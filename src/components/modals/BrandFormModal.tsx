import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Building2,
  Globe2,
  Calendar,
  CarFront,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Brand } from '../../types';
import { normalizeImageUrl } from '../../utils';
import { BrandLogo } from '../BrandLogo';

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandData: any) => Promise<void>;
  brand?: Brand | null;
  mode: 'create' | 'edit';
}

const LUXURY_LOGO_PRESETS = [
  { name: 'Ferrari', url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80', country: 'Italy', hq: 'Maranello, Emilia-Romagna, Italy', year: 1939, models: 8 },
  { name: 'Porsche', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80', country: 'Germany', hq: 'Stuttgart, Baden-Württemberg, Germany', year: 1931, models: 9 },
  { name: 'Lamborghini', url: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=400&q=80', country: 'Italy', hq: 'Sant\'Agata Bolognese, Italy', year: 1963, models: 6 },
  { name: 'Bugatti', url: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?auto=format&fit=crop&w=400&q=80', country: 'France', hq: 'Molsheim, Alsace, France', year: 1909, models: 3 },
  { name: 'McLaren', url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=400&q=80', country: 'United Kingdom', hq: 'Woking, Surrey, United Kingdom', year: 1963, models: 5 },
  { name: 'Aston Martin', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80', country: 'United Kingdom', hq: 'Gaydon, Warwickshire, United Kingdom', year: 1913, models: 5 },
  { name: 'Koenigsegg', url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80', country: 'Sweden', hq: 'Ängelholm, Skåne, Sweden', year: 1994, models: 3 },
  { name: 'Rolls-Royce', url: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=400&q=80', country: 'United Kingdom', hq: 'Goodwood, West Sussex, United Kingdom', year: 1904, models: 4 },
  { name: 'Tesla', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=400&q=80', country: 'USA', hq: 'Austin, Texas, USA', year: 2003, models: 5 },
  { name: 'BMW', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=400&q=80', country: 'Germany', hq: 'Munich, Bavaria, Germany', year: 1916, models: 8 },
  { name: 'Mercedes-Benz', url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80', country: 'Germany', hq: 'Stuttgart, Germany', year: 1926, models: 7 },
  { name: 'Bentley', url: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=400&q=80', country: 'United Kingdom', hq: 'Crewe, Cheshire, United Kingdom', year: 1919, models: 4 },
  { name: 'Audi', url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=400&q=80', country: 'Germany', hq: 'Ingolstadt, Bavaria, Germany', year: 1909, models: 6 },
  { name: 'Toyota', url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80', country: 'Japan', hq: 'Toyota City, Aichi, Japan', year: 1937, models: 6 },
];

export const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brand,
  mode,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    logo_url: '',
    country: 'Germany',
    founded_year: 1930,
    headquarters: '',
    description: '',
    total_models: 5,
    rename_cars_too: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<'testing' | 'valid' | 'fallback' | 'idle'>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (brand && mode === 'edit') {
      setFormData({
        id: brand.id,
        name: brand.name,
        logo_url: brand.logo_url || '',
        country: brand.country || 'Germany',
        founded_year: brand.founded_year || 1930,
        headquarters: brand.headquarters || '',
        description: brand.description || '',
        total_models: brand.total_models || 5,
        rename_cars_too: false,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        logo_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
        country: 'Germany',
        founded_year: 1948,
        headquarters: 'Munich, Germany',
        description: 'Excellence in high-performance automotive engineering and luxury automotive heritage.',
        total_models: 6,
        rename_cars_too: false,
      });
    }
    setError(null);
  }, [brand, mode, isOpen]);

  // Test image URL whenever logo_url changes
  useEffect(() => {
    const raw = formData.logo_url;
    if (!raw) {
      setImageStatus('idle');
      return;
    }

    const clean = normalizeImageUrl(raw);
    setImageStatus('testing');

    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImageStatus('valid');
    };

    img.onerror = () => {
      // Image couldn't be loaded directly by the browser (hotlinking/CORS or invalid)
      setImageStatus('fallback');
    };

    img.src = clean;
  }, [formData.logo_url]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData((prev) => {
        let cleanValue = value;
        // Clean URL if pasting into logo_url
        if (name === 'logo_url') {
          cleanValue = normalizeImageUrl(value);
        }

        const next = { ...prev, [name]: cleanValue };
        if (name === 'name' && mode === 'create' && !prev.id) {
          next.id = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        return next;
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Selected image is too large. Please select an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData((prev) => ({ ...prev, logo_url: base64 }));
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Could not read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: typeof LUXURY_LOGO_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || preset.name,
      logo_url: preset.url,
      country: preset.country,
      headquarters: preset.hq,
      founded_year: preset.year,
      total_models: preset.models,
      id: prev.id || preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Brand name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const submissionData = {
        ...formData,
        logo_url: normalizeImageUrl(formData.logo_url),
      };
      await onSave(submissionData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">
                {mode === 'edit' ? `Edit Marque: ${brand?.name}` : 'Add New Automotive Brand'}
              </h3>
              <p className="text-xs text-neutral-400">
                Configure manufacturer credentials and inventory synchronization in Neon DB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preset Quick Fill (create mode) */}
          {mode === 'create' && (
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Marque Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LUXURY_LOGO_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 text-[11px] font-medium transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Brand Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ferrari, Aston Martin, Porsche"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Brand Identifier (Slug) */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Unique Slug ID
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="e.g. ferrari"
                disabled={mode === 'edit'}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Country of Origin */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
                Country of Origin
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Italy, Germany, United Kingdom"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Founded Year */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Founded Year
              </label>
              <input
                type="number"
                name="founded_year"
                value={formData.founded_year}
                onChange={handleChange}
                placeholder="1947"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Headquarters */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                Global Headquarters
              </label>
              <input
                type="text"
                name="headquarters"
                value={formData.headquarters}
                onChange={handleChange}
                placeholder="e.g. Maranello, Emilia-Romagna, Italy"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Total Models Catalogued */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Total Models Catalogued
              </label>
              <input
                type="number"
                name="total_models"
                value={formData.total_models}
                onChange={handleChange}
                min="0"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Logo / Badge URL & Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                  Badge / Logo URL
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="relative">
                <input
                  type="text"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="https://... or upload image directly"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 pr-8"
                />
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, logo_url: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    title="Clear image URL"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Warning if user pasted an Unsplash Webpage URL */}
              {formData.logo_url && formData.logo_url.includes('unsplash.com/photos/') && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 space-y-1 animate-in fade-in">
                  <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Yeh Unsplash Webpage ka link hai, direct picture ka nahi!</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Browser mein picture lagane ke liye <strong>Direct Image Link</strong> chahiye hota hai.
                  </p>
                  <div className="pt-1 flex flex-col gap-1 text-[11px] text-neutral-400">
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span>
                        Unsplash par photo par <strong>Right-Click</strong> karein aur <strong>"Copy Image Address"</strong> select karein (jo <code className="text-amber-300 font-mono text-[10px]">images.unsplash.com/...</code> se shuru hota hai).
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span>
                        Ya phir tasveer download kar ke upar <strong>"Upload File"</strong> button se direct select kar lein.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Logo Preview Box - Never Blank! */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Live Marque Badge Preview
              </span>
              {imageStatus === 'valid' && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  Direct Image Verified
                </span>
              )}
              {imageStatus === 'fallback' && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3 h-3" />
                  Using Luxury Monogram (Link not directly loadable)
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Robust BrandLogo - NEVER blank! */}
              <BrandLogo
                src={formData.logo_url}
                name={formData.name || 'New Marque'}
                className="w-16 h-16 rounded-xl"
              />

              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                  <span>{formData.name || 'Marque Name'}</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({formData.country || 'Global'})
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 leading-tight">
                  {imageStatus === 'valid'
                    ? 'Logo is loaded and will display in high fidelity across all views.'
                    : imageStatus === 'fallback'
                    ? 'External host restricted direct loading. AutoVerse will seamlessly render this luxury golden monogram emblem so it is never blank.'
                    : 'Preview of how this marque emblem will appear in the fleet and brand tables.'}
                </p>

                {imageStatus === 'fallback' && (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-400/20 transition-colors"
                    >
                      📁 Upload Local Image File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const matched = LUXURY_LOGO_PRESETS.find(
                          (p) => p.name.toLowerCase() === formData.name.toLowerCase()
                        );
                        if (matched) {
                          setFormData((p) => ({ ...p, logo_url: matched.url }));
                        } else {
                          setFormData((p) => ({ ...p, logo_url: LUXURY_LOGO_PRESETS[0].url }));
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono transition-colors"
                    >
                      ✨ Use Verified Preset URL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Brand Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Heritage & Engineering Identity Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide historical context, motorsport accolades, and signature powertrain philosophies..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Cascade Rename Cars Option (Edit Mode only) */}
          {mode === 'edit' && brand?.active_cars_count && brand.active_cars_count > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="rename_cars_too"
                  checked={formData.rename_cars_too}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400 focus:ring-offset-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-amber-300">
                    Synchronize Fleet Vehicles ({brand.active_cars_count} cars)
                  </span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Automatically update the brand field on all existing cars in{' '}
                    <code className="text-amber-400 font-mono">neon_cars</code> to match{' '}
                    <strong className="text-neutral-200">"{formData.name}"</strong>.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
