import pg from 'pg';

const connectionString =
  'postgresql://neondb_owner:npg_V0Kum5hgxfkw@ep-solitary-truth-a1u00b22-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function restoreSchema() {
  const client = await pool.connect();
  try {
    console.log('--- STARTING SAFE SCHEMA RESTORATION (ZERO DATA LOSS) ---');

    await client.query('BEGIN');

    // 1. Audit current row count before anything
    const beforeCount = await client.query('SELECT count(*)::int as count FROM neon_cars');
    console.log(`Current neon_cars row count: ${beforeCount.rows[0].count}`);

    // 2. Add canonical columns to neon_cars IF NOT EXISTS
    console.log('Adding canonical columns to neon_cars if not present...');
    await client.query(`
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS id text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS brand text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS model text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS variant text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS year integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS body_type text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS price_usd numeric;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS fuel_type text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS engine text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS horsepower integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS torque_nm integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS transmission text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS drivetrain text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS top_speed_kmh integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS acceleration_0_100 numeric;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS mileage text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS dimensions text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS wheelbase text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS weight_kg integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS ground_clearance text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS boot_space text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS seating integer;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS tyre_size text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS brakes text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS suspension text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS safety_rating real DEFAULT 5.0;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS features text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS images text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS country text;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS rating real DEFAULT 4.9;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_electric boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_supercar boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_sports boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_suv boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS is_budget_friendly boolean DEFAULT false;
      ALTER TABLE neon_cars ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT NOW();
    `);

    // 3. Migrate data from altered column names to canonical columns
    console.log('Restoring data from altered column names into canonical columns...');
    await client.query(`
      UPDATE neon_cars SET
        brand = COALESCE(NULLIF(brand, ''), manufacturer),
        model = COALESCE(NULLIF(model, ''), model_name),
        year = COALESCE(year, model_year, 2024),
        body_type = COALESCE(NULLIF(body_type, ''), body_style, 'Coupe'),
        description = COALESCE(NULLIF(description, ''), executive_description),
        is_featured = COALESCE(is_featured, is_featured_hero, false),
        is_supercar = COALESCE(is_supercar, is_supercar_spec, false),
        is_electric = COALESCE(is_electric, is_electric_ev, false),
        is_trending = COALESCE(is_trending, false),
        engine = COALESCE(NULLIF(engine, ''), engine_displacement),
        horsepower = COALESCE(horsepower, horsepower_hp),
        fuel_type = COALESCE(NULLIF(fuel_type, ''), fuel_energy_type),
        dimensions = COALESCE(NULLIF(dimensions, ''), dimensions_mm),
        wheelbase = COALESCE(NULLIF(wheelbase, ''), wheelbase_mm),
        weight_kg = COALESCE(weight_kg, curb_weight_kg),
        ground_clearance = COALESCE(NULLIF(ground_clearance, ''), ground_clearance_mm),
        boot_space = COALESCE(NULLIF(boot_space, ''), boot_space_l),
        seating = COALESCE(seating, passenger_seating, 2),
        tyre_size = COALESCE(NULLIF(tyre_size, ''), tyre_specifications),
        brakes = COALESCE(NULLIF(brakes, ''), braking_system),
        country = COALESCE(NULLIF(country, ''), country_of_origin, 'Global'),
        mileage = COALESCE(NULLIF(mileage, ''), mileage_fuel_consumption),
        rating = COALESCE(rating, 4.9),
        safety_rating = COALESCE(safety_rating, 5.0),
        reviews_count = COALESCE(reviews_count, 0)
      WHERE brand IS NULL OR model IS NULL OR year IS NULL;
    `);

    // Migrate acceleration
    console.log('Restoring acceleration_0_100 numeric values...');
    await client.query(`
      UPDATE neon_cars SET
        acceleration_0_100 = CASE
          WHEN acceleration_0_100 IS NOT NULL THEN acceleration_0_100
          WHEN zero_to_hundred_sec IS NOT NULL THEN NULLIF(regexp_replace(zero_to_hundred_sec::text, '[^0-9.]', '', 'g'), '')::numeric
          ELSE 3.0
        END
      WHERE acceleration_0_100 IS NULL;
    `);

    // Migrate images format to JSON array string
    console.log('Restoring images JSON format...');
    await client.query(`
      UPDATE neon_cars SET
        images = CASE
          WHEN images IS NOT NULL AND images LIKE '[%' THEN images
          WHEN gallery_image_urls IS NOT NULL AND gallery_image_urls LIKE '[%' THEN gallery_image_urls
          WHEN gallery_image_urls IS NOT NULL AND gallery_image_urls <> '' THEN json_build_array(gallery_image_urls)::text
          ELSE '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"]'
        END
      WHERE images IS NULL OR images = '';
    `);

    // Specific match for known review car_ids
    console.log('Assigning primary IDs for vehicles...');
    await client.query(`
      UPDATE neon_cars SET id = 'ferrari-sf90'
      WHERE LOWER(brand) LIKE '%ferrari%' AND LOWER(model) LIKE '%sf90%' AND (id IS NULL OR id = '');

      UPDATE neon_cars SET id = 'porsche-gt3rs'
      WHERE LOWER(brand) LIKE '%porsche%' AND LOWER(model) LIKE '%gt3%' AND (id IS NULL OR id = '');

      UPDATE neon_cars SET id = 'tesla-cybertruck'
      WHERE LOWER(brand) LIKE '%tesla%' AND LOWER(model) LIKE '%cybertruck%' AND (id IS NULL OR id = '');

      UPDATE neon_cars SET id = 'bugatti-chiron'
      WHERE LOWER(brand) LIKE '%bugatti%' AND LOWER(model) LIKE '%chiron%' AND (id IS NULL OR id = '');

      UPDATE neon_cars SET id = 'bugatti-divo'
      WHERE LOWER(brand) LIKE '%bugatti%' AND LOWER(model) LIKE '%divo%' AND (id IS NULL OR id = '');
    `);

    // Generate unique slug IDs for remaining cars
    await client.query(`
      WITH numbered AS (
        SELECT ctid,
               LOWER(REGEXP_REPLACE(COALESCE(brand, 'car') || '-' || COALESCE(model, 'model'), '[^a-zA-Z0-9]+', '-', 'g')) as base_id,
               ROW_NUMBER() OVER (PARTITION BY LOWER(REGEXP_REPLACE(COALESCE(brand, 'car') || '-' || COALESCE(model, 'model'), '[^a-zA-Z0-9]+', '-', 'g'))) as rn
        FROM neon_cars
        WHERE id IS NULL OR id = ''
      )
      UPDATE neon_cars c
      SET id = CASE WHEN n.rn = 1 THEN n.base_id ELSE n.base_id || '-' || n.rn END
      FROM numbered n
      WHERE c.ctid = n.ctid AND (c.id IS NULL OR c.id = '');
    `);

    // Derive category booleans
    console.log('Restoring category flags (sports, suv, budget_friendly)...');
    await client.query(`
      UPDATE neon_cars SET
        is_sports = COALESCE(is_sports, body_type ILIKE '%coupe%' OR body_type ILIKE '%sports%' OR body_type ILIKE '%convertible%' OR body_type ILIKE '%hypercar%'),
        is_suv = COALESCE(is_suv, body_type ILIKE '%suv%'),
        is_budget_friendly = COALESCE(is_budget_friendly, price_usd < 100000);
    `);

    // Ensure PRIMARY KEY on neon_cars (id)
    const pkCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'neon_cars' AND constraint_type = 'PRIMARY KEY';
    `);
    if (pkCheck.rows.length === 0) {
      console.log('Adding primary key constraint to neon_cars(id)...');
      await client.query('ALTER TABLE neon_cars ADD PRIMARY KEY (id);');
    }

    // Fix neon_ads accent_color_hex
    console.log('Ensuring neon_ads has proper text accent_color...');
    await client.query(`
      ALTER TABLE neon_ads ADD COLUMN IF NOT EXISTS accent_hex text;
      UPDATE neon_ads SET accent_hex = '#f59e0b' WHERE accent_hex IS NULL;
    `);

    // Verify row count after migration
    const afterCount = await client.query('SELECT count(*)::int as count FROM neon_cars');
    console.log(`neon_cars count after restoration: ${afterCount.rows[0].count}`);

    if (afterCount.rows[0].count !== beforeCount.rows[0].count) {
      throw new Error('Row count mismatch! Aborting transaction.');
    }

    await client.query('COMMIT');
    console.log('--- RESTORATION COMPLETED SUCCESSFULLY WITH ZERO DATA LOSS ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back cleanly:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

restoreSchema().catch(console.error);
