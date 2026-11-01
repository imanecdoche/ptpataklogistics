import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  currentPath: string;
  onNavigateHome: () => void;
}

export function NotFoundPage({ currentPath, onNavigateHome }: NotFoundPageProps): React.JSX.Element {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Logo Resmi PT Patak Abadi Jaya */}
      <img
        src="/icons/pt-logo.png"
        alt="Logo PT Patak Abadi Jaya"
        className="w-16 h-16 rounded-[14px] mx-auto mb-6 shadow-xs object-cover"
      />

      {/* Tipografi Angka 404 Besar */}
      <h1 className="text-6xl md:text-7xl font-extrabold text-[#111111] tracking-tight leading-none mb-3">
        404
      </h1>

      {/* Judul & Keterangan */}
      <h2 className="text-lg md:text-xl font-bold text-[#111111] mb-2 tracking-tight">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-xs md:text-sm text-[#666666] max-w-md mx-auto mb-6 leading-relaxed">
        Halaman atau subpath yang Anda tuju tidak terdaftar di sistem PT Patak Abadi Jaya.
      </p>

      {/* Kotak Rute URL (Solid Filled, Zero Stroke) */}
      <div className="bg-[#f5f5f5] rounded-[8px] px-4 py-2.5 max-w-md w-full mx-auto mb-8 font-mono text-xs text-[#333333] break-all select-all">
        {currentPath || '/'}
      </div>

      {/* Tombol Aksi Tunggal Kembali ke Dashboard */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs md:text-sm font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[10px] transition-colors cursor-pointer border-none shadow-xs whitespace-nowrap"
      >
        <ArrowLeft className="w-4 h-4 flex-shrink-0" />
        <span>Kembali ke Dashboard</span>
      </button>

      {/* Brand Footer */}
      <div className="mt-12 text-[11px] text-[#999999] tracking-wider uppercase">
        PT Patak Abadi Jaya
      </div>
    </div>
  );
}
