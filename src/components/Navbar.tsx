import React from 'react';
import { RefreshCw, Plus, ExternalLink } from 'lucide-react';
import { TabType } from './Sidebar';
import { ADMIN_PROFILE } from '../utils';
import { ThemeSwitcher } from './ThemeSwitcher';

interface NavbarProps {
  currentTab: TabType;
  onRefresh: () => void;
  isRefreshing: boolean;
  onAddVehicle: () => void;
  onAddUser: () => void;
  onAddReview: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onRefresh,
  isRefreshing,
  onAddVehicle,
  onAddUser,
  onAddReview,
}) => {
  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'overview':
        return 'AutoVerse / Executive Overview';
      case 'fleet':
        return 'AutoVerse / Vehicle Fleet Management';
      case 'brands':
        return 'AutoVerse / Automotive Brands & Marques';
      case 'users':
        return 'AutoVerse / User & Role Directory';
      case 'reviews':
        return 'AutoVerse / Customer Reviews Moderation';
      case 'ads':
        return 'AutoVerse / Sponsored Ads & Campaigns';
      case 'engagement':
        return 'AutoVerse / Driver Engagement & Views';
      case 'sql':
        return 'AutoVerse / Neon SQL Query Studio';
      case 'diagnostics':
        return 'AutoVerse / System Diagnostics & Backups';
    }
  };

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-6 flex items-center justify-between gap-6 shrink-0 sticky top-0 z-30">
      {/* Zone 1: Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-neutral-300">{getBreadcrumb()}</span>
      </div>

      {/* Zone 2: Navigation / Real Context links */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5 text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Neon PostgreSQL Connected
        </span>
        <span className="text-neutral-700">|</span>
        <span className="text-neutral-300">Database: neondb</span>
        <span className="text-neutral-700">|</span>
        <span className="text-neutral-300">SSL: Enforced</span>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <ThemeSwitcher variant="compact" />

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {currentTab === 'fleet' && (
          <button
            onClick={onAddVehicle}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        )}

        {currentTab === 'users' && (
          <button
            onClick={onAddUser}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New User</span>
          </button>
        )}

        {currentTab === 'reviews' && (
          <button
            onClick={onAddReview}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Review</span>
          </button>
        )}

        {currentTab === 'overview' && (
          <button
            onClick={onAddVehicle}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        )}

        {/* Executive Profile Avatar Pill */}
        <div className="flex items-center gap-2 pl-3 ml-1 border-l border-neutral-800 shrink-0">
          <div className="relative group cursor-pointer">
            <img
              src={ADMIN_PROFILE.avatarUrl}
              alt={ADMIN_PROFILE.name}
              className="w-8 h-8 rounded-full object-cover object-[50%_10%] border-2 border-amber-400/40 group-hover:border-amber-400 transition-colors shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = ADMIN_PROFILE.remoteAvatarUrl;
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-neutral-200 leading-tight">
              {ADMIN_PROFILE.name}
            </span>
            <span className="text-[10px] text-amber-400 font-mono tracking-wider">
              {ADMIN_PROFILE.badge}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
