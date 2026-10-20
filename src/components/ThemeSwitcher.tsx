import React from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'detailed' | 'segmented';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs shadow-inner ${className}`}
        role="group"
        aria-label="Theme Selection"
      >
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isDark
              ? 'bg-neutral-800 text-amber-400 font-semibold shadow-sm border border-neutral-700/60'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Deep Obsidian Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Obsidian</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            !isDark
              ? 'bg-white text-neutral-900 font-semibold shadow-sm border border-neutral-300'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="High-Contrast Light Solar Mode"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>High-Contrast</span>
        </button>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-xl border transition-all ${
          isDark
            ? 'bg-neutral-900/80 hover:bg-neutral-900 border-neutral-800 text-neutral-300'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        } ${className}`}
        title={`Switch to ${isDark ? 'High-Contrast Light' : 'Deep Obsidian'} mode`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight flex items-center gap-1">
              <span>{isDark ? 'Deep Obsidian' : 'High-Contrast'}</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {isDark ? 'Low-light Executive' : 'Solar Daylight Mode'}
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
            isDark
              ? 'bg-neutral-800 text-neutral-400'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isDark ? 'DARK' : 'LIGHT'}
        </span>
      </button>
    );
  }

  // Compact icon button for Navbar
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
        isDark
          ? 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
          : 'bg-white text-slate-800 hover:text-black border-slate-200 hover:border-slate-300 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to Deep Obsidian Mode'}
      aria-label="Toggle Environment Theme"
    >
      <div className="relative">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-600 transition-transform duration-200 group-hover:rotate-45" />
        )}
      </div>
      <span className="hidden md:inline font-mono text-[11px]">
        {isDark ? 'Obsidian' : 'Light Mode'}
      </span>
    </button>
  );
};
