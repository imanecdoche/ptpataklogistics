import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/types/database';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useDrawerTransition } from '@/hooks/useDrawerTransition';

export interface CashFilterState {
  sortBy: 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';
  flowDirection: 'ALL' | 'IN' | 'OUT';
  category: 'ALL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PEMBAYARAN_PROYEK' | 'DEBT' | 'KASBON_TUKANG' | 'KASBON_KARYAWAN' | 'CAPITAL' | 'BAGI_HASIL_INVESTOR';
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

  const { isRendered, isVisible, handleClose } = useDrawerTransition(isOpen, onClose, { durationMs: 200 });

  // Sinkronisasi local state saat drawer dibuka
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  if (!isRendered) return null;

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
    handleClose();
  };

  const handleResetClick = () => {
    setLocalFilters(DEFAULT_CASH_FILTERS);
    onReset();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop: Solid Dimmed (Zero Blur per Rule 1 & Rule 4) */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* 
        Container Adaptif:
        - Mobile (< md): Bottom Drawer anchored flush to bottom with smooth bi-directional Y slide
        - Desktop (>= md): Slide-over drawer from right edge with smooth X slide
      */}
      <div
        ref={drawerRef}
        className={`
          fixed inset-x-0 bottom-0 z-50 w-full h-[85dvh] max-h-[85dvh] rounded-t-[16px] rounded-b-none bg-white flex flex-col shadow-2xl border-none
          transition-transform duration-200 ease-out transform
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          md:inset-y-0 md:right-0 md:left-auto md:w-[440px] md:max-w-md md:h-full md:max-h-full md:rounded-none
          ${isVisible ? 'md:translate-x-0' : 'md:translate-x-full md:translate-y-0'}
        `}
      >
        {/* Header (No Drag Pill on Mobile per Rule 4.2) */}
        <div className="p-4 border-none flex items-center justify-between bg-[#fafafa] flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#111111] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#111111] truncate">
                Filter & Urutkan Kas
              </h3>
              <p className="text-[11px] text-[#666666] truncate">
                Penyaringan multi-kriteria buku kas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {activeCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white border-none whitespace-nowrap flex-shrink-0">
                {activeCount} aktif
              </span>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-[6px] text-[#555555] hover:text-[#111111] bg-[#eeeeee] hover:bg-[#e2e2e2] border-none flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Content Body (Scrollable independently) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-[#111111]">
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
                  className={`px-3 py-2 text-left rounded-[6px] border-none text-xs font-semibold transition-all cursor-pointer flex items-center justify-between whitespace-nowrap ${
                    localFilters.sortBy === opt.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-[#f0f0f0] text-[#333333] hover:bg-[#e5e5e5]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {localFilters.sortBy === opt.id && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Arah Arus Kas (Flow Direction) */}
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
              Arah Arus Kas
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#ececec] rounded-[8px] border-none">
              {[
                { id: 'ALL', label: 'Semua Arus' },
                { id: 'IN', label: 'Kas Masuk (+)' },
                { id: 'OUT', label: 'Kas Keluar (-)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters(prev => ({ ...prev, flowDirection: opt.id as any }))}
                  className={`py-1.5 text-center rounded-[6px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    localFilters.flowDirection === opt.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Kategori Mutasi Kas (Category) */}
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
              Kategori Mutasi Kas
            </label>
            <select
              value={localFilters.category}
              onChange={e => setLocalFilters(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full bg-[#f4f4f4] border-none rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:bg-[#ebebeb] transition-colors cursor-pointer font-medium"
            >
              <option value="ALL">Semua Kategori Mutasi</option>
              <option value="BELI_MATERIAL">Belanja Material Kuari (Batu, Split, Abu Batu, dll)</option>
              <option value="KASBON_TUKANG">Kasbon Mandor & Tukang Fisik</option>
              <option value="KASBON_KARYAWAN">Kasbon Karyawan & Tim Proyek</option>
              <option value="PEMBAYARAN_PROYEK">Pembayaran Termin / Klien (Kas Masuk)</option>
              <option value="DEBT">Cicilan & Pengembalian Hutang Talangan</option>
              <option value="BIAYA_OPERASIONAL">Beban Operasional & HOK (Supir, Solar, Domain)</option>
              <option value="CAPITAL">Setoran Modal Investor & Pinjaman Perseroan</option>
              <option value="BAGI_HASIL_INVESTOR">Penyerahan Bagi Hasil Dividen Investor</option>
            </select>
          </div>

          {/* 4. Filter Proyek Tujuan */}
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
              Proyek Tujuan / Relasi
            </label>
            <select
              value={localFilters.projectId}
              onChange={e => setLocalFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full bg-[#f4f4f4] border-none rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:bg-[#ebebeb] transition-colors cursor-pointer font-medium"
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
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Rentang Tanggal
              </label>
              {(localFilters.startDate || localFilters.endDate || localFilters.datePreset !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => handleDatePreset('ALL')}
                  className="text-[10px] text-[#777777] hover:text-[#111111] underline cursor-pointer font-medium whitespace-nowrap"
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
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap border-none ${
                    localFilters.datePreset === p.id
                      ? 'bg-[#111111] text-white shadow-2xs'
                      : 'bg-[#eeeeee] text-[#444444] hover:bg-[#e2e2e2]'
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
                  className="w-full bg-[#f4f4f4] border-none rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:bg-[#ebebeb] font-medium"
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
                  className="w-full bg-[#f4f4f4] border-none rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:bg-[#ebebeb] font-medium"
                />
              </div>
            </div>
          </div>

          {/* 6. Rentang Nominal (Amount Range) */}
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
                Rentang Nominal (Rp)
              </label>
              {(localFilters.minAmount || localFilters.maxAmount) && (
                <button
                  type="button"
                  onClick={() => setLocalFilters(prev => ({ ...prev, minAmount: undefined, maxAmount: undefined }))}
                  className="text-[10px] text-[#777777] hover:text-[#111111] underline cursor-pointer font-medium whitespace-nowrap"
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
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
              Status Bukti Kwitansi / Struk
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#ececec] rounded-[8px] border-none">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'WITH_RECEIPT', label: 'Ada Struk' },
                { id: 'NO_RECEIPT', label: 'Tanpa Struk' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters(prev => ({ ...prev, receiptStatus: opt.id as any }))}
                  className={`py-1.5 text-center rounded-[6px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    localFilters.receiptStatus === opt.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 8. PIC / Staf Pencatat (Created By) */}
          <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
            <label className="text-[11px] font-bold text-[#444444] uppercase tracking-wider block">
              Staf Pencatat / PIC
            </label>
            <select
              value={localFilters.createdByName}
              onChange={e => setLocalFilters(prev => ({ ...prev, createdByName: e.target.value }))}
              className="w-full bg-[#f4f4f4] border-none rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:bg-[#ebebeb] transition-colors cursor-pointer font-medium"
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

        {/* Sticky Action Footer (Rule 4.3: Sticky at the very bottom of the drawer) */}
        <div className="sticky bottom-0 inset-x-0 z-10 mt-auto p-4 bg-white border-none shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetClick}
            disabled={activeCount === 0}
            className="px-3.5 py-2 text-xs font-semibold text-[#444444] hover:text-[#111111] bg-[#eeeeee] hover:bg-[#e2e2e2] border-none rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Semua
          </button>

          <button
            type="button"
            onClick={handleApplyClick}
            className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] border-none rounded-[6px] shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Terapkan Filter {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
