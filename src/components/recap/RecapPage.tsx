import React, { useState, useEffect, useMemo } from 'react';
import { DispatchTransaction } from '@/types/database';
import { subscribeAllTransactions } from '@/lib/dispatcherService';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { RunningText } from '@/components/ui/RunningText';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { NavigationTab } from '@/components/layout/Sidebar';
import { CustomSelectCombobox, SelectOption } from '@/components/ui/CustomSelectCombobox';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatRupiah } from '@/lib/currencyUtils';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';

interface RecapPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: NavigationTab, subTabId: string) => void;
}

type CycleOption = '14_days' | '60_days' | 'today' | '7_days' | 'this_month' | 'all';

interface CyclePreset {
  id: CycleOption;
  label: string;
  badge?: string;
}

const CYCLE_PRESETS: CyclePreset[] = [
  { id: '14_days', label: '14 Hari (2 Minggu)' },
  { id: '60_days', label: '60 Hari (2 Bulan)' },
  { id: 'today', label: 'Hari Ini' },
  { id: '7_days', label: '7 Hari Terakhir' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'all', label: 'Semua Periode' }
];

function getLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeForCycle(cycle: CycleOption): { start: string; end: string } {
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  switch (cycle) {
    case '14_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case '60_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'today':
      return { start: todayStr, end: todayStr };
    case '7_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'this_month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'all':
    default:
      return { start: '', end: '' };
  }
}

