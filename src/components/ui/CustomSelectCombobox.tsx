import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface SelectOption {
  id: string;
  label: string;
  subLabel?: string;
}

interface CustomSelectComboboxProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  triggerClassName?: string;
  variant?: 'gray' | 'white';
}

export function CustomSelectCombobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  disabled = false,
  required = false,
  searchable = true,
  className = '',
  triggerClassName = '',
  variant = 'gray'
}: CustomSelectComboboxProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find(o => o.id === value) || null;
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      o => o.label.toLowerCase().includes(q) || (o.subLabel && o.subLabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const handleSelect = (optionId: string): void => {
    onChange(optionId);
    setIsOpen(false);
    setSearch('');
  };

  const isWhite = variant === 'white';
  const baseTriggerClass = isWhite
    ? `flex items-center justify-between w-full bg-white hover:bg-[#fafafa] rounded-[8px] px-3 py-2 text-xs transition-colors cursor-pointer border border-[#eaeaea] ${
        isOpen ? 'border-[#111111] ring-1 ring-[#111111]' : ''
      }`
    : `flex items-center justify-between w-full bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[6px] px-3 py-2 text-xs transition-colors cursor-pointer border border-transparent ${
        isOpen ? 'border-[#111111]' : ''
      }`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev);
        }}
        className={`${baseTriggerClass} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${triggerClassName}`}
      >
        <span
          className={`font-medium truncate ${
            selectedOption ? 'text-[#111111]' : 'text-[#888888] font-normal'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <input type="hidden" value={value} required={required} />

        <svg
          className={`w-3.5 h-3.5 text-[#666666] transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#eaeaea] rounded-[8px] shadow-lg py-1 text-xs">
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-[#eaeaea]">
              <div className="relative">
                <img
                  src="/icons/search.png"
                  alt="Search"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 object-contain pointer-events-none opacity-60"
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari..."
                  autoFocus
                  className="w-full bg-[#f5f5f5] rounded-[4px] pl-8 pr-2 py-1 text-xs text-[#111111] outline-none"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-center text-[#888888]">
              Tidak ada opsi yang cocok.
            </div>
          ) : (
            filteredOptions.map(option => {
              const isSelected = option.id === value;
              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#111111] text-white font-bold'
                      : 'hover:bg-[#f5f5f5] text-[#111111]'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.subLabel && (
                    <span
                      className={`text-[11px] ml-2 font-mono ${
                        isSelected ? 'text-[#e5e5e5]' : 'text-[#666666]'
                      }`}
                    >
                      {option.subLabel}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
