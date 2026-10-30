import React, { useState } from 'react';
import { EyeToggleIcon } from '@/components/auth/EyeToggleIcon';
import { requestAccountAccess } from '@/lib/userManagementService';
import { SystemUser } from '@/types/database';
import { formatPersonNameLive } from '@/lib/nameUtils';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (user: SystemUser) => void;
  onRequestPendingError: (user: SystemUser) => void;
}

export function RequestAccessModal({
  isOpen,
  onClose,
  onRequestSubmitted,
  onRequestPendingError
}: RequestAccessModalProps): React.JSX.Element | null {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      setErrorMsg('Masukkan username email yang valid.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await requestAccountAccess({
        name,
        username: cleanUsername,
        password
      });
      onRequestSubmitted(user);
      onClose();
    } catch (err: any) {
      if (err.code === 'STATUS_PENDING' && err.user) {
        onClose();
        onRequestPendingError(err.user);
      } else {
        setErrorMsg(err.message || 'Gagal mengirim permintaan.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-[12px] border border-[#eaeaea] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-[#eaeaea] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111111]">
              Minta Akses Sistem
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Ajukan pembuatan akun operasional PT Patak Abadi Jaya.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form"
            className="text-[#888888] hover:text-[#111111] p-1 rounded transition-colors"
          >
            <img src="/icons/close.png" alt="Tutup" className="w-4 h-4 object-contain" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-[#444444] mb-1">
              Nama Lengkap: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(formatPersonNameLive(e.target.value))}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#dddddd] rounded-[8px] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Input Email dengan Fixed Suffix @patak.id */}
          <div>
            <label className="block text-xs font-semibold text-[#444444] mb-1">
              Email Akun: <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-[8px] border border-[#dddddd] bg-white focus-within:border-[#111111] overflow-hidden">
              <input
                type="text"
                value={username}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                  setUsername(val);
                }}
                placeholder="nama.depan"
                required
                className="flex-1 px-3.5 py-2.5 text-xs bg-transparent focus:outline-none font-mono"
              />
              <span className="px-3.5 py-2.5 bg-[#f5f5f5] text-[#555555] font-mono text-xs border-l border-[#dddddd] select-none font-semibold">
                @patak.id
              </span>
            </div>
            <p className="text-[10px] text-[#888888] mt-1">
              Hanya username yang perlu diketik, akhiran <strong className="font-mono">@patak.id</strong> otomatis terpasang.
            </p>
          </div>

          {/* Input Kata Sandi */}
          <div>
            <label className="block text-xs font-semibold text-[#444444] mb-1">
              Kata Sandi (Minimal 8 Karakter): <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter..."
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 pr-10 text-xs bg-white border border-[#dddddd] rounded-[8px] focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#777777] hover:text-[#111111] transition-colors p-1"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <EyeToggleIcon isOpen={showPassword} />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-[6px] text-red-600 text-[11px] leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#555555] bg-white border border-[#dddddd] rounded-[6px] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name || !username || password.length < 8}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-black rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
