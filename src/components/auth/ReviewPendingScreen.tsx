import React from 'react';
import { DEVELOPER_WHATSAPP } from '@/lib/userManagementService';
import { SystemUser } from '@/types/database';

interface ReviewPendingScreenProps {
  user: SystemUser | null;
  onBackToLogin: () => void;
}

export function ReviewPendingScreen({ user, onBackToLogin }: ReviewPendingScreenProps): React.JSX.Element {
  const handleContactDeveloper = () => {
    const email = user?.email || '-';
    const name = user?.name || '-';
    const message = `Halo Developer PT Patak Abadi Jaya, saya butuh akses cepat ke sistem untuk akun:\n\n- Nama: ${name}\n- Email: ${email}\n- Status: Menunggu Review Developer\n\nMohon bantuannya untuk persetujuan (ACC) akun. Terima kasih!`;
    const cleanNumber = DEVELOPER_WHATSAPP.startsWith('0')
      ? '62' + DEVELOPER_WHATSAPP.slice(1)
      : DEVELOPER_WHATSAPP;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 select-none h-dvh max-h-dvh w-full overflow-hidden animate-in fade-in duration-200">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Visual Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#fefce8] border border-[#fef08a] flex items-center justify-center mb-5 md:mb-6">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-[#ca8a04]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Teks Status */}
        <h2 className="text-base md:text-xl font-bold text-[#111111] tracking-tight">
          Akunmu masih di-review nih.
        </h2>
        <p className="text-xs md:text-sm text-[#666666] mt-2 leading-relaxed">
          Mohon tunggu, permintaan kamu sedang di-review ya! Silakan cek secara berkala!
        </p>

        {user && (
          <div className="mt-3.5 px-3 py-1.5 bg-[#f9f9f9] border border-[#eeeeee] rounded-[6px] text-[11px] font-mono text-[#555555]">
            {user.email}
          </div>
        )}

        <div className="mt-5 p-4 bg-[#fafafa] rounded-[10px] border border-[#eaeaea] w-full text-center">
          <p className="text-xs md:text-sm font-semibold text-[#111111]">
            Butuh akses cepat ya? Yuk, hubungi developer!
          </p>
          <button
            type="button"
            onClick={handleContactDeveloper}
            className="mt-3 w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#008060] hover:bg-[#006e52] rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Kontak Developer</span>
          </button>
        </div>

        {/* Tombol Kembali ke Login */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-4 text-xs font-semibold text-[#777777] hover:text-[#111111] transition-colors cursor-pointer"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    </div>
  );
}
