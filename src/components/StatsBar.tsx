import React from 'react';
import { Landmark, Compass, Building2, Box, Sparkles, Layers } from 'lucide-react';
import { HeritageSite, CultureStats } from '../types';

interface StatsBarProps {
  sites: HeritageSite[];
  isSpreadsheetSynced: boolean;
  cultureStats?: CultureStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ 
  sites, 
  isSpreadsheetSynced,
  cultureStats 
}) => {
  // Use stats from sheet Statistik or count from current sites
  const stats: CultureStats = cultureStats || {
    Situs: sites.filter(s => (s.category || '').toLowerCase().includes('situs') || (s.category || '').toLowerCase().includes('alam')).length,
    Struktur: sites.filter(s => (s.category || '').toLowerCase().includes('struktur')).length,
    Bangunan: sites.filter(s => (s.category || '').toLowerCase().includes('bangunan') || (s.category || '').toLowerCase().includes('kolonial')).length,
    Benda: sites.filter(s => (s.category || '').toLowerCase().includes('benda') || (s.category || '').toLowerCase().includes('tenun')).length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span className="font-semibold text-stone-300 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Statistik Cagar Budaya (Sheet: <code className="text-amber-300 font-mono">Statistik</code>)</span>
        </span>
        {isSpreadsheetSynced && (
          <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tersinkronisasi Real-Time</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* SITUS */}
        <div className="bg-stone-900/90 border border-amber-600/30 hover:border-amber-500/60 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-serif text-white">{stats.Situs}</p>
            <p className="text-xs font-medium text-amber-300">Situs Budaya</p>
          </div>
        </div>

        {/* STRUKTUR */}
        <div className="bg-stone-900/90 border border-emerald-600/30 hover:border-emerald-500/60 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-serif text-white">{stats.Struktur}</p>
            <p className="text-xs font-medium text-emerald-300">Struktur Budaya</p>
          </div>
        </div>

        {/* BANGUNAN */}
        <div className="bg-stone-900/90 border border-cyan-600/30 hover:border-cyan-500/60 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-serif text-white">{stats.Bangunan}</p>
            <p className="text-xs font-medium text-cyan-300">Bangunan Cagar</p>
          </div>
        </div>

        {/* BENDA */}
        <div className="bg-stone-900/90 border border-purple-600/30 hover:border-purple-500/60 rounded-2xl p-4 flex items-center space-x-3.5 shadow-md transition">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-serif text-white">{stats.Benda}</p>
            <p className="text-xs font-medium text-purple-300">Benda Pusaka</p>
          </div>
        </div>
      </div>
    </div>
  );
};
