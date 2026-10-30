import React, { useState } from 'react';
import { DispatchTransaction } from '@/types/database';
import { settleTransaction } from '@/lib/dispatcherService';
import { useDialog } from '@/context/DialogContext';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';

interface DispatchTableProps {
  transactions: DispatchTransaction[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  userEmail: string;
  isLoading?: boolean;
}

export function DispatchTable({
  transactions,
  selectedDate,
  onDateChange,
  userEmail,
  isLoading = false
}: DispatchTableProps): React.JSX.Element {
  const dialog = useDialog();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<DispatchTransaction | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const { selectedProjectId, isDispatcherUser, isInvestorUser } = useProjectFilter();
  const hideMargin = isDispatcherUser || isInvestorUser;

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // Filter pencarian instan & filter global proyek
  const filteredTransactions = transactions.filter(tx => {
    // 1. Filter Global Proyek
    if (selectedProjectId !== 'ALL' && tx.projectId && tx.projectId !== selectedProjectId) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.ticketNumber.toLowerCase().includes(q) ||
      tx.truckPlate.toLowerCase().includes(q) ||
      tx.customerName.toLowerCase().includes(q) ||
      (tx.projectName && tx.projectName.toLowerCase().includes(q)) ||
      (tx.quarryName && tx.quarryName.toLowerCase().includes(q)) ||
      tx.materialName.toLowerCase().includes(q) ||
      (tx.driverName && tx.driverName.toLowerCase().includes(q))
    );
  });

