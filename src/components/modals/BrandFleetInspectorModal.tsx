import React, { useState, useEffect } from 'react';
import {
  X,
  CarFront,
  Zap,
  Gauge,
  Timer,
  Fuel,
  ArrowRight,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Building2,
  Calendar,
  Globe2,
} from 'lucide-react';
import { Brand, Car } from '../../types';
import { formatCurrency, safeJsonParse, FALLBACK_CAR_IMAGE } from '../../utils';

interface BrandFleetInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
  onOpenFleetWithBrand: (brandName: string) => void;
}

export const BrandFleetInspectorModal: React.FC<BrandFleetInspectorModalProps> = ({
  isOpen,
  onClose,
  brand,
  onOpenFleetWithBrand,
}) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !brand) return;

    const fetchBrandCars = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/brands/${brand.id}`);
        if (!res.ok) {
          throw new Error('Failed to load fleet for brand');
        }
        const data = await res.json();
        setCars(data.cars || []);
      } catch (err: any) {
        setError(err.message || 'Error loading vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandCars();
  }, [isOpen, brand]);

  if (!isOpen || !brand) return null;

  const totalValuation = cars.reduce((acc, c) => acc + Number(c.price_usd || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Hero Banner */}
        <div className="relative p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-700/80 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-lg">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-bold text-amber-400 text-xl font-mono">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{brand.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] font-mono">
                    {brand.country}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[11px] font-mono">
                    Est. {brand.founded_year}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                    {brand.headquarters || 'Global Headquarters'}
                  </span>
                  <span>•</span>
                  <span>{brand.total_models} models listed</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-neutral-800/80">
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800">
              <div className="text-[11px] text-neutral-400">Active Fleet Units</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {cars.length} Vehicles
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800">
              <div className="text-[11px] text-neutral-400">Total Marque Valuation</div>
              <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {formatCurrency(totalValuation)}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-neutral-400">Manage in Fleet</div>
                <div className="text-xs text-neutral-300 font-medium mt-0.5">Filter Fleet Grid</div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenFleetWithBrand(brand.name);
                }}
                className="px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Open Fleet</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Brand Description */}
        {brand.description && (
          <div className="px-6 py-3 bg-neutral-950/40 border-b border-neutral-800/80 text-xs text-neutral-300 italic shrink-0">
            "{brand.description}"
          </div>
        )}

        {/* Fleet Vehicles List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <CarFront className="w-4 h-4 text-amber-400" />
              Registered Vehicles in Database ({cars.length})
            </h4>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Querying Neon PostgreSQL for {brand.name} vehicles...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : cars.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <CarFront className="w-10 h-10 text-neutral-600 mx-auto stroke-[1.5]" />
              <div className="text-sm font-semibold text-neutral-200">
                No vehicles registered under "{brand.name}" yet
              </div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Add cars with brand name matching "{brand.name}" in the Vehicle Fleet manager.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenFleetWithBrand(brand.name);
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Go to Fleet Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cars.map((car) => {
                const images = safeJsonParse<string[]>(car.images, []);
                const imgUrl = images[0] || FALLBACK_CAR_IMAGE;

                return (
                  <div
                    key={car.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex gap-3.5">
                      <div className="w-24 h-20 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                        <img
                          src={imgUrl}
                          alt={car.model}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_CAR_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {car.year} {car.model}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {car.variant || car.body_type}
                        </div>
                        <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                          {formatCurrency(car.price_usd)}
                        </div>
                      </div>
                    </div>

                    {/* Specs Pills */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-900 text-[11px] text-neutral-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{car.horsepower} HP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-neutral-500" />
                        <span>{car.top_speed_kmh} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-neutral-500" />
                        <span>{car.acceleration_0_100}s</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0 text-xs">
          <span className="text-neutral-500 font-mono">ID: {brand.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
