import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const app = express();
const PORT = 3000;

// User's Neon PostgreSQL connection string
const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_V0Kum5hgxfkw@ep-solitary-truth-a1u00b22-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const envUrl = (process.env.NEON_DATABASE_URL || '').trim();
// Ensure we never pass an https:// console URL to pg.Pool
const connectionString =
  envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://')
    ? envUrl
    : DEFAULT_NEON_URL;

console.log('Connecting to Neon PostgreSQL Host:', connectionString.split('@')[1]?.split('/')[0] || 'Neon AWS');

// Neon Serverless Pool with connection timeout tolerance & keepAlive
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool error gracefully (prevents unhandled errors when Neon PgBouncer drops idle sockets)
pool.on('error', (err: any) => {
  console.warn('Neon connection pool client note:', err.message);
});

app.use(express.json({ limit: '10mb' }));

// Helper for resilient SQL queries with automatic retry
async function queryWithRetry(text: string, params: any[] = [], retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      return { ...res, duration };
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      const isTransient =
        msg.includes('connection terminated') ||
        msg.includes('timeout') ||
        msg.includes('econnreset') ||
        msg.includes('closed') ||
        msg.includes('broken pipe') ||
        err.code === '57P01';

      if (isTransient && attempt < retries) {
        console.warn(
          `Transient Neon DB notice (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${attempt * 700}ms...`
        );
        await new Promise((r) => setTimeout(r, attempt * 700));
        continue;
      }
      throw err;
    }
  }
}

// Short-lived in-memory caches to reduce connection stress on Neon serverless
let cachedOverview: { data: any; timestamp: number } | null = null;
let cachedMetaFilters: {
  brands: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  timestamp: number;
} | null = null;

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Immediate ping (no DB)
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ pong: true, time: Date.now() });
});

