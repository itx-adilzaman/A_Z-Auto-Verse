import React, { useState } from 'react';
import {
  X,
  Gauge,
  Zap,
  Timer,
  Fuel,
  Shield,
  Layers,
  Award,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';
import { Car, Review } from '../../types';
import { formatCurrency, safeJsonParse, FALLBACK_CAR_IMAGE } from '../../utils';

interface VehicleDossierModalProps {
  car: Car | null;
  reviews?: Review[];
  favoritesCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (car: Car) => void;
}

export const VehicleDossierModal: React.FC<VehicleDossierModalProps> = ({
  car,
  reviews = [],
  favoritesCount = 0,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!isOpen || !car) return null;

  const images = safeJsonParse<string[]>(car.images, []);
  const features = safeJsonParse<string[]>(car.features, []);
  const currentImage = images[activeImageIdx] || images[0] || FALLBACK_CAR_IMAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-500 uppercase tracking-widest font-semibold">
              VEHICLE DOSSIER
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm font-semibold text-white">
              {car.brand} {car.model}
            </span>
            {car.variant && (
              <span className="text-xs text-neutral-400">({car.variant})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(car)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Specs</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Top Gallery & Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="relative h-72 sm:h-80 w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                <img
                  src={currentImage}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {images.length > 1 && (
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                      }
                      className="p-1.5 rounded-full bg-neutral-950/70 border border-neutral-700 text-white pointer-events-auto hover:bg-neutral-900 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                      }
                      className="p-1.5 rounded-full bg-neutral-950/70 border border-neutral-700 text-white pointer-events-auto hover:bg-neutral-900 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[11px] font-mono text-neutral-300">
                  Image {activeImageIdx + 1} of {images.length || 1}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIdx === idx
                          ? 'border-amber-400 scale-105'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Summary Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{car.year}</span>
                  <span>·</span>
                  <span>{car.body_type}</span>
                  <span>·</span>
                  <span>{car.country}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {car.brand} {car.model}
                </h2>
                <div className="text-xs text-amber-500 font-mono mt-0.5">{car.variant}</div>

                <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs text-neutral-400 font-medium">RETAIL VALUATION</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {formatCurrency(car.price_usd)}
                  </div>
                </div>

                <p className="mt-4 text-xs text-neutral-300 leading-relaxed line-clamp-4">
                  {car.description || 'No description provided.'}
                </p>
              </div>

              {/* Quick Status Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
                {car.is_featured && (
                  <span className="px-2 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded text-[11px] font-medium">
                    Featured Hero
                  </span>
                )}
                {car.is_trending && (
                  <span className="px-2 py-1 bg-purple-400/10 border border-purple-400/30 text-purple-400 rounded text-[11px] font-medium">
                    Trending
                  </span>
                )}
                {car.is_supercar && (
                  <span className="px-2 py-1 bg-rose-400/10 border border-rose-400/30 text-rose-400 rounded text-[11px] font-medium">
                    Supercar Spec
                  </span>
                )}
                {car.is_electric && (
                  <span className="px-2 py-1 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 rounded text-[11px] font-medium">
                    Electric
                  </span>
                )}
                <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-[11px] font-mono">
                  ★ {car.rating || '5.0'} ({car.reviews_count || reviews.length} reviews)
                </span>
                <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-[11px] font-mono">
                  ♥ {favoritesCount} saves
                </span>
              </div>
            </div>
          </div>

          {/* Performance Grid */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              POWERTRAIN & DYNAMICS METRICS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>HORSEPOWER</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  {car.horsepower} <span className="text-xs text-neutral-400 font-normal">HP</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>TORQUE</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  {car.torque_nm} <span className="text-xs text-neutral-400 font-normal">Nm</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span>0-100 KM/H</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  {car.acceleration_0_100} <span className="text-xs text-neutral-400 font-normal">sec</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  <span>TOP SPEED</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  {car.top_speed_kmh} <span className="text-xs text-neutral-400 font-normal">km/h</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>DRIVETRAIN</span>
                </div>
                <div className="text-sm font-semibold font-mono text-white mt-1">
                  {car.drivetrain}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>SAFETY</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  ★ {car.safety_rating}
                </div>
              </div>
            </div>
          </div>

          {/* Full Specifications Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chassis & Mechanical Specs */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                MECHANICAL SPECIFICATIONS
              </h4>
              <div className="divide-y divide-neutral-900 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Engine / Architecture</span>
                  <span className="text-neutral-200 font-medium text-right max-w-[60%]">{car.engine}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Transmission</span>
                  <span className="text-neutral-200 font-medium text-right">{car.transmission}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Fuel Type / Energy</span>
                  <span className="text-neutral-200 font-medium text-right">{car.fuel_type}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Braking System</span>
                  <span className="text-neutral-200 font-medium text-right max-w-[60%]">{car.brakes}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Suspension Setup</span>
                  <span className="text-neutral-200 font-medium text-right max-w-[60%]">{car.suspension}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Tyre Specification</span>
                  <span className="text-neutral-200 font-medium text-right max-w-[60%]">{car.tyre_size}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Efficiency / Mileage</span>
                  <span className="text-neutral-200 font-medium text-right">{car.mileage}</span>
                </div>
              </div>
            </div>

            {/* Dimensions & Capacity */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                DIMENSIONS & CAPACITIES
              </h4>
              <div className="divide-y divide-neutral-900 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Dimensions (L × W × H)</span>
                  <span className="text-neutral-200 font-mono">{car.dimensions}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Wheelbase</span>
                  <span className="text-neutral-200 font-mono">{car.wheelbase}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Curb Weight</span>
                  <span className="text-neutral-200 font-mono">{car.weight_kg} kg</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Ground Clearance</span>
                  <span className="text-neutral-200 font-mono">{car.ground_clearance}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Boot Space</span>
                  <span className="text-neutral-200 font-mono">{car.boot_space}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">Seating Capacity</span>
                  <span className="text-neutral-200 font-mono">{car.seating} passengers</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-neutral-400">System Database ID</span>
                  <span className="text-neutral-400 font-mono text-[11px]">{car.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Checklist */}
          {features.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                INTEGRATED FEATURES & OPTIONS ({features.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews for this car */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              DRIVER REVIEWS ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                No verified reviews recorded for this vehicle yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                          alt={r.user_name}
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-medium text-white">{r.user_name}</span>
                        <span className="text-neutral-500 text-xs">·</span>
                        <span className="text-[11px] text-neutral-400">{r.date}</span>
                      </div>
                      <div className="text-xs font-mono text-amber-400 font-semibold">
                        ★ {r.rating}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-neutral-200">{r.title}</div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 font-mono">
            Neon ID: {car.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