  // Kalkulasi Ringkasan Hari Ini
  const totalRitase = filteredTransactions.length;
  const totalOmset = filteredTransactions.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalLaba = filteredTransactions.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);

  // Aksi Tandai Lunas dengan CustomDialog
  const handleSettle = (tx: DispatchTransaction): void => {
    dialog.showConfirm({
      title: 'Konfirmasi Pelunasan Piutang',
      message: `Tandai transaksi tiket ${tx.ticketNumber} (${tx.customerName}) sebesar ${formatRupiah(tx.totalRevenue)} sebagai LUNAS? Mutasi kas masuk akan otomatis dibukukan di Kas & Piutang.`,
      confirmText: 'Ya, Tandai Lunas',
      cancelText: 'Batal',
      onConfirm: async () => {
        setSettlingId(tx.id);
        try {
          await settleTransaction(tx.id, tx.ticketNumber, tx.totalRevenue, userEmail);
          dialog.showAlert({
            title: 'Pelunasan Berhasil',
            message: `Tiket ${tx.ticketNumber} berstatus LUNAS. Saldo kas berjalan telah diperbarui.`,
            confirmText: 'Selesai'
          });
        } catch (err) {
          console.error('Gagal melunasi piutang:', err);
          dialog.showAlert({
            title: 'Gagal Pelunasan',
            message: 'Terjadi kesalahan sistem saat memperbarui status transaksi.',
            confirmText: 'Tutup'
          });
        } finally {
          setSettlingId(null);
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-[10px] p-5 md:p-6 select-none flex flex-col h-full">
      {/* Header Tabel: Kontrol Tanggal & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eaeaea]">
        <div>
          <h2 className="text-sm font-semibold text-[#111111]">
            Riwayat Ritase Armada
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Daftar pengiriman material berjalan dan status tempo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Date Picker (Bebas Native Browser Picker) */}
          <CustomDatePicker
            value={selectedDate}
            onChange={onDateChange}
          />

          {/* Instant Search (Rule 98: Universal Search Icon) */}
          <div className="relative">
            <img
              src="/icons/search.png"
              alt="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
            />
            <input
              type="text"
              placeholder="Cari plat, tiket, pembeli..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 bg-[#f5f5f5] focus:bg-[#ebebeb] outline-none rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Finansial Harian (Rule 99: Sans-serif bold tracking-tight, no monospace) */}
      <div className={`grid grid-cols-1 ${hideMargin ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2.5 py-4 border-b border-[#f5f5f5]`}>
        <div className="bg-[#fafafa] rounded-[8px] p-3 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
          <span className="text-[11px] text-[#888888]">Total Ritase</span>
          <span className="text-sm sm:text-base font-bold tracking-tight text-[#111111]">
            {totalRitase} <span className="text-xs font-normal text-[#666666]">Trip</span>
          </span>
        </div>

        <div className="bg-[#fafafa] rounded-[8px] p-3 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
          <span className="text-[11px] text-[#888888]">Total Tagihan (Tempo)</span>
          <div className="mt-0.5">
            <MetricCardCurrency amount={totalOmset} size="sm" />
          </div>
        </div>

        {!hideMargin && (
          <div className="bg-[#fafafa] rounded-[8px] p-3 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-1">
            <span className="text-[11px] text-[#888888]">Total Laba Bersih</span>
            <div className="mt-0.5">
              <MetricCardCurrency
                amount={totalLaba}
                size="sm"
                colorClassName={totalLaba >= 0 ? 'text-[#008060]' : 'text-[#cf1124]'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Area Tabel Data */}
      <div className="flex-1 overflow-x-auto overflow-y-auto mt-2 min-h-[280px]">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-xs text-[#888888]">
            Memuat data ritase...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs text-[#888888]">
              Tidak ada catatan ritase pada tanggal ini ({selectedDate}).
            </span>
            <span className="text-[11px] text-[#aaaaaa] mt-1">
              Gunakan formulir di samping untuk mencatat ritase baru.
            </span>
          </div>
        ) : (
          <table className="w-full min-w-[1295px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-white border-b border-[#f0f0f0] text-[11px] font-medium text-[#888888]">
              <tr>
                <th className="py-2.5 px-3 w-[155px] min-w-[155px] whitespace-nowrap">Waktu & No. Tiket</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Armada / Sopir</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Proyek Tujuan</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">Konsumen</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Kuari Asal</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Material & Muatan</th>
                <th className="py-2.5 px-3 w-[190px] min-w-[190px] whitespace-nowrap">Catatan Ritase</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">
                  {hideMargin ? 'Nilai Tagihan' : 'Penjualan & Laba'}
                </th>
                <th className="py-2.5 px-3 w-[90px] min-w-[90px] text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9f9f9]">
              {filteredTransactions.map(tx => {
                const deliveryDateObj = tx.deliveryDate
                  ? new Date(tx.deliveryDate + 'T00:00:00')
                  : new Date(tx.createdAt || tx.date || '');
                const formattedDeliveryDate = deliveryDateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                const createdDateObj = new Date(tx.createdAt || tx.date || '');
                const formattedCreatedDate = createdDateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short'
                });
                const createdTimeStr = createdDateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#fafafa] transition-colors"
                  >
                    {/* Waktu & Tiket (Fixed 155px, Zero Wrap) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[155px]">
                      <div className="font-mono font-bold text-[#111111]">
                        {tx.ticketNumber}
                      </div>
                      <div className="text-[11px] font-medium text-[#111111] mt-0.5">
                        <span className="text-[#888888]">Jalan:</span> {formattedDeliveryDate}
                      </div>
                      <div className="text-[10px] text-[#888888] mt-0.5">
                        <span>Dibuat:</span> {formattedCreatedDate}, {createdTimeStr} WIB
                      </div>
                    </td>

                    {/* Truk & Sopir (Fixed 130px, Zero Wrap) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[130px]">
                      <div className="font-mono font-semibold text-[#111111]">
                        {tx.truckPlate}
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5">
                        {tx.driverName || '-'}
                      </div>
                    </td>

                    {/* Proyek Tujuan (Fixed 130px, Zero Wrap, RunningText) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[130px]">
                      <RunningText
                        text={tx.projectName}
                        className="font-medium text-[#111111]"
                        placeholder="-"
                      />
                    </td>

                    {/* Konsumen (Fixed 140px, Zero Wrap, RunningText) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[140px]">
                      <RunningText
                        text={tx.clientName || tx.customerName}
                        className="font-medium text-[#111111]"
                        placeholder="Umum"
                      />
                    </td>

                    {/* Kuari Asal (Fixed 130px, Zero Wrap, RunningText) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[130px]">
                      <RunningText
                        text={tx.quarryName}
                        className="font-medium text-[#555555]"
                        placeholder="-"
                      />
                    </td>

                    {/* Material & Muatan (Fixed 130px, Zero Wrap) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[130px]">
                      <div className="font-medium text-[#111111]">
                        {tx.materialName}
                      </div>
                      <div className="text-[11px] font-mono text-[#666666] mt-0.5">
                        {tx.quantity} {tx.unit}
                      </div>
                    </td>

                    {/* Catatan Ritase (Fixed 190px, Zero Wrap, RunningText Marquee) */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap w-[190px]">
                      <RunningText
                        text={tx.notes}
                        className="text-[11px] text-[#666666]"
                        placeholder="-"
                      />
                    </td>

                    {/* Finansial (Fixed 140px, Zero Wrap) */}
                    <td className="py-3 px-3 align-middle text-right whitespace-nowrap w-[140px]">
                      <div className="font-mono font-medium text-[#111111]">
                        {formatRupiah(tx.totalRevenue)}
                      </div>
                      {!hideMargin && (
                        <div className="font-mono text-[11px] text-[#666666] mt-0.5">
                          +{formatRupiah(tx.netProfit)}
                        </div>
                      )}
                    </td>

                    {/* Status (Fixed 90px, Zero Wrap, Tipografi Bersih) */}
                    <td className="py-3 px-3 align-middle text-center whitespace-nowrap w-[90px]">
                      <span
                        className={`text-[11px] font-semibold tracking-wide ${
                          tx.status === 'LUNAS' ? 'text-[#111111]' : 'text-[#888888]'
                        }`}
                      >
                        {tx.status === 'LUNAS' ? 'LUNAS' : 'TEMPO'}
                      </span>
                    </td>

                    {/* Aksi (Fixed 60px, Zero Wrap, Popover Context Menu) */}
                    <td className="py-3 px-3 align-middle text-right whitespace-nowrap w-[60px]">
                      <div className="flex items-center justify-end">
                        <TableActionMenu
                          items={[
                            {
                              label: 'Lihat Detail Ritase',
                              onClick: () => setSelectedTx(tx)
                            },
                            {
                              label: settlingId === tx.id ? 'Memproses Lunas...' : 'Tandai Lunas',
                              onClick: () => handleSettle(tx),
                              hidden: tx.status === 'LUNAS',
                              disabled: settlingId === tx.id
                            },
                            {
                              label: 'Salin No. Tiket',
                              onClick: () => {
                                navigator.clipboard.writeText(tx.ticketNumber);
                              }
                            }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        )}
      </div>

      {/* Modal Detail Rincian Ritase */}
      {selectedTx && (
        <DispatchDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
