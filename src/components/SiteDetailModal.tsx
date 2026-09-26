import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Navigation, 
  BadgeCheck, 
  Volume2, 
  VolumeX, 
  Clock, 
  Ticket, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  Share2, 
  Check, 
  Info,
  Layers,
  Compass,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { HeritageSite } from '../types';

interface SiteDetailModalProps {
  site: HeritageSite | null;
  onClose: () => void;
  onShowOnMap?: (site: HeritageSite) => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  site,
  onClose,
  onShowOnMap
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'sejarah' | 'legalitas'>('info');

  if (!site) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToSpeak = `${site.name}. Terletak di ${site.kelurahan}, Kecamatan ${site.kecamatan}, Kabupaten Donggala. ${site.description} Sejarah: ${site.history}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'id-ID';
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="site-detail-modal"
        className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {site.category}
            </span>
            {site.code && (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-stone-800 text-stone-300 border border-stone-700">
                {site.code}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              title="Salin Tautan"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition flex items-center space-x-1 text-xs"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCopied ? 'Tersalin' : 'Bagikan'}</span>
            </button>
            <button
              id="close-site-detail-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Main Visual Gallery & Hero Info */}
          <div className="space-y-4">
            <div className="relative aspect-[21/9] sm:aspect-[16/8] w-full rounded-xl overflow-hidden bg-stone-950 shadow-inner border border-stone-800">
              <img
                src={site.images[activeImageIndex] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
                alt={site.name}
                className="w-full h-full object-cover"
              />
              
              {/* Image Controls if multiple */}
              {site.images.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-stone-700 text-xs">
                  <button
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? site.images.length - 1 : prev - 1))}
                    className="p-1 hover:text-amber-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] text-stone-300">
                    {activeImageIndex + 1} / {site.images.length}
                  </span>
                  <button
                    onClick={() => setActiveImageIndex(prev => (prev === site.images.length - 1 ? 0 : prev + 1))}
                    className="p-1 hover:text-amber-400"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Float Title on Hero Image */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex items-end p-6">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                    {site.name}
                  </h1>
                  <p className="text-sm text-stone-300 flex items-center space-x-2 mt-1">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{site.address}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Thumbnails row if more than 1 */}
            {site.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {site.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                      activeImageIndex === idx ? 'border-amber-500' : 'border-stone-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Bar: Audio Narration & Map Directions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleAudio}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  isPlayingAudio
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50 animate-pulse'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                <span>{isPlayingAudio ? 'Hentikan Audio Narasi' : 'Dengarkan Audio Panduan'}</span>
              </button>

              <div className="hidden sm:block text-[11px] text-stone-400">
                Koordinat: {site.coordinates.lat.toFixed(5)}, {site.coordinates.lng.toFixed(5)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onShowOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onShowOnMap(site);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Lihat di Peta Web</span>
                </button>
              )}

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Navigation className="w-4 h-4" />
                <span>Petunjuk Arah (Google Maps)</span>
              </a>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-stone-800 space-x-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                activeTab === 'info' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Deskripsi & Kunjungan</span>
            </button>
            <button
              onClick={() => setActiveTab('sejarah')}
              className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                activeTab === 'sejarah' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Narasi Sejarah & Nilai Penting</span>
            </button>
            <button
              onClick={() => setActiveTab('legalitas')}
              className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                activeTab === 'legalitas' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Inventarisasi & SK</span>
            </button>
            {(site.video || site.gambar360 || site.gambarLama || site.gambarBaru) && (
              <button
                onClick={() => setActiveTab('media' as any)}
                className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                  (activeTab as any) === 'media' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Media 360° & Arsip Foto</span>
              </button>
            )}
          </div>

          {/* Tab 1: Description & Visit Details */}
          {activeTab === 'info' && (
            <div className="space-y-5 text-sm">
              <div>
                <h4 className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">
                  Uraian Singkat Cagar Budaya / Wisata
                </h4>
                <p className="text-stone-300 leading-relaxed bg-stone-950/40 p-4 rounded-xl border border-stone-800/80">
                  {site.description}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Jam Operasional</span>
                  </div>
                  <p className="font-semibold text-stone-200">{site.openingHours || 'Setiap Hari, 08:00 - 17:00 WITA'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-stone-400">
                    <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tiket Masuk / Donasi</span>
                  </div>
                  <p className="font-semibold text-stone-200">{site.ticketPrice || 'Gratis / Donasi'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-stone-400">
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Status Penetapan</span>
                  </div>
                  <p className="font-semibold text-stone-200">{site.status} ({site.skLevel || 'Kabupaten'})</p>
                </div>

              </div>

              {/* Facilities & Accessibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <h5 className="font-semibold text-stone-200 text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fasilitas Pendukung</span>
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {site.facilities && site.facilities.length > 0 ? (
                      site.facilities.map((fac, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 text-[11px] border border-stone-700">
                          {fac}
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-400 text-xs">Area informasi dasar dan akses jalan.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <h5 className="font-semibold text-stone-200 text-xs flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aksesibilitas & Transportasi</span>
                  </h5>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {site.accessibility || 'Dapat diakses dengan mudah menggunakan kendaraan roda dua dan roda empat dari pusat kota Donggala.'}
                  </p>
                </div>

              </div>

              {/* Tags */}
              {site.tags && site.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-stone-500 mr-1">Kata Kunci:</span>
                  {site.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-stone-800 text-amber-300/80 text-[10px] font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: History & Cultural Significance */}
          {activeTab === 'sejarah' && (
            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Periode / Masa Berdiri: {site.yearOrPeriod}</span>
                </div>
                <p className="text-stone-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {site.history}
                </p>
              </div>

              {site.referenceSource && (
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60 text-xs text-stone-400">
                  <strong className="text-stone-300">Sumber Referensi / Dokumen:</strong> {site.referenceSource}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Legal & Technical Specifications (37-Column Registry Data) */}
          {activeTab === 'legalitas' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Nomor SK Penetapan</span>
                  <p className="font-mono font-semibold text-stone-200">{site.skNumber || 'Dalam Proses Inventarisasi'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Tanggal SK / Tingkat</span>
                  <p className="font-semibold text-stone-200">{site.skDate || '-'} / {site.skLevel || 'Kabupaten Donggala'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Kepemilikan / Pengelola</span>
                  <p className="font-semibold text-stone-200">{site.owner || 'Pemerintah Kabupaten Donggala'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Juru Pelihara (Jupel)</span>
                  <p className="font-semibold text-stone-200">{site.custodian || 'Dinas Kebudayaan Kab. Donggala'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Kondisi Fisik</span>
                  <p className="font-semibold text-stone-200">{site.physicalCondition || 'Baik'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-stone-500">Bahan / Material Konstruksi</span>
                  <p className="font-semibold text-stone-200">{site.material || 'Struktur Alami / Kayu / Batu'}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1 sm:col-span-2">
                  <span className="text-stone-500">Dimensi / Ukuran Luas</span>
                  <p className="font-semibold text-stone-200">{site.dimensions || 'Berdasarkan Titik Polygon Wilayah Cagar Budaya'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Terakhir Diperbarui: {site.lastUpdated || '2024-03-01'}</span>
                <span>Standar Registrasi: 37 Kolom Kemendikbud & Budaya06</span>
              </div>
            </div>
          )}

          {/* Tab 4: Media & Arsip Foto (Data_Budaya) */}
          {(activeTab as any) === 'media' && (
            <div className="space-y-4 text-xs">
              {/* Virtual Tour & 360 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {site.gambar360 && (
                  <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                    <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span>Tampilan Panorama 360°</span>
                    </span>
                    <p className="text-stone-400 text-[11px]">Foto panorama interaktif 360 derajat objek cagar budaya.</p>
                    <a
                      href={site.gambar360}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 text-xs font-semibold transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Foto 360°</span>
                    </a>
                  </div>
                )}

                {site.video && (
                  <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                    <span className="font-semibold text-red-300 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-red-400" />
                      <span>Video Dokumenter / Virtual Tour</span>
                    </span>
                    <p className="text-stone-400 text-[11px]">Video dokumentasi audio visual objek budaya.</p>
                    <a
                      href={site.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 text-xs font-semibold transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Tonton Video</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Before and After comparison if both exist */}
              {(site.gambarLama || site.gambarBaru) && (
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <span className="font-semibold text-amber-300 block">
                    Perbandingan Arsip Foto (Gambar Lama vs Gambar Baru):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {site.gambarLama && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-amber-400 font-mono font-semibold">Foto Arsip Masa Lampau (Gambar Lama)</span>
                        <div className="aspect-video rounded-lg overflow-hidden border border-stone-800 bg-stone-900">
                          <img src={site.gambarLama} alt="Foto Lama" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {site.gambarBaru && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-emerald-400 font-mono font-semibold">Foto Kondisi Terkini (Gambar Baru)</span>
                        <div className="aspect-video rounded-lg overflow-hidden border border-stone-800 bg-stone-900">
                          <img src={site.gambarBaru} alt="Foto Baru" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
