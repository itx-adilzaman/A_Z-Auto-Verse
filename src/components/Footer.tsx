import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowUp,
  Cpu,
  Database,
  Globe2,
  Heart,
  CarFront,
  Tags,
  Users,
  MessageSquare,
  Megaphone,
  Activity,
  Layers,
  Code2,
  ExternalLink,
  Maximize2,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { ADMIN_PROFILE } from '../utils';
import { TabType } from './Sidebar';
import { ThemeSwitcher } from './ThemeSwitcher';

interface FooterProps {
  onNavigate?: (tab: TabType) => void;
  isDbConnected?: boolean;
  carsCount?: number;
  brandsCount?: number;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  isDbConnected = true,
  carsCount = 27,
  brandsCount = 23,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [photoMode, setPhotoMode] = useState<'portrait' | 'full'>('portrait');
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-20 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl overflow-hidden selection:bg-amber-400/20">
      {/* Animated Glowing Ambient Accent Line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse" />

      {/* Background Decorative Mesh & Radial Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Main Hero Signature Box for Muhammad Adil Zaman */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-950/80 border border-neutral-800/90 shadow-2xl shadow-black/80 overflow-hidden mb-12 group hover:border-neutral-700/80 transition-all duration-300">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/15 transition-all duration-500 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center lg:items-center justify-between gap-8">
            {/* Left: Animated Profile & Grand Typography */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left">
              {/* Profile Image with Proper Aspect Ratio & Perfect Face Alignment */}
              <div className="flex flex-col items-center sm:items-start shrink-0">
                <div
                  className="relative group/avatar cursor-pointer"
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  title="Click to view full uncropped portrait"
                >
                  {/* Rotating gradient halo ring */}
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 opacity-75 blur-sm group-hover/avatar:opacity-100 group-hover/avatar:blur transition-all duration-500 animate-[spin_12s_linear_infinite]" />

                  {/* Image Container with portrait framing (never chops forehead or hair) */}
                  <div className="relative w-32 sm:w-36 h-44 sm:h-48 rounded-2xl overflow-hidden bg-neutral-950 border-2 border-amber-400/70 shadow-2xl flex items-center justify-center">
                    <img
                      src={ADMIN_PROFILE.avatarUrl}
                      alt={ADMIN_PROFILE.name}
                      className={`w-full h-full ${
                        photoMode === 'portrait'
                          ? 'object-cover object-[50%_10%]'
                          : 'object-contain p-1'
                      } group-hover/avatar:scale-105 transition-all duration-500`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ADMIN_PROFILE.remoteAvatarUrl;
                      }}
                    />

                    {/* Expand icon overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-medium">
                      <Maximize2 className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px]">Full Photo</span>
                    </div>
                  </div>

                  {/* Status Dot */}
                  <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-neutral-950 border border-emerald-500/50 flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">
                      ONLINE
                    </span>
                  </div>
                </div>

                {/* Photo Display Mode Toggles */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setPhotoMode(photoMode === 'portrait' ? 'full' : 'portrait')}
                    className="px-2 py-0.5 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-[10px] font-mono text-neutral-300 hover:text-amber-400 border border-neutral-700/60 transition-colors flex items-center gap-1"
                    title="Toggle between Face Focus and Complete Uncropped view"
                  >
                    <span>{photoMode === 'portrait' ? 'Full Uncut' : 'Face Focus'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPhotoLightboxOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-[10px] font-mono text-neutral-300 hover:text-amber-400 border border-neutral-700/60 transition-colors flex items-center gap-1"
                    title="Open high-resolution picture viewer"
                  >
                    <Eye className="w-3 h-3 text-amber-400" />
                    <span>Zoom</span>
                  </button>
                </div>
              </div>

              {/* Typography & Bio */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    FOUNDER & LEAD ARCHITECT
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[11px] font-mono">
                    AUTOVERSE OS
                  </span>
                </div>

                {/* Grand Animated Name Typography */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-neutral-100 via-amber-200 to-amber-400 bg-clip-text text-transparent hover:brightness-110 transition-all duration-300">
                    {ADMIN_PROFILE.name}
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
                  Engineered and architected the <strong className="text-neutral-200 font-medium">AutoVerse Admin Console</strong> with full-stack Neon Serverless PostgreSQL persistence, luxury vehicle dossiers, dynamic marque controls, and executive telemetry.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-neutral-400 font-mono">
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Global Infrastructure</span>
                  </span>
                  <span className="text-neutral-700 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full Administrator Authority</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry & Console Heartbeat */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-center gap-3 shrink-0">
              {/* Real-time Heartbeat Clock */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 text-right w-full sm:w-auto min-w-[200px] shadow-inner">
                <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>CONSOLE TIME (LIVE)</span>
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-wider mt-0.5">
                  {timeStr || '12:00:00 PM'}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5 flex items-center justify-between sm:justify-end gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Neon DB Connected (AWS)</span>
                </div>
              </div>

              {/* Back to top button */}
              <button
                onClick={scrollToTop}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md group/btn"
                title="Scroll back to top"
              >
                <span>Back to Top</span>
                <ArrowUp className="w-3.5 h-3.5 text-amber-400 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Platform Directory & Quick Nav Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-8 border-t border-b border-neutral-800/70 text-xs">
          {/* Col 1: AutoVerse Brand */}
          <div className="col-span-2 lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-500 font-bold text-xs shadow-inner">
                AV
              </div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                AutoVerse
                <span className="text-[9px] font-mono tracking-widest text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  SYSTEMS
                </span>
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs max-w-sm">
              An elite digital cockpit for automotive connoisseurs and fleet commanders. Designed with uncompromising standards by Muhammad Adil Zaman.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-500 font-mono">
              <span>PostgreSQL 18.6</span>
              <span>•</span>
              <span>Vite + React 19</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>

          {/* Col 2: Core Platform Navigation */}
          <div className="space-y-2.5">
            <div className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] font-mono">
              Fleet & Catalog
            </div>
            <ul className="space-y-1.5 text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate?.('overview')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3 h-3 text-neutral-500" />
                  <span>Executive Overview</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('fleet')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <CarFront className="w-3 h-3 text-neutral-500" />
                  <span>Vehicle Fleet ({carsCount})</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('brands')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Tags className="w-3 h-3 text-neutral-500" />
                  <span>Marques & Brands ({brandsCount})</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Campaigns */}
          <div className="space-y-2.5">
            <div className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] font-mono">
              User & Moderation
            </div>
            <ul className="space-y-1.5 text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate?.('users')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3 text-neutral-500" />
                  <span>User & Role Directory</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('reviews')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3 text-neutral-500" />
                  <span>Reviews Moderation</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('ads')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Megaphone className="w-3 h-3 text-neutral-500" />
                  <span>Sponsored Campaigns</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Database & Infrastructure */}
          <div className="space-y-2.5">
            <div className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px] font-mono">
              Engineered Stack
            </div>
            <ul className="space-y-1.5 text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate?.('sql')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Code2 className="w-3 h-3 text-neutral-500" />
                  <span>Neon SQL Studio</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('diagnostics')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-neutral-500" />
                  <span>System Diagnostics</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('engagement')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3 h-3 text-neutral-500" />
                  <span>Driver Telemetry</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 AutoVerse Systems.</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-neutral-400">
              Architected & Built by{' '}
              <strong className="text-amber-400 font-semibold hover:underline cursor-pointer">
                Muhammad Adil Zaman
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px] font-mono">
            <ThemeSwitcher variant="segmented" />
            <div className="hidden lg:flex items-center gap-2 text-neutral-400">
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Neon PostgreSQL Verified</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full High-Resolution Uncropped Lightbox Modal */}
      {isPhotoLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsPhotoLightboxOpen(false)}
        >
          <div
            className="relative max-w-xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{ADMIN_PROFILE.name}</span>
                <span className="text-amber-400 font-mono text-[11px]">· Complete Uncropped Portrait</span>
              </div>
              <button
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Uncropped Original Image */}
            <div className="mt-4 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl max-h-[70vh] flex items-center justify-center">
              <img
                src={ADMIN_PROFILE.avatarUrl}
                alt={ADMIN_PROFILE.name}
                className="w-full h-auto max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ADMIN_PROFILE.remoteAvatarUrl;
                }}
              />
            </div>

            {/* Footer */}
            <div className="w-full pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>Full resolution original portrait</span>
              <button
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
