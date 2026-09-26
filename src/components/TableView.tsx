import React, { useState } from 'react';
import { HeritageSite } from '../types';
import { 
  Download, 
  Search, 
  ChevronRight, 
  ExternalLink, 
  MapPin, 
  BadgeCheck,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface TableViewProps {
  sites: HeritageSite[];
  onSelectSite: (site: HeritageSite) => void;
}

export const TableView: React.FC<TableViewProps> = ({ sites, onSelectSite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.kelurahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.code && site.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategory === 'all' || site.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kode',
      'Nama Situs',
      'Kategori',
      'Kelurahan',
      'Kecamatan',
      'Latitude',
      'Longitude',
      'Periode',
      'Status',
      'No SK',
      'Alamat',
      'Deskripsi'
    ];

    const rows = filteredSites.map((site, idx) => [
      idx + 1,
      `"${site.code || ''}"`,
      `"${site.name.replace(/"/g, '""')}"`,
      `"${site.category}"`,
      `"${site.kelurahan}"`,
      `"${site.kecamatan}"`,
      site.coordinates.lat,
      site.coordinates.lng,
      `"${site.yearOrPeriod}"`,
      `"${site.status}"`,
      `"${site.skNumber || ''}"`,
      `"${site.address.replace(/"/g, '""')}"`,
      `"${site.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `djelajah_donggala_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = Array.from(new Set(sites.map(s => s.category)));

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5">
      
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
        
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, kode (BUDAYA06), kelurahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Semua Kategori ({sites.length})</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>

      </div>

      {/* Table Wrapper */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-left text-xs text-stone-300 whitespace-nowrap">
          <thead className="bg-stone-950/80 text-stone-400 uppercase tracking-wider font-mono text-[10px] border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama Cagar Budaya / Situs</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Desa / Kelurahan</th>
              <th className="px-4 py-3">Kecamatan</th>
              <th className="px-4 py-3">Koordinat (Lat, Lng)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Periode</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-sans">
            {filteredSites.length > 0 ? (
              filteredSites.map((site, index) => (
                <tr 
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className="hover:bg-stone-800/60 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono text-stone-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] font-bold text-amber-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {site.code || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-100 max-w-xs truncate">
                    {site.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700">
                      {site.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-300">{site.kelurahan}</td>
                  <td className="px-4 py-3 text-stone-400">{site.kecamatan}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-stone-400">
                    {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                      <BadgeCheck className="w-2.5 h-2.5" />
                      <span>{site.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 max-w-[140px] truncate">
                    {site.yearOrPeriod}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite(site);
                      }}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-stone-500">
                  Tidak ada situs cagar budaya yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
        <span>Menampilkan {filteredSites.length} dari {sites.length} situs cagar budaya</span>
        <span>Format tabel terintegrasi standar 37 Kolom Kemendikbud</span>
      </div>

    </div>
  );
};
