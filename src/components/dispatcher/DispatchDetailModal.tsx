import React from 'react';
import { DispatchTransaction } from '@/types/database';
import { useProjectFilter } from '@/context/ProjectFilterContext';

interface DispatchDetailModalProps {
  transaction: DispatchTransaction | null;
  onClose: () => void;
}

export function DispatchDetailModal({ transaction, onClose }: DispatchDetailModalProps): React.JSX.Element | null {
  const { isDispatcherUser, isInvestorUser } = useProjectFilter();
  const hideMargin = isDispatcherUser || isInvestorUser;

  if (!transaction) return null;

  const formatRupiah = (val: number): string => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
    >
      {/* Solid Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Solid Container Card (Bottom Sheet di mobile, Center Pop-up di Desktop) */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-[16px] md:rounded-[12px] p-5 md:p-6 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 border-none">
        {/* Header Dialog */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-[#111111]">
              Rincian Tiket Ritase
            </h3>
            <span className="font-mono text-xs text-[#888888]">
              {transaction.ticketNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors"
            aria-label="Tutup dialog"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-4 h-4 object-contain"
            />
          </button>
        </div>

        {/* Content Details */}
        <div className="py-4 space-y-3.5 text-xs">
          {/* Row Data Armada, Konsumen & Proyek (Stacked di mobile, split di desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[#f5f5f5]">
            <div>
              <span className="text-[#888888] block text-[11px]">Proyek Tujuan</span>
              <span className="font-semibold text-xs md:text-sm text-[#111111] break-words">
                {transaction.projectName || 'Proyek Umum'}
              </span>
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">No. Plat Truk</span>
              <span className="font-mono font-semibold text-xs md:text-sm text-[#111111]">
                {transaction.truckPlate}
              </span>
              {transaction.driverName && (
                <span className="text-[#666666] block text-[11px] mt-0.5">
                  Sopir: {transaction.driverName}
                </span>
              )}
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">Pembeli / Kontraktor</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                {transaction.clientName || transaction.customerName}
              </span>
            </div>
          </div>

          {/* Row Material, Kuari & Kuantitas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[#f5f5f5]">
            <div>
              <span className="text-[#888888] block text-[11px]">Jenis Material</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                {transaction.materialName}
              </span>
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">Kuari Asal</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                {transaction.quarryName || '-'}
              </span>
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">Volume</span>
              <span className="font-mono font-semibold text-xs md:text-sm text-[#111111]">
                {transaction.quantity} {transaction.unit}
              </span>
            </div>
          </div>

          {/* Kalkulasi Finansial Sesuai PRD (Clean & Unwrapped) */}
          <div className="bg-[#fafafa] rounded-[8px] p-3.5 space-y-2 text-xs">
            {!hideMargin && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-[#666666] truncate">Beli Kuari (Cash):</span>
                <span className="font-mono text-[#111111] whitespace-nowrap flex-shrink-0">
                  {formatRupiah(transaction.totalBuyCost)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-2">
              <span className="text-[#666666] truncate">Operasional Lapangan:</span>
              <span className="font-mono text-[#111111] whitespace-nowrap flex-shrink-0">
                {formatRupiah(transaction.operationalCost)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-[#eaeaea]">
              <span className="text-[#666666] truncate">Penjualan (Tempo):</span>
              <span className="font-mono font-semibold text-[#111111] whitespace-nowrap flex-shrink-0">
                {formatRupiah(transaction.totalRevenue)}
              </span>
            </div>

            {!hideMargin && (
              <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#eaeaea]">
                <span className="font-medium text-[#111111] truncate">Estimasi Laba Bersih:</span>
                <span className="font-mono font-bold text-[#111111] whitespace-nowrap flex-shrink-0">
                  {formatRupiah(transaction.netProfit)}
                </span>
              </div>
            )}
          </div>

          {/* Tanggal Pelaksanaan & Tanggal Dibuat */}
          <div className="pt-2 pb-2 border-b border-[#f5f5f5] space-y-1.5 text-[11px]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
              <span className="text-[#888888]">Tanggal Pelaksanaan (Jalan):</span>
              <span className="font-mono font-medium text-[#111111] whitespace-nowrap">
                {transaction.deliveryDate
                  ? new Date(transaction.deliveryDate + 'T00:00:00').toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '-'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
              <span className="text-[#888888]">Waktu Input Sistem:</span>
              <span className="font-mono text-[#666666] whitespace-nowrap">
                {new Date(transaction.createdAt || transaction.date || '').toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })},{' '}
                {new Date(transaction.createdAt || transaction.date || '').toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}{' '}
                WIB
              </span>
            </div>
          </div>

          {/* Status Pembayaran */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-[#888888]">
            <span>Status Pembayaran:</span>
            <span className={`font-semibold tracking-wide ${transaction.status === 'LUNAS' ? 'text-[#111111]' : 'text-[#888888]'}`}>
              {transaction.status === 'LUNAS' ? 'LUNAS' : 'TEMPO (Piutang)'}
            </span>
          </div>

          {transaction.notes && (
            <div className="mt-2.5 bg-[#fafafa] p-3 rounded-[6px] space-y-1">
              <span className="block text-[10px] font-semibold text-[#888888] tracking-wider uppercase">
                Catatan Tiket
              </span>
              <p className="text-xs text-[#222222] whitespace-pre-wrap leading-relaxed break-words font-sans">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
