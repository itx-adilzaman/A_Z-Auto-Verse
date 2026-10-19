import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Eye,
  Columns,
  Clock,
  Car,
  User,
  Trash2,
  Download,
  Flame,
} from 'lucide-react';
import { Favorite, RecentView, Comparison } from '../../types';
import { formatDate, formatCurrency, safeJsonParse, FALLBACK_CAR_IMAGE } from '../../utils';

export const EngagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'views' | 'comparisons'>('favorites');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [views, setViews] = useState<RecentView[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEngagement = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/engagement');
      if (!res.ok) throw new Error('Failed to load engagement records');
      const data = await res.json();
      setFavorites(data.favorites || []);
      setViews(data.recentViews || []);
      setComparisons(data.comparisons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagement();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Driver Engagement & Activity Logs
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time telemetry from `neon_favorites`, `neon_recent_views`, and `neon_comparisons`
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/export/${
              activeSubTab === 'favorites'
                ? 'neon_favorites'
                : activeSubTab === 'views'
                ? 'neon_recent_views'
                : 'neon_comparisons'
            }?format=csv`}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export Table CSV</span>
          </a>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="p-1 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center gap-1">
        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeSubTab === 'favorites'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Vehicle Bookmarks ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('views')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeSubTab === 'views'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Recent Page Views ({views.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comparisons')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeSubTab === 'comparisons'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5 text-purple-400" />
          <span>Comparison Queue ({comparisons.length})</span>
        </button>
      </div>

      {/* Content Section */}
      {activeSubTab === 'favorites' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px] font-medium">
                <tr>
                  <th className="py-3.5 pl-4 pr-3">Vehicle</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Bookmarked By User</th>
                  <th className="py-3.5 px-3">User ID</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {favorites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-neutral-400">
                      No bookmarks logged yet.
                    </td>
                  </tr>
                ) : (
                  favorites.map((fav, i) => {
                    const images = safeJsonParse<string[]>(fav.images, []);
                    const thumb = images[0] || FALLBACK_CAR_IMAGE;
                    return (
                      <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 pl-4 pr-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={thumb}
                              alt=""
                              className="w-10 h-7 rounded object-cover border border-neutral-800 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-semibold text-white">
                                {fav.brand ? `${fav.brand} ${fav.model}` : fav.car_id}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                ID: {fav.car_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-amber-400">
                          {fav.price_usd ? formatCurrency(fav.price_usd) : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-neutral-200">
                          <div>{fav.user_name || 'Driver Member'}</div>
                          <div className="text-[11px] text-neutral-500">{fav.user_email || '—'}</div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-neutral-500">
                          {fav.user_id}
                        </td>
                        <td className="py-3.5 pr-4 pl-3 text-right font-mono text-[11px] text-neutral-400">
                          {formatDate(fav.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'views' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px] font-medium">
                <tr>
                  <th className="py-3.5 pl-4 pr-3">Vehicle Viewed</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Session User</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Viewed Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {views.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-neutral-400">
                      No page view logs recorded.
                    </td>
                  </tr>
                ) : (
                  views.map((v, i) => (
                    <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-semibold text-white">
                          {v.brand ? `${v.brand} ${v.model}` : v.car_id}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">{v.car_id}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-amber-400">
                        {v.price_usd ? formatCurrency(v.price_usd) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        <div className="font-medium text-white">{v.user_name || 'Visitor'}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{v.user_id}</div>
                      </td>
                      <td className="py-3.5 pr-4 pl-3 text-right font-mono text-[11px] text-neutral-400">
                        {formatDate(v.viewed_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'comparisons' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px] font-medium">
                <tr>
                  <th className="py-3.5 pl-4 pr-3">Car Added to Compare</th>
                  <th className="py-3.5 px-3">User</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {comparisons.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-neutral-400">
                      Comparison queue is currently empty.
                    </td>
                  </tr>
                ) : (
                  comparisons.map((c, i) => (
                    <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 pl-4 pr-3 font-semibold text-white">
                        {c.brand ? `${c.brand} ${c.model}` : c.car_id}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300 font-mono text-[11px]">
                        {c.user_name || c.user_id}
                      </td>
                      <td className="py-3.5 pr-4 pl-3 text-right font-mono text-[11px] text-neutral-400">
                        {formatDate(c.added_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
