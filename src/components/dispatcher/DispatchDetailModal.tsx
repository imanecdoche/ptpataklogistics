import React from 'react';
import {
  DispatchTransaction,
  Client,
  Project,
  MaterialItem,
  MasterQuarry,
  MasterVehicle,
  MasterDriver
} from '@/types/database';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { DynamicEntityText } from '@/components/ui/DynamicEntityText';
import { resolveTransactionEntities, resolveCreatorName } from '@/lib/entityResolver';
import { formatDateID } from '@/lib/dateSearchUtils';

interface DispatchDetailModalProps {
  transaction: DispatchTransaction | null;
  onClose: () => void;
  entityMaps?: {
    clients: Map<string, Client>;
    projects: Map<string, Project>;
    materials: Map<string, MaterialItem>;
    quarries: Map<string, MasterQuarry>;
    vehicles: Map<string, MasterVehicle>;
    drivers: Map<string, MasterDriver>;
  };
}

export function DispatchDetailModal({
  transaction,
  onClose,
  entityMaps
}: DispatchDetailModalProps): React.JSX.Element | null {
  const { isDispatcherUser, isInvestorUser } = useProjectFilter();
  const hideMargin = isDispatcherUser || isInvestorUser;

  if (!transaction) return null;

  const ent = entityMaps ? resolveTransactionEntities(transaction, entityMaps) : null;

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
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Solid Container Card (Bottom Sheet Drawer di mobile, Center Pop-up di Desktop) */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10 border-none">
        {/* Header Dialog Bersih: Judul di tengah pada mobile */}
        <div className="p-4 md:p-5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0">
          <div className="w-full text-center md:text-left">
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
            className="hidden md:flex p-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors"
            aria-label="Tutup dialog"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-4 h-4 object-contain"
            />
          </button>
        </div>

        {/* Content Details Scrollable */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 overscroll-contain space-y-3.5 text-xs">
          {/* Row Data Armada, Konsumen & Proyek (Stacked di mobile, split di desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[#f5f5f5]">
            <div>
              <span className="text-[#888888] block text-[11px]">Proyek Tujuan</span>
              <span className="font-semibold text-xs md:text-sm text-[#111111] break-words">
                <DynamicEntityText
                  name={ent ? ent.project.name : (transaction.projectName || 'Proyek Umum')}
                  isOrphan={ent?.project.isOrphan}
                  tooltipText={ent?.project.tooltipText}
                  className="font-semibold text-xs md:text-sm text-[#111111]"
                />
              </span>
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">No. Plat Truk</span>
              <span className="font-mono font-semibold text-xs md:text-sm text-[#111111]">
                <DynamicEntityText
                  name={ent ? ent.truck.name : transaction.truckPlate}
                  isOrphan={ent?.truck.isOrphan}
                  tooltipText={ent?.truck.tooltipText}
                  className="font-mono font-semibold text-xs md:text-sm text-[#111111]"
                />
              </span>
              {(ent?.driver.name || transaction.driverName) && (
                <span className="text-[#666666] block text-[11px] mt-0.5">
                  Sopir:{' '}
                  <DynamicEntityText
                    name={ent ? ent.driver.name : transaction.driverName || ''}
                    isOrphan={ent?.driver.isOrphan}
                    tooltipText={ent?.driver.tooltipText}
                    className="text-[#666666] text-[11px]"
                  />
                </span>
              )}
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">Pembeli / Kontraktor</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                <DynamicEntityText
                  name={ent ? ent.client.name : (transaction.clientName || transaction.customerName || '-')}
                  isOrphan={ent?.client.isOrphan}
                  tooltipText={ent?.client.tooltipText}
                  className="font-medium text-xs md:text-sm text-[#111111]"
                />
              </span>
            </div>
          </div>

          {/* Row Material, Kuari & Kuantitas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[#f5f5f5]">
            <div>
              <span className="text-[#888888] block text-[11px]">Jenis Material</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                <DynamicEntityText
                  name={ent ? ent.material.name : transaction.materialName}
                  isOrphan={ent?.material.isOrphan}
                  tooltipText={ent?.material.tooltipText}
                  className="font-medium text-xs md:text-sm text-[#111111]"
                />
              </span>
            </div>
            <div>
              <span className="text-[#888888] block text-[11px]">Kuari Asal</span>
              <span className="font-medium text-xs md:text-sm text-[#111111] break-words">
                <DynamicEntityText
                  name={ent ? ent.quarry.name : (transaction.quarryName || '-')}
                  isOrphan={ent?.quarry.isOrphan}
                  tooltipText={ent?.quarry.tooltipText}
                  className="font-medium text-xs md:text-sm text-[#111111]"
                />
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
                <span className="text-[#666666] truncate">Harga Beli Kuari:</span>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-[11px] text-[#666666] block">
                    {formatRupiah(transaction.buyPricePerUnit || (transaction.quantity ? Math.round(transaction.totalBuyCost / transaction.quantity) : 0))} / {transaction.unit}
                  </span>
                  <span className="font-mono font-medium text-[#111111]">
                    {formatRupiah(transaction.totalBuyCost)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center gap-2">
              <span className="text-[#666666] truncate">Operasional Lapangan:</span>
              <span className="font-mono text-[#111111] whitespace-nowrap flex-shrink-0">
                {formatRupiah(transaction.operationalCost)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-[#eaeaea]">
              <span className="text-[#666666] truncate">Harga Jual (Tempo):</span>
              <div className="text-right flex-shrink-0">
                <span className="font-mono text-[11px] text-[#666666] block">
                  {formatRupiah(transaction.sellPricePerUnit)} / {transaction.unit}
                </span>
                <span className="font-mono font-semibold text-[#111111]">
                  {formatRupiah(transaction.totalRevenue)}
                </span>
              </div>
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
                {formatDateID(transaction.deliveryDate || transaction.date)}
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 pt-0.5">
              <span className="text-[#888888]">Dibuat Oleh:</span>
              <span className="font-medium text-[#111111] whitespace-nowrap">
                {resolveCreatorName(transaction.createdBy)}
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

        {/* Sticky Bottom Close Action Bar */}
        <div className="p-3.5 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-center z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
