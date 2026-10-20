import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Sparkles,
  Flame,
  Zap,
  Download,
  CheckSquare,
  Square,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Car, Review } from '../../types';
import { formatCurrency, safeJsonParse, FALLBACK_CAR_IMAGE } from '../../utils';
import { VehicleDossierModal } from '../modals/VehicleDossierModal';
import { VehicleFormModal } from '../modals/VehicleFormModal';

interface CarsViewProps {
  onAddVehicle: () => void;
  initialBrandFilter?: string;
}

export const CarsView: React.FC<CarsViewProps> = ({ onAddVehicle, initialBrandFilter }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(initialBrandFilter || 'all');

  useEffect(() => {
    if (initialBrandFilter) {
      setSelectedBrand(initialBrandFilter);
    }
  }, [initialBrandFilter]);
  const [selectedBodyType, setSelectedBodyType] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterTrending, setFilterTrending] = useState(false);
  const [filterElectric, setFilterElectric] = useState(false);
  const [filterSupercar, setFilterSupercar] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available metadata for dropdowns
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableBodyTypes, setAvailableBodyTypes] = useState<string[]>([]);
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals
  const [dossierCar, setDossierCar] = useState<Car | null>(null);
  const [dossierReviews, setDossierReviews] = useState<Review[]>([]);
  const [dossierFavs, setDossierFavs] = useState<number>(0);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [formCar, setFormCar] = useState<Car | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteTargetCar, setDeleteTargetCar] = useState<Car | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch cars with auto-retry
  const fetchCars = async (isRetry = false) => {
    try {
      setLoading(true);
      setFetchError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) params.append('search', search);
      if (selectedBrand !== 'all') params.append('brand', selectedBrand);
      if (selectedBodyType !== 'all') params.append('body_type', selectedBodyType);
      if (selectedFuelType !== 'all') params.append('fuel_type', selectedFuelType);
      if (filterFeatured) params.append('is_featured', 'true');
      if (filterTrending) params.append('is_trending', 'true');
      if (filterElectric) params.append('is_electric', 'true');
      if (filterSupercar) params.append('is_supercar', 'true');

      const res = await fetch(`/api/cars?${params.toString()}`);
      if (!res.ok) {
        if (!isRetry) {
          // If first attempt failed (e.g. Neon cold-start wake up), wait 1.2s and retry automatically
          setTimeout(() => fetchCars(true), 1200);
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.error || 'Database connection warming up. Please try again.');
        return;
      }
      const data = await res.json();

      setCars(data.cars || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.brands) setAvailableBrands(data.brands);
      if (data.bodyTypes) setAvailableBodyTypes(data.bodyTypes);
      if (data.fuelTypes) setAvailableFuelTypes(data.fuelTypes);
    } catch (err: any) {
      if (!isRetry) {
        setTimeout(() => fetchCars(true), 1200);
      } else {
        setFetchError('Database connection temporarily interrupted. Tap retry to reconnect.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [
    page,
    search,
    selectedBrand,
    selectedBodyType,
    selectedFuelType,
    filterFeatured,
    filterTrending,
    filterElectric,
    filterSupercar,
    sortBy,
    sortOrder,
  ]);

  // Open Dossier
  const handleOpenDossier = async (car: Car) => {
    setDossierCar(car);
    setIsDossierOpen(true);
    try {
      const res = await fetch(`/api/cars/${car.id}`);
      if (res.ok) {
        const detail = await res.json();
        setDossierReviews(detail.reviews || []);
        setDossierFavs(detail.favoritesCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Featured status inline
  const handleToggleFeatured = async (car: Car, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = !car.is_featured;
    try {
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, is_featured: updated } : c))
      );
      await fetch(`/api/cars/${car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...car, is_featured: updated }),
      });
    } catch (err) {
      console.error('Failed to toggle featured:', err);
      fetchCars();
    }
  };

  // Toggle Trending status inline
  const handleToggleTrending = async (car: Car, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = !car.is_trending;
    try {
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, is_trending: updated } : c))
      );
      await fetch(`/api/cars/${car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...car, is_trending: updated }),
      });
    } catch (err) {
      console.error('Failed to toggle trending:', err);
      fetchCars();
    }
  };

  // Duplicate car
  const handleDuplicateCar = async (car: Car) => {
    try {
      const res = await fetch(`/api/cars/${car.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        fetchCars();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete car
  const handleConfirmDelete = async () => {
    if (!deleteTargetCar) return;
    try {
      await fetch(`/api/cars/${deleteTargetCar.id}`, { method: 'DELETE' });
      setDeleteTargetCar(null);
      fetchCars();
    } catch (err) {
      console.error(err);
    }
  };

  // Save or create car from modal
  const handleSaveCar = async (carData: Partial<Car>) => {
    if (formCar) {
      // Update
      const res = await fetch(`/api/cars/${formCar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update vehicle');
      }
    } else {
      // Create
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create vehicle');
      }
    }
    fetchCars();
  };

  // Selection helpers
  const handleSelectAll = () => {
    if (selectedIds.length === cars.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cars.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkAction = async (action: 'set_featured' | 'set_trending' | 'delete', value?: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      await fetch('/api/cars/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds, value }),
      });
      setSelectedIds([]);
      fetchCars();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = '/api/export/neon_cars?format=csv';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Vehicle Fleet Inventory
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Displaying <span className="text-amber-400 font-mono font-medium">{total} total</span>{' '}
            production models synced directly with PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setFormCar(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by brand, model, variant, origin..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Brands ({availableBrands.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Body Type Filter */}
          <div>
            <select
              value={selectedBodyType}
              onChange={(e) => {
                setSelectedBodyType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Body Styles</option>
              {availableBodyTypes.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="created_at-desc">Latest Added</option>
              <option value="price_usd-desc">Price: High to Low</option>
              <option value="price_usd-asc">Price: Low to High</option>
              <option value="horsepower-desc">Horsepower: Highest</option>
              <option value="year-desc">Year: Newest</option>
              <option value="rating-desc">Rating: Highest</option>
            </select>
          </div>
        </div>

        {/* Quick Tag Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800 text-xs">
          <span className="text-neutral-500 text-[11px] font-medium mr-1">QUICK FILTERS:</span>
          <button
            onClick={() => setFilterFeatured(!filterFeatured)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterFeatured
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            ★ Featured Hero
          </button>
          <button
            onClick={() => setFilterTrending(!filterTrending)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterTrending
                ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setFilterElectric(!filterElectric)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterElectric
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            ⚡ Electric
          </button>
          <button
            onClick={() => setFilterSupercar(!filterSupercar)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterSupercar
                ? 'bg-rose-400/20 text-rose-300 border border-rose-400/40'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            🏎 Supercars & Hypercars
          </button>

          {(filterFeatured ||
            filterTrending ||
            filterElectric ||
            filterSupercar ||
            selectedBrand !== 'all' ||
            selectedBodyType !== 'all' ||
            search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedBrand('all');
                setSelectedBodyType('all');
                setSelectedFuelType('all');
                setFilterFeatured(false);
                setFilterTrending(false);
                setFilterElectric(false);
                setFilterSupercar(false);
                setPage(1);
              }}
              className="text-xs text-amber-400 hover:underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Fetch Error Warning Banner with Retry */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => fetchCars(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 font-semibold hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Bulk Action Bar (when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-neutral-900 border border-amber-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>
              {selectedIds.length} {selectedIds.length === 1 ? 'vehicle' : 'vehicles'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('set_featured', true)}
              disabled={bulkActionLoading}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
            >
              Set Featured
            </button>
            <button
              onClick={() => handleBulkAction('set_trending', true)}
              disabled={bulkActionLoading}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
            >
              Set Trending
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkActionLoading}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium rounded transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-neutral-400 hover:text-white px-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px] font-medium">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-neutral-400 hover:text-white"
                  >
                    {selectedIds.length > 0 && selectedIds.length === cars.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-3 min-w-[240px]">Vehicle & Model</th>
                <th className="py-3.5 px-3">Year / Style</th>
                <th className="py-3.5 px-3">Retail Price</th>
                <th className="py-3.5 px-3">Powertrain & Speed</th>
                <th className="py-3.5 px-3">Badges</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="w-4 h-4 bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 bg-neutral-800 rounded" />
                        <div className="space-y-1">
                          <div className="w-24 h-3 bg-neutral-800 rounded" />
                          <div className="w-16 h-2 bg-neutral-800 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-16 h-3 bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-20 h-3 bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-24 h-3 bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-16 h-3 bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="w-12 h-3 bg-neutral-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : cars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <p className="text-sm font-medium text-neutral-300">
                      No vehicles found matching criteria.
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Try clearing filters or adding a new supercar to the database.
                    </p>
                  </td>
                </tr>
              ) : (
                cars.map((car) => {
                  const images = safeJsonParse<string[]>(car.images, []);
                  const thumb = images[0] || FALLBACK_CAR_IMAGE;
                  const isSelected = selectedIds.includes(car.id);

                  return (
                    <tr
                      key={car.id}
                      onClick={() => handleOpenDossier(car)}
                      className={`hover:bg-neutral-800/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-neutral-800/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 pl-4 pr-2"
                        onClick={(e) => handleToggleSelect(car.id, e)}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                        )}
                      </td>

                      {/* Thumbnail & Identity */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={`${car.brand} ${car.model}`}
                            className="w-12 h-9 rounded object-cover border border-neutral-800 shrink-0 bg-neutral-950"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{car.brand} {car.model}</span>
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                              <span>{car.variant || 'Standard'}</span>
                              <span className="text-neutral-600">·</span>
                              <span className="font-mono text-[10px] text-neutral-500">
                                {car.country}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Year & Body Type */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-neutral-300">
                        <div className="font-mono">{car.year}</div>
                        <div className="text-[11px] text-neutral-400">{car.body_type}</div>
                      </td>

                      {/* Price USD */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-mono tabular-nums font-semibold text-amber-400 text-xs">
                          {formatCurrency(car.price_usd)}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          ★ {car.rating || '5.0'}
                        </div>
                      </td>

                      {/* Powertrain */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-neutral-300">
                        <div className="font-mono tabular-nums text-xs">
                          {car.horsepower} HP · {car.top_speed_kmh} km/h
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          0-100: {car.acceleration_0_100}s ({car.drivetrain})
                        </div>
                      </td>

                      {/* Flags Badges / Inline Switches */}
                      <td
                        className="py-3.5 px-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleFeatured(car, e)}
                            title="Toggle Featured"
                            className={`p-1 rounded text-[11px] transition-colors ${
                              car.is_featured
                                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                                : 'bg-neutral-950 text-neutral-600 border border-neutral-800 hover:text-neutral-300'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleTrending(car, e)}
                            title="Toggle Trending"
                            className={`p-1 rounded text-[11px] transition-colors ${
                              car.is_trending
                                ? 'bg-purple-400/20 text-purple-400 border border-purple-400/40'
                                : 'bg-neutral-950 text-neutral-600 border border-neutral-800 hover:text-neutral-300'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                          {car.is_electric && (
                            <span
                              title="Electric"
                              className="p-1 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 text-[10px]"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td
                        className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDossier(car)}
                            title="View Full Specifications Dossier"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormCar(car);
                              setIsFormOpen(true);
                            }}
                            title="Edit Vehicle"
                            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateCar(car)}
                            title="Duplicate Listing"
                            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetCar(car)}
                            title="Delete Vehicle"
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing <span className="font-mono text-white">{cars.length}</span> of{' '}
            <span className="font-mono text-white">{total}</span> vehicles
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              Page {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-semibold text-white">Delete Vehicle Confirmation</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">
                {deleteTargetCar.brand} {deleteTargetCar.model}
              </strong>{' '}
              from the Neon PostgreSQL database? This action will remove associated favorites,
              reviews, and view logs.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetCar(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Dossier Modal */}
      <VehicleDossierModal
        car={dossierCar}
        reviews={dossierReviews}
        favoritesCount={dossierFavs}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onEdit={(car) => {
          setIsDossierOpen(false);
          setFormCar(car);
          setIsFormOpen(true);
        }}
      />

      {/* Vehicle Form Modal (Add / Edit) */}
      <VehicleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialCar={formCar}
        onSave={handleSaveCar}
      />
    </div>
  );
};
