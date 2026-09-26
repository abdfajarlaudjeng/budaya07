import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RotateCcw, 
  Layers,
  Users,
  BarChart3,
  Code
} from 'lucide-react';
import { SpreadsheetSyncConfig } from '../types';
import { DEFAULT_SPREADSHEET_URL } from '../services/googleSheets';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SpreadsheetSyncConfig;
  onSaveAndSync: (url: string, autoSync: boolean) => Promise<void>;
  onResetToDefault: () => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onSaveAndSync,
  onResetToDefault
}) => {
  const [urlInput, setUrlInput] = useState(syncConfig.sheetUrl || DEFAULT_SPREADSHEET_URL);
  const [autoSyncInput, setAutoSyncInput] = useState(syncConfig.autoSync);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(syncConfig.errorMessage || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sync' | 'structure' | 'script'>('sync');

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMessage('Silakan masukkan link Google Spreadsheet atau Apps Script terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSaveAndSync(urlInput.trim(), autoSyncInput);
      setSuccessMessage('Berhasil menyinkronkan data dari sheet Data_Budaya dan Statistik!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyinkronkan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDefaultSpreadsheet = () => {
    setUrlInput(DEFAULT_SPREADSHEET_URL);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="google-sheets-modal-container"
        className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-100">
                Pengaturan Google Spreadsheet
              </h3>
              <p className="text-xs text-stone-400">
                Terhubung dengan sheet <code className="text-amber-300 font-mono">Data_Budaya</code>, <code className="text-amber-300 font-mono">Users</code>, dan <code className="text-amber-300 font-mono">Statistik</code>
              </p>
            </div>
          </div>
          <button
            id="close-sheets-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-900/90 px-6 pt-2 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'sync'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Koneksi & Sinkron</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'structure'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Struktur 3 Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'script'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Kode Apps Script (GS)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* TAB 1: SYNC & CONNECTION */}
          {activeTab === 'sync' && (
            <form onSubmit={handleSyncSubmit} className="space-y-4">
              
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300">
                    Alamat Tautan Spreadsheet / Web App URL
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDefaultSpreadsheet}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Gunakan Spreadsheet Bawaan
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1G8h9I-8ZNhrY-kOliuf3daI8mSbeB1_eulZznsl8gMw/edit"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 font-mono text-xs focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
                <p className="text-[11px] text-stone-400">
                  Mendukung link Google Spreadsheet publik atau URL Web App Google Apps Script (<code className="font-mono text-[10px]">/exec</code>).
                </p>
              </div>

              {/* Connected Sheets Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Sheet Data</span>
                  </span>
                  <p className="font-mono font-bold text-stone-200 text-xs">Data_Budaya</p>
                  <p className="text-[10px] text-stone-400">11 Kolom Inventarisasi</p>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Sheet Login</span>
                  </span>
                  <p className="font-mono font-bold text-stone-200 text-xs">Users</p>
                  <p className="text-[10px] text-stone-400">Kolom Username & Password</p>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>Sheet Statistik</span>
                  </span>
                  <p className="font-mono font-bold text-stone-200 text-xs">Statistik</p>
                  <p className="text-[10px] text-stone-400">Situs, Struktur, Bangunan, Benda</p>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-200 text-xs block">
                    Sinkronisasi Otomatis saat Aplikasi Dibuka
                  </span>
                  <span className="text-[11px] text-stone-400 block">
                    Memuat data terbaru secara otomatis dari sheet Data_Budaya setiap kali aplikasi dikunjungi.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSyncInput}
                  onChange={(e) => setAutoSyncInput(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-stone-900 border-stone-700"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onResetToDefault}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default Donggala</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-950/50 transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Sekarang'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: SHEET STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-semibold text-emerald-300 block">
                  1. Lembar Kerja: <code className="font-mono text-emerald-400">Data_Budaya</code>
                </span>
                <p className="text-stone-400 text-[11px]">
                  Berisi 11 kolom data cagar budaya yang dibaca dan ditulis oleh aplikasi:
                </p>
                <div className="p-2.5 rounded-lg bg-stone-900 font-mono text-[11px] text-stone-300 overflow-x-auto">
                  ID, Nama_Objek, Kategori, Deskripsi, Latitude, Longitude, URL_Gambar, URL_Gambar_360, URL_Video, Gambar_Lama, Gambar_Baru
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-semibold text-amber-300 block">
                  2. Lembar Kerja: <code className="font-mono text-amber-400">Users</code>
                </span>
                <p className="text-stone-400 text-[11px]">
                  Digunakan untuk otentikasi login pengelola / petugas:
                </p>
                <div className="p-2.5 rounded-lg bg-stone-900 font-mono text-[11px] text-stone-300 overflow-x-auto">
                  Kolom A: Username | Kolom B: Password | Kolom C (opsional): Role
                </div>
                <p className="text-[11px] text-stone-500">
                  Fallback default jika sheet belum dibuat: <strong className="text-stone-300">admin / admin123</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="font-semibold text-cyan-300 block">
                  3. Lembar Kerja: <code className="font-mono text-cyan-400">Statistik</code>
                </span>
                <p className="text-stone-400 text-[11px]">
                  Menyimpan jumlah rekapitulasi 4 kategori cagar budaya:
                </p>
                <div className="p-2.5 rounded-lg bg-stone-900 font-mono text-[11px] text-stone-300 overflow-x-auto">
                  Baris 1: Situs, Struktur, Bangunan, Benda <br />
                  Baris 2: [Jumlah Situs, Jumlah Struktur, Jumlah Bangunan, Jumlah Benda]
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT CODE */}
          {activeTab === 'script' && (
            <div className="space-y-3 text-xs">
              <p className="text-stone-300">
                Kode Google Apps Script yang Anda pasang pada menu <strong>Ekstensi &gt; Apps Script</strong>:
              </p>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 font-mono text-[11px] text-amber-300/90 max-h-64 overflow-y-auto space-y-1">
                <pre>{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (e && e.parameter && e.parameter.action === "login") {
    var sheetUsers = ss.getSheetByName("Users");
    var usernameInput = e.parameter.username;
    var passwordInput = e.parameter.password;
    var loginSuccess = false;

    if (sheetUsers && sheetUsers.getLastRow() >= 2) {
      var userRows = sheetUsers.getDataRange().getValues();
      for (var j = 1; j < userRows.length; j++) {
        if (userRows[j][0] == usernameInput && userRows[j][1] == passwordInput) {
          loginSuccess = true;
          break;
        }
      }
    } else {
      if (usernameInput === "admin" && passwordInput === "admin123") loginSuccess = true;
    }

    return ContentService.createTextOutput(JSON.stringify({"result": loginSuccess ? "success" : "failed"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Pengambilan data budaya
  var sheetBudaya = ss.getSheetByName("Data_Budaya");
  var rows = sheetBudaya.getDataRange().getValues();
  var dataBudaya = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    dataBudaya.push({
      "id": row[0], "nama": row[1], "kategori": row[2],
      "deskripsi": row[3], "lat": row[4], "lng": row[5],
      "gambar": row[6], "gambar360": row[7], "video": row[8],
      "gambarLama": row[9], "gambarBaru": row[10]
    });
  }
  
  var sheetStat = ss.getSheetByName("Statistik");
  var statistik = { Situs: 0, Struktur: 0, Bangunan: 0, Benda: 0 };
  if (sheetStat && sheetStat.getLastRow() >= 2) {
    statistik.Situs = Number(sheetStat.getRange(2, 1).getValue()) || 0;
    statistik.Struktur = Number(sheetStat.getRange(2, 2).getValue()) || 0;
    statistik.Bangunan = Number(sheetStat.getRange(2, 3).getValue()) || 0;
    statistik.Benda = Number(sheetStat.getRange(2, 4).getValue()) || 0;
  }
  
  return ContentService.createTextOutput(JSON.stringify({ dataBudaya, statistik }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Spreadsheet ID Terdaftar: <code className="text-stone-300 font-mono">1G8h9I-8ZNhrY-kOliuf3daI8mSbeB1_eulZznsl8gMw</code></span>
                <a
                  href={DEFAULT_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
