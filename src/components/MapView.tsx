import React, { useEffect, useRef, useState } from 'react';
import { HeritageSite } from '../types';
import { MapPin, Navigation, Eye, Layers } from 'lucide-react';
import L from 'leaflet';

interface MapViewProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite | null;
  onSelectSite: (site: HeritageSite) => void;
  focusedSite: HeritageSite | null;
}

export const MapView: React.FC<MapViewProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  focusedSite
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const [mapReady, setMapReady] = useState(false);

  // Donggala center coordinates
  const DEFAULT_CENTER: [number, number] = [-0.675, 119.74];
  const DEFAULT_ZOOM = 12;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true
      });

      // Add high quality OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when sites change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Custom Icon generator
    const createCustomIcon = (category: string, isSelected: boolean) => {
      let iconColor = '#d97706'; // default amber
      if (category.toLowerCase().includes('geowisata')) iconColor = '#059669'; // emerald
      else if (category.toLowerCase().includes('arsitektur')) iconColor = '#ea580c'; // orange
      else if (category.toLowerCase().includes('bahari')) iconColor = '#0284c7'; // cyan
      else if (category.toLowerCase().includes('sejarah')) iconColor = '#9333ea'; // purple

      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${iconColor};
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          ">
            <div style="
              transform: rotate(45deg);
              width: 8px;
              height: 8px;
              background-color: #ffffff;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 36 : 28],
        popupAnchor: [0, -32]
      });
    };

    const bounds = L.latLngBounds([]);

    sites.forEach(site => {
      const lat = site.coordinates?.lat;
      const lng = site.coordinates?.lng;
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = selectedSite?.id === site.id;
      const icon = createCustomIcon(site.category, isSelected);

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      // Popup content
      const popupHtml = `
        <div style="min-width: 200px; font-family: sans-serif; color: #1c1917; padding: 4px;">
          <div style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 2px;">
            ${site.category}
          </div>
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px; line-height: 1.2;">
            ${site.name}
          </div>
          <div style="font-size: 11px; color: #78716c; margin-bottom: 8px;">
            📍 ${site.kelurahan}, ${site.kecamatan}
          </div>
          <button 
            id="popup-btn-${site.id}" 
            style="
              display: block;
              width: 100%;
              text-align: center;
              background-color: #d97706;
              color: white;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            "
          >
            Lihat Detail Situs
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${site.id}`);
        if (btn) {
          btn.onclick = () => onSelectSite(site);
        }
      });

      bounds.extend([lat, lng]);
      markersRef.current[site.id] = marker;
    });

    // Auto fit bounds if multiple sites exist
    if (sites.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [sites, mapReady]);

  // If a site is focused or selected from outside
  useEffect(() => {
    const targetSite = focusedSite || selectedSite;
    const map = mapInstanceRef.current;
    if (!targetSite || !map) return;

    const lat = targetSite.coordinates?.lat;
    const lng = targetSite.coordinates?.lng;
    if (isNaN(lat) || isNaN(lng)) return;

    map.flyTo([lat, lng], 15, { duration: 1.2 });

    const marker = markersRef.current[targetSite.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 400);
    }
  }, [focusedSite, selectedSite]);

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
      
      {/* Map Container Element */}
      <div 
        id="donggala-leaflet-map"
        ref={mapContainerRef} 
        className="w-full h-full z-0"
      />

      {/* Map Floating Legend */}
      <div className="absolute top-4 right-4 z-10 bg-stone-900/90 backdrop-blur-md p-3.5 rounded-xl border border-stone-800 shadow-xl text-xs space-y-2 pointer-events-auto max-w-[200px] hidden sm:block">
        <div className="font-semibold text-stone-200 flex items-center space-x-1.5 pb-1 border-b border-stone-800">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Kategori Situs</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center space-x-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Geowisata (Pusentasi)</span>
          </div>
          <div className="flex items-center space-x-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Cagar Budaya</span>
          </div>
          <div className="flex items-center space-x-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Arsitektur Kolonial</span>
          </div>
          <div className="flex items-center space-x-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <span>Wisata Bahari</span>
          </div>
          <div className="flex items-center space-x-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Situs Sejarah</span>
          </div>
        </div>
      </div>

      {/* Map Floating Bottom Hint */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-800 text-[11px] text-stone-300 pointer-events-none flex items-center space-x-2">
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        <span>Klik pin penanda untuk melihat ringkasan dan membuka rute</span>
      </div>

    </div>
  );
};
