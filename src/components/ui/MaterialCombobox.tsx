import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MaterialItem } from '@/types/database';

interface MaterialComboboxProps {
  materials: MaterialItem[];
  selectedMaterialId?: string;
  selectedMaterialName?: string;
  onSelect: (material: MaterialItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'solid-white';
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

export function MaterialCombobox({
  materials,
  selectedMaterialId,
  selectedMaterialName,
  onSelect,
  placeholder = 'Cari atau pilih jenis material...',
  disabled = false,
  required = false,
  variant = 'default',
  inputRef,
  onKeyDown,
  onFocus
}: MaterialComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState(selectedMaterialName || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const effectiveInputRef = inputRef || localInputRef;

  // Sinkronisasi nama material saat props berubah
  useEffect(() => {
    if (selectedMaterialName !== undefined) {
      setQuery(selectedMaterialName);
    } else if (selectedMaterialId) {
      const found = materials.find(m => m.id === selectedMaterialId);
      if (found) {
        setQuery(found.name);
      }
    }
  }, [selectedMaterialName, selectedMaterialId, materials]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedMaterialName && query !== selectedMaterialName) {
          setQuery(selectedMaterialName);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMaterialName, query]);

  const filteredMaterials = useMemo(() => {
    if (!query.trim()) return materials;
    const q = query.toLowerCase().trim();
    return materials.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
    );
  }, [materials, query]);

  const handleSelect = (m: MaterialItem): void => {
    setQuery(m.name);
    setIsOpen(false);
    onSelect(m);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setQuery('');
    onSelect(null);
    effectiveInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Tab') {
      if (isOpen && filteredMaterials.length > 0) {
        const target = filteredMaterials[highlightedIndex] || filteredMaterials[0];
        if (target) {
          handleSelect(target);
        }
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredMaterials.length > 0) {
        e.preventDefault();
        const target = filteredMaterials[highlightedIndex] || filteredMaterials[0];
        if (target) {
          handleSelect(target);
        }
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev + 1) % filteredMaterials.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex(prev => (prev - 1 + filteredMaterials.length) % filteredMaterials.length);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (onKeyDown) onKeyDown(e);
    } else {
      if (onKeyDown) onKeyDown(e);
    }
  };

  const isSolidWhite = variant === 'solid-white';
  const baseBg = isSolidWhite ? 'bg-white' : 'bg-[#f5f5f5]';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Material Icon Preview */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <img
            src="/icons/material-cube.png"
            alt="Material"
            className="w-4 h-4 object-contain"
          />
        </div>

        <input
          ref={effectiveInputRef}
          type="text"
          value={query}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={e => {
            setIsOpen(true);
            setHighlightedIndex(0);
            const target = e.currentTarget;
            setTimeout(() => target.select(), 0);
            if (onFocus) onFocus(e);
          }}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full ${baseBg} border-none outline-none focus:outline-none focus:ring-0 rounded-[6px] pl-8.5 pr-8 py-2 text-xs text-black font-semibold placeholder:text-[#888888] placeholder:font-normal transition-colors select-all ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#111111] p-0.5 rounded cursor-pointer"
            title="Hapus pilihan"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Hasil Autocomplete */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#eaeaea] rounded-[8px] shadow-xl max-h-60 overflow-y-auto z-40 divide-y divide-[#f5f5f5]">
          {filteredMaterials.length === 0 ? (
            <div className="p-3 text-xs text-center text-[#888888]">
              Material tidak ditemukan
            </div>
          ) : (
            filteredMaterials.map((m, idx) => (
              <div
                key={m.id}
                onMouseDown={() => handleSelect(m)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  idx === highlightedIndex ? 'bg-[#f0f0f0]' : 'hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/icons/material-cube.png"
                    alt={m.name}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="block font-bold text-xs text-[#111111] truncate">
                      {m.name}
                    </span>
                    <span className="block text-[10px] text-[#666666]">
                      Acuan: Beli {formatRupiah(m.defaultBuyPrice)} • Jual {formatRupiah(m.defaultSellPrice)} / {m.unit}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold bg-[#eaeaea] text-[#444444] px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                  {m.unit}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
