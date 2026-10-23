import React from 'react';
import {
  Car,
  DollarSign,
  Users,
  MessageSquare,
  Bookmark,
  Eye,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  Database,
  Download,
} from 'lucide-react';
import { OverviewData } from '../../types';
import { formatCurrency, formatNumber, safeJsonParse, FALLBACK_CAR_IMAGE } from '../../utils';
import { TabType } from '../Sidebar';
import autoverseHeroImg from '../../assets/images/autoverse_admin_hero_1792428311407.jpg';

interface OverviewViewProps {
  data: OverviewData | null;
  loading: boolean;
  onNavigate: (tab: TabType) => void;
  onAddVehicle: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  loading,
  onNavigate,
  onAddVehicle,
}) => {
  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-44 bg-neutral-900 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-neutral-900 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-neutral-900 rounded-xl" />
        </div>
      </div>
    );
  }

  const { cars, users, reviews, favorites, views, topBrands, bodyTypes, fuelTypes, topFavoritedCars } =
    data;

  // Max count for brand bar percentage calculation
  const maxBrandCount = Math.max(...topBrands.map((b) => b.count), 1);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl group">
        <img
          src={autoverseHeroImg}
          alt="AutoVerse Hypercar"
          className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-85 transition-all duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Production fallback to public path or remote asset
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + '/images/autoverse_admin_hero_1792428311407.jpg') {
              target.src = '/images/autoverse_admin_hero_1792428311407.jpg';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/70 to-neutral-950/20 sm:to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-3 tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>EXECUTIVE FLEET CONTROL</span>
            <span>·</span>
            <span className="text-neutral-400">NEON POSTGRESQL CLUSTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            AutoVerse Supercar Portfolio & Platform Management
          </h1>
          <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
            Real-time synchronization with production Neon PostgreSQL database. Managing{' '}
            <span className="text-amber-400 font-mono font-medium">{cars.total_cars} luxury models</span>{' '}
            valued at{' '}
            <span className="text-amber-400 font-mono font-medium">
              {formatCurrency(cars.total_inventory_value)}
            </span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onAddVehicle}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Add Vehicle Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('fleet')}
              className="px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700/80 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Explore Fleet Directory</span>
            </button>
            <button
              onClick={() => onNavigate('sql')}
              className="px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700/80 rounded-lg transition-colors flex items-center gap-2"
            >
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span>SQL Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet Size */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium tracking-wide">TOTAL FLEET</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {formatNumber(cars.total_cars)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-amber-400 font-medium">{cars.supercar_count} Supercars</span>
              <span>·</span>
              <span>{cars.electric_count} EV</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Portfolio Valuation */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium tracking-wide">PORTFOLIO VALUATION</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {formatCurrency(cars.total_inventory_value)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
              <span>Avg:</span>
              <span className="font-mono text-neutral-300 font-medium">
                {formatCurrency(cars.avg_price)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Users & Admins */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium tracking-wide">REGISTERED MEMBERS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {formatNumber(users.total_users)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-blue-400 font-medium">{users.admin_users} Admins</span>
              <span>·</span>
              <span>{users.total_users - users.admin_users} Drivers</span>
            </div>
          </div>
        </div>

        {/* Card 4: Customer Engagement */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium tracking-wide">ENGAGEMENT & REVIEWS</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-white">
              {formatNumber(reviews.total_reviews)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-amber-400 font-medium">★ {Number(reviews.avg_rating).toFixed(1)}</span>
              <span>·</span>
              <span>{favorites} Bookmarks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Brands Analysis & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Brand Distribution */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Brand Inventory Volume</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Top manufacturers represented in the AutoVerse database
              </p>
            </div>
            <button
              onClick={() => onNavigate('brands')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Manage Brands</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5 flex-1 justify-center flex flex-col">
            {topBrands.slice(0, 7).map((item) => {
              const percentage = Math.round((item.count / maxBrandCount) * 100);
              return (
                <div key={item.brand} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{item.brand}</span>
                    <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                      <span>Avg: {formatCurrency(item.avg_price)}</span>
                      <span className="text-white font-semibold tabular-nums">
                        {item.count} {item.count === 1 ? 'vehicle' : 'vehicles'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Powertrain & Body Type Mix */}
        <div className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Powertrain Mix</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Propulsion systems in database</p>

            <div className="mt-4 space-y-2.5">
              {fuelTypes.map((ft) => (
                <div
                  key={ft.fuel_type}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs"
                >
                  <span className="text-neutral-300">{ft.fuel_type}</span>
                  <span className="font-mono tabular-nums font-semibold text-neutral-100">
                    {ft.count} models
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <h2 className="text-sm font-semibold text-white">Body Classification</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {bodyTypes.slice(0, 4).map((bt) => (
                <div
                  key={bt.body_type}
                  className="p-2 rounded bg-neutral-950/70 border border-neutral-800/80 text-center"
                >
                  <div className="text-xs text-neutral-400 truncate">{bt.body_type}</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                    {bt.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Favorited Vehicles Leaderboard */}
      <div className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Most Favorited Supercars</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Vehicles bookmarked most frequently by registered AutoVerse members
            </p>
          </div>
          <button
            onClick={() => onNavigate('engagement')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>Engagement Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topFavoritedCars.map((car, idx) => {
            const images = safeJsonParse<string[]>(car.images, []);
            const imgUrl = images[0] || FALLBACK_CAR_IMAGE;

            return (
              <div
                key={car.car_id || idx}
                className="group relative rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col hover:border-neutral-700 transition-colors"
              >
                <div className="h-28 w-full bg-neutral-900 relative overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-neutral-950/80 backdrop-blur border border-neutral-700 text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <Bookmark className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{car.favorite_count}</span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                      {car.brand}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{car.model}</div>
                  </div>
                  <div className="mt-2 text-xs font-mono font-medium text-amber-400">
                    {formatCurrency(car.price_usd)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
