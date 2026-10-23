import React from 'react';
import {
  LayoutDashboard,
  CarFront,
  Users,
  MessageSquare,
  Sparkles,
  Database,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Megaphone,
  Tags,
  Swords,
} from 'lucide-react';
import { ADMIN_PROFILE } from '../utils';
import { ThemeSwitcher } from './ThemeSwitcher';

export type TabType =
  | 'overview'
  | 'fleet'
  | 'brands'
  | 'compare'
  | 'users'
  | 'reviews'
  | 'ads'
  | 'engagement'
  | 'sql'
  | 'diagnostics';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  carsCount?: number;
  brandsCount?: number;
  usersCount?: number;
  reviewsCount?: number;
  adsCount?: number;
  isDbConnected: boolean;
  latencyMs?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  carsCount = 27,
  brandsCount = 23,
  usersCount = 1,
  reviewsCount = 4,
  adsCount = 4,
  isDbConnected,
  latencyMs,
}) => {
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Executive Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'fleet' as TabType,
      label: 'Vehicle Fleet',
      icon: CarFront,
      badge: carsCount,
    },
    {
      id: 'brands' as TabType,
      label: 'Automotive Brands',
      icon: Tags,
      badge: brandsCount,
    },
    {
      id: 'users' as TabType,
      label: 'User Directory',
      icon: Users,
      badge: usersCount,
    },
    {
      id: 'reviews' as TabType,
      label: 'Review Moderation',
      icon: MessageSquare,
      badge: reviewsCount,
    },
    {
      id: 'ads' as TabType,
      label: 'Ad Campaigns',
      icon: Megaphone,
      badge: adsCount,
    },
    {
      id: 'engagement' as TabType,
      label: 'Driver Engagement',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'sql' as TabType,
      label: 'SQL Query Studio',
      icon: Database,
      badge: null,
    },
    {
      id: 'diagnostics' as TabType,
      label: 'System & Backups',
      icon: Activity,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-500 font-bold tracking-wider text-sm shadow-inner">
            AV
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-neutral-100 flex items-center gap-1.5">
              AutoVerse
              <span className="text-[10px] font-mono tracking-widest text-amber-500 font-medium">CONSOLE</span>
            </span>
            <span className="text-[11px] text-neutral-400">Database Administration</span>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-medium tracking-wider text-neutral-300">
          CORE PLATFORM
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-900 text-amber-400 border border-neutral-800 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database Connection Card */}
      <div className="p-3 m-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-medium text-neutral-300">Neon Database</span>
          </div>
          {latencyMs !== undefined && (
            <span className="font-mono tabular-nums text-[10px] text-neutral-400">
              {latencyMs}ms
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-300 truncate">
          AWS ap-southeast-1 · SSL
        </p>
        <button
          onClick={() => setCurrentTab('diagnostics')}
          className="mt-2 w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Connection Specs</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Environment Theme Switcher */}
      <div className="px-3 pb-2">
        <ThemeSwitcher variant="detailed" />
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-neutral-800/80 flex items-center justify-between bg-neutral-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={ADMIN_PROFILE.avatarUrl}
              alt={ADMIN_PROFILE.name}
              className="w-8 h-8 rounded-full object-cover object-[50%_10%] border-2 border-amber-400/30 shadow-sm"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = ADMIN_PROFILE.remoteAvatarUrl;
              }}
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-neutral-950 ring-1 ring-emerald-400/50" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-neutral-100 truncate flex items-center gap-1">
              <span>{ADMIN_PROFILE.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono truncate">{ADMIN_PROFILE.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
