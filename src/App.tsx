import React, { useState, useEffect, useMemo } from 'react';
import { HeritageSite, SpreadsheetSyncConfig, CultureStats, UserSession } from './types';
import { DEFAULT_HERITAGE_SITES } from './data/heritageSites';
import { 
  DEFAULT_SPREADSHEET_URL,
  LOCAL_STORAGE_KEY_SHEET_URL,
  LOCAL_STORAGE_KEY_AUTO_SYNC,
  LOCAL_STORAGE_KEY_CACHED_SITES,
  LOCAL_STORAGE_KEY_CACHED_STATS,
  LOCAL_STORAGE_KEY_LAST_SYNC,
  LOCAL_STORAGE_KEY_USER_SESSION,
  fetchDataBudayaAndStats,
  calculateStatsFromSites
} from './services/googleSheets';
import { initAuth, logout as firebaseLogout } from './services/auth';
import { Navbar } from './components/Navbar';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { AddSiteModal } from './components/AddSiteModal';
import { LoginModal } from './components/LoginModal';
import { SiteCard } from './components/SiteCard';
import { SiteDetailModal } from './components/SiteDetailModal';
import { MapView } from './components/MapView';
import { TableView } from './components/TableView';
import { FilterSection } from './components/FilterSection';
import { StatsBar } from './components/StatsBar';
import { 
  CheckCircle2, 
  Landmark, 
  Compass, 
  PlusCircle,
  Lock,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Sites data state
  const [sitesData, setSitesData] = useState<HeritageSite[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_CACHED_SITES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cache situs:', e);
    }
    return DEFAULT_HERITAGE_SITES;
  });

  // Culture statistics state (from sheet Statistik)
  const [cultureStats, setCultureStats] = useState<CultureStats>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_CACHED_STATS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // fallback
    }
    return calculateStatsFromSites(DEFAULT_HERITAGE_SITES);
  });

  // User Auth state (Credentials from sheet Users or Google)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER_SESSION);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      // fallback
    }
    return null;
  });

  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Sync configuration state
  const [syncConfig, setSyncConfig] = useState<SpreadsheetSyncConfig>(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEY_SHEET_URL) || DEFAULT_SPREADSHEET_URL;
    const savedAutoSync = localStorage.getItem(LOCAL_STORAGE_KEY_AUTO_SYNC) !== 'false';
    const savedLastSync = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_SYNC) || undefined;
    return {
      sheetUrl: savedUrl,
      autoSync: savedAutoSync,
      lastSyncTime: savedLastSync,
      syncStatus: 'idle'
    };
  });

  // UI state
  const [activeView, setActiveView] = useState<'grid' | 'map' | 'table'>('grid');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [focusedSiteOnMap, setFocusedSiteOnMap] = useState<HeritageSite | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>('all');
  const [sortBy, setSortBy] = useState('default');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Initialize Firebase Auth listener for Google OAuth sessions
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        if (token) setGoogleAccessToken(token);
        if (user && !currentUser) {
          const session: UserSession = {
            username: user.email || 'google_user',
            displayName: user.displayName || user.email || 'Pengguna Google',
            role: 'Editor',
            photoURL: user.photoURL || undefined,
            email: user.email || undefined,
            isGoogleUser: true
          };
          setCurrentUser(session);
          localStorage.setItem(LOCAL_STORAGE_KEY_USER_SESSION, JSON.stringify(session));
        }
      },
      () => {
        // logged out
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Sync data from spreadsheet / Apps Script URL
  const syncDataFromUrl = async (url: string, showNotice = true) => {
    setSyncConfig(prev => ({ ...prev, syncStatus: 'syncing', errorMessage: undefined }));
    try {
      const result = await fetchDataBudayaAndStats(url);
      
      if (result.sites.length > 0) {
        setSitesData(result.sites);
        setCultureStats(result.stats);

        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(LOCAL_STORAGE_KEY_CACHED_SITES, JSON.stringify(result.sites));
        localStorage.setItem(LOCAL_STORAGE_KEY_CACHED_STATS, JSON.stringify(result.stats));
        localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SYNC, now);

        setSyncConfig(prev => ({
          ...prev,
          sheetUrl: url,
          lastSyncTime: now,
          rowCount: result.sites.length,
          syncStatus: 'success'
        }));

        if (showNotice) {
          setSyncNotice(`Berhasil menyinkronkan ${result.sites.length} data budaya & statistik dari sheet Data_Budaya!`);
          setTimeout(() => setSyncNotice(null), 5000);
        }
      } else {
        throw new Error('Tidak ada baris data yang ditemukan pada sheet Data_Budaya.');
      }
    } catch (err: any) {
      console.warn('Gagal sinkron:', err);
      setSyncConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: err?.message || 'Gagal menyinkronkan data dari sheet Data_Budaya.'
      }));
      if (showNotice) {
        setSyncNotice(`Peringatan: Menggunakan data lokal (Situs Pusentasi & Cagar Budaya).`);
        setTimeout(() => setSyncNotice(null), 5000);
      }
    }
  };

  // Auto-sync on startup if enabled
  useEffect(() => {
    if (syncConfig.sheetUrl && syncConfig.autoSync) {
      syncDataFromUrl(syncConfig.sheetUrl, false);
    }
  }, []);

  const handleSaveAndSync = async (url: string, autoSync: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SHEET_URL, url);
    localStorage.setItem(LOCAL_STORAGE_KEY_AUTO_SYNC, String(autoSync));
    setSyncConfig(prev => ({ ...prev, sheetUrl: url, autoSync }));
    await syncDataFromUrl(url, true);
    setIsSyncModalOpen(false);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_SHEET_URL);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CACHED_SITES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CACHED_STATS);
    setSitesData(DEFAULT_HERITAGE_SITES);
    setCultureStats(calculateStatsFromSites(DEFAULT_HERITAGE_SITES));
    setSyncConfig({
      sheetUrl: DEFAULT_SPREADSHEET_URL,
      autoSync: true,
      syncStatus: 'idle',
      rowCount: DEFAULT_HERITAGE_SITES.length
    });
    setSyncNotice('Data dikembalikan ke default Pusentasi & Cagar Budaya Donggala.');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleQuickRefresh = () => {
    if (syncConfig.sheetUrl) {
      syncDataFromUrl(syncConfig.sheetUrl, true);
    }
  };

  const handleLoginSuccess = (session: UserSession, token?: string) => {
    setCurrentUser(session);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    if (token) setGoogleAccessToken(token);

    setSyncNotice(`Selamat datang, ${session.displayName}! Menu Tambah Data dan Spreadsheet kini telah terbuka.`);
    setTimeout(() => setSyncNotice(null), 6000);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setGoogleAccessToken(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER_SESSION);
    try {
      await firebaseLogout();
    } catch (e) {
      // ignore
    }
    setSyncNotice('Anda telah berhasil keluar (logout). Menu Tambah Data dan Spreadsheet disembunyikan.');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleFocusOnMap = (site: HeritageSite) => {
    setFocusedSiteOnMap(site);
    setActiveView('map');
  };

  // Callback when a new site is added
  const handleSiteAdded = (newSite: HeritageSite) => {
    setSitesData(prev => {
      const updated = [newSite, ...prev];
      localStorage.setItem(LOCAL_STORAGE_KEY_CACHED_SITES, JSON.stringify(updated));
      return updated;
    });

    // Update stats
    setCultureStats(prev => {
      const updated = { ...prev };
      const kat = (newSite.category || '').toLowerCase();
      if (kat.includes('situs') || kat.includes('alam')) updated.Situs++;
      else if (kat.includes('struktur')) updated.Struktur++;
      else if (kat.includes('bangunan')) updated.Bangunan++;
      else if (kat.includes('benda')) updated.Benda++;
      else updated.Situs++;

      localStorage.setItem(LOCAL_STORAGE_KEY_CACHED_STATS, JSON.stringify(updated));
      return updated;
    });

    setSyncConfig(prev => ({
      ...prev,
      rowCount: sitesData.length + 1
    }));

    setSyncNotice(`Cagar budaya "${newSite.name}" berhasil ditambahkan ke sheet Data_Budaya dan Statistik diperbarui!`);
    setTimeout(() => setSyncNotice(null), 6000);
  };

  // Filtered & Sorted sites
  const categories = useMemo(() => {
    return Array.from(new Set(sitesData.map(s => s.category)));
  }, [sitesData]);

  const kelurahans = useMemo(() => {
    return Array.from(new Set(sitesData.map(s => s.kelurahan)));
  }, [sitesData]);

  const filteredSites = useMemo(() => {
    return sitesData
      .filter((site) => {
        const matchesSearch = 
          searchQuery === '' ||
          site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          site.kelurahan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (site.code && site.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (site.tags && site.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCat = selectedCategory === 'all' || site.category === selectedCategory;
        const matchesKel = selectedKelurahan === 'all' || site.kelurahan === selectedKelurahan;

        return matchesSearch && matchesCat && matchesKel;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [sitesData, searchQuery, selectedCategory, selectedKelurahan, sortBy]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-700 selection:text-white">
      
      {/* Header / Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        syncConfig={syncConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onQuickRefresh={handleQuickRefresh}
        sitesCount={sitesData.length}
        currentUser={currentUser}
        onOpenAddSiteModal={() => setIsAddSiteModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Sync Notification Banner if active */}
      {syncNotice && (
        <div className="bg-emerald-900/90 border-b border-emerald-700 text-emerald-100 px-4 py-2.5 text-xs sm:text-sm text-center font-medium flex items-center justify-center space-x-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-900/80 to-stone-950 py-10 sm:py-14 border-b border-stone-800/80 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Landmark className="w-3.5 h-3.5" />
                <span>Terhubung ke Google Spreadsheet: Sheet Data_Budaya & Statistik</span>
              </div>
              
              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Warisan Pusaka <span className="text-amber-500">Kabupaten Donggala</span>
              </h1>
              
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                Jelajahi keajaiban geologis <strong>Pusentasi (Pusat Laut Towale)</strong>, istana kayu <strong>Souraja Kerajaan Banawa</strong>, pelabuhan kolonial kota tua, dan kerajinan tenun sutra tradisional melalui integrasi data Google Spreadsheet real-time.
              </p>
            </div>

            {/* Quick Action Button: Tambah Data (if logged in) or Login Petugas (if guest) */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
              {currentUser ? (
                <>
                  <button
                    id="hero-add-site-btn"
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 border border-emerald-500/40 transition active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Tambah Data ke Data_Budaya</span>
                  </button>
                  <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Masuk: <strong className="text-stone-200">{currentUser.displayName}</strong> ({currentUser.role})</span>
                  </div>
                </>
              ) : (
                <>
                  <button
                    id="hero-login-btn"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-amber-950/50 border border-amber-500/40 transition active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login Petugas / Tambah Data</span>
                  </button>
                  <p className="text-[11px] text-stone-400">
                    Login via sheet <code className="text-amber-300 font-mono">Users</code> untuk membuka menu
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Statistics Bar (Situs, Struktur, Bangunan, Benda) from sheet Statistik */}
          <div className="mt-8">
            <StatsBar 
              sites={sitesData} 
              isSpreadsheetSynced={!!syncConfig.sheetUrl} 
              cultureStats={cultureStats}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Filters and Search Bar */}
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedKelurahan={selectedKelurahan}
          setSelectedKelurahan={setSelectedKelurahan}
          sortBy={sortBy}
          setSortBy={setSortBy}
          categories={categories}
          kelurahans={kelurahans}
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedKelurahan('all');
            setSortBy('default');
          }}
        />

        {/* View Switch Rendering: Grid vs Map vs Table */}
        {activeView === 'grid' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-stone-400">
                Menampilkan <span className="text-stone-200 font-bold">{filteredSites.length}</span> objek cagar budaya & wisata
              </p>
              <div className="flex items-center space-x-3">
                {currentUser && syncConfig.sheetUrl && (
                  <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Data_Budaya Aktif</span>
                  </span>
                )}
                
                {currentUser ? (
                  <button
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Objek</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login Petugas</span>
                  </button>
                )}
              </div>
            </div>

            {filteredSites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onSelectSite={(s) => setSelectedSite(s)}
                    onFocusOnMap={(s) => handleFocusOnMap(s)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-stone-900/50 border border-stone-800/80 rounded-2xl p-12 text-center space-y-4">
                <Landmark className="w-12 h-12 text-stone-600 mx-auto" />
                <h3 className="text-base font-semibold text-stone-300">Tidak ada situs ditemukan</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat kembali seluruh cagar budaya Kabupaten Donggala.
                </p>
                {currentUser ? (
                  <button
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Objek Baru Sekarang</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login untuk Tambah Objek</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-200 flex items-center space-x-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Peta Titik Geografis Cagar Budaya Donggala</span>
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-stone-400">
                  {sitesData.length} Titik Koordinat Terpetakan
                </span>
                {currentUser && (
                  <button
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Titik</span>
                  </button>
                )}
              </div>
            </div>
            <MapView
              sites={filteredSites}
              selectedSite={selectedSite}
              onSelectSite={(s) => setSelectedSite(s)}
              focusedSite={focusedSiteOnMap}
            />
          </div>
        )}

        {activeView === 'table' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-200 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>Tabel Data Inventarisasi Cagar Budaya (Sheet: Data_Budaya)</span>
              </h2>
              {currentUser ? (
                <button
                  onClick={() => setIsAddSiteModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah Baris Data</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium border border-stone-700 transition"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login untuk Tambah Baris</span>
                </button>
              )}
            </div>
            <TableView
              sites={sitesData}
              onSelectSite={(s) => setSelectedSite(s)}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-800/80 bg-stone-950 py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-600 flex items-center justify-center text-white text-[11px] font-bold">
              D
            </div>
            <span className="text-stone-300 font-semibold">
              Djelajah Donggala &copy; {new Date().getFullYear()}
            </span>
            <span>&bull;</span>
            <span>Sheet: Data_Budaya, Users, Statistik</span>
          </div>

          <div className="flex flex-wrap items-center space-x-4 text-[11px]">
            {currentUser ? (
              <>
                <button
                  onClick={() => setIsAddSiteModalOpen(true)}
                  className="text-stone-400 hover:text-emerald-400 transition"
                >
                  + Tambah Data Situs
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="text-stone-400 hover:text-amber-400 transition"
                >
                  Kelola Spreadsheet
                </button>
                <span>&bull;</span>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-amber-400 hover:text-amber-300 transition flex items-center space-x-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Login Petugas (Users Sheet)</span>
                </button>
                <span>&bull;</span>
              </>
            )}
            <span className="text-stone-400">Pusentasi Towale &bull; Souraja &bull; Tanjung Karang</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
              Vercel Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SiteDetailModal
        site={selectedSite}
        onClose={() => setSelectedSite(null)}
        onShowOnMap={(s) => handleFocusOnMap(s)}
      />

      {currentUser && (
        <GoogleWorkspaceModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          syncConfig={syncConfig}
          onSaveAndSync={handleSaveAndSync}
          onResetToDefault={handleResetToDefault}
        />
      )}

      {currentUser && (
        <AddSiteModal
          isOpen={isAddSiteModalOpen}
          onClose={() => setIsAddSiteModalOpen(false)}
          currentUser={currentUser}
          googleAccessToken={googleAccessToken}
          currentSpreadsheetUrl={syncConfig.sheetUrl}
          onSiteAdded={handleSiteAdded}
          existingSitesCount={sitesData.length}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        spreadsheetUrl={syncConfig.sheetUrl}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
