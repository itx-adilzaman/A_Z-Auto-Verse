import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  Download,
  AlertTriangle,
  X,
  Check,
  Palette,
  Eye,
} from 'lucide-react';
import { Ad } from '../../types';

// Convert integer color from Neon DB (e.g. 4294956554) to css hex (#FFAE0A)
function intToHexColor(colorInt: string | number | undefined): string {
  if (!colorInt) return '#F59E0B';
  const num = typeof colorInt === 'string' ? parseInt(colorInt, 10) : colorInt;
  if (isNaN(num)) return '#F59E0B';
  // Standard ARGB or RGB uint32
  const hex = (num >>> 0).toString(16).padStart(8, '0');
  // Return #RRGGBB (ignoring alpha byte if 8 chars)
  return '#' + (hex.length === 8 ? hex.slice(2) : hex.slice(0, 6));
}

export const AdsView: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<Partial<Ad>>({
    id: '',
    sponsor_name: '',
    partner_badge: '',
    headline: '',
    subline: '',
    cta_text: '',
    image_url: '',
    accent_color_hex: '#F59E0B',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`/api/ads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAds(data || []);
      }
    } catch (e) {
      console.error('Failed to load ads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [search]);

  const handleOpenModal = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        ...ad,
        accent_color_hex: intToHexColor(ad.accent_color_hex),
      });
    } else {
      setEditingAd(null);
      setFormData({
        id: `ad_${Math.random().toString(36).substring(2, 8)}`,
        sponsor_name: 'MICHELIN MOTORSPORT',
        partner_badge: 'OFFICIAL TRACK TYRE',
        headline: 'Pilot Sport Cup 2 R',
        subline: 'Lap record breaker engineered with MotoGP compound chemistry. Maximized lateral g-force cornering.',
        cta_text: 'Explore Grip',
        image_url: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
        accent_color_hex: '#F59E0B',
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sponsor_name || !formData.headline) {
      setFormError('Sponsor name and headline are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      if (editingAd) {
        const res = await fetch(`/api/ads/${editingAd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update ad');
        }
      } else {
        const res = await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create ad');
        }
      }
      setIsModalOpen(false);
      fetchAds();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/ads/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (ad: Ad) => {
    try {
      const res = await fetch(`/api/ads/${ad.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        fetchAds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const colorPresets = [
    { label: 'Amber Gold', hex: '#F59E0B' },
    { label: 'Brembo Red', hex: '#EF4444' },
    { label: 'Mobil Blue', hex: '#3B82F6' },
    { label: 'Akrapovič Cyan', hex: '#06B6D4' },
    { label: 'Acid Lime', hex: '#84CC16' },
    { label: 'Ultra Violet', hex: '#8B5CF6' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <span>Sponsored Ads & Partner Campaigns</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage partner banners, tyre and brake sponsors, and automotive promotional placements in `neon_ads`
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/neon_ads?format=csv"
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by sponsor, headline, badge..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400 whitespace-nowrap">
          {ads.length} active {ads.length === 1 ? 'campaign' : 'campaigns'} in database
        </div>
      </div>

      {/* Ads Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-neutral-900 animate-pulse" />
          ))
        ) : ads.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-neutral-400 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            No ads found. Tap "Create Campaign" to add your first sponsor banner.
          </div>
        ) : (
          ads.map((ad) => {
            const accentColor = intToHexColor(ad.accent_color_hex);

            return (
              <div
                key={ad.id}
                className="group relative rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col shadow-lg hover:border-neutral-700 transition-all duration-300"
              >
                {/* Visual Banner Preview */}
                <div className="relative h-56 w-full overflow-hidden bg-neutral-950">
                  <img
                    src={ad.image_url}
                    alt={ad.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Contrast Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase font-semibold text-neutral-950 shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {ad.partner_badge || 'OFFICIAL PARTNER'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-white/90 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-white/10">
                      ID: {ad.id}
                    </span>
                  </div>

                  {/* Banner Content */}
                  <div className="absolute bottom-4 inset-x-4 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      {ad.sponsor_name}
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                      {ad.headline}
                    </h3>
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed drop-shadow">
                      {ad.subline}
                    </p>
                  </div>
                </div>

                {/* Bottom Administrative Bar */}
                <div className="p-4 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: accentColor }}
                      title={`Accent Color: ${accentColor}`}
                    />
                    <span className="text-xs font-mono text-neutral-400">
                      CTA: <strong className="text-neutral-200">{ad.cta_text}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenModal(ad)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(ad)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                      title="Duplicate Campaign"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ad)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 border border-neutral-800 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-semibold text-white">Remove Campaign Banner</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete the campaign banner for{' '}
              <strong className="text-white">
                {deleteTarget.sponsor_name} ({deleteTarget.headline})
              </strong>{' '}
              from the AutoVerse database?
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Campaign Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  {editingAd ? `Edit Campaign: ${editingAd.headline}` : 'Create New Sponsor Campaign'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAd} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real-time In-App Preview</span>
                </span>
                <div className="relative h-44 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                  <img
                    src={
                      formData.image_url ||
                      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold text-neutral-950"
                      style={{ backgroundColor: String(formData.accent_color_hex || '#F59E0B') }}
                    >
                      {formData.partner_badge || 'OFFICIAL PARTNER'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-300">
                        {formData.sponsor_name || 'SPONSOR NAME'}
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {formData.headline || 'Headline Title'}
                      </div>
                      <div className="text-xs text-neutral-300 line-clamp-1">
                        {formData.subline || 'Description summary text...'}
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-950 whitespace-nowrap shrink-0 shadow"
                      style={{ backgroundColor: String(formData.accent_color_hex || '#F59E0B') }}
                    >
                      {formData.cta_text || 'Learn More'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Sponsor / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sponsor_name || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, sponsor_name: e.target.value.toUpperCase() }))
                      }
                      placeholder="e.g. PIRELLI MOTORSPORT"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Partner Badge Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.partner_badge || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, partner_badge: e.target.value.toUpperCase() }))
                      }
                      placeholder="e.g. OFFICIAL TYRE PARTNER"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Campaign Headline *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.headline || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, headline: e.target.value }))}
                      placeholder="e.g. P Zero™ Trofeo RS"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      CTA Button Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cta_text || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, cta_text: e.target.value }))}
                      placeholder="Explore Grip, Learn More"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Campaign Subline / Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.subline || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, subline: e.target.value }))}
                    placeholder="Enter short punchy commercial narrative..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Banner Background Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Accent Color Palette */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Brand Accent Color</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, accent_color_hex: c.hex }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                          formData.accent_color_hex?.toString().toLowerCase() === c.hex.toLowerCase()
                            ? 'border-white text-white bg-neutral-800'
                            : 'border-neutral-800 text-neutral-400 hover:text-white bg-neutral-950'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.label}</span>
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="color"
                        value={formData.accent_color_hex || '#F59E0B'}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, accent_color_hex: e.target.value }))
                        }
                        className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-neutral-400">
                        {formData.accent_color_hex}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System ID */}
                {!editingAd && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Campaign Identifier (Database ID)
                    </label>
                    <input
                      type="text"
                      value={formData.id || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, id: e.target.value }))}
                      placeholder="ad_custom_name"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{editingAd ? 'Save Campaign' : 'Publish Ad Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
