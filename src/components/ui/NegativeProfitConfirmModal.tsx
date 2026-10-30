import React, { useState, useEffect, useRef } from 'react';

const formatRupiah = (val: number): string => {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

interface NegativeProfitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalBuyCost: number;
  totalOperational: number;
  totalRevenue: number;
  netProfit: number;
  isLoading?: boolean;
}

const COUNTDOWN_DURATION_MS = 5000;
const TICK_INTERVAL_MS = 25;

export function NegativeProfitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  totalBuyCost,
  totalOperational,
  totalRevenue,
  netProfit,
  isLoading = false
}: NegativeProfitConfirmModalProps): React.JSX.Element | null {
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [isTimerFinished, setIsTimerFinished] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setProgressPercent(100);
      setIsTimerFinished(false);
      return;
    }

    startTimeRef.current = Date.now();
    setProgressPercent(100);
    setIsTimerFinished(false);

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, COUNTDOWN_DURATION_MS - elapsed);
      const percent = (remaining / COUNTDOWN_DURATION_MS) * 100;

      setProgressPercent(percent);

      if (remaining <= 0) {
        setIsTimerFinished(true);
        clearInterval(timer);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Keyboard shortcut: Escape untuk membatalkan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const totalExpense = totalBuyCost + totalOperational;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="negative-profit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
    >
      {/* Solid Dimmed Backdrop (Tanpa Blur / Anti-Glassmorphism) */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface (Solid White Card - Flat Borderless) */}
      <div className="relative w-full max-w-md bg-white rounded-[10px] overflow-hidden z-10 flex flex-col border border-[#eaeaea]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eaeaea]">
          <h2
            id="negative-profit-title"
            className="text-xs md:text-sm font-semibold tracking-tight text-[#cf1124] truncate"
          >
            Laba Bersih Minus, Yakin Nggak Salah Input?
          </h2>

          {/* Close Button (/icons/close.png) */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup dialog"
            className="p-1 rounded text-[#666666] hover:text-[#111111] hover:bg-[#fafafa] transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-4 h-4 object-contain"
            />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-[#555555] leading-relaxed">
            Estimasi pendapatan tempo lebih kecil daripada total belanja kuari dan operasional lapangan armada.
          </p>

          {/* Rincian Finansial Komparasi */}
          <div className="bg-[#fafafa] rounded-[8px] p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#666666]">
              <span>Belanja Tunai Kuari:</span>
              <span className="font-mono text-[#111111]">{formatRupiah(totalBuyCost)}</span>
            </div>

            <div className="flex justify-between items-center text-[#666666]">
              <span>Beban Operasional & HOK:</span>
              <span className="font-mono text-[#111111]">{formatRupiah(totalOperational)}</span>
            </div>

            <div className="flex justify-between items-center text-[#444444] pt-1.5 border-t border-[#eaeaea]">
              <span className="font-medium">Total Pengeluaran:</span>
              <span className="font-mono font-semibold text-[#111111]">{formatRupiah(totalExpense)}</span>
            </div>

            <div className="flex justify-between items-center text-[#666666]">
              <span>Piutang Penjualan (Tempo):</span>
              <span className="font-mono text-[#111111]">{formatRupiah(totalRevenue)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#eaeaea] text-[#cf1124]">
              <span className="font-semibold">Estimasi Rugi Bersih:</span>
              <span className="font-mono font-bold text-sm">
                {formatRupiah(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[#fafafa] border-t border-[#eaeaea] flex items-center justify-end space-x-2.5">
          {/* Tombol Batal */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-medium text-[#171717] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[6px] transition-colors disabled:opacity-50"
          >
            Batal
          </button>

          {/* Tombol Tetap Simpan dengan Depleting Progress Bar (5 Detik, Tanpa Angka) */}
          <button
            type="button"
            onClick={() => {
              if (isTimerFinished && !isLoading) {
                onConfirm();
              }
            }}
            disabled={!isTimerFinished || isLoading}
            className={`relative overflow-hidden px-4 py-2 text-xs font-semibold rounded-[6px] transition-all select-none ${
              isTimerFinished
                ? 'bg-[#cf1124] hover:bg-[#a80e1d] text-white active:scale-[0.99] cursor-pointer'
                : 'bg-[#fee2e2] text-[#991b1b] cursor-not-allowed opacity-90'
            }`}
          >
            {/* Depleting Progress Bar Fill (Menyusut dari 100% ke 0%) */}
            {!isTimerFinished && (
              <div
                className="absolute inset-y-0 left-0 bg-[#ef4444]/30 pointer-events-none"
                style={{
                  width: `${progressPercent}%`,
                  transition: 'width 25ms linear'
                }}
              />
            )}

            {/* Label Tombol */}
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? 'Menyimpan...' : 'Tetap Simpan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
