import React, { useState, useMemo, useEffect } from 'react';
import { DispatchTransaction, Project } from '@/types/database';
import { resolveCreatorName } from '@/lib/entityResolver';
import { RecordProjectPaymentModal } from './RecordProjectPaymentModal';
import { settleSingleTicket } from '@/lib/cashLedgerService';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatRupiah } from '@/lib/currencyUtils';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';
import { formatVolumeDisplay } from '@/lib/volumeUtils';

interface ReceivablesViewProps {
  transactions: DispatchTransaction[];
  projects: Project[];
  userEmail: string;
  onRefresh: () => void;
}

export function ReceivablesView({
  transactions,
  projects,
  userEmail,
  onRefresh
}: ReceivablesViewProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TEMPO' | 'LUNAS'>('ALL');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [settlingTicketId, setSettlingTicketId] = useState<string | null>(null);
  const { isWatcherUser } = useProjectFilter();

  // Kalkulasi Ringkasan Piutang
  const stats = useMemo(() => {
    let totalTempo = 0;
    let totalLunas = 0;

    transactions.forEach(tx => {
      const rev = tx.totalRevenue || 0;
      if (tx.status === 'TEMPO') {
        totalTempo += rev;
      } else {
        totalLunas += rev;
      }
    });

    return {
      totalTempo,
      totalLunas,
      grandTotal: totalTempo + totalLunas
    };
  }, [transactions]);

  // Breakdown per Proyek
  const projectBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; tempo: number; lunas: number; count: number }>();
    transactions.forEach(tx => {
      const pId = tx.projectId || 'unassigned';
      const pName = tx.projectName || 'Proyek Lain / Tanpa Proyek';
      const cur = map.get(pId) || { name: pName, tempo: 0, lunas: 0, count: 0 };
      const rev = tx.totalRevenue || 0;
      if (tx.status === 'TEMPO') {
        cur.tempo += rev;
      } else {
        cur.lunas += rev;
      }
      cur.count += 1;
      map.set(pId, cur);
    });
    return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }));
  }, [transactions]);

  // Pagination State (Rule 126: 20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, transactions]);

  // Filter Data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        tx.ticketNumber.toLowerCase().includes(q) ||
        (tx.suratJalan && tx.suratJalan.toLowerCase().includes(q)) ||
        (tx.projectName && tx.projectName.toLowerCase().includes(q)) ||
        (tx.clientName && tx.clientName.toLowerCase().includes(q)) ||
        (tx.truckPlate && tx.truckPlate.toLowerCase().includes(q)) ||
        (tx.materialName && tx.materialName.toLowerCase().includes(q)) ||
        matchesDateQuery(tx.deliveryDate || tx.date, q)
      );
    });
  }, [transactions, statusFilter, searchQuery]);

  // Data per halaman (Rule 126: 20 per halaman)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredTransactions.slice(start, start + 20);
  }, [filteredTransactions, currentPage]);

  const handleSettleTicket = async (ticketId: string) => {
    if (!window.confirm('Tandai tiket ritase ini sebagai LUNAS?')) return;
    try {
      setSettlingTicketId(ticketId);
      await settleSingleTicket(ticketId, userEmail);
      onRefresh();
    } catch (err) {
      console.error('Gagal melunasi tiket:', err);
      alert('Terjadi kesalahan saat melunasi tiket.');
    } finally {
      setSettlingTicketId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Metric Cards Ringkasan Piutang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Piutang Belum Tertagih (TEMPO)
          </span>
          <span className="text-xl font-bold tracking-tight text-[#cf1124] block mt-1">
            {formatRupiah(stats.totalTempo)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Nilai tagihan ritase yang belum dilunasi klien
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Piutang Terbayar (LUNAS)
          </span>
          <span className="text-xl font-bold tracking-tight text-emerald-700 block mt-1">
            {formatRupiah(stats.totalLunas)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Penerimaan termin pembayaran yang sudah terealisasi
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Akumulasi Omset Penjualan Ritase
          </span>
          <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
            {formatRupiah(stats.grandTotal)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Total omset kotor seluruh tiket ritase tercatat
          </span>
        </div>
      </div>

      {/* 2. Ringkasan Piutang per Proyek (Tabel Terstruktur) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#eaeaea] bg-[#fafafa] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#111111] leading-tight">Ringkasan Piutang per Proyek</h3>
            <p className="text-[11px] text-[#666666] leading-tight mt-0.5">Akumulasi tagihan dan sisa piutang tempo per proyek berjalan</p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#555555] bg-white px-2.5 py-1 rounded-[5px] border border-[#eaeaea]">
            {projectBreakdown.length} Proyek
          </span>
        </div>
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[700px] table-fixed text-left text-xs border-collapse">
            <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[240px] whitespace-nowrap">Proyek Tujuan</th>
                <th className="py-2.5 px-3 w-[100px] text-center whitespace-nowrap">Jumlah Ritase</th>
                <th className="py-2.5 px-3 w-[140px] text-right whitespace-nowrap">Total Tagihan</th>
                <th className="py-2.5 px-3 w-[140px] text-right whitespace-nowrap">Sisa Piutang (Tempo)</th>
                <th className="py-2.5 px-3 w-[140px] text-right whitespace-nowrap">Terbayar Lunas</th>
                <th className="py-2.5 px-3 w-[90px] text-center whitespace-nowrap">Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {projectBreakdown.map(p => {
                const total = p.tempo + p.lunas;
                const percent = total > 0 ? Math.round((p.lunas / total) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#111111] whitespace-nowrap truncate">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#555555] text-center whitespace-nowrap">
                      {p.count} Ritase
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#111111] text-right whitespace-nowrap">
                      {formatRupiah(total)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#cf1124] text-right whitespace-nowrap">
                      {formatRupiah(p.tempo)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 text-right whitespace-nowrap">
                      {formatRupiah(p.lunas)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border-none ${
                        percent === 100 ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#555555]'
                      }`}>
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Tabel Piutang Ritase */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f5f5f5]'
              }`}
            >
              Semua Tiket
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('TEMPO')}
              className={`px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
                statusFilter === 'TEMPO'
                  ? 'bg-[#cf1124] text-white font-bold'
                  : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f5f5f5]'
              }`}
            >
              Tempo (Belum Lunas)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f5f5f5]'
              }`}
            >
              Lunas
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input (Rule 98) */}
            <div className="relative flex-1 sm:w-64">
              <img
                src="/icons/search.png"
                alt="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari tiket, proyek, klien, tanggal (misal 28-10-26)..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isWatcherUser && <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(true)}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
            >
              + Catat Pelunasan Termin Proyek
            </button>}
          </div>
        </div>

        {/* Tabel Data Piutang */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[1000px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[150px] whitespace-nowrap">No. Tiket / SJ</th>
                <th className="py-2.5 px-3 w-[110px] whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3 w-[200px] whitespace-nowrap">Proyek / Klien</th>
                <th className="py-2.5 px-3 w-[160px] whitespace-nowrap">Material / Plat</th>
                <th className="py-2.5 px-3 w-[130px] text-right whitespace-nowrap">Nilai Tagihan</th>
                <th className="py-2.5 px-3 w-[105px] whitespace-nowrap">Dibuat Oleh</th>
                {!isWatcherUser && <th className="py-2.5 px-3 w-[110px] text-right whitespace-nowrap">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#888888]">
                    Tidak ada tiket ritase piutang yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                      <span className="font-mono font-bold text-[#111111] block">
                        {tx.ticketNumber}
                      </span>
                      {tx.suratJalan ? (
                        <span className="text-[10px] font-mono text-[#888888] block">
                          SJ: {tx.suratJalan}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#555555] whitespace-nowrap align-middle">
                      {formatDateID(tx.deliveryDate || tx.date)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                      <span className="font-semibold text-[#111111] block truncate">
                        {tx.projectName || 'Proyek Lapangan'}
                      </span>
                      <span className="text-[10px] text-[#666666] block truncate">
                        {tx.clientName || tx.customerName || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                      <span className="font-medium text-[#111111] block">
                        {tx.materialName} ({formatVolumeDisplay(tx.quantity, tx.unit)})
                      </span>
                      <span className="text-[10px] font-mono text-[#888888] block">
                        {tx.truckPlate} {tx.driverName ? `- ${tx.driverName}` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap align-middle">
                      <PricePerVolCell
                        unitPrice={tx.sellPricePerUnit}
                        totalPrice={tx.totalRevenue}
                        unit={tx.unit}
                        quantity={tx.quantity}
                        align="right"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] whitespace-nowrap align-middle">
                      {resolveCreatorName(tx.createdBy)}
                    </td>
                    {!isWatcherUser && (<td className="py-2.5 px-3 text-right whitespace-nowrap align-middle">
                      {tx.status === 'TEMPO' ? (
                        <button
                          type="button"
                          onClick={() => handleSettleTicket(tx.id)}
                          disabled={settlingTicketId === tx.id}
                          className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded-[6px] border-none transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {settlingTicketId === tx.id ? 'Memproses...' : 'Lunasi'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#008060] font-semibold">
                          Selesai
                        </span>
                      )}
                    </td>)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Pagination 20 Baris Universal (Rule 126) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemLabel="piutang ritase"
        />
      </div>

      {/* Modal Pelunasan Termin Proyek */}
      <RecordProjectPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        projects={projects}
        userEmail={userEmail}
        onSuccess={onRefresh}
      />
    </div>
  );
}
