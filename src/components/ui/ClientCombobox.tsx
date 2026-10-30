import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Client } from '@/types/database';
import { formatClientName, formatClientNameLive } from '@/lib/clientService';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { NewClientModal } from '@/components/ui/NewClientModal';

interface ClientComboboxProps {
  clients: Client[];
  selectedClientId?: string;
  selectedClientName?: string;
  onSelect: (client: Client | null) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'solid-white';
}

export function ClientCombobox({
  clients,
  selectedClientId,
  selectedClientName,
  onSelect,
  required = false,
  disabled = false,
  variant = 'default'
}: ClientComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState(selectedClientName || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialName, setModalInitialName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query when selectedClientName changes externally
  useEffect(() => {
    if (selectedClientName !== undefined) {
      setQuery(selectedClientName);
    }
  }, [selectedClientName]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If query was typed but no client selected, revert to current selectedClientName
        if (selectedClientName && query !== selectedClientName) {
          setQuery(selectedClientName);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedClientName, query]);

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase().trim();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.picName && c.picName.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.includes(q))
    );
  }, [clients, query]);

  // Check whether query matches an existing client exactly
  const exactMatch = useMemo(() => {
    const formatted = formatClientName(query).toLowerCase();
    return clients.some(c => c.name.toLowerCase() === formatted);
  }, [clients, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatClientNameLive(e.target.value);
    setQuery(formatted);
    setIsOpen(true);
    if (!formatted.trim()) {
      onSelect(null);
    }
  };

  const handleInputBlur = (): void => {
    if (query) {
      const formatted = formatClientName(query);
      setQuery(formatted);
    }
  };

  const handleSelectClient = (c: Client): void => {
    setQuery(c.name);
    setIsOpen(false);
    onSelect(c);
  };

  const handleOpenRegister = (prefillName: string): void => {
    setModalInitialName(formatClientName(prefillName));
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleClientCreated = (newClient: Client): void => {
    setQuery(newClient.name);
    onSelect(newClient);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div
        className={`relative flex items-center rounded-[6px] transition-colors ${
          variant === 'solid-white'
            ? 'bg-white border-none'
            : 'bg-[#f5f5f5] focus-within:bg-[#ebebeb]'
        }`}
      >
        <img
          src="/icons/search.png"
          alt="Search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
        />
        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          placeholder="Cari atau pilih nama klien / pembeli..."
          value={query}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          className={`w-full bg-transparent outline-none border-none py-2 pl-9 pr-3 text-xs ${
            variant === 'solid-white'
              ? 'text-black font-semibold placeholder:text-[#888888]'
              : 'text-[#111111] placeholder:text-[#999999]'
          }`}
        />

        {/* Chevron Dropdown Toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
          className={`p-2 transition-colors border-none bg-transparent cursor-pointer ${
            variant === 'solid-white' ? 'text-black' : 'text-[#777777] hover:text-[#111111]'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Popover Dropdown List (Flat borderless solid surface, no drop shadow) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaeaea] rounded-[6px] overflow-hidden z-40 max-h-56 overflow-y-auto">
          {/* List Klien Terdaftar */}
          {filteredClients.length > 0 ? (
            <div className="divide-y divide-[#f5f5f5]">
              {filteredClients.map(c => {
                const isSelected = c.id === selectedClientId || c.name === selectedClientName;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between border-none cursor-pointer ${
                      isSelected
                        ? 'bg-[#111111] text-white'
                        : 'bg-white hover:bg-[#f5f5f5] text-[#111111]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">{c.name}</div>
                      {(c.picName || c.phoneNumber) && (
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isSelected ? 'text-gray-300' : 'text-[#777777]'
                          }`}
                        >
                          {c.picName && <span>PIC: {c.picName}</span>}
                          {c.picName && c.phoneNumber && <span className="mx-1">•</span>}
                          {c.phoneNumber && <span className="font-mono">{formatPhoneNumber(c.phoneNumber)}</span>}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-white text-xs font-semibold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-[#777777]">
              Tidak ada klien terdaftar yang cocok dengan &quot;{query}&quot;
            </div>
          )}

          {/* Opsi Daftarkan Klien Baru */}
          {(!exactMatch || filteredClients.length === 0) && (
            <div className="p-1.5 bg-[#fafafa] border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => handleOpenRegister(query.trim())}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#111111] font-medium hover:bg-[#ebebeb] rounded-[4px] transition-colors flex items-center gap-1.5 border-none cursor-pointer"
              >
                <span className="font-bold text-sm leading-none">+</span>
                <span className="truncate">
                  {query.trim()
                    ? `Daftarkan "${formatClientName(query)}" sebagai Klien Baru`
                    : 'Daftarkan Klien / Pembeli Baru'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Pendaftaran PT Baru */}
      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialName={modalInitialName}
        onCreated={handleClientCreated}
      />
    </div>
  );
}