export function RecapPage({
  userEmail: _userEmail,
  activeSubTab: propSubTab,
  onNavigateSubTab
}: RecapPageProps): React.JSX.Element {
  const { projects, isDispatcherUser, isManagementUser } = useProjectFilter();

  // Sub-tab selection: Dispatcher is strictly locked to 'volume' (Operational Journal)
  const [internalSubTab, setInternalSubTab] = useState<'volume' | 'financial'>(
    isDispatcherUser ? 'volume' : propSubTab === 'financial' ? 'financial' : 'volume'
  );

  useEffect(() => {
    if (isDispatcherUser) {
      setInternalSubTab('volume');
    } else if (propSubTab === 'financial' || propSubTab === 'volume') {
      setInternalSubTab(propSubTab);
    }
  }, [propSubTab, isDispatcherUser]);

  const activeSubTab = isDispatcherUser ? 'volume' : internalSubTab;

  const handleSubTabChange = (tab: 'volume' | 'financial') => {
    if (isDispatcherUser && tab === 'financial') return;
    setInternalSubTab(tab);
    if (onNavigateSubTab) {
      onNavigateSubTab('recap', tab);
    }
  };

  // State Transaksi & Loading
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedCycle, setSelectedCycle] = useState<CycleOption>('14_days'); // Default 14-day cycle (Papah's mandate)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedQuarry, setSelectedQuarry] = useState<string>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State (Rule 126: 20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-reset halaman ke 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCycle, selectedProjectId, selectedQuarry, selectedMaterial, selectedStatus, searchQuery, activeSubTab]);

  // Selected Detail Modal
  const [selectedDetailTx, setSelectedDetailTx] = useState<DispatchTransaction | null>(null);

  // Subscribe seluruh transaksi logistik
  useEffect(() => {
    const unsubscribe = subscribeAllTransactions(list => {
      setTransactions(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter list options
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'ACTIVE'), [projects]);

  const uniqueQuarries = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.quarryName && t.quarryName.trim()) set.add(t.quarryName.trim());
    });
    return Array.from(set).sort();
  }, [transactions]);

  const uniqueMaterials = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.materialName && t.materialName.trim()) set.add(t.materialName.trim());
    });
    return Array.from(set).sort();
  }, [transactions]);

  const projectOptions: SelectOption[] = useMemo(() => [
    { id: 'ALL', label: 'Semua Proyek Tujuan' },
    ...activeProjects.map(p => ({ id: p.id, label: p.name }))
  ], [activeProjects]);

  const quarryOptions: SelectOption[] = useMemo(() => [
    { id: 'ALL', label: 'Semua Kuari Tambang' },
    ...uniqueQuarries.map(q => ({ id: q, label: q }))
  ], [uniqueQuarries]);

  const materialOptions: SelectOption[] = useMemo(() => [
    { id: 'ALL', label: 'Semua Jenis Komoditas' },
    ...uniqueMaterials.map(m => ({ id: m, label: m }))
  ], [uniqueMaterials]);

  const statusOptions: SelectOption[] = useMemo(() => [
    { id: 'ALL', label: 'Semua Status (Tempo & Lunas)' },
    { id: 'TEMPO', label: 'TEMPO (Piutang)' },
    { id: 'LUNAS', label: 'LUNAS' }
  ], []);

  // Perhitungan filter transaksi
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRangeForCycle(selectedCycle);

    return transactions.filter(tx => {
      // 1. Filter Tanggal (deliveryDate)
      if (start && end) {
        const txDate = tx.deliveryDate || (tx.date ? tx.date.slice(0, 10) : '');
        if (txDate < start || txDate > end) return false;
      }

      // 2. Filter Proyek
      if (selectedProjectId !== 'ALL') {
        if (tx.projectId !== selectedProjectId) return false;
      }

      // 3. Filter Kuari Asal
      if (selectedQuarry !== 'ALL') {
        if ((tx.quarryName || '').trim() !== selectedQuarry) return false;
      }

      // 4. Filter Jenis Material
      if (selectedMaterial !== 'ALL') {
        if ((tx.materialName || '').trim() !== selectedMaterial) return false;
      }

      // 5. Filter Status Pembayaran
      if (selectedStatus !== 'ALL') {
        if (tx.status !== selectedStatus) return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketMatch = (tx.ticketNumber || '').toLowerCase().includes(q);
        const suratJalanMatch = (tx.suratJalan || '').toLowerCase().includes(q);
        const plateMatch = (tx.truckPlate || '').toLowerCase().includes(q);
        const driverMatch = (tx.driverName || '').toLowerCase().includes(q);
        const clientMatch = (tx.clientName || tx.customerName || '').toLowerCase().includes(q);
        const projectMatch = (tx.projectName || '').toLowerCase().includes(q);
        const quarryMatch = (tx.quarryName || '').toLowerCase().includes(q);
        const materialMatch = (tx.materialName || '').toLowerCase().includes(q);
        const dateMatch = matchesDateQuery(tx.deliveryDate || tx.date, q);

        if (
          !ticketMatch &&
          !suratJalanMatch &&
          !plateMatch &&
          !driverMatch &&
          !clientMatch &&
          !projectMatch &&
          !quarryMatch &&
          !materialMatch &&
          !dateMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    selectedCycle,
    selectedProjectId,
    selectedQuarry,
    selectedMaterial,
    selectedStatus,
    searchQuery
  ]);

  // Agregasi Metrik Operasional
  const totalTrips = filteredTransactions.length;

  const totalDt = useMemo(() => {
    return filteredTransactions
      .filter(t => t.unit === 'DT')
      .reduce((acc, t) => acc + (t.quantity || 0), 0);
  }, [filteredTransactions]);

  const totalTon = useMemo(() => {
    return filteredTransactions
      .filter(t => t.unit === 'Ton')
      .reduce((acc, t) => acc + (t.quantity || 0), 0);
  }, [filteredTransactions]);

  // Agregasi Metrik Finansial (Hanya untuk Management)
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
  }, [filteredTransactions]);

  const totalBuyCost = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.totalBuyCost || 0), 0);
  }, [filteredTransactions]);

  const totalOperationalCost = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.operationalCost || 0), 0);
  }, [filteredTransactions]);

  const totalNetProfit = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.netProfit || 0), 0);
  }, [filteredTransactions]);

  // Transaksi ritase terpotong per halaman (Rule 126: 20 per halaman)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredTransactions.slice(start, start + 20);
  }, [filteredTransactions, currentPage]);

  const activeRangeText = useMemo(() => {
    const { start, end } = getDateRangeForCycle(selectedCycle);
    if (!start || !end) return 'Semua Riwayat Transaksi Tercatat';
    if (start === end) {
      return new Date(start + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const startFormatted = new Date(start + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const endFormatted = new Date(end + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${startFormatted} — ${endFormatted}`;
  }, [selectedCycle]);

  return (
    <div className="space-y-4">
      {/* 1. Sub-Tab Switcher (Rule 88: Clean Title, No Subtitle) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => handleSubTabChange('volume')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'volume'
                ? 'bg-[#111111] text-white'
                : 'bg-transparent text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]'
            }`}
          >
            Jurnal & Rekap Operasional
          </button>

          {/* Sub-tab Rekapitulasi Finansial: KHUSUS MANAJEMEN, 100% TERSEMBUNYI UNTUK DISPATCHER */}
          {isManagementUser && (
            <button
              type="button"
              onClick={() => handleSubTabChange('financial')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'financial'
                  ? 'bg-[#111111] text-white'
                  : 'bg-transparent text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]'
              }`}
            >
              Rekapitulasi Finansial
            </button>
          )}
        </div>

        {/* Rentang Periode Aktif Info */}
        <div className="px-2 text-right">
          <span className="text-[11px] text-[#888888] font-medium block">
            Rentang Waktu: <span className="font-semibold text-[#111111]">{activeRangeText}</span>
          </span>
        </div>
      </div>

      {/* 2. Operational Cycle Presets Filter Bar (Papah's Mandate: 14-Day & 60-Day Cycles) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Siklus Evaluasi Operasional
          </span>
          <span className="text-[11px] text-[#666666]">
            Total {filteredTransactions.length} transaksi ritase ditemukan
          </span>
        </div>

        {/* Cycle Presets Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {CYCLE_PRESETS.map(preset => {
            const isSelected = selectedCycle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedCycle(preset.id)}
                className={`w-full py-2 px-2.5 text-xs rounded-[6px] font-semibold text-center transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#fafafa] text-[#555555] border-[#eaeaea] hover:bg-[#f0f0f0] hover:text-[#111111]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Additional Multi-Dimension Filters */}
        <div className="pt-2 border-t border-[#f0f0f0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Filter Proyek Tujuan */}
          <div>
            <label className="block text-[11px] font-medium text-[#777777] mb-1">
              Proyek Tujuan
            </label>
            <CustomSelectCombobox
              options={projectOptions}
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              placeholder="Pilih Proyek..."
              variant="white"
              searchable={false}
              triggerClassName="py-1.5 rounded-[6px]"
            />
          </div>

          {/* Filter Kuari Asal */}
          <div>
            <label className="block text-[11px] font-medium text-[#777777] mb-1">
              Kuari Asal
            </label>
            <CustomSelectCombobox
              options={quarryOptions}
              value={selectedQuarry}
              onChange={setSelectedQuarry}
              placeholder="Pilih Kuari..."
              variant="white"
              searchable={false}
              triggerClassName="py-1.5 rounded-[6px]"
            />
          </div>

          {/* Filter Jenis Material */}
          <div>
            <label className="block text-[11px] font-medium text-[#777777] mb-1">
              Jenis Material
            </label>
            <CustomSelectCombobox
              options={materialOptions}
              value={selectedMaterial}
              onChange={setSelectedMaterial}
              placeholder="Pilih Material..."
              variant="white"
              searchable={false}
              triggerClassName="py-1.5 rounded-[6px]"
            />
          </div>

          {/* Filter Status Pembayaran */}
          <div>
            <label className="block text-[11px] font-medium text-[#777777] mb-1">
              Status Pembayaran
            </label>
            <CustomSelectCombobox
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Pilih Status..."
              variant="white"
              searchable={false}
              triggerClassName="py-1.5 rounded-[6px]"
            />
          </div>
        </div>

        {/* Searchbar (Rule 98: Universal Searchbar Icon) */}
        <div className="relative w-full pt-1">
          <img
            src="/icons/search.png"
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none mt-0.5"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari no. tiket, surat jalan, plat, supir, tanggal (misal 28-10-26)..."
            className="w-full pl-9 pr-3 py-2 bg-[#fafafa] border border-[#eaeaea] rounded-[6px] text-xs text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>
      </div>

      {/* 3. Metric Cards (Rule 99: Sans-serif Bold Tracking-Tight, Zero font-mono) */}
      {activeSubTab === 'volume' ? (
        /* Operational Metrics: Total Ritase, Total Volume DT, Total Volume Ton (Strictly Separated) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Total Ritase Pengiriman
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] block mt-1">
              {totalTrips.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-semibold text-[#888888]">Rit</span>
            </span>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Total Volume DT (Dump Truck 6 m³)
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] block mt-1">
              {totalDt.toLocaleString('id-ID', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-semibold text-[#888888]">DT</span>
            </span>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Total Volume Ton (Timbangan Kuari)
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] block mt-1">
              {totalTon.toLocaleString('id-ID', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-semibold text-[#888888]">Ton</span>
            </span>
          </div>
        </div>
      ) : (
        /* Financial Metrics: Omset, Belanja Kuari, Operasional, Laba Bersih (Hanya Manajemen) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Omset Penjualan (Tempo)
            </span>
            <div className="mt-1">
              <MetricCardCurrency amount={totalRevenue} />
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Belanja Pokok Kuari (Cash)
            </span>
            <div className="mt-1">
              <MetricCardCurrency amount={totalBuyCost} />
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Beban Operasional & HOK (Uang Jalan / Supir / Solar)
            </span>
            <div className="mt-1">
              <MetricCardCurrency amount={totalOperationalCost} />
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
            <span className="text-[11px] text-[#888888] font-medium block">
              Laba Bersih Perseroan
            </span>
            <div className="mt-1">
              <MetricCardCurrency amount={totalNetProfit} />
            </div>
          </div>
        </div>
      )}

      {/* 4. Logistics / Financial Table Container (Rule 66: Fixed width, zero-wrap, overflow-x-auto, sticky thead) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        <div className="p-3.5 border-b border-[#eaeaea] flex items-center justify-between bg-[#fafafa]">
          <div className="text-xs font-semibold text-[#111111]">
            {activeSubTab === 'volume'
              ? 'Jurnal Logistik Transaksi Lapangan'
              : 'Rekapitulasi Finansial & Margin Perseroan'}
          </div>
          <div className="text-[11px] text-[#777777]">
            {filteredTransactions.length} dari {transactions.length} total tiket ritase
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#888888]">
              Memuat data rekapitulasi transaksi...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#888888]">
              Tidak ada data transaksi ritase yang sesuai dengan kriteria filter.
            </div>
          ) : activeSubTab === 'volume' ? (
            /* ============================================================== */
            /* TABEL LOGISTIK OPERASIONAL (Zero Margin Exposure)               */
            /* ============================================================== */
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[105px]">Tanggal Jalan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[145px]">No. Tiket</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px]">No. Surat Jalan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[105px]">Plat Truk</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">Supir</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">Proyek Tujuan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Kuari Asal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Material</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[95px] text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {paginatedTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedDetailTx(tx)}
                    className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                  >
                    {/* 1. Tanggal Jalan */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-[#555555]">
                      {formatDateID(tx.deliveryDate || tx.date)}
                    </td>

                    {/* 2. No. Tiket */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-[#111111]">
                      {tx.ticketNumber}
                    </td>

                    {/* 3. No. Surat Jalan */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[#555555]">
                      {tx.suratJalan ? tx.suratJalan : <span className="text-[#aaaaaa] font-sans">—</span>}
                    </td>

                    {/* 4. Plat Truk */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-[#111111]">
                      {tx.truckPlate}
                    </td>

                    {/* 5. Supir */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#333333]">
                      <RunningText text={tx.driverName || '—'} className="max-w-[120px]" />
                    </td>

                    {/* 6. Proyek Tujuan & Konsumen */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-[#111111]">
                      <span className="font-semibold block truncate">
                        {tx.projectName || 'Proyek Umum'}
                      </span>
                      {(tx.clientName || tx.customerName) && (
                        <span className="text-[11px] text-[#666666] block truncate font-normal mt-0.5">
                          {tx.clientName || tx.customerName}
                        </span>
                      )}
                    </td>

                    {/* 7. Kuari Asal */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#444444]">
                      <RunningText text={tx.quarryName || '—'} className="max-w-[140px]" />
                    </td>

                    {/* 8. Material */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#111111]">
                      <RunningText text={tx.materialName} className="max-w-[140px]" />
                    </td>

                    {/* 9. Volume */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-bold tracking-tight text-[#111111]">
                      {tx.quantity?.toLocaleString('id-ID')}{' '}
                      <span className="text-[11px] font-normal text-[#777777]">{tx.unit === 'M3' ? 'm³' : tx.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ============================================================== */
            /* TABEL FINANSIAL & MARGIN PERSEROAN (Khusus Manajemen)          */
            /* ============================================================== */
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[105px]">Tanggal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[145px]">No. Tiket</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px]">No. Surat Jalan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">Proyek Tujuan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Komoditas & Vol</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px] text-right">Harga Beli</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[115px] text-right">HOK & Operasional</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px] text-right">Harga Jual</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px] text-right">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {paginatedTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedDetailTx(tx)}
                    className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                  >
                    {/* Tanggal */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-[#555555]">
                      {formatDateID(tx.deliveryDate || tx.date)}
                    </td>

                    {/* No. Tiket */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-[#111111]">
                      {tx.ticketNumber}
                    </td>

                    {/* No. Surat Jalan */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[#555555]">
                      {tx.suratJalan ? tx.suratJalan : <span className="text-[#aaaaaa] font-sans">—</span>}
                    </td>

                    {/* Proyek Tujuan & Konsumen */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#111111]">
                      <span className="font-semibold block truncate">
                        {tx.projectName || 'Proyek Umum'}
                      </span>
                      {(tx.clientName || tx.customerName) && (
                        <span className="text-[11px] text-[#666666] block truncate font-normal mt-0.5">
                          {tx.clientName || tx.customerName}
                        </span>
                      )}
                    </td>

                    {/* Komoditas & Volume */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#111111]">
                      <span className="font-medium">{tx.materialName}</span>{' '}
                      <span className="text-[11px] text-[#777777]">
                        ({tx.quantity?.toLocaleString('id-ID')} {tx.unit === 'M3' ? 'm³' : tx.unit})
                      </span>
                    </td>

                    {/* Harga Beli */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <PricePerVolCell
                        unitPrice={tx.buyPricePerUnit}
                        totalPrice={tx.totalBuyCost}
                        unit={tx.unit}
                        quantity={tx.quantity}
                        align="right"
                      />
                    </td>

                    {/* Operasional */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-bold tracking-tight text-[#555555]">
                      {formatRupiah(tx.operationalCost)}
                    </td>

                    {/* Harga Jual */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <PricePerVolCell
                        unitPrice={tx.sellPricePerUnit}
                        totalPrice={tx.totalRevenue}
                        unit={tx.unit}
                        quantity={tx.quantity}
                        align="right"
                      />
                    </td>

                    {/* Laba Bersih Perseroan */}
                    <td
                      className={`py-2.5 px-3 whitespace-nowrap text-right font-bold tracking-tight ${
                        (tx.netProfit || 0) < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(tx.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Kontrol Pagination 20 Baris Universal (Rule 126) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemLabel="ritase"
        />
      </div>

      {/* 5. Detail Modal Popup (Accessible via row click) */}
      {selectedDetailTx && (
        <DispatchDetailModal
          transaction={selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
        />
      )}
    </div>
  );
}
