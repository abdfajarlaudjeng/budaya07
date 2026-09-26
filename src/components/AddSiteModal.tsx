import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  MapPin, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Landmark, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Navigation,
  ShieldCheck,
  LogOut,
  Video,
  Layers,
  History
} from 'lucide-react';
import { HeritageSite, CategoryType, UserSession } from '../types';
import { saveBudayaToStorage } from '../services/googleSheets';
import { ConfirmationModal } from './ConfirmationModal';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  googleAccessToken: string | null;
  currentSpreadsheetUrl: string;
  onSiteAdded: (newSite: HeritageSite) => void;
  existingSitesCount: number;
}

const CATEGORY_CHOICES: CategoryType[] = [
  'Situs',
  'Struktur',
  'Bangunan',
  'Benda',
  'Cagar Budaya',
  'Situs Sejarah',
  'Geowisata'
];

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  googleAccessToken,
  currentSpreadsheetUrl,
  onSiteAdded,
  existingSitesCount
}) => {
  // Form input fields matching Data_Budaya sheet (11 columns)
  const [code, setCode] = useState(`BUDAYA${String(existingSitesCount + 1).padStart(2, '0')}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Situs');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<string>('-0.672');
  const [lng, setLng] = useState<string>('119.742');
  const [urlGambar, setUrlGambar] = useState('https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80');
  const [urlGambar360, setUrlGambar360] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [gambarLama, setGambarLama] = useState('');
  const [gambarBaru, setGambarBaru] = useState('');

  // Target sheet URL
  const [targetSheetUrl, setTargetSheetUrl] = useState(currentSpreadsheetUrl);

  // Submission & Confirmation modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ name: string; code: string; message: string } | null>(null);

  // Update code when count changes
  useEffect(() => {
    setCode(`BUDAYA${String(existingSitesCount + 1).padStart(2, '0')}`);
  }, [existingSitesCount]);

  useEffect(() => {
    if (currentSpreadsheetUrl && !targetSheetUrl) {
      setTargetSheetUrl(currentSpreadsheetUrl);
    }
  }, [currentSpreadsheetUrl]);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLng(position.coords.longitude.toFixed(6));
        },
        (error) => {
          alert(`Gagal mengambil koordinat lokasi: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Perangkat Anda tidak mendukung fitur Geolocation.');
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError('Nama Objek Cagar Budaya harus diisi.');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      setSubmitError('Format koordinat Latitude dan Longitude harus berupa angka yang valid.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteSave = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      const images: string[] = [];
      if (urlGambar.trim()) images.push(urlGambar.trim());
      if (gambarBaru.trim() && gambarBaru !== urlGambar) images.push(gambarBaru.trim());
      if (gambarLama.trim() && gambarLama !== urlGambar) images.push(gambarLama.trim());
      if (images.length === 0) {
        images.push('https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80');
      }

      const generatedId = `site-${(code || name).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

      const newSite: HeritageSite = {
        id: generatedId,
        code: code.trim(),
        name: name.trim(),
        category,
        classification: category === 'Situs' ? 'Situs Budaya' : category === 'Struktur' ? 'Struktur Budaya' : category === 'Bangunan' ? 'Bangunan Cagar Budaya' : 'Benda Cagar Budaya',
        kelurahan: 'Banawa',
        kecamatan: 'Banawa',
        kabupaten: 'Donggala',
        provinsi: 'Sulawesi Tengah',
        address: `Kabupaten Donggala, Sulawesi Tengah`,
        coordinates: {
          lat: parsedLat,
          lng: parsedLng
        },
        description: description.trim() || `${name} merupakan objek warisan cagar budaya di Kabupaten Donggala.`,
        history: `Objek ${name} bernilai historis dan merupakan potensi cagar budaya di Donggala.`,
        yearOrPeriod: 'Bersejarah',
        status: 'Terdaftar',
        owner: 'Pemerintah Daerah / Adat Donggala',
        custodian: 'Dinas Kebudayaan Kab. Donggala',
        physicalCondition: 'Terawat',
        material: 'Alami / Kayu / Batu',
        images,
        virtualTourUrl: urlVideo.trim() || undefined,
        video: urlVideo.trim() || undefined,
        gambar360: urlGambar360.trim() || undefined,
        gambarLama: gambarLama.trim() || undefined,
        gambarBaru: gambarBaru.trim() || undefined,
        openingHours: 'Setiap Hari, 08:00 - 17:00 WITA',
        ticketPrice: 'Gratis / Donasi',
        facilities: ['Area Informasi', 'Akses Jalan', 'Parkir'],
        accessibility: 'Dapat diakses kendaraan roda 2 dan 4',
        tags: [name, category, 'Donggala', 'Cagar Budaya'],
        referenceSource: 'Dinas Kebudayaan Kab. Donggala',
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      // Save to Google Spreadsheet / Google Apps Script
      const saveResult = await saveBudayaToStorage(
        targetSheetUrl,
        {
          id: code.trim(),
          nama: name.trim(),
          kategori: category,
          deskripsi: description.trim(),
          lat: parsedLat,
          lng: parsedLng,
          gambar: urlGambar.trim(),
          gambar360: urlGambar360.trim(),
          video: urlVideo.trim(),
          gambarLama: gambarLama.trim(),
          gambarBaru: gambarBaru.trim()
        },
        googleAccessToken
      );

      setIsConfirmOpen(false);
      onSiteAdded(newSite);

      setSuccessInfo({
        name: newSite.name,
        code: newSite.code || 'BUDAYA',
        message: saveResult.message || 'Data berhasil disimpan ke sheet Data_Budaya!'
      });

    } catch (err: any) {
      console.error('Gagal menyimpan ke Google Spreadsheet:', err);
      setSubmitError(err?.message || 'Terjadi kesalahan saat menyimpan data.');
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setDescription('');
    setUrlGambar360('');
    setUrlVideo('');
    setGambarLama('');
    setGambarBaru('');
    setSuccessInfo(null);
    setSubmitError(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
        <div 
          id="add-site-modal-container"
          className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md border border-emerald-500/30">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-100 flex items-center space-x-2">
                  <span>Tambah Data Cagar Budaya</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Sheet: Data_Budaya
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Data otomatis tersimpan ke lembar <code className="text-amber-300 font-mono">Data_Budaya</code> & memperbarui <code className="text-amber-300 font-mono">Statistik</code>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Session Bar */}
          {currentUser && (
            <div className="px-6 py-2.5 border-b border-stone-800 bg-stone-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Masuk sebagai: <strong className="text-stone-200">{currentUser.displayName || currentUser.username}</strong>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-700 text-[10px] font-bold uppercase">
                  {currentUser.role || 'Petugas'}
                </span>
              </div>
              <span className="text-[11px] text-stone-400">Hak Akses: Penambahan & Pengeditan Data</span>
            </div>
          )}

          {/* Success View */}
          {successInfo ? (
            <div className="p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="font-serif text-xl font-bold text-white">
                Data Berhasil Ditambahkan ke Google Spreadsheet!
              </h4>
              <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
                Objek <strong>"{successInfo.name}"</strong> (ID: {successInfo.code}) telah berhasil disimpan pada lembar kerja <strong>Data_Budaya</strong> dan statistik pada sheet <strong>Statistik</strong> telah diperbarui.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition"
                >
                  Tambah Objek Lainnya
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                >
                  Selesai & Lihat Data
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
              
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. ID & Nama Objek */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-300">
                    ID Objek <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="BUDAYA07"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-300">
                    Nama Objek <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="contoh: Pusentasi (Pusat Laut Towale)"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* 2. Kategori (Situs, Struktur, Bangunan, Benda) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Kategori Objek (Tercatat di Sheet Statistik) <span className="text-amber-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Situs', 'Struktur', 'Bangunan', 'Benda'].map((kat) => (
                    <button
                      key={kat}
                      type="button"
                      onClick={() => setCategory(kat)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${
                        category === kat
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>{kat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Deskripsi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Deskripsi Objek
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uraikan karakteristik, nilai historis, serta kondisi cagar budaya..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* 4. Koordinat (Latitude, Longitude) */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-200 flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Koordinat Geografis (Latitude & Longitude)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-medium transition"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Ambil GPS Saya</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-400">Latitude</label>
                    <input
                      type="text"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="-0.730278"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400">Longitude</label>
                    <input
                      type="text"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="119.676389"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Gambar & Media (URL_Gambar, URL_Gambar_360, URL_Video, Gambar_Lama, Gambar_Baru) */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                  Media & Foto Cagar Budaya:
                </span>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-medium">URL Gambar Utama</label>
                  <input
                    type="url"
                    value={urlGambar}
                    onChange={(e) => setUrlGambar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-300 font-medium flex items-center space-x-1">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>URL Gambar 360°</span>
                    </label>
                    <input
                      type="url"
                      value={urlGambar360}
                      onChange={(e) => setUrlGambar360(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-300 font-medium flex items-center space-x-1">
                      <Video className="w-3.5 h-3.5 text-red-400" />
                      <span>URL Video (YouTube / Virtual Tour)</span>
                    </label>
                    <input
                      type="url"
                      value={urlVideo}
                      onChange={(e) => setUrlVideo(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-300 font-medium flex items-center space-x-1">
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>URL Gambar Lama (Arsip Bersejarah)</span>
                    </label>
                    <input
                      type="url"
                      value={gambarLama}
                      onChange={(e) => setGambarLama(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-300 font-medium flex items-center space-x-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>URL Gambar Baru (Kondisi Terkini)</span>
                    </label>
                    <input
                      type="url"
                      value={gambarBaru}
                      onChange={(e) => setGambarBaru(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan ke Data_Budaya</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteSave}
        title="Konfirmasi Penambahan Data Budaya"
        description="Data objek cagar budaya baru ini akan disimpan langsung ke Google Spreadsheet pada lembar kerja Data_Budaya, serta kategori akan dicatatkan pada sheet Statistik."
        details={[
          { label: 'ID Objek', value: code },
          { label: 'Nama Objek', value: name },
          { label: 'Kategori Budaya', value: category },
          { label: 'Lembar Penyimpanan', value: 'Data_Budaya' },
          { label: 'Koordinat', value: `${lat}, ${lng}` }
        ]}
        confirmText="Ya, Simpan ke Spreadsheet"
        cancelText="Periksa Kembali"
        isLoading={isSubmitting}
      />
    </>
  );
};
