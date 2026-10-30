import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DispatchTransaction, CashLedgerEntry } from '@/types/database';
import { NavigationTab } from '@/components/layout/Sidebar';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { FundTransferSection } from '@/components/dashboard/FundTransferSection';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';

interface DashboardPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateTab?: (tab: NavigationTab, subTabId?: string) => void;
}

export function DashboardPage({
  userEmail,
  activeSubTab = 'overview',
  onNavigateTab
}: DashboardPageProps): React.JSX.Element {
  const {
    projects,
    selectedProjectId,
    selectedProject,
    isInvestorUser,
    isDispatcherUser,
    isManagementUser
  } = useProjectFilter();
  const hideMargin = isInvestorUser || isDispatcherUser;

  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [cashEntries, setCashEntries] = useState<CashLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<DispatchTransaction | null>(null);

  // Tanggal hari ini lokal YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Format Rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Subscriptions ke Firestore
  useEffect(() => {
    setIsLoading(true);

    // 1. Subscribe semua transaksi ritase
    const txCol = collection(db, 'transactions');
    const qTx = query(txCol, orderBy('createdAt', 'desc'), limit(100));
    const unsubTx = onSnapshot(
      qTx,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DispatchTransaction));
        setTransactions(list);
        setIsLoading(false);
      },
      err => {
        console.warn('Gagal memuat transaksi dashboard:', err);
        setIsLoading(false);
      }
    );

    // 2. Subscribe cash ledger
    const cashCol = collection(db, 'cash_ledger');
    const qCash = query(cashCol, orderBy('date', 'desc'), limit(50));
    const unsubCash = onSnapshot(
      qCash,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CashLedgerEntry));
        setCashEntries(list);
      },
      err => {
        console.warn('Gagal memuat cash ledger dashboard:', err);
      }
    );

    return () => {
      unsubTx();
      unsubCash();
    };
  }, []);

  // Filter transaksi berdasarkan proyek yang dipilih di Header Switcher
  const filteredTransactions = useMemo(() => {
    if (selectedProjectId === 'ALL') return transactions;
    return transactions.filter(t => t.projectId === selectedProjectId);
  }, [transactions, selectedProjectId]);

  // Metrik Utama Hari Ini
  const todayMetrics = useMemo(() => {
    const todayTx = filteredTransactions.filter(
      t => (t.deliveryDate && t.deliveryDate === todayStr) || (t.date && t.date.slice(0, 10) === todayStr)
    );

    const totalTrips = todayTx.length;
    const totalVolume = todayTx.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
    const totalRevenue = todayTx.reduce((acc, t) => acc + (Number(t.totalRevenue) || 0), 0);
    const totalProfit = todayTx.reduce((acc, t) => acc + (Number(t.netProfit) || 0), 0);

    const activePlates = new Set(todayTx.map(t => t.truckPlate?.trim().toUpperCase()).filter(Boolean));

    // Total Piutang Tempo Keseluruhan (transaksi dengan status 'TEMPO')
    const pendingReceivables = filteredTransactions
      .filter(t => t.status === 'TEMPO')
      .reduce((acc, t) => acc + (Number(t.totalRevenue) || 0), 0);

    // Saldo kas: jika memfilter proyek spesifik, gunakan saldo kas proyek tersebut
    const latestCash = selectedProject
      ? selectedProject.currentBalance
      : ((cashEntries.length > 0 && cashEntries[0]) ? cashEntries[0].runningBalance : 0);

    return {
      totalTrips,
      totalVolume,
      totalRevenue,
      totalProfit,
      activePlatesCount: activePlates.size,
      pendingReceivables,
      latestCash
    };
  }, [filteredTransactions, cashEntries, todayStr, selectedProject]);

  return (
    <div className="space-y-6 w-full">
      {/* 1. SECTION: KPI CARDS RINGKASAN UTAMA */}
      {activeSubTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Card 1: Ritase Hari Ini */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                Ritase Hari Ini
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#111111]">
                  {todayMetrics.totalTrips}
                </span>
                <span className="text-xs text-[#777777]">trip</span>
              </div>
              <span className="text-[11px] text-[#888888] mt-1">
                Volume: <strong className="font-bold text-[#111111]">{todayMetrics.totalVolume}</strong> DT/Ton
              </span>
            </div>

            {/* Card 2: Estimasi Laba Bersih / Omzet Hari Ini */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                {hideMargin ? 'Omzet Penjualan Hari Ini' : 'Estimasi Laba Bersih Hari Ini'}
              </span>
              <div className="mt-2">
                <MetricCardCurrency
                  amount={hideMargin ? todayMetrics.totalRevenue : todayMetrics.totalProfit}
                  colorClassName={
                    hideMargin
                      ? 'text-[#111111]'
                      : todayMetrics.totalProfit >= 0
                      ? 'text-[#0e9f6e]'
                      : 'text-[#cf1124]'
                  }
                />
              </div>
              <span className="text-[11px] text-[#888888] mt-1">
                {hideMargin
                  ? `Volume: ${todayMetrics.totalVolume} DT/Ton`
                  : `Omzet: ${formatRupiah(todayMetrics.totalRevenue)}`}
              </span>
            </div>

            {/* Card 3: Saldo Kas Riil Berjalan */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                {selectedProject ? `Kas Proyek (${selectedProject.name})` : 'Posisi Kas Riil'}
              </span>
              <div className="mt-2">
                <MetricCardCurrency
                  amount={todayMetrics.latestCash}
                  colorClassName={todayMetrics.latestCash >= 0 ? 'text-[#111111]' : 'text-[#cf1124]'}
                />
              </div>
              <span className="text-[11px] text-[#888888] mt-1">
                {selectedProject
                  ? `Modal Disetor: ${formatRupiah(selectedProject.initialDeposit)}`
                  : 'Buku Kas Tunai Operasional'}
              </span>
            </div>

            {/* Card 4: Piutang Tempo Berjalan */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                Piutang Tempo Berjalan
              </span>
              <div className="mt-2">
                <MetricCardCurrency
                  amount={todayMetrics.pendingReceivables}
                  colorClassName="text-[#e3a008]"
                />
              </div>
              <span className="text-[11px] text-[#888888] mt-1">
                Armada Aktif: <strong className="font-bold text-[#111111]">{todayMetrics.activePlatesCount}</strong> unit
              </span>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dispatcher', 'new_ticket')}
              className="bg-white rounded-[10px] p-4 border border-[#eaeaea] hover:border-[#111111] text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <img src="/icons/truck.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <h3 className="text-xs font-bold text-[#111111] group-hover:underline">
                    Catat Ritase Baru
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Input armada keluar-masuk kuari dan penetapan harga tempo
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dispatcher', 'history')}
              className="bg-white rounded-[10px] p-4 border border-[#eaeaea] hover:border-[#111111] text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <img src="/icons/chart.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <h3 className="text-xs font-bold text-[#111111] group-hover:underline">
                    Lihat Riwayat Ritase
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Tabel rekap transaksi harian dan verifikasi status pembayaran
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('database', 'vehicles')}
              className="bg-white rounded-[10px] p-4 border border-[#eaeaea] hover:border-[#111111] text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <img src="/icons/database.png" alt="" className="w-6 h-6 object-contain" />
                <div>
                  <h3 className="text-xs font-bold text-[#111111] group-hover:underline">
                    Master Database
                  </h3>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    Kelola data armada plat nomor, supir, klien, dan kuari asal
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* 1.5 SECTION: SUBSIDI SILANG & KAS TALANGAN ANTAR-PROYEK (Khusus Manajemen) */}
          {isManagementUser && (
            <FundTransferSection projects={projects} userEmail={userEmail} />
          )}
        </>
      )}

      {/* 2. SECTION: TABEL LOG AKTIVITAS TERKINI (Feed Log Ritase Real-time) */}
      <div className="bg-white rounded-[10px] border border-[#eaeaea] overflow-hidden">
        <div className="p-4 border-b border-[#eaeaea] flex items-center justify-between">
          <div>
            <h2 className="text-xs md:text-sm font-bold text-[#111111]">
              Aktivitas Ritase Terkini
            </h2>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Feed transaksi ritase armada keluar-masuk kuari secara real-time.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#888888]">
            {filteredTransactions.length} ritase terdata
          </span>
        </div>

        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[1310px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap">No. Tiket</th>
                <th className="py-2.5 px-3 w-[115px] min-w-[115px] whitespace-nowrap">Tanggal Jalan</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Armada & Supir</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Proyek Tujuan</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">Klien / Proyek</th>
                <th className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap">Material</th>
                <th className="py-2.5 px-3 w-[90px] min-w-[90px] text-center whitespace-nowrap">Volume</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Nilai Jual</th>
                {!hideMargin && (
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Laba Bersih</th>
                )}
                <th className="py-2.5 px-3 w-[185px] min-w-[185px] whitespace-nowrap">Catatan Ritase</th>
                <th className="py-2.5 px-3 w-[80px] min-w-[80px] text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={hideMargin ? 11 : 12} className="py-8 text-center text-[#888888] whitespace-nowrap">
                    {isLoading ? 'Memuat log aktivitas...' : 'Belum ada transaksi ritase tercatat.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 20).map(tx => (
                  <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                    {/* No. Tiket (Fixed 125px, Zero Wrap) */}
                    <td className="py-3 px-3 font-mono font-medium text-[#111111] whitespace-nowrap w-[125px] align-middle">
                      {tx.ticketNumber}
                    </td>

                    {/* Tanggal Jalan (Fixed 115px, Zero Wrap) */}
                    <td className="py-3 px-3 font-mono text-[#666666] whitespace-nowrap w-[115px] align-middle">
                      {tx.deliveryDate || (tx.date ? tx.date.slice(0, 10) : '-')}
                    </td>

                    {/* Armada & Supir (Fixed 130px, Zero Wrap) */}
                    <td className="py-3 px-3 whitespace-nowrap w-[130px] align-middle">
                      <span className="font-mono font-bold text-[#111111] block">
                        {tx.truckPlate}
                      </span>
                      <span className="text-[11px] text-[#666666] block">
                        {tx.driverName || '-'}
                      </span>
                    </td>

                    {/* Proyek Tujuan (Fixed 130px, Zero Wrap) */}
                    <td className="py-3 px-3 whitespace-nowrap w-[130px] align-middle">
                      <span className="font-semibold text-[#111111] block truncate">
                        {tx.projectName || 'Proyek Umum'}
                      </span>
                    </td>

                    {/* Klien / Proyek (Fixed 140px, Zero Wrap, RunningText) */}
                    <td className="py-3 px-3 whitespace-nowrap w-[140px] align-middle">
                      <RunningText
                        text={tx.clientName || tx.customerName}
                        className="font-medium text-[#111111]"
                        placeholder="Umum"
                      />
                    </td>

                    {/* Material (Fixed 125px, Zero Wrap) */}
                    <td className="py-3 px-3 whitespace-nowrap w-[125px] align-middle">
                      <span className="font-medium text-[#111111]">
                        {tx.materialName}
                      </span>
                    </td>

                    {/* Volume (Fixed 90px, Zero Wrap) */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-[#111111] whitespace-nowrap w-[90px] align-middle">
                      {tx.quantity} {tx.unit}
                    </td>

                    {/* Nilai Jual (Fixed 130px, Zero Wrap) */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-[#111111] whitespace-nowrap w-[130px] align-middle">
                      {formatRupiah(tx.totalRevenue)}
                    </td>

                    {/* Laba Bersih (Fixed 130px, Zero Wrap) */}
                    {!hideMargin && (
                      <td
                        className={`py-3 px-3 text-right font-mono font-semibold whitespace-nowrap w-[130px] align-middle ${
                          tx.netProfit >= 0 ? 'text-[#0e9f6e]' : 'text-[#cf1124]'
                        }`}
                      >
                        {formatRupiah(tx.netProfit)}
                      </td>
                    )}

                    {/* Catatan Ritase (Fixed 185px, Zero Wrap, RunningText Marquee) */}
                    <td className="py-3 px-3 whitespace-nowrap w-[185px] align-middle">
                      <RunningText
                        text={tx.notes}
                        className="text-[11px] text-[#666666]"
                        placeholder="-"
                      />
                    </td>

                    {/* Status (Fixed 80px, Zero Wrap, Tipografi Bersih) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap w-[80px] align-middle">
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
                ))
              )}
            </tbody>
          </table>
        </div>
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
