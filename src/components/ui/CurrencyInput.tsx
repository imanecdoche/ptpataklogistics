import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  variant?: 'default' | 'solid-white';
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Komponen Input Mata Uang (Currency Input) Rupiah Baku
 * - Simbol tetap 'Rp' di sisi kiri dalam kotak input
 * - Pemisah ribuan 3-digit otomatis (titik '.') saat pengguna mengetik
 * - Mengembalikan nilai numerik murni ke parent via onChange
 * - Borderless murni selaras standar desain Vercel & hukum workspace
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  variant = 'default',
  inputRef,
  onKeyDown,
  onFocus
}: CurrencyInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(() => (value ? value.toLocaleString('id-ID') : '0'));

  useEffect(() => {
    // Hanya sinkronisasi dari luar jika tidak sedang diedit/fokus oleh user
    if (!isFocused) {
      setDisplayValue(value ? value.toLocaleString('id-ID') : '0');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      // Biarkan kosong saat sedang dihapus, jangan paksa kembali jadi 0
      setDisplayValue('');
      onChange(0);
      return;
    }
    const num = parseInt(rawDigits, 10);
    setDisplayValue(num.toLocaleString('id-ID'));
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
    setIsFocused(true);
    // Jika nilai masih 0, kosongkan agar pengguna bisa langsung mengetik angka baru
    if (displayValue === '0' || value === 0) {
      setDisplayValue('');
    } else {
      const target = e.currentTarget;
      setTimeout(() => target.select(), 0);
    }
    if (onFocus) onFocus(e);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    // Saat unfocused dan tidak ada angka, baru kembalikan ke '0'
    if (!displayValue || displayValue.trim() === '') {
      setDisplayValue('0');
      onChange(0);
    }
  };

  return (
    <div
      className={`relative flex items-center rounded-[6px] transition-colors ${
        variant === 'solid-white'
          ? 'bg-white border-none text-black font-semibold'
          : 'bg-[#f5f5f5] focus-within:bg-[#ebebeb]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Simbol Fixed 'Rp' */}
      <span
        className={`pl-3 pr-1 text-xs font-mono select-none pointer-events-none ${
          variant === 'solid-white' ? 'text-black font-semibold' : 'text-[#888888] font-medium'
        }`}
      >
        Rp
      </span>

      {/* Input Angka Otomatis 3-Digit Divider */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full bg-transparent outline-none border-none py-2 pr-3 text-xs font-mono ${
          variant === 'solid-white'
            ? 'text-black font-semibold placeholder:text-[#888888]'
            : 'text-[#111111] font-medium placeholder:text-[#999999]'
        }`}
      />
    </div>
  );
}
