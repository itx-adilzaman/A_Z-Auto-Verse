export interface Car {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  body_type: string;
  price_usd: number | string;
  fuel_type: string;
  engine: string;
  horsepower: number;
  torque_nm: number;
  transmission: string;
  drivetrain: string;
  top_speed_kmh: number;
  acceleration_0_100: number | string;
  mileage: string;
  dimensions: string;
  wheelbase: string;
  weight_kg: number;
  ground_clearance: string;
  boot_space: string;
  seating: number;
  tyre_size: string;
  brakes: string;
  suspension: string;
  safety_rating: number | string;
  features: string[] | string;
  images: string[] | string;
  description: string;
  country: string;
  rating: number | string;
  reviews_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_electric: boolean;
  is_supercar: boolean;
  is_sports: boolean;
  is_suv: boolean;
  is_budget_friendly: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  bio?: string;
  location?: string;
  dream_car?: string;
  avatar_url?: string;
  preferred_currency?: string;
  unit_system?: string;
  is_admin: boolean;
  auth_provider?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  car_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  date?: string;
  title: string;
  comment: string;
  likes: number;
  is_liked_by_user?: boolean;
  created_at?: string;
  car_brand?: string;
  car_model?: string;
}

export interface Favorite {
  user_id: string;
  car_id: string;
  created_at: string;
  brand?: string;
  model?: string;
  price_usd?: number | string;
  images?: string[] | string;
  user_name?: string;
  user_email?: string;
}

export interface RecentView {
  user_id: string;
  car_id: string;
  viewed_at: string;
  brand?: string;
  model?: string;
  price_usd?: number | string;
  user_name?: string;
}

export interface Comparison {
  user_id: string;
  car_id: string;
  added_at: string;
  brand?: string;
  model?: string;
  user_name?: string;
}

export interface Ad {
  id: string;
  sponsor_name: string;
  partner_badge: string;
  headline: string;
  subline: string;
  cta_text: string;
  image_url: string;
  accent_color_hex: string | number;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  country: string;
  founded_year: number;
  headquarters: string;
  description: string;
  total_models: number;
  active_cars_count?: number;
  avg_inventory_price?: number;
}

export interface OverviewData {
  cars: {
    total_cars: number;
    total_inventory_value: number;
    avg_price: number;
    featured_count: number;
    trending_count: number;
    electric_count: number;
    supercar_count: number;
    sports_count: number;
    suv_count: number;
  };
  users: {
    total_users: number;
    admin_users: number;
  };
  reviews: {
    total_reviews: number;
    avg_rating: number;
    total_likes: number;
  };
  favorites: number;
  views: number;
  topBrands: { brand: string; count: number; avg_price: number }[];
  bodyTypes: { body_type: string; count: number }[];
  fuelTypes: { fuel_type: string; count: number }[];
  topFavoritedCars: {
    car_id: string;
    brand: string;
    model: string;
    price_usd: number | string;
    images: string[] | string;
    favorite_count: number;
  }[];
  recentReviews: Review[];
}

export interface SchemaTable {
  table_name: string;
  rowCount: number;
  columns: {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }[];
}

export interface HealthStatus {
  status: string;
  database: string;
  latencyMs: number;
  currentTime: string;
  version: string;
  pool: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}
