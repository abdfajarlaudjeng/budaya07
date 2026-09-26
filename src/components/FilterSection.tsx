import React from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedKelurahan: string;
  setSelectedKelurahan: (kel: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  categories: string[];
  kelurahans: string[];
  onResetFilters: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedKelurahan,
  setSelectedKelurahan,
  sortBy,
  setSortBy,
  categories,
  kelurahans,
  onResetFilters
}) => {
  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedKelurahan !== 'all';

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      
      {/* Top row: Search and Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            id="search-heritage-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari situs (misal: Pusentasi, Souraja, Towale, BUDAYA06)..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-stone-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdowns: Kelurahan & Sort */}
        <div className="flex items-center space-x-2">
          
          <select
            id="filter-kelurahan-select"
            value={selectedKelurahan}
            onChange={(e) => setSelectedKelurahan(e.target.value)}
            className="bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-2.5 text-xs text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="all">Semua Desa / Kelurahan</option>
            {kelurahans.map((kel, i) => (
              <option key={i} value={kel}>{kel}</option>
            ))}
          </select>

          <select
            id="sort-by-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-2.5 text-xs text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="default">Urutan Standar</option>
            <option value="name-asc">Nama (A - Z)</option>
            <option value="name-desc">Nama (Z - A)</option>
            <option value="category">Berdasarkan Kategori</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              title="Reset Filter"
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400 border border-stone-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition ${
            selectedCategory === 'all'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
              : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
};
