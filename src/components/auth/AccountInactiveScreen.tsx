import React from 'react';
import { DEVELOPER_WHATSAPP } from '@/lib/userManagementService';
import { SystemUser } from '@/types/database';

interface AccountInactiveScreenProps {
  user: SystemUser | null;
  onBackToLogin: () => void;
}

export function AccountInactiveScreen({ user, onBackToLogin }: AccountInactiveScreenProps): React.JSX.Element {
  // Hitung jumlah hari tidak aktif
  const inactiveDays = React.useMemo(() => {
    if (!user?.lastLoginAt) return 30;
    const diffMs = Date.now() - new Date(user.lastLoginAt).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 30;
  }, [user]);

  const handleContactDeveloper = () => {
    const email = user?.email || '-';
    const name = user?.name || '-';
    const message = `Halo Developer PT Patak Abadi Jaya, akun saya dinonaktifkan karena tidak aktif selama ${inactiveDays} hari.\n\n• Nama: ${name}\n• Email: ${email}\n\nSaya ingin meminta pembukaan kembali akses akun. Terima kasih!`;
    const cleanNumber = DEVELOPER_WHATSAPP.startsWith('0')
      ? '62' + DEVELOPER_WHATSAPP.slice(1)
      : DEVELOPER_WHATSAPP;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 select-none h-dvh max-h-dvh w-full overflow-hidden animate-in fade-in duration-200">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Visual Icon Nonaktif */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center mb-5 md:mb-6">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-[#dc2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        {/* Teks Status */}
        <h2 className="text-base md:text-xl font-bold text-[#111111] tracking-tight">
          Akun kamu dinonaktifkan nih.
        </h2>
        <p className="text-xs md:text-sm text-[#666666] mt-2 leading-relaxed">
          Karna tidak ada aktifitas selama {inactiveDays} hari.
        </p>

        {user && (
          <div className="mt-3.5 px-3 py-1.5 bg-[#f9f9f9] border border-[#eeeeee] rounded-[6px] text-[11px] font-mono text-[#555555]">
            {user.email}
          </div>
        )}

        <div className="mt-6 w-full space-y-2.5">
          <button
            type="button"
            onClick={handleContactDeveloper}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#008060] hover:bg-[#006e52] rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Minta Akses Lagi ke Developer</span>
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 text-xs font-semibold text-[#777777] hover:text-[#111111] transition-colors cursor-pointer"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  );
}
