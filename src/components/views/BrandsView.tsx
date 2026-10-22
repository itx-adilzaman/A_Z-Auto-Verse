import React, { useState, useEffect } from 'react';
import {
  CarFront,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  Building2,
  Calendar,
  Globe2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Layers,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Grid,
  List,
  ShieldAlert,
} from 'lucide-react';
import { Brand } from '../../types';
import { formatCurrency } from '../../utils';
import { BrandFormModal } from '../modals/BrandFormModal';
import { BrandFleetInspectorModal } from '../modals/BrandFleetInspectorModal';
import { BrandLogo } from '../BrandLogo';

interface BrandsViewProps {
  onNavigateToFleet: (brandName: string) => void;
  onBrandCountChange?: (count: number) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({
  onNavigateToFleet,
  onBrandCountChange,
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [sortBy, setSortBy] = useState<string>('active_cars_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedBrandForEdit, setSelectedBrandForEdit] = useState<Brand | null>(null);

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedBrandForInspector, setSelectedBrandForInspector] = useState<Brand | null>(null);

  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-sync missing brands state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await fetch(`/api/brands?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load brands from Neon database');
      }
      const data: Brand[] = await res.json();
      setBrands(data);
      if (onBrandCountChange) {
        onBrandCountChange(data.length);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching brands');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [search, selectedCountry, sortBy, sortOrder]);

  // Derived stats
  const totalBrands = brands.length;
  const totalFleetCars = brands.reduce((sum, b) => sum + (b.active_cars_count || 0), 0);
  const countries = Array.from(new Set(brands.map((b) => b.country).filter(Boolean))).sort();
  const highestInventoryBrand = [...brands].sort(
    (a, b) =>
      Number(b.avg_inventory_price || 0) * (b.active_cars_count || 0) -
      Number(a.avg_inventory_price || 0) * (a.active_cars_count || 0)
  )[0];

  const handleCreateBrand = async (brandData: any) => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create brand');
    }
    fetchBrands();
  };

  const handleUpdateBrand = async (brandData: any) => {
    if (!selectedBrandForEdit) return;
    const res = await fetch(`/api/brands/${selectedBrandForEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update brand');
    }
    fetchBrands();
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/brands/${brandToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete brand');
      }
      setBrandToDelete(null);
      fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Error deleting brand');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateBrand = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/brands/${brand.id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to duplicate brand');
      }
      fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Error duplicating brand');
    }
  };

  const handleSyncFromFleet = async () => {
    try {
      setIsSyncing(true);
      setSyncNotice(null);
      // Get all distinct brands in cars
      const carsRes = await fetch('/api/cars/meta/filters');
      if (!carsRes.ok) throw new Error('Failed to inspect vehicle brands');
      const filters = await carsRes.json();
      const carBrands: string[] = filters.brands || [];

      // Check which ones are not in brands list
      const existingNames = new Set(brands.map((b) => b.name.toLowerCase()));
      const missing = carBrands.filter((b) => !existingNames.has(b.toLowerCase()));

      if (missing.length === 0) {
        setSyncNotice('All vehicle brands in the fleet are already catalogued in neon_brands!');
        setTimeout(() => setSyncNotice(null), 4000);
        return;
      }

      // Create missing brands
      let addedCount = 0;
      for (const name of missing) {
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name,
            country: 'Global',
            founded_year: 2000,
            headquarters: 'Global Headquarters',
            description: `${name} automotive engineering and vehicle manufacturing.`,
            total_models: 2,
          }),
        });
        addedCount++;
      }

      setSyncNotice(`Successfully synchronized ${addedCount} brand(s) from fleet: ${missing.join(', ')}`);
      fetchBrands();
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      setSyncNotice(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const exportBrands = (format: 'csv' | 'json') => {
    window.location.href = `/api/export/neon_brands?format=${format}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
              Automotive Brands & Marques
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-semibold">
              {totalBrands} Marque{totalBrands === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Curate global manufacturers, manage brand identity dossiers, sync model counts, and control inventory association across AutoVerse.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchBrands}
            disabled={isRefreshing}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title="Refresh brands from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleSyncFromFleet}
            disabled={isSyncing}
            className="px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Auto-detect any car brands in neon_cars not yet in neon_brands"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSyncing ? 'Syncing...' : 'Sync from Fleet'}</span>
          </button>

          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
            <button
              onClick={() => exportBrands('csv')}
              className="px-2.5 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 border-r border-neutral-800"
              title="Export as CSV"
            >
              <Download className="w-3 h-3 text-neutral-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportBrands('json')}
              className="px-2.5 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
              title="Export as JSON"
            >
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={() => {
              setFormMode('create');
              setSelectedBrandForEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="p-1 hover:bg-amber-400/20 rounded text-amber-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Catalogued Marques</span>
            <CarFront className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {totalBrands}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Registered in <code className="text-amber-400 font-mono">neon_brands</code>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Active Fleet Linkage</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {totalFleetCars} <span className="text-xs font-normal text-neutral-400">Cars</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Vehicles mapped to marques in fleet
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Global Origins</span>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {countries.length} <span className="text-xs font-normal text-neutral-400">Nations</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            {countries.slice(0, 4).join(', ')}...
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Top Marque by Fleet</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 truncate">
            {highestInventoryBrand?.name || 'Porsche'}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            {highestInventoryBrand?.active_cars_count || 0} models in inventory
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands by marque name, country, headquarters, or heritage..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Country Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Countries ({countries.length})</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
          >
            <option value="active_cars_count">Sort: Active Cars in Fleet</option>
            <option value="name">Sort: Brand Name (A-Z)</option>
            <option value="total_models">Sort: Total Models</option>
            <option value="founded_year">Sort: Founded Year</option>
            <option value="avg_inventory_price">Sort: Avg Inventory Price</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Grid Cards View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Dense Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center text-xs text-neutral-400 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Querying Neon PostgreSQL for automotive brands...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchBrands}
            className="px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors"
          >
            Retry Query
          </button>
        </div>
      ) : brands.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <CarFront className="w-12 h-12 text-neutral-600 mx-auto stroke-[1.5]" />
          <div>
            <h3 className="text-base font-semibold text-neutral-200">No matching brands found</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
              Try adjusting your search terms or country filter, or auto-sync marques from the vehicle fleet.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearch('');
                setSelectedCountry('all');
              }}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleSyncFromFleet}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors"
            >
              Sync from Fleet
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
            >
              <div className="p-5 space-y-4">
                {/* Brand Card Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BrandLogo
                      src={brand.logo_url}
                      name={brand.name}
                      className="w-14 h-14 rounded-xl"
                    />
                    <div>
                      <h3 className="font-bold text-base text-white tracking-tight group-hover:text-amber-400 transition-colors">
                        {brand.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                          <Globe2 className="w-3 h-3 text-neutral-500" />
                          {brand.country || 'Global'}
                        </span>
                        <span className="text-neutral-700">•</span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          Est. {brand.founded_year || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fleet Count Badge */}
                  <button
                    onClick={() => {
                      setSelectedBrandForInspector(brand);
                      setIsInspectorOpen(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-colors ${
                      brand.active_cars_count && brand.active_cars_count > 0
                        ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20'
                        : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/50'
                    }`}
                    title="View vehicles belonging to this marque"
                  >
                    <span>{brand.active_cars_count || 0}</span>
                    <span className="text-[10px] font-sans font-normal opacity-80">in Fleet</span>
                  </button>
                </div>

                {/* Headquarters & Models */}
                <div className="space-y-1.5 text-xs text-neutral-400 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{brand.headquarters || 'Headquarters unlisted'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-neutral-500">Models catalogued:</span>
                    <span className="text-neutral-200 font-semibold">{brand.total_models || 0}</span>
                  </div>
                  {brand.active_cars_count && brand.active_cars_count > 0 && brand.avg_inventory_price ? (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-500">Avg fleet price:</span>
                      <span className="text-amber-400 font-semibold">
                        {formatCurrency(brand.avg_inventory_price)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Description snippet */}
                {brand.description && (
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed pt-1">
                    {brand.description}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedBrandForInspector(brand);
                    setIsInspectorOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Inspect Fleet</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateBrand(brand)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="Duplicate brand record"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBrandForEdit(brand);
                      setFormMode('edit');
                      setIsFormModalOpen(true);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="Edit brand credentials"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setBrandToDelete(brand)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title="Delete brand"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Marque / Brand</th>
                  <th className="py-3.5 px-4 font-semibold">Origin & Era</th>
                  <th className="py-3.5 px-4 font-semibold">Headquarters</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Models</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Active Fleet</th>
                  <th className="py-3.5 px-4 font-semibold">Avg Price</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="hover:bg-neutral-900/40 transition-colors group"
                  >
                    {/* Brand Name & Logo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <BrandLogo
                          src={brand.logo_url}
                          name={brand.name}
                          className="w-9 h-9 rounded-lg"
                        />
                        <div>
                          <div className="font-semibold text-neutral-100 group-hover:text-amber-400 transition-colors">
                            {brand.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">
                            id: {brand.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Origin & Year */}
                    <td className="py-3 px-4">
                      <div className="text-neutral-200 font-medium">{brand.country}</div>
                      <div className="text-[11px] font-mono text-neutral-500">
                        Est. {brand.founded_year || 'N/A'}
                      </div>
                    </td>

                    {/* HQ */}
                    <td className="py-3 px-4 text-neutral-400 max-w-xs truncate">
                      {brand.headquarters || '—'}
                    </td>

                    {/* Total Models */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-neutral-200">
                      {brand.total_models || 0}
                    </td>

                    {/* Active Fleet */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedBrandForInspector(brand);
                          setIsInspectorOpen(true);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-semibold inline-flex items-center gap-1 ${
                          brand.active_cars_count && brand.active_cars_count > 0
                            ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {brand.active_cars_count || 0} units
                      </button>
                    </td>

                    {/* Avg Price */}
                    <td className="py-3 px-4 font-mono text-neutral-300">
                      {brand.avg_inventory_price && Number(brand.avg_inventory_price) > 0
                        ? formatCurrency(brand.avg_inventory_price)
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedBrandForInspector(brand);
                            setIsInspectorOpen(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          title="Inspect fleet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateBrand(brand)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          title="Duplicate brand"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBrandForEdit(brand);
                            setFormMode('edit');
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Edit brand"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBrandToDelete(brand)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brand Form Modal (Create & Edit) */}
      <BrandFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={formMode === 'create' ? handleCreateBrand : handleUpdateBrand}
        brand={selectedBrandForEdit}
        mode={formMode}
      />

      {/* Brand Fleet Inspector Modal */}
      <BrandFleetInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        brand={selectedBrandForInspector}
        onOpenFleetWithBrand={(brandName) => {
          setIsInspectorOpen(false);
          onNavigateToFleet(brandName);
        }}
      />

      {/* Delete Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Brand Dossier</h3>
              <p className="text-xs text-neutral-400">
                Are you sure you want to delete <strong className="text-neutral-100">"{brandToDelete.name}"</strong> from{' '}
                <code className="text-amber-400 font-mono">neon_brands</code>?
              </p>
            </div>

            {brandToDelete.active_cars_count && brandToDelete.active_cars_count > 0 ? (
              <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs">
                <strong>Attention:</strong> There are currently{' '}
                <strong>{brandToDelete.active_cars_count} active vehicles</strong> linked to this brand in{' '}
                <code>neon_cars</code>. Deleting the brand won't delete the cars, but they will no longer be mapped to this brand profile.
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBrand}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
