import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { verifyUserCredentials } from '../services/googleSheets';
import { googleSignIn } from '../services/auth';
import { UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetUrl: string;
  onLoginSuccess: (session: UserSession, googleToken?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  spreadsheetUrl,
  onLoginSuccess
}) => {
  const [authMode, setAuthMode] = useState<'credentials' | 'google'>('credentials');
  
  // Credentials form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await verifyUserCredentials(spreadsheetUrl, username, password);

      if (result.success) {
        const session: UserSession = {
          username: username.trim(),
          displayName: username.trim() === 'admin' ? 'Administrator Donggala' : `Petugas (${username.trim()})`,
          role: result.role,
          isGoogleUser: false
        };
        onLoginSuccess(session);
        onClose();
      } else {
        setErrorMessage(result.message || 'Username atau password tidak sesuai.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memverifikasi login ke sheet Users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await googleSignIn();
      const session: UserSession = {
        username: res.user.email || 'google_user',
        displayName: res.user.displayName || res.user.email || 'Pengguna Google',
        role: 'Editor',
        photoURL: res.user.photoURL || undefined,
        email: res.user.email || undefined,
        isGoogleUser: true
      };
      onLoginSuccess(session, res.accessToken);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(err?.message || 'Gagal masuk dengan Google. Pastikan jendela popup tidak diblokir.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="login-modal-container"
        className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-stone-800/90 to-stone-900 border-b border-stone-800 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/30 flex items-center justify-center text-white shadow-xl shadow-amber-950/60">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="font-serif text-xl font-bold text-white tracking-tight">
            Login Petugas & Pengelola
          </h3>
          <p className="text-xs text-amber-300/90 font-medium mt-1">
            Verifikasi Pengguna dari Sheet <code className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono text-[11px]">Users</code>
          </p>
        </div>

        {/* Tab switcher: Credentials vs Google */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={`flex-1 py-3 text-center transition flex items-center justify-center space-x-1.5 ${
              authMode === 'credentials'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-stone-900/60'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Username & Password (Sheet Users)</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('google')}
            className={`flex-1 py-3 text-center transition flex items-center justify-center space-x-1.5 ${
              authMode === 'google'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-stone-900/60'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Akun Google</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authMode === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notice & Demo Credentials */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-stone-300 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Akun Terdaftar di Sheet "Users":</span>
                </div>
                <p className="text-stone-400">
                  Kolom A = Username, Kolom B = Password. <br />
                  Fallback bawaan: <strong className="text-stone-200">admin</strong> / <strong className="text-stone-200">admin123</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-amber-950/50 transition active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk (Login)'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-xs text-stone-300 leading-relaxed">
                Anda juga dapat masuk menggunakan Akun Google resmi dengan izin Google Sheets:
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="gsi-material-button !w-full !h-11 shadow-lg hover:shadow-xl transition disabled:opacity-50"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents !text-sm">
                    {isLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Privileges Note */}
          <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
            <span className="font-semibold text-stone-300 block">
              Menu Terbuka Setelah Berhasil Login:
            </span>
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Menu "+ Tambah Data" muncul di Navbar & Banner</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Menu "Spreadsheet" muncul untuk kelola link & sinkronisasi</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800/80 bg-stone-950/60 text-center text-[11px] text-stone-400">
          <span>Djelajah Donggala &bull; Terhubung ke Google Spreadsheet</span>
        </div>
      </div>
    </div>
  );
};
