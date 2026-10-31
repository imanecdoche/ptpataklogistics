import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/types/database';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export interface CashFilterState {
  sortBy: 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';
  flowDirection: 'ALL' | 'IN' | 'OUT';
  category: 'ALL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PEMBAYARAN_PROYEK' | 'DEBT' | 'KASBON_TUKANG' | 'CAPITAL' | 'BAGI_HASIL_INVESTOR';
  projectId: string;
  datePreset: 'ALL' | 'TODAY' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
  receiptStatus: 'ALL' | 'WITH_RECEIPT' | 'NO_RECEIPT';
  createdByName: string;
}

export const DEFAULT_CASH_FILTERS: CashFilterState = {
  sortBy: 'DATE_DESC',
  flowDirection: 'ALL',
  category: 'ALL',
  projectId: 'ALL',
  datePreset: 'ALL',
  startDate: '',
  endDate: '',
  minAmount: undefined,
  maxAmount: undefined,
  receiptStatus: 'ALL',
  createdByName: 'ALL'
};

export function countActiveFilters(filters: CashFilterState): number {
  let count = 0;
  if (filters.sortBy !== 'DATE_DESC') count++;
  if (filters.flowDirection !== 'ALL') count++;
  if (filters.category !== 'ALL') count++;
  if (filters.projectId !== 'ALL') count++;
  if (filters.datePreset !== 'ALL' || filters.startDate || filters.endDate) count++;
  if (filters.minAmount !== undefined && filters.minAmount > 0) count++;
  if (filters.maxAmount !== undefined && filters.maxAmount > 0) count++;
  if (filters.receiptStatus !== 'ALL') count++;
  if (filters.createdByName !== 'ALL') count++;
  return count;
}

interface CashFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CashFilterState;
  onApply: (newFilters: CashFilterState) => void;
  onReset: () => void;
  projects: Project[];
  availableCreators: string[];
}

