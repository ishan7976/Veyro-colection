import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Sun, Moon, Database, Copy, CheckCircle2, Shield, Palette, Sparkles, Monitor } from 'lucide-react';
import { SUPABASE_PROJECT_ID, GENERATE_SUPABASE_RLS_SQL } from '../../../lib/supabase';

interface SettingsTabProps {
  productsCount: number;
  ordersCount: number;
  customersCount: number;
  onCopySql: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  productsCount,
  ordersCount,
  customersCount,
  onCopySql
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8 font-mono text-xs">
      
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold uppercase tracking-wider flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-neutral-950'
        }`}>
          <Palette className="w-5 h-5 text-amber-500" />
          <span>Dashboard Studio & Theme Customization</span>
        </h2>
        <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Switch aesthetic modes, configure database telemetry, and manage security rules
        </p>
      </div>

      {/* THEME SWITCHER STUDIO (LIGHT / DARK THEME SYSTEM) */}
      <div className={`p-6 rounded-2xl border space-y-6 transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-neutral-950'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Theme Appearance Engine</span>
            </h3>
            <p className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
              Choose between high-contrast Dark Luxury Streetwear and Clean Light Atelier Mode
            </p>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-[11px] flex items-center gap-2 ${
            isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
          }`}>
            <span className="text-amber-500 font-bold">Shortcut:</span>
            <span>Ctrl / Cmd + Shift + L</span>
          </div>
        </div>

        {/* 2 Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Option 1: Dark Luxury Mode */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
              isDark 
                ? 'border-amber-500 bg-neutral-900 shadow-lg' 
                : 'border-neutral-200 bg-neutral-900 text-neutral-100 opacity-90 hover:opacity-100'
            }`}
          >
            {isDark && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded-md shadow">
                ACTIVE
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                  Dark Obsidian Luxury (Default)
                </h4>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Deep obsidian black canvas (#050505), high-contrast cards, and radiant golden amber (#F59E0B) accents. Built for late-night streetwear logistics.
              </p>
            </div>

            {/* Visual Mini Preview Box */}
            <div className="p-3 bg-[#050505] rounded-xl border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-amber-400 font-bold">VEYRO HQ</span>
                <span className="text-neutral-500">₹2,84,000 GMV</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-3/4"></div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setTheme('dark');
              }}
              className={`w-full py-2.5 rounded-xl font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                isDark 
                  ? 'bg-amber-500 text-neutral-950 shadow-md' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{isDark ? 'Selected (Dark Mode)' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          {/* Option 2: Light Atelier Mode */}
          <div
            onClick={() => setTheme('light')}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
              !isDark 
                ? 'border-amber-500 bg-white shadow-lg text-neutral-900' 
                : 'border-neutral-800 bg-neutral-100 text-neutral-900 opacity-90 hover:opacity-100'
            }`}
          >
            {!isDark && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded-md shadow">
                ACTIVE
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-sm text-neutral-950 uppercase tracking-wider">
                  Light Atelier Mode
                </h4>
              </div>
              <p className="text-neutral-600 text-xs leading-relaxed">
                Crisp minimalist white backdrop, high-contrast typography, refined borders, and warm amber highlights. Ideal for daylight office management.
              </p>
            </div>

            {/* Visual Mini Preview Box */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-amber-700 font-bold">VEYRO ATELIER</span>
                <span className="text-neutral-500">₹2,84,000 GMV</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-3/4"></div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setTheme('light');
              }}
              className={`w-full py-2.5 rounded-xl font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                !isDark 
                  ? 'bg-amber-500 text-neutral-950 shadow-md' 
                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{!isDark ? 'Selected (Light Mode)' : 'Switch to Light Mode'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Supabase Connection Status Card */}
      <div className={`p-6 rounded-2xl border space-y-4 transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-950'}`}>
              Supabase Real-Time PostgreSQL Active
            </span>
          </div>
          <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
            Project ID: {SUPABASE_PROJECT_ID}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Table: products</span>
            <div className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-neutral-950'}`}>{productsCount} Records</div>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Table: orders</span>
            <div className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-neutral-950'}`}>{ordersCount} Records</div>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Table: profiles</span>
            <div className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-neutral-950'}`}>{customersCount} Records</div>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Storage: product-images</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">Public Active</div>
          </div>
        </div>
      </div>

      {/* SQL Schema Script Viewer */}
      <div className={`p-6 rounded-2xl border space-y-4 transition ${
        isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex justify-between items-center">
          <span className={`font-bold uppercase ${isDark ? 'text-white' : 'text-neutral-950'}`}>
            Complete Supabase Schema & RLS SQL
          </span>
          <button
            onClick={onCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy SQL</span>
          </button>
        </div>
        <pre className={`p-4 rounded-xl text-[11px] overflow-x-auto max-h-64 border ${
          isDark 
            ? 'bg-neutral-900 border-neutral-800 text-neutral-300' 
            : 'bg-neutral-50 border-neutral-200 text-neutral-800'
        }`}>
          {GENERATE_SUPABASE_RLS_SQL}
        </pre>
      </div>

    </div>
  );
};
