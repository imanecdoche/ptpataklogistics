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
import { DashboardFilterDrawer, DashboardFilterState } from '@/components/dashboard/DashboardFilterDrawer';
import { DashboardInlineChart } from '@/components/dashboard/DashboardInlineChart';
import { TablePagination } from '@/components/ui/TablePagination';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { formatDateID } from '@/lib/dateSearchUtils';
import { formatVolumeDisplay } from '@/lib/volumeUtils';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { subscribeCommodities } from '@/lib/materialMasterService';

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


  // Format Rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Format Volume Satuan DT (Integer Murni) & Ton (Maksimal 1 Desimal)
  const formatVolumeDt = (val: number): string => {
    return Math.round(val).toLocaleString('id-ID');
  };

  const formatVolumeTon = (val: number): string => {
    if (Number.isInteger(val)) {
      return val.toLocaleString('id-ID');
    }
    return Number(val.toFixed(1)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
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

  const defaultFilters: DashboardFilterState = {
    datePreset: 'ALL',
    startDate: '',
    endDate: '',
    projectId: 'ALL',
    quarryName: 'ALL',
    materialName: 'ALL',
    status: 'ALL'
  };

  const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [quarries, setQuarries] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const unsubQuarries = subscribeMasterQuarries(list => {
      setQuarries(list.map(q => ({ id: q.id, name: q.name })));
    });
    const unsubMaterials = subscribeCommodities(list => {
      setMaterials(list.map(m => ({ id: m.id, name: m.name })));
    });

    return () => {
      unsubQuarries();
      unsubMaterials();
    };
  }, []);

  const isFilterActive = useMemo(() => {
    return (
      filters.datePreset !== 'ALL' ||
      filters.projectId !== 'ALL' ||
      filters.quarryName !== 'ALL' ||
      filters.materialName !== 'ALL' ||
      filters.status !== 'ALL'
    );
  }, [filters]);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filter transaksi berdasarkan filter drawer & global project filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Proyek
      const targetProjId = filters.projectId !== 'ALL' ? filters.projectId : selectedProjectId;
      if (targetProjId && targetProjId !== 'ALL' && t.projectId !== targetProjId) {
        return false;
      }

      // 2. Rentang tanggal
      const txDate = t.deliveryDate || (t.date ? t.date.slice(0, 10) : t.createdAt?.slice(0, 10));
      if (filters.datePreset !== 'ALL') {
        if (filters.startDate && txDate && txDate < filters.startDate) return false;
        if (filters.endDate && txDate && txDate > filters.endDate) return false;
      }

      // 3. Kuari asal
      if (filters.quarryName !== 'ALL' && t.quarryName !== filters.quarryName) {
        return false;
      }

      // 4. Jenis material
      if (filters.materialName !== 'ALL' && t.materialName !== filters.materialName) {
        return false;
      }

      // 5. Status pembayaran
      if (filters.status !== 'ALL' && t.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [transactions, selectedProjectId, filters]);

  // Transaksi yang ditampilkan per halaman (20 baris per page)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredTransactions.slice(start, start + 20);
  }, [filteredTransactions, currentPage]);

  // Metrik Utama Berdasarkan Filter Aktif
  const todayMetrics = useMemo(() => {
    const activeTx = filteredTransactions;

    const totalTrips = activeTx.length;
    const totalVolumeDt = activeTx
      .filter(t => t.unit === 'DT' || !t.unit)
      .reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
    const totalVolumeTon = activeTx
      .filter(t => t.unit === 'Ton')
      .reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
    const totalRevenue = activeTx.reduce((acc, t) => acc + (Number(t.totalRevenue) || 0), 0);
    const totalProfit = activeTx.reduce((acc, t) => acc + (Number(t.netProfit) || 0), 0);
    const totalBuyCost = activeTx.reduce((acc, t) => acc + (Number(t.totalBuyCost) || 0), 0);
    const totalOperationalCost = activeTx.reduce((acc, t) => acc + (Number(t.operationalCost) || 0), 0);
    const totalCashOut = totalBuyCost + totalOperationalCost;

    const activePlates = new Set(activeTx.map(t => t.truckPlate?.trim().toUpperCase()).filter(Boolean));

    // Total Piutang Tempo Keseluruhan (transaksi dengan status 'TEMPO')
    const pendingReceivables = transactions
      .filter(t => t.status === 'TEMPO')
      .reduce((acc, t) => acc + (Number(t.totalRevenue) || 0), 0);

    // Saldo kas: jika memfilter proyek spesifik, gunakan saldo kas proyek tersebut
    const latestCash = selectedProject
      ? selectedProject.currentBalance
      : ((cashEntries.length > 0 && cashEntries[0]) ? cashEntries[0].runningBalance : 0);

    return {
      totalTrips,
      totalVolumeDt,
      totalVolumeTon,
      totalRevenue,
      totalProfit,
      totalBuyCost,
      totalOperationalCost,
      totalCashOut,
      activePlatesCount: activePlates.size,
      pendingReceivables,
      latestCash
    };
  }, [filteredTransactions, transactions, cashEntries, selectedProject]);

  return (
    <div className="space-y-6 w-full">
      {/* BILAH KONTROL ATAS DASHBOARD: FILTER OPERASIONAL */}
      <div className="select-none">
        {/* Tombol: Filter Operasional (Membuka Bottom Sheet Drawer) */}
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-[10px] border transition-all cursor-pointer min-h-[52px] ${
            isFilterActive
              ? 'bg-[#111111] text-white border-[#111111] shadow-md'
              : 'bg-white text-[#111111] border-[#eaeaea] hover:bg-[#f9f9f9] shadow-xs active:scale-[0.99]'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-[8px] flex-shrink-0 flex items-center justify-center ${isFilterActive ? 'bg-white/15' : 'bg-[#f0f0f0]'}`}>
              <img
                src="/icons/filter-slider.png"
                alt="Filter"
                className={`w-4 h-4 object-contain ${isFilterActive ? 'brightness-0 invert' : ''}`}
              />
            </div>
            <div className="text-left truncate">
              <span className="text-xs sm:text-sm font-bold block leading-tight truncate">Filter Operasional</span>
              <span className={`text-[10px] block mt-0.5 truncate ${isFilterActive ? 'text-zinc-300' : 'text-[#777777]'}`}>
                {filters.datePreset === 'TODAY' ? 'Hari Ini' : filters.datePreset === '7D' ? '7 Hari Terakhir' : filters.datePreset === '30D' ? '30 Hari' : filters.datePreset === 'THIS_MONTH' ? 'Bulan Ini' : filters.datePreset === 'ALL' ? 'Semua Waktu' : 'Kustom'}
                {filters.projectId !== 'ALL' ? ' - Proyek' : ''}
              </span>
            </div>
          </div>
          {isFilterActive ? (
            <span className="text-[10px] font-bold bg-white text-[#111111] px-2 py-0.5 rounded-full flex-shrink-0">
              Aktif
            </span>
          ) : (
            <svg className="w-4 h-4 text-[#888888] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* 1. SECTION: KPI CARDS RINGKASAN UTAMA */}
      {activeSubTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Card 1: Ritase */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                {filters.datePreset === 'TODAY' ? 'Ritase Hari Ini' : filters.datePreset === 'ALL' ? 'Total Ritase' : 'Ritase Periode Terpilih'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#111111]">
                  {todayMetrics.totalTrips}
                </span>
                <span className="text-xs text-[#777777]">trip</span>
              </div>
              <span className="text-[11px] text-[#888888] mt-1">
                Volume: <strong className="font-bold text-[#111111]">{formatVolumeDt(todayMetrics.totalVolumeDt)}</strong> DT | <strong className="font-bold text-[#111111]">{formatVolumeTon(todayMetrics.totalVolumeTon)}</strong> Ton
              </span>
            </div>

            {/* Card 2: Estimasi Laba Bersih / Omzet */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">
                {filters.datePreset === 'TODAY'
                  ? (hideMargin ? 'Omzet Penjualan Hari Ini' : 'Estimasi Laba Bersih Hari Ini')
                  : filters.datePreset === 'ALL'
                  ? (hideMargin ? 'Total Omzet Penjualan' : 'Estimasi Laba Bersih')
                  : (hideMargin ? 'Omzet Periode Terpilih' : 'Estimasi Laba Periode Terpilih')}
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
                {hideMargin ? (
                  <>
                    Volume: <strong className="font-bold text-[#111111]">{formatVolumeDt(todayMetrics.totalVolumeDt)}</strong> DT | <strong className="font-bold text-[#111111]">{formatVolumeTon(todayMetrics.totalVolumeTon)}</strong> Ton
                  </>
                ) : (
                  `Omzet: ${formatRupiah(todayMetrics.totalRevenue)}`
                )}
              </span>
            </div>

            {/* Card 3: Saldo Kas Riil Berjalan */}
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
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
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
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

          {/* 1.1 SECTION: GRAFIK GARIS TREN OPERASIONAL & KEUANGAN (SELALU MUNCUL DI BAWAH KARTU MATRIKS) */}
          <DashboardInlineChart
            transactions={filteredTransactions}
            cashEntries={cashEntries}
            hideMargin={hideMargin}
          />

          {/* Card / Ringkasan Kas Keluar (Rule 109: Pengawasan Kebocoran Modal & HOK) */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f0f0] pb-2.5">
              <div>
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider block">
                  {filters.datePreset === 'TODAY' ? 'Arus Kas Keluar Hari Ini (Modal Terpakai)' : filters.datePreset === 'ALL' ? 'Total Arus Kas Keluar (Modal Terpakai)' : 'Arus Kas Keluar Periode Terpilih (Modal Terpakai)'}
                </span>
                <span className="text-[11px] text-[#888888]">
                  {filters.datePreset === 'TODAY' ? 'Akumulasi kas modal yang dikeluarkan untuk tebus kuari dan operasional HOK supir hari ini' : 'Akumulasi kas modal yang dikeluarkan untuk tebus kuari dan operasional HOK supir'}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-[#777777] font-medium block">Total Kas Keluar</span>
                <div className="text-base sm:text-lg font-bold tracking-tight text-[#cf1124]">
                  {formatRupiah(todayMetrics.totalCashOut)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div className="p-2.5 bg-[#fafafa] rounded-[6px] border border-[#f0f0f0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-[#666666] block">Belanja Pokok Kuari (Cash)</span>
                  <span className="text-[10px] text-[#888888]">Tebus material tambang langsung</span>
                </div>
                <span className="text-sm font-bold tracking-tight text-[#111111]">
                  {formatRupiah(todayMetrics.totalBuyCost)}
                </span>
              </div>

              <div className="p-2.5 bg-[#fafafa] rounded-[6px] border border-[#f0f0f0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-[#666666] block">Beban Operasional & HOK (Cash)</span>
                  <span className="text-[10px] text-[#888888]">Uang jalan supir, solar & retribusi</span>
                </div>
                <span className="text-sm font-bold tracking-tight text-[#111111]">
                  {formatRupiah(todayMetrics.totalOperationalCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dispatcher', 'new_ticket')}
              className="bg-[#1c1c1e] rounded-[10px] p-4 border border-[#2c2c2e] hover:bg-[#26262a] hover:border-[#3a3a3e] text-left transition-all duration-200 cursor-pointer group shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/icons/truck.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:underline">
                    Catat Ritase Baru
                  </h3>
                  <p className="text-[11px] text-[#e0e0e0] mt-0.5">
                    Input armada keluar-masuk kuari dan penetapan harga tempo
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('dispatcher', 'history')}
              className="bg-[#1c1c1e] rounded-[10px] p-4 border border-[#2c2c2e] hover:bg-[#26262a] hover:border-[#3a3a3e] text-left transition-all duration-200 cursor-pointer group shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/icons/chart.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:underline">
                    Lihat Riwayat Ritase
                  </h3>
                  <p className="text-[11px] text-[#e0e0e0] mt-0.5">
                    Tabel rekap transaksi harian dan verifikasi status pembayaran
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('database', 'vehicles')}
              className="bg-[#1c1c1e] rounded-[10px] p-4 border border-[#2c2c2e] hover:bg-[#26262a] hover:border-[#3a3a3e] text-left transition-all duration-200 cursor-pointer group shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/icons/database.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:underline">
                    Master Database
                  </h3>
                  <p className="text-[11px] text-[#e0e0e0] mt-0.5">
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
          <table className="w-full min-w-[1120px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[11px] font-semibold text-[#555555] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap">No. Tiket</th>
                <th className="py-2.5 px-3 w-[115px] min-w-[115px] whitespace-nowrap">Tanggal Jalan</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Armada & Supir</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Proyek Tujuan</th>
                <th className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap">Material</th>
                <th className="py-2.5 px-3 w-[90px] min-w-[90px] text-center whitespace-nowrap">Volume</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Harga Jual</th>
                {!hideMargin && (
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Laba Bersih</th>
                )}
                <th className="py-2.5 px-3 w-[185px] min-w-[185px] whitespace-nowrap">Catatan Ritase</th>
                <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={hideMargin ? 9 : 10} className="py-10 text-center text-[#888888] whitespace-nowrap">
                    {isLoading ? 'Memuat log aktivitas...' : 'Belum ada transaksi ritase tercatat.'}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                    {/* No. Tiket (Fixed 125px, Zero Wrap) */}
                    <td className="py-2.5 px-3 font-mono font-medium text-[#111111] whitespace-nowrap w-[125px] align-middle">
                      {tx.ticketNumber}
                    </td>

                    {/* Tanggal Jalan (Fixed 115px, Zero Wrap) */}
                    <td className="py-2.5 px-3 font-mono font-medium text-[#666666] whitespace-nowrap w-[115px] align-middle">
                      {formatDateID(tx.deliveryDate || tx.date)}
                    </td>

                    {/* Armada & Supir (Fixed 130px, Zero Wrap) */}
                    <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                      <span className="font-mono font-bold text-[#111111] block">
                        {tx.truckPlate}
                      </span>
                      <span className="text-[11px] text-[#666666] block">
                        {tx.driverName || '-'}
                      </span>
                    </td>

                    {/* Proyek Tujuan & Konsumen (Fixed 160px, Zero Wrap) */}
                    <td className="py-2.5 px-3 whitespace-nowrap w-[160px] align-middle">
                      <span className="font-semibold text-[#111111] block truncate">
                        {tx.projectName || 'Proyek Umum'}
                      </span>
                      {(tx.clientName || tx.customerName) && (
                        <span className="text-[11px] text-[#666666] block truncate mt-0.5">
                          {tx.clientName || tx.customerName}
                        </span>
                      )}
                    </td>

                    {/* Material (Fixed 125px, Zero Wrap) */}
                    <td className="py-2.5 px-3 whitespace-nowrap w-[125px] align-middle">
                      <span className="font-medium text-[#111111]">
                        {tx.materialName}
                      </span>
                    </td>

                    {/* Volume (Fixed 90px, Zero Wrap) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap w-[90px] align-middle">
                      <span className="font-bold tracking-tight text-[#111111]">{formatVolumeDisplay(tx.quantity)}</span>{' '}
                      <span className="text-[#666666] text-[11px]">{tx.unit === 'M3' ? 'm³' : tx.unit}</span>
                    </td>

                    {/* Harga Jual (Fixed 130px, Zero Wrap) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap w-[130px] align-middle">
                      <PricePerVolCell
                        unitPrice={tx.sellPricePerUnit}
                        totalPrice={tx.totalRevenue}
                        unit={tx.unit}
                        quantity={tx.quantity}
                        align="right"
                      />
                    </td>

                    {/* Laba Bersih (Fixed 130px, Zero Wrap) */}
                    {!hideMargin && (
                      <td
                        className={`py-2.5 px-3 text-right font-bold tracking-tight whitespace-nowrap w-[130px] align-middle ${
                          tx.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formatRupiah(tx.netProfit)}
                      </td>
                    )}

                    {/* Catatan Ritase (Fixed 185px, Zero Wrap, RunningText Marquee) */}
                    <td className="py-2.5 px-3 whitespace-nowrap w-[185px] align-middle">
                      <RunningText
                        text={tx.notes}
                        className="text-[11px] text-[#666666]"
                        placeholder="-"
                      />
                    </td>

                    {/* Aksi (Fixed 60px, Zero Wrap, Popover Context Menu) */}
                    <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap w-[60px]">
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

        {/* Universal Pagination 20 Baris Per Page */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemLabel="ritase"
        />
      </div>

      {/* Modal Detail Rincian Ritase */}
      {selectedTx && (
        <DispatchDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {/* Bottom Sheet Drawer Filter Dashboard */}
      <DashboardFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApply={newFilters => setFilters(newFilters)}
        onReset={() => setFilters(defaultFilters)}
        projects={projects}
        quarries={quarries}
        materials={materials}
      />
    </div>
  );
}