// 1. Health & DB Status
app.get('/api/health', async (_req: Request, res: Response) => {
  console.log('-> Entered /api/health handler');
  try {
    const start = Date.now();
    const dbRes = await queryWithRetry('SELECT NOW() as current_time, version() as version');
    const latency = Date.now() - start;
    console.log('-> /api/health query success, latency:', latency);
    res.json({
      status: 'connected',
      database: 'Neon PostgreSQL (AWS ap-southeast-1)',
      latencyMs: latency,
      currentTime: dbRes.rows[0].current_time,
      version: dbRes.rows[0].version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    });
  } catch (err: any) {
    console.error('-> /api/health error:', err.message);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

// 2. Dashboard Overview Aggregates
app.get('/api/overview', async (req: Request, res: Response) => {
  try {
    const isFresh = req.query.fresh === 'true';
    if (!isFresh && cachedOverview && Date.now() - cachedOverview.timestamp < 6000) {
      return res.json(cachedOverview.data);
    }

    let client;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        client = await pool.connect();

        const [
          carsStatsRes,
          usersStatsRes,
          reviewsStatsRes,
          favoritesCountRes,
          viewsCountRes,
          brandsRes,
          bodyTypesRes,
          fuelTypesRes,
          topFavoritedRes,
          recentReviewsRes,
        ] = await Promise.all([
          client.query(`
            SELECT 
              COUNT(*)::int as total_cars,
              COALESCE(SUM(price_usd), 0)::numeric as total_inventory_value,
              COALESCE(AVG(price_usd), 0)::numeric as avg_price,
              COUNT(CASE WHEN is_featured = true THEN 1 END)::int as featured_count,
              COUNT(CASE WHEN is_trending = true THEN 1 END)::int as trending_count,
              COUNT(CASE WHEN is_electric = true THEN 1 END)::int as electric_count,
              COUNT(CASE WHEN is_supercar = true THEN 1 END)::int as supercar_count,
              COUNT(CASE WHEN is_sports = true THEN 1 END)::int as sports_count,
              COUNT(CASE WHEN is_suv = true THEN 1 END)::int as suv_count
            FROM neon_cars
          `),
          client.query(`
            SELECT 
              COUNT(*)::int as total_users,
              COUNT(CASE WHEN is_admin = true THEN 1 END)::int as admin_users
            FROM neon_users
          `),
          client.query(`
            SELECT 
              COUNT(*)::int as total_reviews,
              COALESCE(AVG(rating), 0)::real as avg_rating,
              COALESCE(SUM(likes), 0)::int as total_likes
            FROM neon_reviews
          `),
          client.query(`SELECT COUNT(*)::int as total_favorites FROM neon_favorites`),
          client.query(`SELECT COUNT(*)::int as total_views FROM neon_recent_views`),
          client.query(`
            SELECT brand, COUNT(*)::int as count, AVG(price_usd)::numeric as avg_price
            FROM neon_cars
            GROUP BY brand
            ORDER BY count DESC, brand ASC
            LIMIT 10
          `),
          client.query(`
            SELECT body_type, COUNT(*)::int as count
            FROM neon_cars
            GROUP BY body_type
            ORDER BY count DESC
          `),
          client.query(`
            SELECT fuel_type, COUNT(*)::int as count
            FROM neon_cars
            GROUP BY fuel_type
            ORDER BY count DESC
          `),
          client.query(`
            SELECT f.car_id, c.brand, c.model, c.price_usd, c.images, COUNT(f.car_id)::int as favorite_count
            FROM neon_favorites f
            LEFT JOIN neon_cars c ON f.car_id = c.id
            GROUP BY f.car_id, c.brand, c.model, c.price_usd, c.images
            ORDER BY favorite_count DESC
            LIMIT 5
          `),
          client.query(`
            SELECT r.*, c.brand as car_brand, c.model as car_model
            FROM neon_reviews r
            LEFT JOIN neon_cars c ON r.car_id = c.id
            ORDER BY r.created_at DESC
            LIMIT 5
          `),
        ]);

        client.release();
        const payload = {
          cars: carsStatsRes.rows[0],
          users: usersStatsRes.rows[0],
          reviews: reviewsStatsRes.rows[0],
          favorites: favoritesCountRes.rows[0].total_favorites,
          views: viewsCountRes.rows[0].total_views,
          topBrands: brandsRes.rows,
          bodyTypes: bodyTypesRes.rows,
          fuelTypes: fuelTypesRes.rows,
          topFavoritedCars: topFavoritedRes.rows,
          recentReviews: recentReviewsRes.rows,
        };

        cachedOverview = { data: payload, timestamp: Date.now() };
        return res.json(payload);
      } catch (err: any) {
        if (client) {
          try {
            client.release(true);
          } catch {}
          client = undefined;
        }
        if (attempt < 3) {
          console.warn(`Overview query attempt ${attempt} failed: ${err.message}. Retrying...`);
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        throw err;
      }
    }
  } catch (err: any) {
    console.error('Error fetching overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Cars Fleet Management - List with Filtering, Search, Pagination
app.get('/api/cars', async (req: Request, res: Response) => {
  try {
    const {
      search,
      brand,
      body_type,
      fuel_type,
      is_featured,
      is_trending,
      is_electric,
      is_supercar,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = '1',
      limit = '100',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(LOWER(brand) LIKE $${paramIndex} OR LOWER(model) LIKE $${paramIndex} OR LOWER(variant) LIKE $${paramIndex} OR LOWER(id) LIKE $${paramIndex} OR LOWER(country) LIKE $${paramIndex})`
      );
      params.push(`%${(search as string).toLowerCase().trim()}%`);
      paramIndex++;
    }

    if (brand && brand !== 'all') {
      conditions.push(`brand = $${paramIndex}`);
      params.push(brand);
      paramIndex++;
    }

    if (body_type && body_type !== 'all') {
      conditions.push(`body_type = $${paramIndex}`);
      params.push(body_type);
      paramIndex++;
    }

    if (fuel_type && fuel_type !== 'all') {
      conditions.push(`fuel_type = $${paramIndex}`);
      params.push(fuel_type);
      paramIndex++;
    }

    if (is_featured === 'true') {
      conditions.push(`is_featured = true`);
    }

    if (is_trending === 'true') {
      conditions.push(`is_trending = true`);
    }

    if (is_electric === 'true') {
      conditions.push(`is_electric = true`);
    }

    if (is_supercar === 'true') {
      conditions.push(`is_supercar = true`);
    }

    if (min_price) {
      conditions.push(`price_usd >= $${paramIndex}`);
      params.push(parseFloat(min_price as string));
      paramIndex++;
    }

    if (max_price) {
      conditions.push(`price_usd <= $${paramIndex}`);
      params.push(parseFloat(max_price as string));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortCols = ['brand', 'model', 'year', 'price_usd', 'horsepower', 'rating', 'created_at'];
    const safeSortBy = allowedSortCols.includes(sort_by as string) ? (sort_by as string) : 'created_at';
    const safeSortOrder = (sort_order as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Count query with retry
    const countRes = await queryWithRetry(
      `SELECT COUNT(*)::int as total FROM neon_cars ${whereClause}`,
      params
    );
    const total = countRes.rows[0].total;

    // Items query with retry
    const itemsRes = await queryWithRetry(
      `SELECT * FROM neon_cars ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    // Metadata filters (cached for 60 seconds)
    if (!cachedMetaFilters || Date.now() - cachedMetaFilters.timestamp > 60000) {
      try {
        const [brandsMeta, bodyTypesMeta, fuelTypesMeta] = await Promise.all([
          queryWithRetry(`SELECT DISTINCT brand FROM neon_cars ORDER BY brand`),
          queryWithRetry(`SELECT DISTINCT body_type FROM neon_cars ORDER BY body_type`),
          queryWithRetry(`SELECT DISTINCT fuel_type FROM neon_cars ORDER BY fuel_type`),
        ]);
        cachedMetaFilters = {
          brands: brandsMeta.rows.map((r: any) => r.brand),
          bodyTypes: bodyTypesMeta.rows.map((r: any) => r.body_type),
          fuelTypes: fuelTypesMeta.rows.map((r: any) => r.fuel_type),
          timestamp: Date.now(),
        };
      } catch (metaErr) {
        console.warn('Could not refresh filter metadata:', metaErr);
      }
    }

    res.json({
      cars: itemsRes.rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      brands: cachedMetaFilters?.brands || [],
      bodyTypes: cachedMetaFilters?.bodyTypes || [],
      fuelTypes: cachedMetaFilters?.fuelTypes || [],
    });
  } catch (err: any) {
    console.error('Error querying cars:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Single Car Details with Reviews
app.get('/api/cars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const carRes = await queryWithRetry(`SELECT * FROM neon_cars WHERE id = $1`, [id]);
    if (carRes.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const reviewsRes = await queryWithRetry(
      `SELECT * FROM neon_reviews WHERE car_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const favCountRes = await queryWithRetry(
      `SELECT COUNT(*)::int as favorites_count FROM neon_favorites WHERE car_id = $1`,
      [id]
    );

    res.json({
      car: carRes.rows[0],
      reviews: reviewsRes.rows,
      favoritesCount: favCountRes.rows[0].favorites_count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Create Car
app.post('/api/cars', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id =
      data.id ||
      `${data.brand || 'car'}-${data.model || 'model'}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 6);

    const insertQuery = `
      INSERT INTO neon_cars (
        id, brand, model, variant, year, body_type, price_usd, fuel_type,
        engine, horsepower, torque_nm, transmission, drivetrain, top_speed_kmh,
        acceleration_0_100, mileage, dimensions, wheelbase, weight_kg,
        ground_clearance, boot_space, seating, tyre_size, brakes, suspension,
        safety_rating, features, images, description, country, rating,
        reviews_count, is_featured, is_trending, is_electric, is_supercar,
        is_sports, is_suv, is_budget_friendly, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36,
        $37, $38, $39, NOW()
      ) RETURNING *;
    `;

    const values = [
      id,
      data.brand || 'Autoverse',
      data.model || 'Model X',
      data.variant || 'Standard',
      parseInt(data.year, 10) || 2026,
      data.body_type || 'Supercar',
      parseFloat(data.price_usd) || 0,
      data.fuel_type || 'Petrol',
      data.engine || 'V8',
      parseInt(data.horsepower, 10) || 500,
      parseInt(data.torque_nm, 10) || 500,
      data.transmission || 'Automatic',
      data.drivetrain || 'AWD',
      parseInt(data.top_speed_kmh, 10) || 300,
      parseFloat(data.acceleration_0_100) || 3.5,
      data.mileage || '10.0 L/100km',
      data.dimensions || '4,500 × 1,900 × 1,200 mm',
      data.wheelbase || '2,700 mm',
      parseInt(data.weight_kg, 10) || 1500,
      data.ground_clearance || '120 mm',
      data.boot_space || '200 L',
      parseInt(data.seating, 10) || 2,
      data.tyre_size || '245/40 R19',
      data.brakes || 'Ventilated Carbon Ceramic',
      data.suspension || 'Adaptive Air Suspension',
      parseFloat(data.safety_rating) || 5.0,
      Array.isArray(data.features) ? JSON.stringify(data.features) : (typeof data.features === 'string' ? data.features : '[]'),
      Array.isArray(data.images) ? JSON.stringify(data.images) : (typeof data.images === 'string' ? data.images : '[]'),
      data.description || '',
      data.country || 'Global',
      parseFloat(data.rating) || 5.0,
      parseInt(data.reviews_count, 10) || 0,
      Boolean(data.is_featured),
      Boolean(data.is_trending),
      Boolean(data.is_electric),
      Boolean(data.is_supercar),
      Boolean(data.is_sports),
      Boolean(data.is_suv),
      Boolean(data.is_budget_friendly),
    ];

    const result = await queryWithRetry(insertQuery, values);
    cachedOverview = null;
    cachedMetaFilters = null;
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating car:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Update Car
app.put('/api/cars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateQuery = `
      UPDATE neon_cars SET
        brand = $1, model = $2, variant = $3, year = $4, body_type = $5,
        price_usd = $6, fuel_type = $7, engine = $8, horsepower = $9,
        torque_nm = $10, transmission = $11, drivetrain = $12, top_speed_kmh = $13,
        acceleration_0_100 = $14, mileage = $15, dimensions = $16, wheelbase = $17,
        weight_kg = $18, ground_clearance = $19, boot_space = $20, seating = $21,
        tyre_size = $22, brakes = $23, suspension = $24, safety_rating = $25,
        features = $26, images = $27, description = $28, country = $29,
        rating = $30, reviews_count = $31, is_featured = $32, is_trending = $33,
        is_electric = $34, is_supercar = $35, is_sports = $36, is_suv = $37,
        is_budget_friendly = $38
      WHERE id = $39
      RETURNING *;
    `;

    const values = [
      data.brand,
      data.model,
      data.variant,
      parseInt(data.year, 10),
      data.body_type,
      parseFloat(data.price_usd),
      data.fuel_type,
      data.engine,
      parseInt(data.horsepower, 10),
      parseInt(data.torque_nm, 10),
      data.transmission,
      data.drivetrain,
      parseInt(data.top_speed_kmh, 10),
      parseFloat(data.acceleration_0_100),
      data.mileage,
      data.dimensions,
      data.wheelbase,
      parseInt(data.weight_kg, 10),
      data.ground_clearance,
      data.boot_space,
      parseInt(data.seating, 10),
      data.tyre_size,
      data.brakes,
      data.suspension,
      parseFloat(data.safety_rating),
      Array.isArray(data.features) ? JSON.stringify(data.features) : (typeof data.features === 'string' ? data.features : '[]'),
      Array.isArray(data.images) ? JSON.stringify(data.images) : (typeof data.images === 'string' ? data.images : '[]'),
      data.description,
      data.country,
      parseFloat(data.rating),
      parseInt(data.reviews_count, 10),
      Boolean(data.is_featured),
      Boolean(data.is_trending),
      Boolean(data.is_electric),
      Boolean(data.is_supercar),
      Boolean(data.is_sports),
      Boolean(data.is_suv),
      Boolean(data.is_budget_friendly),
      id,
    ];

    const result = await queryWithRetry(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    cachedOverview = null;
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating car:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Car
app.delete('/api/cars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await queryWithRetry(`DELETE FROM neon_favorites WHERE car_id = $1`, [id]);
    await queryWithRetry(`DELETE FROM neon_comparisons WHERE car_id = $1`, [id]);
    await queryWithRetry(`DELETE FROM neon_recent_views WHERE car_id = $1`, [id]);
    await queryWithRetry(`DELETE FROM neon_reviews WHERE car_id = $1`, [id]);
    const delRes = await queryWithRetry(`DELETE FROM neon_cars WHERE id = $1 RETURNING id`, [id]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    cachedOverview = null;
    cachedMetaFilters = null;
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Duplicate Car
app.post('/api/cars/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const origRes = await queryWithRetry(`SELECT * FROM neon_cars WHERE id = $1`, [id]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    const orig = origRes.rows[0];
    const newId = `${orig.id}-copy-${Math.random().toString(36).substring(2, 6)}`;
    const newModel = `${orig.model} (Copy)`;

    const insertRes = await queryWithRetry(
      `INSERT INTO neon_cars (
        id, brand, model, variant, year, body_type, price_usd, fuel_type,
        engine, horsepower, torque_nm, transmission, drivetrain, top_speed_kmh,
        acceleration_0_100, mileage, dimensions, wheelbase, weight_kg,
        ground_clearance, boot_space, seating, tyre_size, brakes, suspension,
        safety_rating, features, images, description, country, rating,
        reviews_count, is_featured, is_trending, is_electric, is_supercar,
        is_sports, is_suv, is_budget_friendly, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36,
        $37, $38, $39, NOW()
      ) RETURNING *`,
      [
        newId,
        orig.brand,
        newModel,
        orig.variant,
        orig.year,
        orig.body_type,
        orig.price_usd,
        orig.fuel_type,
        orig.engine,
        orig.horsepower,
        orig.torque_nm,
        orig.transmission,
        orig.drivetrain,
        orig.top_speed_kmh,
        orig.acceleration_0_100,
        orig.mileage,
        orig.dimensions,
        orig.wheelbase,
        orig.weight_kg,
        orig.ground_clearance,
        orig.boot_space,
        orig.seating,
        orig.tyre_size,
        orig.brakes,
        orig.suspension,
        orig.safety_rating,
        typeof orig.features === 'string' ? orig.features : JSON.stringify(orig.features || []),
        typeof orig.images === 'string' ? orig.images : JSON.stringify(orig.images || []),
        orig.description,
        orig.country,
        orig.rating,
        0,
        false,
        false,
        orig.is_electric,
        orig.is_supercar,
        orig.is_sports,
        orig.is_suv,
        orig.is_budget_friendly,
      ]
    );

    cachedOverview = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Bulk Update / Actions on Cars
app.patch('/api/cars/bulk', async (req: Request, res: Response) => {
  try {
    const { action, ids, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    if (action === 'delete') {
      await queryWithRetry(`DELETE FROM neon_cars WHERE id = ANY($1)`, [ids]);
      cachedOverview = null;
      cachedMetaFilters = null;
      return res.json({ success: true, count: ids.length });
    }

    if (action === 'set_featured') {
      await queryWithRetry(`UPDATE neon_cars SET is_featured = $1 WHERE id = ANY($2)`, [Boolean(value), ids]);
      cachedOverview = null;
      return res.json({ success: true });
    }

    if (action === 'set_trending') {
      await queryWithRetry(`UPDATE neon_cars SET is_trending = $1 WHERE id = ANY($2)`, [Boolean(value), ids]);
      cachedOverview = null;
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Unknown bulk action' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Users Management
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    let queryText = `SELECT * FROM neon_users`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(
        `(LOWER(name) LIKE $${params.length + 1} OR LOWER(email) LIKE $${params.length + 1} OR LOWER(phone_number) LIKE $${params.length + 1})`
      );
      params.push(`%${(search as string).toLowerCase().trim()}%`);
    }

    if (role === 'admin') {
      conditions.push(`is_admin = true`);
    } else if (role === 'member') {
      conditions.push(`(is_admin = false OR is_admin IS NULL)`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY created_at DESC`;
    const usersRes = await queryWithRetry(queryText, params);
    res.json(usersRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create User
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = data.id || `user_${Math.random().toString(36).substring(2, 10)}`;
    const resUser = await queryWithRetry(
      `INSERT INTO neon_users (
        id, email, name, phone_number, bio, location, dream_car, avatar_url,
        preferred_currency, unit_system, is_admin, auth_provider, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        id,
        data.email,
        data.name || 'Member',
        data.phone_number || '',
        data.bio || 'AutoVerse Member',
        data.location || 'Global',
        data.dream_car || 'Porsche 911 GT3 RS',
        data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        data.preferred_currency || 'USD',
        data.unit_system || 'METRIC',
        Boolean(data.is_admin),
        data.auth_provider || 'email',
      ]
    );
    cachedOverview = null;
    res.status(201).json(resUser.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update User (e.g. toggle is_admin, edit profile)
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateRes = await queryWithRetry(
      `UPDATE neon_users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone_number = COALESCE($3, phone_number),
        bio = COALESCE($4, bio),
        location = COALESCE($5, location),
        dream_car = COALESCE($6, dream_car),
        avatar_url = COALESCE($7, avatar_url),
        preferred_currency = COALESCE($8, preferred_currency),
        unit_system = COALESCE($9, unit_system),
        is_admin = COALESCE($10, is_admin),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        data.name,
        data.email,
        data.phone_number,
        data.bio,
        data.location,
        data.dream_car,
        data.avatar_url,
        data.preferred_currency,
        data.unit_system,
        data.is_admin !== undefined ? Boolean(data.is_admin) : null,
        id,
      ]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    cachedOverview = null;
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await queryWithRetry(`DELETE FROM neon_favorites WHERE user_id = $1`, [id]);
    await queryWithRetry(`DELETE FROM neon_comparisons WHERE user_id = $1`, [id]);
    await queryWithRetry(`DELETE FROM neon_recent_views WHERE user_id = $1`, [id]);
    const delRes = await queryWithRetry(`DELETE FROM neon_users WHERE id = $1 RETURNING id`, [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    cachedOverview = null;
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Reviews Moderation
app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const { search, car_id, min_rating } = req.query;
    let queryText = `
      SELECT r.*, c.brand as car_brand, c.model as car_model
      FROM neon_reviews r
      LEFT JOIN neon_cars c ON r.car_id = c.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(
        `(LOWER(r.user_name) LIKE $${params.length + 1} OR LOWER(r.title) LIKE $${params.length + 1} OR LOWER(r.comment) LIKE $${params.length + 1} OR LOWER(c.model) LIKE $${params.length + 1})`
      );
      params.push(`%${(search as string).toLowerCase().trim()}%`);
    }

    if (car_id) {
      conditions.push(`r.car_id = $${params.length + 1}`);
      params.push(car_id);
    }

    if (min_rating) {
      conditions.push(`r.rating >= $${params.length + 1}`);
      params.push(parseFloat(min_rating as string));
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY r.created_at DESC`;
    const revRes = await queryWithRetry(queryText, params);
    res.json(revRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Review
app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id = data.id || `rev-${Date.now()}`;
    const insertRes = await queryWithRetry(
      `INSERT INTO neon_reviews (
        id, car_id, user_name, user_avatar, rating, date, title, comment, likes, is_liked_by_user, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        id,
        data.car_id,
        data.user_name || 'Verified Driver',
        data.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        parseFloat(data.rating) || 5.0,
        data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        data.title || 'Exceptional Vehicle',
        data.comment || '',
        parseInt(data.likes, 10) || 0,
        Boolean(data.is_liked_by_user),
      ]
    );

    // Update reviews_count on car
    await queryWithRetry(
      `UPDATE neon_cars SET reviews_count = reviews_count + 1 WHERE id = $1`,
      [data.car_id]
    );

    cachedOverview = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Review
app.put('/api/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateRes = await queryWithRetry(
      `UPDATE neon_reviews SET
        title = COALESCE($1, title),
        comment = COALESCE($2, comment),
        rating = COALESCE($3, rating),
        likes = COALESCE($4, likes)
      WHERE id = $5
      RETURNING *`,
      [data.title, data.comment, data.rating ? parseFloat(data.rating) : null, data.likes !== undefined ? parseInt(data.likes, 10) : null, id]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    cachedOverview = null;
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Review
app.delete('/api/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const carRes = await queryWithRetry(`SELECT car_id FROM neon_reviews WHERE id = $1`, [id]);
    const delRes = await queryWithRetry(`DELETE FROM neon_reviews WHERE id = $1 RETURNING id`, [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (carRes.rows[0]?.car_id) {
      await queryWithRetry(
        `UPDATE neon_cars SET reviews_count = GREATEST(0, reviews_count - 1) WHERE id = $1`,
        [carRes.rows[0].car_id]
      );
    }
    cachedOverview = null;
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Engagement Analytics (Favorites, Views, Comparisons)
app.get('/api/engagement', async (_req: Request, res: Response) => {
  try {
    const [favoritesRes, viewsRes, comparisonsRes] = await Promise.all([
      queryWithRetry(`
        SELECT f.*, c.brand, c.model, c.price_usd, c.images, u.name as user_name, u.email as user_email
        FROM neon_favorites f
        LEFT JOIN neon_cars c ON f.car_id = c.id
        LEFT JOIN neon_users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
        LIMIT 50
      `),
      queryWithRetry(`
        SELECT v.*, c.brand, c.model, c.price_usd, u.name as user_name
        FROM neon_recent_views v
        LEFT JOIN neon_cars c ON v.car_id = c.id
        LEFT JOIN neon_users u ON v.user_id = u.id
        ORDER BY v.viewed_at DESC
        LIMIT 50
      `),
      queryWithRetry(`
        SELECT comp.*, c.brand, c.model, u.name as user_name
        FROM neon_comparisons comp
        LEFT JOIN neon_cars c ON comp.car_id = c.id
        LEFT JOIN neon_users u ON comp.user_id = u.id
        ORDER BY comp.added_at DESC
        LIMIT 50
      `),
    ]);

    res.json({
      favorites: favoritesRes.rows,
      recentViews: viewsRes.rows,
      comparisons: comparisonsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to convert hex colors (e.g. #FF8A00) or numbers into Neon DB bigint format
function parseColorToBigInt(val: any): string {
  if (!val) return '4278822143';
  if (typeof val === 'number') return String(Math.floor(val));
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return str;
  const cleanHex = str.replace('#', '');
  if (cleanHex.length === 6) {
    return String(parseInt('FF' + cleanHex, 16));
  } else if (cleanHex.length === 8) {
    return String(parseInt(cleanHex, 16));
  }
  return '4278822143';
}

// 12.5 Sponsored Ads & Partner Campaigns
app.get('/api/ads', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM neon_ads`;
    const params: any[] = [];
    if (search) {
      sql += ` WHERE LOWER(sponsor_name) LIKE $1 OR LOWER(headline) LIKE $1 OR LOWER(subline) LIKE $1`;
      params.push(`%${(search as string).toLowerCase().trim()}%`);
    }
    sql += ` ORDER BY id ASC`;
    const adsRes = await queryWithRetry(sql, params);
    res.json(adsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adRes = await queryWithRetry(`SELECT * FROM neon_ads WHERE id = $1`, [id]);
    if (adRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json(adRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ads', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id =
      data.id ||
      `ad_${(data.sponsor_name || 'sponsor')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 15)}_${Math.random().toString(36).substring(2, 6)}`;
    const accentBigInt = parseColorToBigInt(data.accent_color_hex);

    const insertRes = await queryWithRetry(
      `INSERT INTO neon_ads (
        id, sponsor_name, partner_badge, headline, subline, cta_text, image_url, accent_color_hex
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        data.sponsor_name || 'PARTNER SPONSOR',
        data.partner_badge || 'OFFICIAL PARTNER',
        data.headline || 'High Performance Engineering',
        data.subline || 'Experience peak precision and aerodynamic luxury.',
        data.cta_text || 'Explore Now',
        data.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        accentBigInt,
      ]
    );
    cachedOverview = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const accentBigInt = parseColorToBigInt(data.accent_color_hex);

    const updateRes = await queryWithRetry(
      `UPDATE neon_ads SET
        sponsor_name = COALESCE($1, sponsor_name),
        partner_badge = COALESCE($2, partner_badge),
        headline = COALESCE($3, headline),
        subline = COALESCE($4, subline),
        cta_text = COALESCE($5, cta_text),
        image_url = COALESCE($6, image_url),
        accent_color_hex = COALESCE($7, accent_color_hex)
      WHERE id = $8
      RETURNING *`,
      [
        data.sponsor_name,
        data.partner_badge,
        data.headline,
        data.subline,
        data.cta_text,
        data.image_url,
        accentBigInt,
        id,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    cachedOverview = null;
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delRes = await queryWithRetry(`DELETE FROM neon_ads WHERE id = $1 RETURNING id`, [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    cachedOverview = null;
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ads/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const origRes = await queryWithRetry(`SELECT * FROM neon_ads WHERE id = $1`, [id]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    const orig = origRes.rows[0];
    const newId = `${orig.id}_copy_${Math.random().toString(36).substring(2, 6)}`;
    const newHeadline = `${orig.headline} (Copy)`;

    const insertRes = await queryWithRetry(
      `INSERT INTO neon_ads (
        id, sponsor_name, partner_badge, headline, subline, cta_text, image_url, accent_color_hex
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        newId,
        orig.sponsor_name,
        orig.partner_badge,
        newHeadline,
        orig.subline,
        orig.cta_text,
        orig.image_url,
        orig.accent_color_hex,
      ]
    );
    cachedOverview = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12.8 Automotive Brands Management
app.get('/api/brands', async (req: Request, res: Response) => {
  try {
    const { search, country, sort_by = 'name', sort_order = 'asc' } = req.query;
    let sql = `
      SELECT 
        b.*,
        COUNT(c.id)::int as active_cars_count,
        COALESCE(AVG(c.price_usd), 0)::numeric as avg_inventory_price
      FROM neon_brands b
      LEFT JOIN neon_cars c ON LOWER(b.name) = LOWER(c.brand)
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(
        `(LOWER(b.name) LIKE $${params.length + 1} OR LOWER(b.country) LIKE $${params.length + 1} OR LOWER(b.headquarters) LIKE $${params.length + 1} OR LOWER(b.description) LIKE $${params.length + 1})`
      );
      params.push(`%${(search as string).toLowerCase().trim()}%`);
    }

    if (country && country !== 'all') {
      conditions.push(`LOWER(b.country) = LOWER($${params.length + 1})`);
      params.push(country);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY b.id, b.name, b.logo_url, b.country, b.founded_year, b.headquarters, b.description, b.total_models`;

    const safeSortCols: Record<string, string> = {
      name: 'b.name',
      founded_year: 'b.founded_year',
      total_models: 'b.total_models',
      active_cars_count: 'active_cars_count',
      avg_inventory_price: 'avg_inventory_price',
    };
    const sortCol = safeSortCols[sort_by as string] || 'b.name';
    const sortDir = (sort_order as string).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortCol} ${sortDir}`;

    const brandsRes = await queryWithRetry(sql, params);
    res.json(brandsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/brands/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brandRes = await queryWithRetry(`SELECT * FROM neon_brands WHERE id = $1`, [id]);
    if (brandRes.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const brand = brandRes.rows[0];
    const carsRes = await queryWithRetry(
      `SELECT * FROM neon_cars WHERE LOWER(brand) = LOWER($1) ORDER BY price_usd DESC`,
      [brand.name]
    );
    res.json({
      brand,
      cars: carsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function cleanLogoUrl(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim();
  if (!clean) return '';
  if (clean.startsWith('data:image/')) return clean;
  if (clean.includes('google.') && (clean.includes('imgurl=') || clean.includes('url='))) {
    try {
      const urlObj = new URL(clean);
      const extracted = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url');
      if (extracted) clean = decodeURIComponent(extracted);
    } catch {}
  }
  if (clean.startsWith('//')) clean = 'https:' + clean;
  else if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = 'https://' + clean;
  }
  return clean;
}

app.post('/api/brands', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const id =
      data.id ||
      (data.name || 'brand')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const sanitizedLogo = cleanLogoUrl(data.logo_url) || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80';

    const insertRes = await queryWithRetry(
      `INSERT INTO neon_brands (
        id, name, logo_url, country, founded_year, headquarters, description, total_models
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        data.name || 'New Brand',
        sanitizedLogo,
        data.country || 'Global',
        parseInt(data.founded_year, 10) || 2026,
        data.headquarters || 'Global Headquarters',
        data.description || 'Pioneering automotive craftsmanship and luxury engineering.',
        parseInt(data.total_models, 10) || 1,
      ]
    );
    cachedOverview = null;
    cachedMetaFilters = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/brands/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const oldRes = await queryWithRetry(`SELECT name FROM neon_brands WHERE id = $1`, [id]);
    const oldName = oldRes.rows[0]?.name;

    const sanitizedLogo = data.logo_url !== undefined ? cleanLogoUrl(data.logo_url) : undefined;

    const updateRes = await queryWithRetry(
      `UPDATE neon_brands SET
        name = COALESCE($1, name),
        logo_url = COALESCE($2, logo_url),
        country = COALESCE($3, country),
        founded_year = COALESCE($4, founded_year),
        headquarters = COALESCE($5, headquarters),
        description = COALESCE($6, description),
        total_models = COALESCE($7, total_models)
      WHERE id = $8
      RETURNING *`,
      [
        data.name,
        sanitizedLogo,
        data.country,
        data.founded_year ? parseInt(data.founded_year, 10) : null,
        data.headquarters,
        data.description,
        data.total_models !== undefined ? parseInt(data.total_models, 10) : null,
        id,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (data.rename_cars_too && oldName && data.name && oldName !== data.name) {
      await queryWithRetry(`UPDATE neon_cars SET brand = $1 WHERE LOWER(brand) = LOWER($2)`, [
        data.name,
        oldName,
      ]);
    }

    cachedOverview = null;
    cachedMetaFilters = null;
    res.json(updateRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/brands/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delRes = await queryWithRetry(`DELETE FROM neon_brands WHERE id = $1 RETURNING id`, [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    cachedOverview = null;
    cachedMetaFilters = null;
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/brands/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const origRes = await queryWithRetry(`SELECT * FROM neon_brands WHERE id = $1`, [id]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const orig = origRes.rows[0];
    const newId = `${orig.id}-copy-${Math.random().toString(36).substring(2, 6)}`;
    const newName = `${orig.name} (Copy)`;

    const insertRes = await queryWithRetry(
      `INSERT INTO neon_brands (
        id, name, logo_url, country, founded_year, headquarters, description, total_models
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        newId,
        newName,
        orig.logo_url,
        orig.country,
        orig.founded_year,
        orig.headquarters,
        orig.description,
        orig.total_models,
      ]
    );
    cachedOverview = null;
    cachedMetaFilters = null;
    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Schema Explorer
app.get('/api/schema', async (_req: Request, res: Response) => {
  try {
    const tablesRes = await queryWithRetry(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const schemaDetails = [];
    for (const t of tablesRes.rows) {
      const tableName = t.table_name;
      const [colsRes, countRes] = await Promise.all([
        queryWithRetry(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]),
        queryWithRetry(`SELECT COUNT(*)::int as count FROM "${tableName}"`),
      ]);

      schemaDetails.push({
        table_name: tableName,
        rowCount: countRes.rows[0].count,
        columns: colsRes.rows,
      });
    }

    res.json(schemaDetails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. SQL Query Studio Console
app.post('/api/sql', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query text is required' });
    }

    const trimmed = sql.trim();
    if (/drop\s+(database|schema)/i.test(trimmed)) {
      return res.status(403).json({ error: 'DROP DATABASE or DROP SCHEMA statements are restricted in Admin Console.' });
    }

    const result = await queryWithRetry(trimmed, [], 1);

    res.json({
      command: result.command,
      rowCount: result.rowCount,
      fields: result.fields?.map((f: any) => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
      rows: result.rows,
      durationMs: result.duration,
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
    });
  }
});

// 15. Export Table Data
app.get('/api/export/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    const checkRes = await queryWithRetry(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Table does not exist' });
    }

    const dataRes = await queryWithRetry(`SELECT * FROM "${table}"`);

    if (format === 'csv') {
      const rows = dataRes.rows;
      if (rows.length === 0) {
        return res.send('');
      }
      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(',')];
      for (const row of rows) {
        const line = headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        });
        csvLines.push(line.join(','));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${table}-export.csv"`);
      return res.send(csvLines.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${table}-export.json"`);
    res.json(dataRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Dev & Production Integration
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoVerse Admin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
