import React from 'react';

interface RequestSubmittedScreenProps {
  onBackToLogin: () => void;
}

export function RequestSubmittedScreen({ onBackToLogin }: RequestSubmittedScreenProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 select-none h-dvh max-h-dvh w-full overflow-hidden animate-in fade-in duration-200">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Visual Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mb-5 md:mb-6">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Teks Status */}
        <h2 className="text-base md:text-xl font-bold text-[#111111] tracking-tight">
          Permintaan berhasil dikirim!
        </h2>
        <p className="text-xs md:text-sm text-[#666666] mt-2 md:mt-3 leading-relaxed">
          Mohon tunggu, permintaan kamu sedang di-review ya! Silakan cek secara berkala.
        </p>

        {/* Tombol Kembali ke Halaman Login */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-6 md:mt-8 px-5 py-2.5 text-xs md:text-sm font-semibold text-white bg-[#111111] hover:bg-black rounded-[8px] transition-colors cursor-pointer"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    </div>
  );
}
