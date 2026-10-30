import React, { useState, useEffect, useRef } from 'react';
import { MaterialItem, DispatchTransaction } from '@/types/database';
import { getMaterials, subscribeTransactionsByDate } from '@/lib/dispatcherService';
import { DispatchForm } from '@/components/dispatcher/DispatchForm';
import { DispatchTable } from '@/components/dispatcher/DispatchTable';
import { MobileTopRubberBand } from '@/components/ui/MobileTopRubberBand';

interface DispatcherPageProps {
  userEmail: string;
}

export function DispatcherPage({ userEmail }: DispatcherPageProps): React.JSX.Element {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const drawerHeaderRef = useRef<HTMLDivElement | null>(null);
  const drawerContentRef = useRef<HTMLDivElement | null>(null);

  // Default tanggal hari ini dalam format YYYY-MM-DD lokal
  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // Dengarkan event kustom 'patak:open-dispatch-drawer' dan 'patak:close-dispatch-drawer'
  useEffect(() => {
    const handleOpenDrawer = (): void => {
      setIsHistoryDrawerOpen(true);
    };
    const handleCloseDrawer = (): void => {
      setIsHistoryDrawerOpen(false);
    };

    window.addEventListener('patak:open-dispatch-drawer', handleOpenDrawer);
    window.addEventListener('patak:close-dispatch-drawer', handleCloseDrawer);
    return () => {
      window.removeEventListener('patak:open-dispatch-drawer', handleOpenDrawer);
      window.removeEventListener('patak:close-dispatch-drawer', handleCloseDrawer);
    };
  }, []);

  // 1. Ambil data master materials
  useEffect(() => {
    getMaterials()
      .then(res => setMaterials(res))
      .catch(err => console.error('Gagal memuat materials:', err));
  }, []);

  // 2. Real-time subscribe transaksi berdasarkan tanggal terpilih
  useEffect(() => {
    setIsLoadingTx(true);
    const unsubscribe = subscribeTransactionsByDate(selectedDate, list => {
      setTransactions(list);
      setIsLoadingTx(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-6 items-start w-full relative">
      {/* Formulir Pencatatan Ritase Baru (Boxless di Mobile, Full-width di Desktop) */}
      <div className="w-full">
        <DispatchForm
          materials={materials}
          userEmail={userEmail}
          transactions={transactions}
          onSuccess={() => {
            // Setelah tiket berhasil disimpan, otomatis buka drawer 'Riwayat Ritase Armada' di mobile
            setIsHistoryDrawerOpen(true);
          }}
        />
      </div>

      {/* Tabel Riwayat Ritase (Desktop: Posisikan Vertikal Tepat di Bawah Form Ritase) */}
      <div className="hidden md:block w-full min-w-0">
        <DispatchTable
          transactions={transactions}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          userEmail={userEmail}
          isLoading={isLoadingTx}
        />
      </div>

      {/* Mobile Docked Handler Bar: "Riwayat Ritase Armada" (Frosted Glass + Soft Drop Shadow) */}
      <div
        onClick={() => setIsHistoryDrawerOpen(true)}
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/80 backdrop-blur-md rounded-t-[16px] border-t border-[#eaeaea]/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3 cursor-pointer select-none active:bg-white/95 transition-all flex flex-col items-center"
      >
        <div className="w-8 h-1 rounded-full bg-[#cccccc] mb-1.5" />
        <div className="w-full flex items-center justify-between text-xs">
          <span className="font-bold text-[#111111]">Riwayat Ritase Armada</span>
          <span className="text-[11px] text-[#666666] font-medium flex items-center gap-1 font-mono">
            <span>{transactions.length} ritase</span>
            <svg className="w-3.5 h-3.5 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Fullscreen Mobile Drawer: Riwayat Ritase Armada (Animasi Meluncur Halus 300ms Dua Arah) */}
      <div
        className={`fixed inset-0 z-50 md:hidden bg-[#fafafa] flex flex-col transition-transform duration-300 ease-out transform ${
          isHistoryDrawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Frosted Glass Header: Riwayat Ritase Armada (Bisa diklik di seluruh area untuk menutup) */}
        <div
          ref={drawerHeaderRef}
          onClick={() => setIsHistoryDrawerOpen(false)}
          className="h-14 bg-white/80 backdrop-blur-md border-b border-[#eaeaea] rounded-b-[16px] px-4 flex items-center justify-between flex-shrink-0 z-10 select-none cursor-pointer active:bg-[#f5f5f5]/80 transition-colors"
        >
          {/* Tombol Tutup Panah Bawah (Style Line) di Sisi Kiri */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryDrawerOpen(false);
            }}
            aria-label="Tutup riwayat ritase"
            className="text-[#171717] p-1.5 -ml-1.5 rounded hover:bg-[#f5f5f5]/60 transition-colors flex items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <h2 className="text-xs font-bold text-[#111111] tracking-tight truncate max-w-[220px] text-center">
            Riwayat Ritase Armada
          </h2>

          <div className="w-8" aria-hidden="true" />
        </div>

        {/* Drawer Content: DispatchTable (Bisa ditarik ke bawah saat di puncak scroll untuk pulltoclose) */}
        <div
          ref={drawerContentRef}
          className="flex-1 overflow-y-auto p-4 pb-12"
        >
          <DispatchTable
            transactions={transactions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            userEmail={userEmail}
            isLoading={isLoadingTx}
          />
        </div>

        {/* Symmetrical Top Rubber Dome untuk Gestur pulltoclose */}
        <MobileTopRubberBand
          headerRef={drawerHeaderRef}
          contentRef={drawerContentRef}
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
