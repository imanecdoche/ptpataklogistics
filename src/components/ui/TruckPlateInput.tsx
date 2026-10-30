import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Daftar Resmi Kode Wilayah TNKB (Tanda Nomor Kendaraan Bermotor) di Indonesia.
 * Huruf C, I, J, O, U, V tidak pernah menjadi kode wilayah TNKB.
 */
const VALID_REGION_CODES = new Set([
  // Sumatera
  'BL', 'BB', 'BK', 'BA', 'BM', 'BH', 'BD', 'BP', 'BG', 'BN', 'BE',
  // Jawa & Jabodetabek
  'A', 'B', 'D', 'E', 'F', 'T', 'Z',
  'G', 'H', 'K', 'R', 'AA', 'AD',
  'AB',
  'L', 'M', 'N', 'P', 'S', 'W', 'AE', 'AG',
  // Bali & Nusa Tenggara
  'DK', 'DR', 'EA', 'DH', 'EB', 'ED',
  // Kalimantan
  'KB', 'DA', 'KH', 'KT', 'KU',
  // Sulawesi
  'DB', 'DL', 'DM', 'DN', 'DT', 'DD', 'DC', 'DP',
  // Maluku & Papua
  'DE', 'DG', 'PA', 'PB'
]);

/**
 * Ekstrak kode wilayah dari string plat nomor (1 atau 2 huruf di awal)
 */
export function extractRegionCode(plate: string): string {
  const cleaned = plate.trim().toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2})/);
  return match && match[1] ? match[1] : '';
}

/**
 * Validasi apakah kode wilayah termasuk TNKB resmi Indonesia
 */
export function isValidRegionCode(region: string): boolean {
  if (!region) return false;
  return VALID_REGION_CODES.has(region.toUpperCase());
}

/**
 * Mengecek apakah format plat nomor truk lengkap dan valid 100%:
 * - Kode wilayah resmi Indonesia (1-2 huruf)
 * - Nomor registrasi (1-4 digit angka)
 * - Seri belakang (1-3 huruf)
 * Contoh valid: "B 1234 ABC", "A 9021 BA", "DK 812 Z"
 */
export function isCompleteValidTruckPlate(plate: string): boolean {
  if (!plate) return false;
  const parts = plate.trim().toUpperCase().split(/\s+/);
  if (parts.length !== 3) return false;
  const [wilayah, angka, seri] = parts;
  if (!wilayah || !angka || !seri) return false;
  if (!isValidRegionCode(wilayah)) return false;
  if (!/^[0-9]{1,4}$/.test(angka)) return false;
  if (!/^[A-Z]{1,3}$/.test(seri)) return false;
  return true;
}

/**
 * Format otomatis nomor plat truk: HURUF - ANGKA - HURUF dengan auto-spasi
 * Contoh: "b9123pda" -> "B 9123 PDA"
 */
export function formatTruckPlate(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';

  // 1. Ekstrak Wilayah (Maksimal 2 Huruf jika huruf kedua juga A-Z)
  let wilayah = '';
  let rest = '';

  const firstChar = cleaned[0] || '';
  if (/[A-Z]/.test(firstChar)) {
    wilayah += firstChar;
    const secondChar = cleaned[1] || '';
    if (/[A-Z]/.test(secondChar)) {
      wilayah += secondChar;
      rest = cleaned.slice(2);
    } else {
      rest = cleaned.slice(1);
    }
  } else {
    // Jika diketik angka di awal tanpa huruf wilayah
    return cleaned;
  }

  // 2. Ekstrak Nomor Registrasi (1 - 4 Digit Angka)
  let angka = '';
  let i = 0;
  while (i < rest.length && angka.length < 4) {
    const char = rest[i];
    if (char && /[0-9]/.test(char)) {
      angka += char;
      i++;
    } else {
      break;
    }
  }
  rest = rest.slice(i);

  // 3. Ekstrak Seri Belakang (1 - 3 Huruf)
  let seri = '';
  let j = 0;
  while (j < rest.length && seri.length < 3) {
    const char = rest[j];
    if (char && /[A-Z]/.test(char)) {
      seri += char;
      j++;
    } else {
      break;
    }
  }

  // Gabungkan dengan spasi otomatis
  let result = wilayah;
  if (angka) result += ' ' + angka;
  if (seri) result += ' ' + seri;
  return result;
}

export interface TruckSuggestionItem {
  plate: string;
  lastDriverName?: string;
  count: number;
}

interface TruckPlateInputProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  isInvalidExternal?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  knownTrucks?: TruckSuggestionItem[];
  onSelectTruck?: (truck: TruckSuggestionItem) => void;
  variant?: 'default' | 'solid-white';
}

