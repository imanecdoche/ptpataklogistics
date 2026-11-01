import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Project } from '@/types/database';
import { useDrawerTransition } from '@/hooks/useDrawerTransition';

export interface DashboardFilterState {
  datePreset: 'TODAY' | '7D' | '30D' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';
  startDate: string;
  endDate: string;
  projectId: string;
  quarryName: string;
  materialName: string;
  status: 'ALL' | 'LUNAS' | 'TEMPO';
}

interface DashboardFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilterState;
  onApply: (newFilters: DashboardFilterState) => void;
  onReset: () => void;
  projects: Project[];
  quarries: { id: string; name: string }[];
  materials: { id: string; name: string }[];
}

export function DashboardFilterDrawer({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  projects,
  quarries,
  materials
}: DashboardFilterDrawerProps): React.JSX.Element | null {
  const [localFilters, setLocalFilters] = useState<DashboardFilterState>(filters);
  const { isRendered, isVisible, handleClose } = useDrawerTransition(isOpen, onClose, { durationMs: 200 });

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [filters, isOpen]);

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

  const handlePresetSelect = (preset: DashboardFilterState['datePreset']) => {
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
    } else if (preset === '7D') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, '0')}-${String(past7.getDate()).padStart(2, '0')}`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: '7D',
        startDate: past7Str,
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
      const startOfMonth = `${y}-${m}-01`;
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'THIS_MONTH',
        startDate: startOfMonth,
        endDate: today
      }));
    } else if (preset === 'ALL') {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'ALL',
        startDate: '',
        endDate: ''
      }));
    } else {
      setLocalFilters(prev => ({
        ...prev,
        datePreset: 'CUSTOM'
      }));
    }
  };

  const handleApply = () => {
    onApply(localFilters);
    handleClose();
  };

  const handleReset = () => {
    onReset();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none overflow-hidden">
      {/* Backdrop: Solid Dimmed (Zero Blur) */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer Panel Bottom Sheet */}
      <div
        className={`relative z-10 bg-white rounded-t-[18px] shadow-2xl h-[85dvh] max-h-[85dvh] flex flex-col w-full max-w-2xl mx-auto overflow-hidden transition-transform duration-200 ease-out transform border-none ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drawer Header (Centered Title, No Drag Handle per Rule 128) */}
        <div className="p-4 bg-[#fafafa] flex items-center justify-between flex-shrink-0 border-none">
          <div className="flex items-center gap-2.5">
            <img src="/icons/filter-slider.png" alt="" className="w-5 h-5 object-contain" />
            <h2 className="text-sm font-bold text-[#111111] tracking-tight">Filter Operasional Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-[6px] text-[#555555] hover:text-[#111111] bg-[#eeeeee] hover:bg-[#e2e2e2] border-none flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Rentang Waktu */}
          <div>
            <label className="block text-[#666666] font-semibold mb-2">Rentang Waktu</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'TODAY', label: 'Hari Ini' },
                { id: '7D', label: '7 Hari' },
                { id: '30D', label: '30 Hari' },
                { id: 'THIS_MONTH', label: 'Bulan Ini' },
                { id: 'ALL', label: 'Semua' },
                { id: 'CUSTOM', label: 'Kustom' }
              ].map(p => {
                const isSelected = localFilters.datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id as DashboardFilterState['datePreset'])}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-[6px] transition-colors border text-center ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#fafafa] text-[#555555] border-[#e5e5e5] hover:bg-[#f0f0f0]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers */}
            {localFilters.datePreset === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-[#fafafa] rounded-[8px] border border-[#eaeaea]">
                <div>
                  <label className="block text-[11px] text-[#777777] font-medium mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={localFilters.startDate}
                    onChange={e =>
                      setLocalFilters(prev => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777777] font-medium mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={localFilters.endDate}
                    onChange={e =>
                      setLocalFilters(prev => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Proyek Tujuan */}
          <div>
            <label className="block text-[#666666] font-semibold mb-1.5">Proyek Tujuan</label>
            <select
              value={localFilters.projectId}
              onChange={e => setLocalFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold"
            >
              <option value="ALL">Semua Proyek Aktif</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 3: Kuari Asal */}
          <div>
            <label className="block text-[#666666] font-semibold mb-1.5">Kuari Asal / Tambang</label>
            <select
              value={localFilters.quarryName}
              onChange={e => setLocalFilters(prev => ({ ...prev, quarryName: e.target.value }))}
              className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold"
            >
              <option value="ALL">Semua Kuari</option>
              {quarries.map(q => (
                <option key={q.id} value={q.name}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 4: Jenis Material */}
          <div>
            <label className="block text-[#666666] font-semibold mb-1.5">Jenis Material</label>
            <select
              value={localFilters.materialName}
              onChange={e => setLocalFilters(prev => ({ ...prev, materialName: e.target.value }))}
              className="w-full bg-white border border-[#dcdcdc] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold"
            >
              <option value="ALL">Semua Jenis Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 5: Status Pembayaran */}
          <div>
            <label className="block text-[#666666] font-semibold mb-1.5">Status Pembayaran Tiket</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ALL', label: 'Semua Status' },
                { id: 'LUNAS', label: 'Lunas (Cash)' },
                { id: 'TEMPO', label: 'Piutang Tempo' }
              ].map(s => {
                const isSelected = localFilters.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLocalFilters(prev => ({ ...prev, status: s.id as any }))}
                    className={`py-2 px-2 text-xs font-semibold rounded-[6px] border text-center transition-colors ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#fafafa] text-[#555555] border-[#e5e5e5] hover:bg-[#f0f0f0]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-[#fafafa] border-t border-[#eaeaea] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-[8px] bg-[#f0f0f0] hover:bg-[#e4e4e4] border-none text-xs font-bold text-[#555555] transition-colors cursor-pointer"
          >
            Reset Default
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-5 rounded-[8px] bg-[#111111] text-white text-xs font-bold hover:bg-black active:scale-[0.99] transition-all shadow-sm text-center"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
