import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Review, Car } from '../../types';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [carsList, setCarsList] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState<Partial<Review>>({
    car_id: '',
    user_name: '',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: '',
    comment: '',
    likes: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (ratingFilter !== 'all') params.append('min_rating', ratingFilter);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setReviews(data || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCarsList(data.cars || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchCars();
  }, [search, ratingFilter]);

  const handleOpenModal = (rev?: Review) => {
    if (rev) {
      setEditingReview(rev);
      setFormData({ ...rev });
    } else {
      setEditingReview(null);
      setFormData({
        car_id: carsList[0]?.id || '',
        user_name: 'Adil Zaman',
        user_avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        title: 'Masterpiece of Modern Engineering',
        comment: 'Incredible track precision, intoxicating acoustic exhaust note, and unshakeable aerodynamic grip.',
        likes: 12,
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.comment) {
      setError('Title and comment are required.');
      return;
    }
    if (!formData.car_id) {
      setError('Please select a target vehicle.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingReview) {
        const res = await fetch(`/api/reviews/${editingReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update review');
      } else {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to submit review');
      }
      setIsModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Displaying feedback, driver ratings, and community endorsements from `neon_reviews`
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/neon_reviews?format=csv"
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
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by driver name, feedback, car model..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Ratings' },
            { id: '5', label: '★ 5 Stars' },
            { id: '4', label: '★ 4+ Stars' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRatingFilter(r.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                ratingFilter === r.id
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-neutral-900 animate-pulse" />
          ))
        ) : reviews.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-neutral-400 rounded-xl border border-neutral-800 bg-neutral-900/40">
            No reviews match your query.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between space-y-3 hover:border-neutral-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      rev.user_avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={rev.user_name}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-semibold text-white text-xs">{rev.user_name}</div>
                    <div className="text-[11px] text-neutral-400">{rev.date || 'Verified Driver'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{rev.rating}</span>
                </div>
              </div>

              {/* Vehicle Badge */}
              <div className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                <span className="text-neutral-500">FOR:</span>
                <span className="text-white font-medium">
                  {rev.car_brand ? `${rev.car_brand} ${rev.car_model}` : rev.car_id}
                </span>
              </div>

              {/* Title & Comment */}
              <div>
                <h4 className="text-sm font-semibold text-white">{rev.title}</h4>
                <p className="mt-1 text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[11px]">
                  <ThumbsUp className="w-3 h-3 text-amber-500" />
                  <span>{rev.likes || 0} Likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(rev)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                    title="Edit Review"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingReview ? 'Edit Customer Review' : 'Create Customer Review'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Associated Vehicle *
                </label>
                <select
                  required
                  value={formData.car_id || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, car_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select a vehicle...</option>
                  {carsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.user_name || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, user_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Rating (1 to 5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating || 5}
                    onChange={(e) => setFormData((p) => ({ ...p, rating: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Unbelievable Hybrid Hypercar"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Review Narrative *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.comment || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Write detailed driving impressions..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Likes Count
                  </label>
                  <input
                    type="number"
                    value={formData.likes || 0}
                    onChange={(e) => setFormData((p) => ({ ...p, likes: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.user_avatar || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, user_avatar: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{editingReview ? 'Save Review' : 'Publish Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
