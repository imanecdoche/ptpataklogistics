import React, { useState, useEffect, useRef } from 'react';
import { Project, MasterQuarry, MaterialItem } from '@/types/database';

export interface DispatchFilterState {
  datePreset: 'TODAY' | '15D' | '30D' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';
  startDate: string;
  endDate: string;
  projectId: string;
  quarryId: string;
  materialId: string;
  status: 'ALL' | 'LUNAS' | 'TEMPO';
}

interface DispatchFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DispatchFilterState;
  onApply: (newFilters: DispatchFilterState) => void;
  onReset: () => void;
  projects: Project[];
  quarries: MasterQuarry[];
  materials: MaterialItem[];
}

export function DispatchFilterPopover({
  isOpen,
  onClose,
  anchorRef,
  filters,
  onApply,
  onReset,
  projects,
  quarries,
  materials
}: DispatchFilterPopoverProps): React.JSX.Element | null {
  const [localFilters, setLocalFilters] = useState<DispatchFilterState>(filters);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  // Handle Click Outside & Escape Key on Desktop
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: DispatchFilterState['datePreset']) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;

    if (preset === 'TODAY') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'TODAY',
        startDate: today,
        endDate: today
      }));
    } else if (preset === '15D') {
      const past15 = new Date();
      past15.setDate(past15.getDate() - 14);
      const past15Str = `${past15.getFullYear()}-${String(past15.getMonth() + 1).padStart(2, '0')}-${String(past15.getDate()).padStart(2, '0')}`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: '15D',
        startDate: past15Str,
        endDate: today
      }));
    } else if (preset === '30D') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      const past30Str = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, '0')}-${String(past30.getDate()).padStart(2, '0')}`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: '30D',
        startDate: past30Str,
        endDate: today
      }));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = `${y}-${m}-01`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'THIS_MONTH',
        startDate: firstDay,
        endDate: today
      }));
    } else if (preset === 'ALL') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'ALL',
        startDate: '',
        endDate: ''
      }));
    } else if (preset === 'CUSTOM') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'CUSTOM'
      }));
    }
  };

  const handleApplyClick = () => {
    onApply(localFilters);
    onClose();
  };

  const handleResetClick = () => {
    onReset();
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Popover Card (Desktop: Floating Anchored Popover | Mobile: Bottom Sheet Drawer) */}
      <div
        ref={popoverRef}
        className="fixed md:absolute bottom-0 md:bottom-auto md:top-full right-0 md:mt-2 w-full md:w-[440px] max-h-[85vh] md:max-h-[600px] overflow-y-auto bg-white rounded-t-[16px] md:rounded-[12px] border border-[#dcdcdc] shadow-2xl z-50 p-4 md:p-5 flex flex-col gap-4 text-xs select-none animate-in fade-in slide-in-from-bottom-3 md:zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
          <div className="flex items-center gap-2">
            <img src="/icons/filter-slider.png" alt="Filter" className="w-4 h-4 object-contain" />
            <h3 className="text-sm font-bold text-[#111111]">Filter Riwayat Ritase</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#888888] hover:text-[#111111] rounded-full hover:bg-[#f0f0f0] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 1. Filter Preset Tanggal */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Rentang Periode Waktu
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'TODAY', label: 'Hari Ini' },
              { id: '15D', label: '15 Hari' },
              { id: '30D', label: '30 Hari' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: 'ALL', label: 'Sepanjang Waktu' },
              { id: 'CUSTOM', label: 'Kustom Tanggal' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id as DispatchFilterState['datePreset'])}
                className={`py-1.5 px-2 rounded-[6px] text-xs font-medium transition-colors text-center border ${
                  localFilters.datePreset === p.id
                    ? 'bg-[#111111] text-white border-[#111111] font-semibold'
                    : 'bg-[#fafafa] text-[#555555] border-[#eaeaea] hover:bg-[#f0f0f0]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rentang Tanggal Kustom (Muncul jika CUSTOM atau saat kustom tanggal diedit) */}
        {localFilters.datePreset === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#f9f9f9] rounded-[8px] border border-[#eaeaea]">
            <div>
              <span className="text-[10px] text-[#777777] block mb-1 font-medium">Dari Tanggal:</span>
              <input
                type="date"
                value={localFilters.startDate}
                onChange={e =>
                  setLocalFilters(prev => ({
                    ...prev,
                    datePreset: 'CUSTOM',
                    startDate: e.target.value
                  }))
                }
                className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#777777] block mb-1 font-medium">Sampai Tanggal:</span>
              <input
                type="date"
                value={localFilters.endDate}
                onChange={e =>
                  setLocalFilters(prev => ({
                    ...prev,
                    datePreset: 'CUSTOM',
                    endDate: e.target.value
                  }))
                }
                className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
          </div>
        )}

        {/* 2. Filter Proyek Tujuan */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Proyek Tujuan
          </label>
          <select
            value={localFilters.projectId}
            onChange={e => setLocalFilters(prev => ({ ...prev, projectId: e.target.value }))}
            className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="ALL">Semua Proyek</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filter Jenis Material */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Jenis Material
          </label>
          <select
            value={localFilters.materialId}
            onChange={e => setLocalFilters(prev => ({ ...prev, materialId: e.target.value }))}
            className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="ALL">Semua Material</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Filter Kuari Asal */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Kuari Asal
          </label>
          <select
            value={localFilters.quarryId}
            onChange={e => setLocalFilters(prev => ({ ...prev, quarryId: e.target.value }))}
            className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="ALL">Semua Kuari Asal</option>
            {quarries.map(q => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Filter Status Pembayaran */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Status Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'LUNAS', label: 'Lunas' },
              { id: 'TEMPO', label: 'Tempo' }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setLocalFilters(prev => ({ ...prev, status: s.id as 'ALL' | 'LUNAS' | 'TEMPO' }))}
                className={`py-1.5 rounded-[6px] text-xs font-medium border text-center transition-colors ${
                  localFilters.status === s.id
                    ? s.id === 'LUNAS'
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                      : s.id === 'TEMPO'
                      ? 'bg-[#cf1124] text-white border-[#cf1124] font-bold'
                      : 'bg-[#111111] text-white border-[#111111] font-bold'
                    : 'bg-[#fafafa] text-[#555555] border-[#eaeaea] hover:bg-[#f0f0f0]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tombol Aksi Bawah */}
        <div className="flex items-center justify-between pt-3 border-t border-[#eaeaea] mt-1">
          <button
            type="button"
            onClick={handleResetClick}
            className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] rounded-[6px] transition-colors"
          >
            Reset Semua
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#555555] border border-[#dcdcdc] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyClick}
              className="px-4 py-1.5 text-xs bg-[#111111] hover:bg-black text-white font-semibold rounded-[6px] transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
