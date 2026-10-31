import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  
  signOut,
  User 
} from 'firebase/auth';
import { auth, } from '@/lib/firebase';
import { EyeToggleIcon } from '@/components/auth/EyeToggleIcon';
import loginMainGif from '../../../assets/login-main.gif';
import { 
  getUserStatusByEmail, 
  updateUserLastLogin, 
  seedInitialUsers 
} from '@/lib/userManagementService';
import { RequestAccessView } from '@/components/auth/RequestAccessView';
import { RequestSubmittedScreen } from '@/components/auth/RequestSubmittedScreen';
import { ReviewPendingScreen } from '@/components/auth/ReviewPendingScreen';
import { AccountInactiveScreen } from '@/components/auth/AccountInactiveScreen';
import { SystemUser } from '@/types/database';

interface LoginPageProps {
  user: User | null;
}

export function LoginPage({ user }: LoginPageProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Status & View States
  const [authView, setAuthView] = useState<'login' | 'request_access'>('login');
  const [isSubmittedScreenOpen, setIsSubmittedScreenOpen] = useState(false);
  const [pendingReviewUser, setPendingReviewUser] = useState<SystemUser | null>(null);
  const [inactiveUser, setInactiveUser] = useState<SystemUser | null>(null);

  // Seed default developer & admin on mount
  React.useEffect(() => {
    seedInitialUsers().catch(console.error);
  }, []);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Email dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const statusUser = await getUserStatusByEmail(cleanEmail);

      // Cek apakah akun masih dalam status PENDING review
      if (statusUser?.status === 'PENDING') {
        setPendingReviewUser(statusUser);
        setIsLoading(false);
        return;
      }

      // Cek apakah akun berstatus NONAKTIF (inaktif 30 hari)
      if (statusUser?.status === 'INACTIVE') {
        setInactiveUser(statusUser);
        setIsLoading(false);
        return;
      }

      // Login ke Firebase Auth
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      await updateUserLastLogin(cleanEmail);
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password') || err.message.includes('auth/user-not-found')) {
          setAuthError('Email atau kata sandi tidak valid.');
        } else if (err.message.includes('auth/too-many-requests')) {
          setAuthError('Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.');
        } else {
          setAuthError('Gagal masuk. Periksa koneksi internet Anda.');
        }
      } else {
        setAuthError('Terjadi kesalahan autentikasi.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Signout error:', err);
    }
  }

  // State: Terautentikasi (Sesi Aktif)
  if (user) {
    return (
      <div className="h-dvh max-h-dvh overflow-hidden bg-[#fafafa] flex flex-col justify-center items-center p-4 selection:bg-[#171717] selection:text-white">
        <div className="w-full max-w-md bg-white rounded-[10px] p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#eaeaea]">
            <img
              src="/icons/pt-logo.png"
              alt="PT Patak Abadi Jaya"
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            <div>
              <h2 className="text-base font-semibold text-[#111111] tracking-tight">
                PT Patak Abadi Jaya
              </h2>
              <p className="text-xs text-[#666666]">
                Sesi Terautentikasi
              </p>
            </div>
          </div>

          <div className="bg-[#f5f5f5] rounded-[6px] p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#666666]">
              <span>Status Akun</span>
              <span className="font-medium text-[#111111]">Aktif</span>
            </div>
            <div className="flex justify-between items-center text-[#666666]">
              <span>Email</span>
              <span className="text-[#111111] font-medium whitespace-nowrap">{user.email || 'Google User'}</span>
            </div>
            <div className="flex justify-between items-center text-[#666666]">
              <span>Database Target</span>
              <span className="font-mono text-[#111111]">pataklogisticdb</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-10 flex items-center justify-center space-x-2 bg-[#171717] hover:bg-[#333333] active:bg-[#444444] text-white text-sm font-medium rounded-[6px] transition-colors"
          >
            <img
              src="/icons/logout.png"
              alt="Keluar"
              className="w-4 h-4 object-contain brightness-0 invert"
            />
            <span>Keluar dari Sistem</span>
          </button>
        </div>

        <p className="text-[10px] text-[#888888] mt-6 text-center">
          PT Patak Abadi Jaya - Sistem Operasional Logistik & Pencatatan Ritase
        </p>
      </div>
    );
  }

  // Tampilan Halaman Penuh: Permintaan Akses Akun Baru (Layout Identik Login, Full Page)
  if (authView === 'request_access') {
    return (
      <>
        <RequestAccessView
          onBackToLogin={() => setAuthView('login')}
          onRequestSubmitted={_u => {
            setIsSubmittedScreenOpen(true);
          }}
          onRequestPendingError={u => {
            setPendingReviewUser(u);
          }}
          onRequestInactiveError={u => {
            setInactiveUser(u);
          }}
        />

        {/* Layar Permintaan Berhasil Dikirim */}
        {isSubmittedScreenOpen && (
          <RequestSubmittedScreen
            onBackToLogin={() => {
              setIsSubmittedScreenOpen(false);
              setAuthView('login');
            }}
          />
        )}

        {/* Layar Akun Masih Di-Review */}
        {pendingReviewUser && (
          <ReviewPendingScreen
            user={pendingReviewUser}
            onBackToLogin={() => {
              setPendingReviewUser(null);
              setAuthView('login');
            }}
          />
        )}

        {/* Layar Akun Dinonaktifkan (30 Hari Inaktif) */}
        {inactiveUser && (
          <AccountInactiveScreen
            user={inactiveUser}
            onBackToLogin={() => {
              setInactiveUser(null);
              setAuthView('login');
            }}
          />
        )}
      </>
    );
  }

  // State: Form Login (Light Mode, Vercel Design System Tokens)
  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-[#ffffff] flex flex-col justify-between items-center p-4 md:p-6 selection:bg-[#171717] selection:text-white">
      {/* Center Group: Logo, Nama PT, dan Form Login rapat & seimbang di tengah layar */}
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
            Masuk ke
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] mt-0.5">
            PT Patak Abadi Jaya
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Sistem Pencatatan Ritase & Finansial Material
          </p>
        </header>

        {/* Main Container: Cardless di mobile, Elegan Card di desktop (Borderless & Flat) */}
        <main className="w-full md:bg-white md:rounded-[10px] md:p-6 space-y-4">
          {authError && (
            <div className="p-3 bg-[#fff1f1] text-[#cf1124] text-xs rounded-[6px] leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            {/* Email Field (Filled Surface, Borderless) */}
            <div className="space-y-1">
              <label 
                htmlFor="login-email" 
                className="flex items-center space-x-1.5 text-xs font-medium text-[#444444]"
              >
                <img
                  src="/icons/mail.png"
                  alt="Email"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Email Akun</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@patak.id"
                disabled={isLoading}
                className="w-full h-10 px-3 text-sm text-[#171717] placeholder-[#888888] bg-[#f5f5f5] rounded-[6px] outline-none transition-colors focus:bg-[#ebebeb] disabled:bg-[#f0f0f0]"
              />
            </div>

            {/* Password Field (Filled Surface, Borderless) */}
            <div className="space-y-1">
              <label 
                htmlFor="login-password" 
                className="flex items-center space-x-1.5 text-xs font-medium text-[#444444]"
              >
                <img
                  src="/icons/lock.png"
                  alt="Kata Sandi"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Kata Sandi</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  disabled={isLoading}
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

            {/* Submit Button (Spinner cepat saat isLoading) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-[#171717] hover:bg-[#333333] active:bg-[#444444] text-white text-sm font-medium rounded-[6px] transition-all disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center mt-2"
            >
              {isLoading ? (
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
                'Masuk'
              )}
            </button>
          </form>

          

          {/* Tombol Minta Akses Akun Baru */}
          <div className="pt-2 text-center">
            <span className="text-xs text-[#666666]">Belum memiliki akun? </span>
            <button
              type="button"
              onClick={() => setAuthView('request_access')}
              className="text-xs font-semibold text-[#111111] underline hover:text-black transition-colors cursor-pointer"
            >
              Minta Akses
            </button>
          </div>
        </main>
      </div>

      {/* Footer (Teks lebih kecil dan ringkas) */}
      <footer className="w-full max-w-[380px] text-center pb-2 flex-shrink-0">
        <p className="text-[10px] text-[#888888] leading-tight">
          Akses internal terbatas untuk manajemen & operasional PT Patak Abadi Jaya
        </p>
      </footer>

      {/* Layar Permintaan Berhasil Dikirim */}
      {isSubmittedScreenOpen && (
        <RequestSubmittedScreen
          onBackToLogin={() => setIsSubmittedScreenOpen(false)}
        />
      )}

      {/* Layar Akun Masih Di-Review */}
      {pendingReviewUser && (
        <ReviewPendingScreen
          user={pendingReviewUser}
          onBackToLogin={() => setPendingReviewUser(null)}
        />
      )}

      {/* Layar Akun Dinonaktifkan (30 Hari Inaktif) */}
      {inactiveUser && (
        <AccountInactiveScreen
          user={inactiveUser}
          onBackToLogin={() => setInactiveUser(null)}
        />
      )}
    </div>
  );
}
