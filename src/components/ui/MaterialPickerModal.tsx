import React, { useState, useMemo } from 'react';
import { MaterialItem, DispatchTransaction } from '@/types/database';
import { getMaterialIconSrc } from '@/lib/materialIcons';

interface MaterialPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  selectedMaterialId: string;
  onSelect: (material: MaterialItem) => void;
  transactions?: DispatchTransaction[];
}

export function MaterialPickerModal({
  isOpen,
  onClose,
  materials,
  selectedMaterialId,
  onSelect,
  transactions = []
}: MaterialPickerModalProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Urutkan jenis material otomatis dari yang paling sering masuk record ritase
  const sortedMaterials = useMemo(() => {
    const frequencyMap = new Map<string, number>();
    for (const tx of transactions) {
      frequencyMap.set(tx.materialId, (frequencyMap.get(tx.materialId) || 0) + 1);
    }

    return [...materials].sort((a, b) => {
      const countA = frequencyMap.get(a.id) || 0;
      const countB = frequencyMap.get(b.id) || 0;
      if (countB !== countA) {
        return countB - countA; // Paling sering tampil di atas
      }
      return a.name.localeCompare(b.name);
    });
  }, [materials, transactions]);

  // 2. Filter pencarian cepat
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return sortedMaterials;
    const q = searchQuery.toLowerCase();
    return sortedMaterials.filter(
      m => m.name.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q)
    );
  }, [sortedMaterials, searchQuery]);

  if (!isOpen) return null;

  const formatRupiah = (val: number): string => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
    >
      {/* Dim Backdrop tanpa blur */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Container Picker Window */}
      <div className="relative w-full md:max-w-xl h-[88vh] md:h-auto md:max-h-[85vh] bg-white rounded-t-[16px] md:rounded-[12px] flex flex-col overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header Modal */}
        <div className="p-4 md:p-5 border-b border-[#eaeaea] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-[#111111]">
                Jenis Material
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Pilih material acuan ritase armada.
              </p>
            </div>

            {/* Tombol Tutup X di Header */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors"
              aria-label="Tutup"
            >
              <img
                src="/icons/close.png"
                alt="Tutup"
                className="w-4 h-4 object-contain"
              />
            </button>
          </div>

          {/* Searchbar Pencarian Cepat di Header (Rule 98: Universal Search Icon) */}
          <div className="relative mt-3">
            <img
              src="/icons/search.png"
              alt="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
            />
            <input
              type="text"
              autoFocus
              placeholder="Cari jenis material atau satuan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#f5f5f5] focus:bg-[#ebebeb] outline-none rounded-[6px] pl-9 pr-3.5 py-2 text-xs text-[#111111] placeholder:text-[#999999] transition-colors border-none"
            />
          </div>
        </div>

        {/* List Material dengan Divider Tipis */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f5f5f5] p-2 md:p-3">
          {filteredMaterials.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-[#888888] text-center p-4">
              <span>Tidak ada jenis material yang cocok dengan "{searchQuery}".</span>
            </div>
          ) : (
            filteredMaterials.map(m => {
              const isSelected = m.id === selectedMaterialId;
              const iconSrc = getMaterialIconSrc(m.name);

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelect(m);
                    onClose();
                  }}
                  className={`p-3 md:p-3.5 flex items-center justify-between gap-3 cursor-pointer rounded-[8px] transition-colors ${
                    isSelected ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'
                  }`}
                >
                  {/* Sisi Kiri: 1:1 Thumbnail Icon Material & Nama */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={iconSrc}
                      alt={m.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-[8px] object-cover flex-shrink-0 bg-[#ebebeb]"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs md:text-sm font-semibold text-[#111111] truncate">
                          {m.name}
                        </span>

                        {/* Badge Volume Tanpa Outline */}
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ebebeb] text-[#555555] font-mono text-[11px] font-semibold select-none border-none">
                          {m.unit}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#888888] mt-1 md:hidden">
                        Beli: <span className="font-mono text-[#444444]">{formatRupiah(m.defaultBuyPrice)}</span> • Jual: <span className="font-mono text-[#444444]">{formatRupiah(m.defaultSellPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan (Desktop): Rincian Harga Acuan */}
                  <div className="hidden md:flex flex-col items-end text-right flex-shrink-0">
                    <span className="text-[11px] text-[#888888]">
                      Acuan Jual: <span className="font-mono font-semibold text-[#111111]">{formatRupiah(m.defaultSellPrice)}</span>
                    </span>
                    <span className="text-[11px] text-[#888888] mt-0.5">
                      Acuan Beli: <span className="font-mono text-[#666666]">{formatRupiah(m.defaultBuyPrice)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
