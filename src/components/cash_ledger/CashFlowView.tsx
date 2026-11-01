import React, { useState, useMemo, useEffect } from 'react';
import { CashLedgerEntry } from '@/types/database';
import { resolveCreatorName } from '@/lib/entityResolver';
import { PayDebtModal } from './PayDebtModal';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { RecordMutationModal } from './RecordMutationModal';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatRupiah } from '@/lib/currencyUtils';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';
import { ReceiptLightboxModal } from '@/components/ui/ReceiptLightboxModal';
import { EditCashLedgerModal } from './EditCashLedgerModal';
import { DeleteCashLedgerModal } from './DeleteCashLedgerModal';
import { ImageIcon, Pencil, Trash2, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { CashFilterDrawer, CashFilterState, DEFAULT_CASH_FILTERS, countActiveFilters } from './CashFilterDrawer';

interface CashFlowViewProps {
  entries: CashLedgerEntry[];
  userEmail: string;
  onRefresh: () => void;
}

const PEI_INITIAL_DEBT = 23000000;

export function CashFlowView({
  entries,
  userEmail,
  onRefresh
}: CashFlowViewProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPayDebtOpen, setIsPayDebtOpen] = useState(false);
  const [isRecordMutationOpen, setIsRecordMutationOpen] = useState(false);
  const [activeReceiptLightbox, setActiveReceiptLightbox] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<CashLedgerEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<CashLedgerEntry | null>(null);
  const { isWatcherUser, projects } = useProjectFilter();

  const [filters, setFilters] = useState<CashFilterState>(DEFAULT_CASH_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  const availableCreators = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      if (e.createdByName?.trim()) {
        set.add(e.createdByName.trim());
      }
    });
    return Array.from(set).sort();
  }, [entries]);

  // Kalkulasi Hutang Bpk. Pei
  const peiDebtPayments = useMemo(() => {
    return entries
      .filter(
        e =>
          !e.isCredit &&
          (e.type === 'CICILAN_HUTANG' ||
            e.description.toLowerCase().includes('pei') ||
            e.referenceId === 'HUTANG-PT-PEI')
      )
      .reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [entries]);

  const remainingPeiDebt = Math.max(0, PEI_INITIAL_DEBT - peiDebtPayments);
  const isPeiDebtSettled = remainingPeiDebt === 0;

  // Kalkulasi Ringkasan Kas
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    entries.forEach(e => {
      if (e.isCredit) {
        totalIn += e.amount || 0;
      } else {
        totalOut += e.amount || 0;
      }
    });
    const latestBalance = entries[0]?.runningBalance ?? 0;
    return { totalIn, totalOut, currentBalance: latestBalance };
  }, [entries]);

  // Filter Search & Sorting
  // Pagination State (Rule 126: 20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, entries]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // 1. Text Search (Search bar)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        e =>
          e.description.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          (e.referenceId && e.referenceId.toLowerCase().includes(q)) ||
          (e.createdByName && e.createdByName.toLowerCase().includes(q)) ||
          matchesDateQuery(e.date, q)
      );
    }

    // 2. Filter Arus Kas (Masuk / Keluar)
    if (filters.flowDirection === 'IN') {
      result = result.filter(e => e.isCredit);
    } else if (filters.flowDirection === 'OUT') {
      result = result.filter(e => !e.isCredit);
    }

    // 3. Filter Kategori
    if (filters.category !== 'ALL') {
      if (filters.category === 'DEBT') {
        result = result.filter(e => e.type === 'CICILAN_HUTANG' || e.type === 'TRANSFER_INVESTOR');
      } else if (filters.category === 'CAPITAL') {
        result = result.filter(e => e.type === 'MODAL_AWAL' || e.type === 'HUTANG_PIHAK_KETIGA');
      } else {
        result = result.filter(e => e.type === filters.category);
      }
    }

    // 4. Filter Proyek
    if (filters.projectId !== 'ALL') {
      const p = projects.find(item => item.id === filters.projectId);
      if (p) {
        const pNameLower = p.name.toLowerCase();
        result = result.filter(e => {
          const descLower = e.description.toLowerCase();
          return (
            descLower.includes(pNameLower) ||
            (p.name.includes('Cikedal') && (descLower.includes('cikedal') || descLower.includes('endang') || descLower.includes('sapta')))
          );
        });
      }
    }

    // 5. Filter Rentang Tanggal
    if (filters.startDate) {
      result = result.filter(e => e.date.slice(0, 10) >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(e => e.date.slice(0, 10) <= filters.endDate);
    }

    // 6. Filter Rentang Nominal
    if (filters.minAmount !== undefined && filters.minAmount > 0) {
      result = result.filter(e => (e.amount || 0) >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined && filters.maxAmount > 0) {
      result = result.filter(e => (e.amount || 0) <= filters.maxAmount!);
    }

    // 7. Filter Status Bukti Struk
    if (filters.receiptStatus === 'WITH_RECEIPT') {
      result = result.filter(e => !!e.receiptUrl);
    } else if (filters.receiptStatus === 'NO_RECEIPT') {
      result = result.filter(e => !e.receiptUrl);
    }

    // 8. Filter PIC Pembuat
    if (filters.createdByName !== 'ALL') {
      result = result.filter(e => (e.createdByName || 'System') === filters.createdByName);
    }

    // 9. Multi-Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'DATE_ASC':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'DATE_DESC':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'AMOUNT_DESC':
          return (b.amount || 0) - (a.amount || 0);
        case 'AMOUNT_ASC':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [entries, searchQuery, filters, projects]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredEntries.slice(start, start + 20);
  }, [filteredEntries, currentPage]);

  return (
    <div className="space-y-4">
      {/* 1. Metric Cards Ringkasan Arus Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Saldo Kas Riil Berjalan
          </span>
          <span
            className={`text-xl font-bold tracking-tight block mt-1 ${
              summary.currentBalance < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
            }`}
          >
            {formatRupiah(summary.currentBalance)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Akumulasi bersih saldo buku kas fisik / bank
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Kas Masuk
          </span>
          <span className="text-xl font-bold tracking-tight text-emerald-700 block mt-1">
            {formatRupiah(summary.totalIn)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Modal disetor, pelunasan termin & top-up
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Kas Keluar
          </span>
          <span className="text-xl font-bold tracking-tight text-[#cf1124] block mt-1">
            {formatRupiah(summary.totalOut)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Belanja material, HOK supir/solar & operasional
          </span>
        </div>
      </div>

      {/* 2. Kartu Liabilitas Khusus: Hutang Perseroan Bpk. Pei (Rule 104 & Rule 116) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] p-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#111111]">
            Hutang Bpk. Pei
          </h3>

          {!isWatcherUser && (
          <button
            type="button"
            onClick={() => setIsPayDebtOpen(true)}
            disabled={isPeiDebtSettled}
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Bayar Cicilan
          </button>
        )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3">
          <div>
            <span className="text-[11px] text-[#888888] block">Hutang Pokok</span>
            <span className="text-xs sm:text-base font-bold tracking-tight text-[#111111] block mt-0.5">
              {formatRupiah(PEI_INITIAL_DEBT)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#888888] block">Terbayar</span>
            <span className="text-xs sm:text-base font-bold tracking-tight text-emerald-700 block mt-0.5">
              {formatRupiah(peiDebtPayments)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#888888] block">Sisa Hutang</span>
            <span
              className={`text-xs sm:text-base font-bold tracking-tight block mt-0.5 ${
                remainingPeiDebt > 0 ? 'text-[#cf1124]' : 'text-emerald-700'
              }`}
            >
              {formatRupiah(remainingPeiDebt)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tabel Mutasi Buku Kas Riil */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas: Search di Kiri, Aksi di Kanan (Mobile: Search 1 Row atas, Filter & Plus di bawah) */}
        <div className="p-3 sm:p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-[#fafafa]">
          {/* Search Input di Kiri (Mobile: Row 1 full-width) */}
          <div className="relative w-full sm:w-72 md:w-80">
            <img
              src="/icons/search.png"
              alt="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, deskripsi, ref, tanggal..."
              className="w-full bg-[#f4f4f4] border-none rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#888888] outline-none focus:bg-[#ebebeb] transition-colors"
            />
          </div>

          {/* Action Buttons: Filter & Mutasi Kas (Mobile: Row 2) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Filter & Sorting Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-[6px] border-none transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeFiltersCount > 0
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#eeeeee] text-[#222222] hover:bg-[#e2e2e2]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter & Urutkan</span>
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[10px] font-bold border-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Tombol Mutasi Kas (Desktop: Text + Icon, Mobile: Icon Only) */}
            {!isWatcherUser && (
              <button
                type="button"
                onClick={() => setIsRecordMutationOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] border-none transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                title="Catat Mutasi Kas Manual"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">Mutasi Kas</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips (Solid Filled, Zero Outlines per auditaislop) */}
        {activeFiltersCount > 0 && (
          <div className="px-3.5 py-2 border-b border-[#eaeaea] bg-white flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[#666666] mr-1 whitespace-nowrap">
              Filter Aktif:
            </span>

            {/* Sorting Chip */}
            {filters.sortBy !== 'DATE_DESC' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                {filters.sortBy === 'DATE_ASC' && 'Urut: Terlama'}
                {filters.sortBy === 'AMOUNT_DESC' && 'Urut: Nominal Terbesar'}
                {filters.sortBy === 'AMOUNT_ASC' && 'Urut: Nominal Terkecil'}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'DATE_DESC' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Flow Direction Chip */}
            {filters.flowDirection !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                {filters.flowDirection === 'IN' ? 'Kas Masuk (+)' : 'Kas Keluar (-)'}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, flowDirection: 'ALL' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Category Chip */}
            {filters.category !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                Kat: {filters.category.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, category: 'ALL' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Project Chip */}
            {filters.projectId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                Proyek: {projects.find(p => p.id === filters.projectId)?.name || filters.projectId}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, projectId: 'ALL' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Date Range Chip */}
            {(filters.startDate || filters.endDate || filters.datePreset !== 'ALL') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                Tanggal: {filters.startDate || 'Awal'} s/d {filters.endDate || 'Akhir'}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, datePreset: 'ALL', startDate: '', endDate: '' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Amount Range Chip */}
            {(filters.minAmount || filters.maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                Nominal: {filters.minAmount ? formatRupiah(filters.minAmount) : 'Rp 0'} - {filters.maxAmount ? formatRupiah(filters.maxAmount) : '∞'}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minAmount: undefined, maxAmount: undefined }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Receipt Status Chip */}
            {filters.receiptStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                {filters.receiptStatus === 'WITH_RECEIPT' ? 'Ada Bukti Struk' : 'Tanpa Bukti Struk'}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, receiptStatus: 'ALL' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Creator Chip */}
            {filters.createdByName !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#ededed] text-[#111111] border-none text-[11px] font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                PIC: {filters.createdByName}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, createdByName: 'ALL' }))}
                  className="hover:text-[#cf1124] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {/* Reset All Button */}
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_CASH_FILTERS)}
              className="ml-auto text-[11px] font-bold text-[#cf1124] bg-[#fee2e2] hover:bg-[#fecaca] px-2.5 py-0.5 rounded-full border-none flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Semua
            </button>
          </div>
        )}

        {/* Tabel Data Mutasi */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[950px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[120px] whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3 w-[160px] whitespace-nowrap">Kategori Mutasi</th>
                <th className="py-2.5 px-3 w-[250px] whitespace-nowrap">Deskripsi / Referensi</th>
                <th className="py-2.5 px-3 w-[130px] text-right whitespace-nowrap">Kas Masuk (+)</th>
                <th className="py-2.5 px-3 w-[130px] text-right whitespace-nowrap">Kas Keluar (-)</th>
                <th className="py-2.5 px-3 w-[150px] text-right whitespace-nowrap">Saldo Berjalan</th>
                <th className="py-2.5 px-3 w-[105px] whitespace-nowrap">Dibuat Oleh</th>
                <th className="py-2.5 px-3 w-[110px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#888888]">
                    Tidak ada catatan mutasi kas yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map(e => (
                  <tr key={e.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-[#555555] whitespace-nowrap align-middle">
                      {formatDateID(e.date)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                      <span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#f0f0f0] text-[#111111] font-semibold text-[11px] border-none whitespace-nowrap">
                        {e.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#333333] align-middle">
                      <span className="block font-medium truncate">{e.description}</span>
                      {e.referenceId ? (
                        <span className="text-[10px] font-mono text-[#888888] block">
                          Ref: {e.referenceId}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 font-bold tracking-tight text-emerald-700 text-right whitespace-nowrap align-middle">
                      {e.isCredit ? formatRupiah(e.amount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold tracking-tight text-[#cf1124] text-right whitespace-nowrap align-middle">
                      {!e.isCredit ? formatRupiah(e.amount) : '-'}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap align-middle ${
                        e.runningBalance < 0 ? 'text-[#cf1124]' : 'text-[#111111]'
                      }`}
                    >
                      {formatRupiah(e.runningBalance)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] whitespace-nowrap align-middle">
                      {resolveCreatorName(e.createdByName)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {e.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setActiveReceiptLightbox(e.receiptUrl || null)}
                            className="p-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] rounded-[6px] border-none cursor-pointer transition-colors flex-shrink-0"
                            title="Lihat Bukti Kwitansi / Transfer"
                            aria-label="Lihat Bukti Kwitansi"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isWatcherUser ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditEntry(e)}
                              className="p-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] rounded-[6px] border-none cursor-pointer transition-colors flex-shrink-0"
                              title="Edit Mutasi"
                              aria-label="Edit Mutasi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteEntry(e)}
                              className="p-1.5 bg-[#fee2e2] hover:bg-[#fecaca] text-[#cf1124] rounded-[6px] border-none cursor-pointer transition-colors flex-shrink-0"
                              title="Hapus Mutasi"
                              aria-label="Hapus Mutasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : !e.receiptUrl ? (
                          <span className="text-[11px] text-[#999999]">-</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Pagination 20 Baris Universal (Rule 126) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredEntries.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemLabel="mutasi kas"
        />
      </div>

      {/* Modal Bayar Hutang Pak Pei */}
      <PayDebtModal
        isOpen={isPayDebtOpen}
        onClose={() => setIsPayDebtOpen(false)}
        remainingDebt={remainingPeiDebt}
        currentCashBalance={summary.currentBalance}
        userEmail={userEmail}
        onSuccess={onRefresh}
      />

      {/* Modal Catat Mutasi Kas Manual */}
      <RecordMutationModal
        isOpen={isRecordMutationOpen}
        onClose={() => setIsRecordMutationOpen(false)}
        userEmail={userEmail}
        onSuccess={onRefresh}
      />

      {/* Modal Lightbox Foto Bukti Kwitansi */}
      <ReceiptLightboxModal
        isOpen={Boolean(activeReceiptLightbox)}
        onClose={() => setActiveReceiptLightbox(null)}
        imageUrl={activeReceiptLightbox}
      />

      {/* Modal Edit Mutasi Kas */}
      <EditCashLedgerModal
        isOpen={Boolean(editEntry)}
        onClose={() => setEditEntry(null)}
        entry={editEntry}
        userEmail={userEmail}
        onSuccess={() => {
          setEditEntry(null);
          onRefresh();
        }}
      />

      {/* Modal Hapus Mutasi Kas */}
      <DeleteCashLedgerModal
        isOpen={Boolean(deleteEntry)}
        onClose={() => setDeleteEntry(null)}
        entry={deleteEntry}
        onSuccess={() => {
          setDeleteEntry(null);
          onRefresh();
        }}
      />

      {/* Drawer Filter & Sorting Kas */}
      <CashFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApply={setFilters}
        onReset={() => setFilters(DEFAULT_CASH_FILTERS)}
        projects={projects}
        availableCreators={availableCreators}
      />
    </div>
  );
}
