import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Navigation, 
  BadgeCheck, 
  Compass, 
  Eye,
  Camera
} from 'lucide-react';
import { HeritageSite } from '../types';

interface SiteCardProps {
  site: HeritageSite;
  onSelectSite: (site: HeritageSite) => void;
  onFocusOnMap?: (site: HeritageSite) => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  onSelectSite,
  onFocusOnMap
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
  const displayImage = imageError || !site.images || site.images.length === 0 ? fallbackImage : site.images[0];

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'geowisata':
        return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30';
      case 'cagar budaya':
        return 'bg-amber-600/20 text-amber-300 border-amber-500/30';
      case 'arsitektur kolonial':
        return 'bg-orange-600/20 text-orange-300 border-orange-500/30';
      case 'wisata bahari':
        return 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30';
      case 'situs sejarah':
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      case 'tradisi & budaya':
        return 'bg-rose-600/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-stone-700/40 text-stone-300 border-stone-600/30';
    }
  };

  const getStatusBadge = (status: string) => {
    const isEstablished = status?.toLowerCase().includes('tetap') || status?.toLowerCase().includes('ditetapkan');
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
        isEstablished 
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40 shadow-sm'
          : 'bg-stone-800/80 text-stone-300 border-stone-700/60'
      }`}>
        <BadgeCheck className="w-3 h-3 text-emerald-400" />
        <span>{status || 'Terdaftar'}</span>
      </span>
    );
  };

  return (
    <article 
      id={`site-card-${site.id}`}
      className="group bg-stone-900/90 hover:bg-stone-800/90 rounded-2xl overflow-hidden border border-stone-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-950/20 flex flex-col h-full"
    >
      
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-950">
        <img
          src={displayImage}
          alt={site.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border backdrop-blur-md shadow-md ${getCategoryColor(site.category)}`}>
            {site.category}
          </span>
          {site.code && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              {site.code}
            </span>
          )}
        </div>

        {/* Bottom Floating Info on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-300">
          <div className="flex items-center space-x-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-[170px]">
              {site.kelurahan}, {site.kecamatan}
            </span>
          </div>
          {site.images.length > 1 && (
            <span className="flex items-center space-x-1 text-[11px] bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm border border-stone-700/50">
              <Camera className="w-3 h-3 text-stone-300" />
              <span>{site.images.length}</span>
            </span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Status & Period */}
          <div className="flex items-center justify-between mb-2">
            {getStatusBadge(site.status)}
            <div className="flex items-center space-x-1 text-[11px] text-stone-400">
              <Calendar className="w-3 h-3 text-stone-500" />
              <span className="truncate max-w-[120px]">{site.yearOrPeriod}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {site.name}
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs text-stone-400 line-clamp-3 leading-relaxed">
            {site.description}
          </p>
        </div>

        {/* Footer & Action Buttons */}
        <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
          
          {onFocusOnMap && (
            <button
              type="button"
              onClick={() => onFocusOnMap(site)}
              title="Lihat Titik di Peta"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-800/50 hover:bg-stone-800 border border-stone-700/60 transition"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Peta</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectSite(site)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-500 text-xs font-semibold transition-all duration-200 active:scale-95"
          >
            <span>Buka Detail</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

    </article>
  );
};
