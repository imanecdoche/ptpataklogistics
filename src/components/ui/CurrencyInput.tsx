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
  name
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

  const handleFocus = (): void => {
    setIsFocused(true);
    // Jika nilai masih 0, kosongkan agar pengguna bisa langsung mengetik angka baru
    if (displayValue === '0' || value === 0) {
      setDisplayValue('');
    }
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
      className={`relative flex items-center bg-[#f5f5f5] focus-within:bg-[#ebebeb] rounded-[6px] transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Simbol Fixed 'Rp' */}
      <span className="pl-3 pr-1 text-xs font-mono font-medium text-[#888888] select-none pointer-events-none">
        Rp
      </span>

      {/* Input Angka Otomatis 3-Digit Divider */}
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full bg-transparent outline-none border-none py-2 pr-3 text-xs font-mono font-medium text-[#111111] placeholder:text-[#999999]"
      />
    </div>
  );
}