export function CashFilterDrawer({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  projects,
  availableCreators
}: CashFilterDrawerProps): React.JSX.Element | null {
  const [localFilters, setLocalFilters] = useState<CashFilterState>(filters);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Sinkronisasi local state saat drawer dibuka
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCount = countActiveFilters(localFilters);

  // Helper Preset Tanggal
  const handleDatePreset = (preset: CashFilterState['datePreset']) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (preset === 'ALL') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'ALL',
        startDate: '',
        endDate: ''
      }));
    } else if (preset === 'TODAY') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'TODAY',
        startDate: todayStr,
        endDate: todayStr
      }));
    } else if (preset === '7D') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: '7D',
        startDate: past7Str,
        endDate: todayStr
      }));
    } else if (preset === '30D') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      const past30Str = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, '0')}-${String(past30.getDate()).padStart(2, '0')}`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: '30D',
        startDate: past30Str,
        endDate: todayStr
      }));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = `${y}-${m}-01`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'THIS_MONTH',
        startDate: firstDay,
        endDate: todayStr
      }));
    }
  };

  const handleApplyClick = () => {
    onApply(localFilters);
    onClose();
  };

  const handleResetClick = () => {
    setLocalFilters(DEFAULT_CASH_FILTERS);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#eaeaea] animate-in slide-in-from-right duration-250 ease-out"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#eaeaea] flex items-center justify-between bg-[#fafafa]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#111111] text-white flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  Filter & Urutkan Kas
                </h3>
                <p className="text-[11px] text-[#666666]">
                  Sesuaikan penyaringan multi-kriteria buku kas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeCount} aktif
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-[6px] text-[#666666] hover:text-[#111111] hover:bg-[#eaeaea] flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
            {/* 1. Pengurutan (Sorting) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Urutkan Berdasarkan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'DATE_DESC', label: 'Tanggal Terbaru' },
                  { id: 'DATE_ASC', label: 'Tanggal Terlama' },
                  { id: 'AMOUNT_DESC', label: 'Nominal Terbesar' },
                  { id: 'AMOUNT_ASC', label: 'Nominal Terkecil' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, sortBy: opt.id as any }))}
                    className={`px-3 py-2 text-left rounded-[6px] border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      localFilters.sortBy === opt.id
                        ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                        : 'bg-white text-[#444444] border-[#eaeaea] hover:bg-[#f8f8f8]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {localFilters.sortBy === opt.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Arah Arus Kas (Flow Direction) */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Arah Arus Kas
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5f5f5] rounded-[8px]">
                {[
                  { id: 'ALL', label: 'Semua Arus' },
                  { id: 'IN', label: 'Kas Masuk (+)' },
                  { id: 'OUT', label: 'Kas Keluar (-)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, flowDirection: opt.id as any }))}
                    className={`py-1.5 text-center rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                      localFilters.flowDirection === opt.id
                        ? 'bg-white text-[#111111] shadow-xs'
                        : 'text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Kategori Mutasi Kas (Category) */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Kategori Mutasi Kas
              </label>
              <select
                value={localFilters.category}
                onChange={e => setLocalFilters(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Kategori Mutasi</option>
                <option value="BELI_MATERIAL">Belanja Material Kuari (Batu, Split, Abu Batu, dll)</option>
                <option value="KASBON_TUKANG">Kasbon Mandor & Tukang Fisik</option>
                <option value="PEMBAYARAN_PROYEK">Pembayaran Termin / Klien (Kas Masuk)</option>
                <option value="DEBT">Cicilan & Pengembalian Hutang Talangan</option>
                <option value="BIAYA_OPERASIONAL">Beban Operasional & HOK (Supir, Solar, Domain)</option>
                <option value="CAPITAL">Setoran Modal Investor & Pinjaman Perseroan</option>
                <option value="BAGI_HASIL_INVESTOR">Penyerahan Bagi Hasil Dividen Investor</option>
              </select>
            </div>

            {/* 4. Filter Proyek Tujuan */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Proyek Tujuan / Relasi
              </label>
              <select
                value={localFilters.projectId}
                onChange={e => setLocalFilters(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Proyek & Non-Proyek</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName || 'Klien'})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Rentang Tanggal (Date Range) */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                  Rentang Tanggal
                </label>
                {(localFilters.startDate || localFilters.endDate || localFilters.datePreset !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => handleDatePreset('ALL')}
                    className="text-[10px] text-[#888888] hover:text-[#111111] underline cursor-pointer"
                  >
                    Reset Tanggal
                  </button>
                )}
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua Waktu' },
                  { id: 'TODAY', label: 'Hari Ini' },
                  { id: '7D', label: '7 Hari' },
                  { id: '30D', label: '30 Hari' },
                  { id: 'THIS_MONTH', label: 'Bulan Ini' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleDatePreset(p.id as any)}
                    className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer ${
                      localFilters.datePreset === p.id
                        ? 'bg-[#111111] text-white shadow-2xs'
                        : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-[#777777] block mb-1">Mulai Dari:</span>
                  <input
                    type="date"
                    value={localFilters.startDate}
                    onChange={e =>
                      setLocalFilters(prev => ({
                        ...prev,
                        startDate: e.target.value,
                        datePreset: 'CUSTOM'
                      }))
                    }
                    className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block mb-1">Sampai Dengan:</span>
                  <input
                    type="date"
                    value={localFilters.endDate}
                    onChange={e =>
                      setLocalFilters(prev => ({
                        ...prev,
                        endDate: e.target.value,
                        datePreset: 'CUSTOM'
                      }))
                    }
                    className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                  />
                </div>
              </div>
            </div>

            {/* 6. Rentang Nominal (Amount Range) */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                  Rentang Nominal (Rp)
                </label>
                {(localFilters.minAmount || localFilters.maxAmount) && (
                  <button
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, minAmount: undefined, maxAmount: undefined }))}
                    className="text-[10px] text-[#888888] hover:text-[#111111] underline cursor-pointer"
                  >
                    Reset Nominal
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#777777] block mb-1">Nominal Minimal:</span>
                  <CurrencyInput
                    value={localFilters.minAmount || 0}
                    onChange={val => setLocalFilters(prev => ({ ...prev, minAmount: val > 0 ? val : undefined }))}
                    placeholder="0"
                    variant="solid-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block mb-1">Nominal Maksimal:</span>
                  <CurrencyInput
                    value={localFilters.maxAmount || 0}
                    onChange={val => setLocalFilters(prev => ({ ...prev, maxAmount: val > 0 ? val : undefined }))}
                    placeholder="Tak terhingga"
                    variant="solid-white"
                  />
                </div>
              </div>
            </div>

            {/* 7. Status Bukti Nota/Struk */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Status Bukti Kwitansi / Struk
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5f5f5] rounded-[8px]">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'WITH_RECEIPT', label: 'Ada Struk' },
                  { id: 'NO_RECEIPT', label: 'Tanpa Struk' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, receiptStatus: opt.id as any }))}
                    className={`py-1.5 text-center rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                      localFilters.receiptStatus === opt.id
                        ? 'bg-white text-[#111111] shadow-xs'
                        : 'text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. PIC / Staf Pencatat (Created By) */}
            <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Staf Pencatat / PIC
              </label>
              <select
                value={localFilters.createdByName}
                onChange={e => setLocalFilters(prev => ({ ...prev, createdByName: e.target.value }))}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Staf / PIC</option>
                {availableCreators.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-[#eaeaea] bg-[#fbfbfb] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetClick}
              disabled={activeCount === 0}
              className="px-3.5 py-2 text-xs font-semibold text-[#666666] hover:text-[#111111] bg-white border border-[#eaeaea] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua
            </button>

            <button
              type="button"
              onClick={handleApplyClick}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Terapkan Filter {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
