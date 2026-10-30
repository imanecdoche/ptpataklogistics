import React, { useState, useEffect } from 'react';
import { formatPhoneBodyLive, formatPhoneNumber } from '@/lib/phoneUtils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '8xx-xxxx-xxxx',
  required = false,
  disabled = false,
  id
}: PhoneInputProps): React.JSX.Element {
  const [displayValue, setDisplayValue] = useState<string>(() => formatPhoneBodyLive(value));

  // Sinkronisasi nilai internal jika props value diubah dari luar
  useEffect(() => {
    setDisplayValue(formatPhoneBodyLive(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value;
    const formattedBody = formatPhoneBodyLive(raw);
    setDisplayValue(formattedBody);

    if (formattedBody) {
      onChange(`+62 ${formattedBody}`);
    } else {
      onChange('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formattedBody = formatPhoneBodyLive(pastedText);
    setDisplayValue(formattedBody);

    if (formattedBody) {
      onChange(`+62 ${formattedBody}`);
    } else {
      onChange('');
    }
  };

  const handleBlur = (): void => {
    // Pastikan nilai tersimpan sudah menggunakan format kanonikal resmi
    if (displayValue) {
      const canonical = formatPhoneNumber(displayValue);
      onChange(canonical);
      setDisplayValue(formatPhoneBodyLive(canonical));
    } else {
      onChange('');
      setDisplayValue('');
    }
  };

  return (
    <div className="relative flex items-center bg-[#f5f5f5] focus-within:bg-[#ebebeb] rounded-[6px] transition-colors">
      {/* Fixed Prefix +62 Murni Tipografi Tanpa Badge */}
      <span className="pl-3 pr-1 text-xs font-mono font-medium text-[#111111] select-none pointer-events-none">
        +62
      </span>

      {/* Input Angka Nomor Telepon */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={handleBlur}
        className="w-full bg-transparent outline-none border-none py-2 pl-1 pr-3 text-xs font-mono text-[#111111] placeholder:text-[#999999]"
      />
    </div>
  );
}
