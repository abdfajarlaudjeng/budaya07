import React from 'react';
import { 
  Compass, 
  Table, 
  Grid3X3, 
  FileSpreadsheet, 
  RefreshCw, 
  Landmark,
  PlusCircle,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { SpreadsheetSyncConfig, UserSession } from '../types';

interface NavbarProps {
  activeView: 'grid' | 'map' | 'table';
  setActiveView: (view: 'grid' | 'map' | 'table') => void;
  syncConfig: SpreadsheetSyncConfig;
  onOpenSyncModal: () => void;
  onQuickRefresh: () => void;
  sitesCount: number;
  currentUser: UserSession | null;
  onOpenAddSiteModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  syncConfig,
  onOpenSyncModal,
  onQuickRefresh,
  sitesCount,
  currentUser,
  onOpenAddSiteModal,
  onOpenLoginModal,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Left: Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('grid')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/40 flex items-center justify-center text-white shadow-lg shadow-amber-950/50">
              <Landmark className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-base sm:text-xl tracking-tight text-stone-100">
                  DJELAJAH DONGGALA
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Data_Budaya
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Pusentasi Towale & Cagar Budaya Kabupaten Donggala
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="hidden lg:flex items-center bg-stone-800/80 p-1 rounded-xl border border-stone-700/60 shadow-inner">
            <button
              id="view-grid-btn"
              onClick={() => setActiveView('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'grid'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Galeri Situs</span>
            </button>
            <button
              id="view-map-btn"
              onClick={() => setActiveView('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'map'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Peta Budaya</span>
            </button>
            <button
              id="view-table-btn"
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'table'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel Data</span>
            </button>
          </div>

          {/* Right Actions: ONLY shown when logged in, or Login button when guest */}
          <div className="flex items-center space-x-2">
            
            {currentUser ? (
              <>
                {/* Tambah Data - ONLY WHEN LOGGED IN */}
                <button
                  id="add-site-btn"
                  onClick={onOpenAddSiteModal}
                  title="Tambah data cagar budaya baru ke sheet Data_Budaya"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Data</span>
                  <span className="sm:hidden">Tambah</span>
                </button>

                {/* Spreadsheet Settings Modal Button - ONLY WHEN LOGGED IN */}
                <button
                  id="open-sync-modal-btn"
                  onClick={onOpenSyncModal}
                  title="Kelola & Hubungkan Google Spreadsheet"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white text-xs sm:text-sm font-medium transition active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Spreadsheet</span>
                </button>

                {/* Quick Refresh if sheet configured */}
                <button
                  id="quick-refresh-sheet-btn"
                  onClick={onQuickRefresh}
                  disabled={syncConfig.syncStatus === 'syncing'}
                  title="Sinkronkan ulang data dari sheet Data_Budaya"
                  className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-amber-400 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncConfig.syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
                </button>

                {/* User Info & Logout Button */}
                <div className="flex items-center space-x-1.5 pl-1">
                  <div 
                    className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-stone-800/90 border border-emerald-600/40 text-xs"
                    title={`Masuk sebagai: ${currentUser.displayName} (${currentUser.role})`}
                  >
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName} 
                        className="w-6 h-6 rounded-full border border-emerald-500/60 object-cover" 
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-[10px]">
                        {currentUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden md:flex flex-col text-left leading-none">
                      <span className="font-semibold text-stone-200 truncate max-w-[100px]">
                        {currentUser.displayName}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    title="Keluar (Logout)"
                    className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950/60 border border-stone-700 hover:border-rose-800 text-stone-400 hover:text-rose-300 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* When NOT logged in: Show Login Button */
              <button
                id="open-login-btn"
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-950/40 border border-amber-500/40 transition active:scale-95"
                title="Masuk untuk membuka menu Tambah Data & Google Spreadsheet"
              >
                <Lock className="w-4 h-4" />
                <span>Login Pengelola</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile View Switcher Tab Bar */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-stone-800 text-xs">
          <button
            onClick={() => setActiveView('grid')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg font-medium ${
              activeView === 'grid' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Galeri</span>
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg font-medium ${
              activeView === 'map' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Peta</span>
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center space-x-1.5 py-1 px-3 rounded-lg font-medium ${
              activeView === 'table' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </button>
        </div>

      </div>
    </header>
  );
};
