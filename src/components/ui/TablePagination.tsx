import React from 'react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string; // e.g. "data", "ritase", "transaksi", "jurnal"
  className?: string;
}

/**
 * Komponen Universal Pagination 20 Baris Per Halaman.
 * Sesuai Standar:
 * 1. Menampilkan ringkasan data aktif: "Menampilkan X-Y dari Z [label]"
 * 2. Tombol navigasi Sebelumnya & Berikutnya dengan disabled state halus
 * 3. Deretan nomor halaman dinamis dengan ellipsis (...) saat halaman banyak
 * 4. Desain monokrom netral yang rapi di desktop dan responsif di mobile
 */
export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  itemLabel = 'data',
  className = ''
}: TablePaginationProps): React.JSX.Element | null {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Jika total items 0 atau hanya 1 halaman dan itemnya sedikit, tetap tampilkan ringkasan atau sembunyikan jika kosong
  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Hitung nomor halaman yang ditampilkan (maksimal 5-7 nomor dengan ellipsis)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-4 py-3 bg-white border-t border-[#eaeaea] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Kiri: Ringkasan Jumlah Baris Aktif */}
      <div className="text-[#666666] text-center sm:text-left">
        Menampilkan{' '}
        <strong className="text-[#111111] font-semibold">{startIndex}</strong> -{' '}
        <strong className="text-[#111111] font-semibold">{endIndex}</strong> dari{' '}
        <strong className="text-[#111111] font-semibold">{totalItems}</strong> {itemLabel}
      </div>

      {/* Kanan: Tombol Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Tombol Sebelumnya */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`px-2.5 py-1.5 rounded-[6px] border text-xs font-semibold flex items-center gap-1 transition-colors ${
              currentPage <= 1
                ? 'bg-[#fafafa] text-[#aaaaaa] border-[#eaeaea] cursor-not-allowed opacity-60'
                : 'bg-white text-[#222222] border-[#d1d5db] hover:bg-[#f5f5f5] cursor-pointer'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Nomor-Nomor Halaman */}
          <div className="hidden xs:flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-[#888888]">
                    …
                  </span>
                );
              }

              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[30px] h-[30px] px-2 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white border border-[#111111] shadow-xs'
                      : 'bg-white text-[#444444] border border-[#d1d5db] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Indikator Halaman di Mobile */}
          <span className="xs:hidden text-[11px] font-semibold text-[#555555] px-2">
            Hal. {currentPage} / {totalPages}
          </span>

          {/* Tombol Berikutnya */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`px-2.5 py-1.5 rounded-[6px] border text-xs font-semibold flex items-center gap-1 transition-colors ${
              currentPage >= totalPages
                ? 'bg-[#fafafa] text-[#aaaaaa] border-[#eaeaea] cursor-not-allowed opacity-60'
                : 'bg-white text-[#222222] border-[#d1d5db] hover:bg-[#f5f5f5] cursor-pointer'
            }`}
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
