import React, { useState } from 'react';
import loginMainGif from '../../../assets/login-main.gif';
import { EyeToggleIcon } from '@/components/auth/EyeToggleIcon';
import { requestAccountAccess } from '@/lib/userManagementService';
import { SystemUser } from '@/types/database';

interface RequestAccessViewProps {
  onBackToLogin: () => void;
  onRequestSubmitted: (user: SystemUser) => void;
  onRequestPendingError: (user: SystemUser) => void;
  onRequestInactiveError?: (user: SystemUser) => void;
}

export function RequestAccessView({
  onBackToLogin,
  onRequestSubmitted,
  onRequestPendingError,
  onRequestInactiveError
}: RequestAccessViewProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err: any) {
      if (err.code === 'STATUS_PENDING' && err.user) {
        onRequestPendingError(err.user);
      } else if (err.code === 'STATUS_INACTIVE' && err.user && onRequestInactiveError) {
        onRequestInactiveError(err.user);
      } else {
        setErrorMsg(err.message || 'Gagal mengirim permintaan.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-[#ffffff] flex flex-col justify-between items-center p-4 md:p-6 selection:bg-[#171717] selection:text-white">
      {/* Center Group: Header & Form seimbang di tengah */}
      <div className="w-full max-w-[380px] flex-1 flex flex-col justify-center my-auto">
        {/* Brand Header */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src={loginMainGif}
              alt="PT Patak Abadi Jaya"
              className="w-14 h-14 object-contain pointer-events-none"
            />
          </div>
          <p className="text-xs font-medium text-[#666666] tracking-wide">
            Permintaan Akses
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-0.5">
            PT Patak Abadi Jaya
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Daftarkan akun untuk mendapatkan hak akses operasional
          </p>
        </header>

        {/* Main Form Container */}
        <main className="w-full md:bg-white md:rounded-[10px] md:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#fff1f1] text-[#cf1124] text-xs rounded-[6px] leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Field Nama Lengkap */}
            <div className="space-y-1">
              <label
                htmlFor="request-name"
                className="flex items-center space-x-1.5 text-xs font-medium text-[#444444]"
              >
                <img
                  src="/icons/avatar.png"
                  alt="Nama"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Nama Lengkap Pengguna</span>
              </label>
              <input
                id="request-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Ahmad Fauzi"
                disabled={isSubmitting}
                className="w-full h-10 px-3 text-sm text-[#171717] placeholder-[#888888] bg-[#f5f5f5] rounded-[6px] outline-none transition-colors focus:bg-[#ebebeb] disabled:bg-[#f0f0f0]"
              />
            </div>

            {/* Field Email dengan Fixed Suffix @patak.id */}
            <div className="space-y-1">
              <label
                htmlFor="request-username"
                className="flex items-center space-x-1.5 text-xs font-medium text-[#444444]"
              >
                <img
                  src="/icons/mail.png"
                  alt="Email"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Email Akun (@patak.id)</span>
              </label>
              <div className="flex items-center h-10 bg-[#f5f5f5] rounded-[6px] overflow-hidden focus-within:bg-[#ebebeb] transition-colors">
                <input
                  id="request-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="ahmad.fauzi"
                  disabled={isSubmitting}
                  className="flex-1 h-full px-3 text-sm text-[#171717] placeholder-[#888888] bg-transparent outline-none font-mono"
                />
                <span className="px-3 h-full flex items-center bg-[#eaeaea] text-[#555555] font-mono font-semibold text-xs border-l border-[#e0e0e0] select-none">
                  @patak.id
                </span>
              </div>
            </div>

            {/* Field Kata Sandi */}
            <div className="space-y-1">
              <label
                htmlFor="request-password"
                className="flex items-center space-x-1.5 text-xs font-medium text-[#444444]"
              >
                <img
                  src="/icons/lock.png"
                  alt="Kata Sandi"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Kata Sandi (Minimal 8 Karakter)</span>
              </label>
              <div className="relative">
                <input
                  id="request-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter..."
                  disabled={isSubmitting}
                  className="w-full h-10 pl-3 pr-10 text-sm text-[#171717] placeholder-[#888888] bg-[#f5f5f5] rounded-[6px] outline-none transition-colors focus:bg-[#ebebeb] disabled:bg-[#f0f0f0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#888888] hover:text-[#171717] transition-colors rounded flex items-center justify-center cursor-pointer"
                >
                  <EyeToggleIcon isOpen={showPassword} size={18} />
                </button>
              </div>
            </div>

            {/* Tombol Kirim Permintaan */}
            <button
              type="submit"
              disabled={isSubmitting || !name || !username || password.length < 8}
              className="w-full h-10 bg-[#171717] hover:bg-[#333333] active:bg-[#444444] text-white text-sm font-medium rounded-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin [animation-duration:0.45s] h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Kirim Permintaan'
              )}
            </button>
          </form>

          {/* Tautan Kembali ke Login */}
          <div className="pt-2 text-center">
            <span className="text-xs text-[#666666]">Sudah memiliki akun? </span>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-semibold text-[#111111] underline hover:text-black transition-colors cursor-pointer"
            >
              Masuk
            </button>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[380px] text-center pb-2 flex-shrink-0">
        <p className="text-[10px] text-[#888888] leading-tight">
          Akses internal terbatas untuk manajemen & operasional PT Patak Abadi Jaya
        </p>
      </footer>
    </div>
  );
}
