import React from 'react';
import { AlertCircle, FileSpreadsheet, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details = [],
  confirmText = 'Konfirmasi & Simpan',
  cancelText = 'Batal',
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        id="confirmation-modal-container"
        className="bg-stone-900 border border-amber-600/40 text-stone-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-amber-950/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-100">
                {title}
              </h3>
              <p className="text-[11px] text-amber-300/80">
                Konfirmasi Penulisan Data ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-stone-300 leading-relaxed">
            {description}
          </p>

          {details.length > 0 && (
            <div className="bg-stone-950/80 rounded-xl border border-stone-800 p-3.5 space-y-2">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-stone-800/60 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-stone-400 font-medium shrink-0 pr-2">{item.label}:</span>
                  <span className="text-stone-200 font-semibold text-right break-all">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-stone-800/50 border border-stone-700/60 text-[11px] text-stone-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tindakan ini akan menambahkan satu baris data baru ke Google Spreadsheet Anda dengan izin autentikasi akun Google Anda.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/40 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            id="confirm-action-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold shadow-lg shadow-amber-950/50 transition active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-1">↻</span>
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Menyimpan...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
