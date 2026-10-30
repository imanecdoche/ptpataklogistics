import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MasterQuarry } from '@/types/database';
import { saveMasterQuarry } from '@/lib/databaseMasterService';

interface QuarryComboboxProps {
  quarries: MasterQuarry[];
  selectedQuarryId?: string;
  selectedQuarryName?: string;
  onSelect: (quarry: MasterQuarry | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'solid-white';
}

export function QuarryCombobox({
  quarries,
  selectedQuarryId,
  selectedQuarryName,
  onSelect,
  placeholder = 'Pilih atau ketik kuari asal...',
  disabled = false,
  required = false,
  variant = 'default'
}: QuarryComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState(selectedQuarryName || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedQuarryName !== undefined) {
      setQuery(selectedQuarryName);
    }
  }, [selectedQuarryName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedQuarryName && query !== selectedQuarryName) {
          setQuery(selectedQuarryName);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedQuarryName, query]);

  const filteredQuarries = useMemo(() => {
    if (!query.trim()) return quarries;
    const q = query.toLowerCase().trim();
    return quarries.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.contactPerson && item.contactPerson.toLowerCase().includes(q))
    );
  }, [quarries, query]);

  const exactMatch = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return quarries.some(q => q.name.trim().toLowerCase() === clean);
  }, [quarries, query]);

  const handleSelect = (q: MasterQuarry): void => {
    setQuery(q.name);
    setIsOpen(false);
    onSelect(q);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setQuery('');
    onSelect(null);
    inputRef.current?.focus();
  };

  const handleQuickCreate = async (): Promise<void> => {
    const clean = query.trim();
    if (!clean) return;

    setIsCreating(true);
    try {
      const newId = await saveMasterQuarry(clean);
      const newQry: MasterQuarry = {
        id: newId,
        name: clean,
        createdAt: new Date().toISOString()
      };
      setQuery(clean);
      setIsOpen(false);
      onSelect(newQry);
    } catch (err) {
      console.error('Gagal membuat kuari baru:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled || isCreating}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value.trim()) {
              onSelect(null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-[6px] pl-3.5 pr-8 py-2 text-xs transition-colors disabled:bg-[#f9f9f9] disabled:cursor-not-allowed ${
            variant === 'solid-white'
              ? 'bg-white border-2 border-black text-black font-semibold placeholder-[#888888] focus:outline-none'
              : 'bg-white border border-[#eaeaea] text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111]'
          }`}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 text-[#888888] hover:text-[#111111] rounded cursor-pointer transition-colors"
            title="Hapus pilihan"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#eaeaea] rounded-[8px] shadow-lg max-h-52 overflow-y-auto overflow-x-hidden p-1 text-xs">
          {filteredQuarries.length > 0 ? (
            filteredQuarries.map(q => {
              const isSelected = q.id === selectedQuarryId || q.name === selectedQuarryName;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelect(q)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-[#111111] text-white font-medium' : 'text-[#333333] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{q.name}</span>
                    {q.location && (
                      <span className={`text-[10px] truncate ${isSelected ? 'text-[#cccccc]' : 'text-[#888888]'}`}>
                        Lokasi: {q.location}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold ml-2">✓</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-2.5 text-center text-[#888888] text-[11px]">
              Tidak ada kuari yang cocok.
            </div>
          )}

          {/* Quick Add Option */}
          {query.trim() && !exactMatch && (
            <div className="border-t border-[#eaeaea] mt-1 pt-1">
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={isCreating}
                className="w-full text-left px-3 py-2 rounded-[6px] text-[#008060] hover:bg-[#f0fdf4] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>+</span>
                <span className="truncate">
                  {isCreating ? 'Menyimpan kuari...' : `Tambah Kuari Baru: "${query.trim()}"`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
