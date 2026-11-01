import React from 'react';
import { ArrowLeft, FileQuestion } from 'lucide-react';

interface NotFoundPageProps {
  currentPath: string;
  onNavigateHome: () => void;
}

export function NotFoundPage({ currentPath, onNavigateHome }: NotFoundPageProps): React.JSX.Element {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#eaeaea] rounded-[12px] p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-[#f5f5f5] text-[#111111] rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 bg-[#111111] text-white text-xs font-bold rounded-full mb-3 tracking-wider uppercase">
          404 - Halaman Tidak Ditemukan
        </div>

        <h1 className="text-xl font-bold text-[#111111] mb-2 tracking-tight">
          Rute Tidak Dikenali
        </h1>

        <p className="text-xs text-[#666666] leading-relaxed mb-4">
          Halaman atau subpath yang Anda tuju tidak terdaftar di sistem logistik PATAK.
        </p>

        <div className="bg-[#f9f9f9] border border-[#ebebeb] rounded-[8px] p-3 mb-6 font-mono text-xs text-[#555555] break-all select-all">
          {currentPath || '/'}
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[8px] transition-colors cursor-pointer border-none shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>
    </div>
  );
}