export function TruckPlateInput({
  value,
  onChange,
  required = false,
  isInvalidExternal = false,
  onValidationChange,
  inputRef,
  knownTrucks = [],
  onSelectTruck,
  variant = 'default'
}: TruckPlateInputProps): React.JSX.Element {
  const [isInvalid, setIsInvalid] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sinkronisasi status eksternal (misal saat form disubmit)
  useEffect(() => {
    if (isInvalidExternal) {
      setIsInvalid(true);
      setShowToast(true);
    }
  }, [isInvalidExternal]);

  // Click outside listener untuk menutup popover saran
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validatePlate = (plateStr: string): boolean => {
    if (!plateStr.trim()) return true;
    const region = extractRegionCode(plateStr);
    return isValidRegionCode(region);
  };

  const handleBlur = (): void => {
    if (!value.trim()) {
      setIsInvalid(false);
      setShowToast(false);
      if (onValidationChange) onValidationChange(true);
      return;
    }

    const valid = validatePlate(value);
    if (!valid) {
      setIsInvalid(true);
      setShowToast(true);
      if (onValidationChange) onValidationChange(false);
    } else {
      setIsInvalid(false);
      setShowToast(false);
      if (onValidationChange) onValidationChange(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    const formatted = formatTruckPlate(raw);
    onChange(formatted);
    setIsOpen(true);

    const region = extractRegionCode(formatted);
    if (isValidRegionCode(region)) {
      setIsInvalid(false);
      setShowToast(false);
      if (onValidationChange) onValidationChange(true);
    }
  };

  // Filter daftar saran armada dari database
  const filteredSuggestions = useMemo(() => {
    if (!knownTrucks || knownTrucks.length === 0) return [];
    const query = value.replace(/\s+/g, '').toUpperCase();
    if (!query) {
      // Tampilkan hingga 5 armada teratas saat input kosong
      return knownTrucks.slice(0, 5);
    }
    return knownTrucks
      .filter(t => t.plate.replace(/\s+/g, '').includes(query))
      .slice(0, 5);
  }, [knownTrucks, value]);

  const handleSelectSuggestion = (t: TruckSuggestionItem): void => {
    onChange(t.plate);
    if (onSelectTruck) {
      onSelectTruck(t);
    }
    setIsOpen(false);
    setIsInvalid(false);
    setShowToast(false);
    if (onValidationChange) onValidationChange(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Tab') {
      if (isOpen && filteredSuggestions.length > 0) {
        const top = filteredSuggestions[0];
        if (top) {
          handleSelectSuggestion(top);
        }
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filteredSuggestions.length > 0) {
        e.preventDefault();
        const top = filteredSuggestions[0];
        if (top) {
          handleSelectSuggestion(top);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Toast Merah Filled Teks Hitam di Atas Layar */}
      {showToast && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#ef4444] text-black font-semibold text-xs px-4 py-2.5 rounded-[8px] flex items-center gap-2 select-none border-none animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <svg
            className="w-4 h-4 text-black flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Kode wilayah tidak valid</span>
        </div>
      )}

      {/* Input Field No Plat Truk */}
      <input
        ref={inputRef}
        type="text"
        required={required}
        placeholder="B 9123 PDA"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        className={`w-full outline-none rounded-[6px] px-3 py-2 text-xs font-mono font-medium uppercase tracking-wide transition-colors ${
          isInvalid
            ? 'bg-[#fef2f2] text-red-600 ring-2 ring-inset ring-red-500 font-bold placeholder:text-red-300'
            : variant === 'solid-white'
              ? 'bg-white border-none text-black font-semibold placeholder:text-[#888888]'
              : 'bg-[#f5f5f5] focus:bg-[#ebebeb] text-[#111111] placeholder:text-[#999999]'
        }`}
      />

      {/* Popover Suggestions Armada Database (Solid flat surface, no drop shadow) */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaeaea] rounded-[6px] overflow-hidden z-30 max-h-48 overflow-y-auto">
          <div className="divide-y divide-[#f5f5f5]">
            {filteredSuggestions.map(t => (
              <button
                key={t.plate}
                type="button"
                onMouseDown={e => {
                  e.preventDefault(); // Cegah blur sebelum trigger klik
                  handleSelectSuggestion(t);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[#f5f5f5] transition-colors flex items-center justify-between border-none bg-white cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="font-mono font-bold text-[#111111]">
                    {t.plate}
                  </span>
                  {t.lastDriverName && (
                    <span className="text-[11px] text-[#777777] ml-2">
                      Sopir: {t.lastDriverName}
                    </span>
                  )}
                </div>
                {t.count > 1 && (
                  <span className="text-[10px] text-[#999999] font-mono flex-shrink-0">
                    {t.count}x
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
