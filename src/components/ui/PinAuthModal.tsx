import React, { useState, useRef, useEffect } from 'react';

export const DEFAULT_AUTH_PIN = '2008005';

interface PinAuthModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetLabel?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function PinAuthModal({
  isOpen,
  title,
  description,
  targetLabel,
  confirmText = 'Konfirmasi Otorisasi',
  cancelText = 'Batal',
  isDestructive = false,
  onSuccess,
  onClose
}: PinAuthModalProps): React.JSX.Element | null {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '', '']);
      setErrorMsg('');
      setIsShaking(false);
      // Auto-focus kotak digit pertama setelah modal render
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Hanya izinkan angka
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg('');

    if (char && index < 6) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 6) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 7);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 7; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setErrorMsg('');

    const nextIndex = Math.min(pasted.length, 6);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = () => {
    const enteredPin = digits.join('');
    if (enteredPin.length < 7) {
      setErrorMsg('Masukkan 7 digit sandi otorisasi lengkap.');
      triggerShake();
      return;
    }

    if (enteredPin === DEFAULT_AUTH_PIN) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Sandi otorisasi salah. Periksa kembali sandi Anda.');
      triggerShake();
      setDigits(['', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.([40, 60, 40]);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Surface: Mobile Bottom Sheet Drawer */}
      <div 
        className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Dialog Bersih: Judul di tengah pada mobile */}
        <div className="p-4 md:p-6 border-b border-[#eaeaea] flex-shrink-0">
          <h3 className="text-sm md:text-base font-semibold text-[#111111] text-center md:text-left">
            {title}
          </h3>
          <p className="text-xs text-[#666666] mt-1 leading-relaxed text-center md:text-left">
            {description}
          </p>
          {targetLabel && (
            <div className="mt-3 p-2.5 bg-[#f9f9f9] rounded-[6px] border border-[#eeeeee]">
              <span className="text-[11px] text-[#777777] block font-medium">Target Otorisasi:</span>
              <span className="text-xs font-bold text-[#111111] font-mono block mt-0.5 break-all">
                {targetLabel}
              </span>
            </div>
          )}
        </div>

        {/* Body: Scrollable */}
        <div className="p-5 md:p-6 bg-[#fafafa]/50 flex flex-col items-center overflow-y-auto flex-1 overscroll-contain">
          <label className="text-xs font-semibold text-[#444444] mb-3 self-center md:self-start">
            Masukkan Sandi Otorisasi (7 Digit):
          </label>

          <div className={`flex items-center justify-center gap-1.5 sm:gap-2.5 transition-transform duration-100 ${
            isShaking ? 'translate-x-1 animate-pulse ring-1 ring-red-400 rounded-lg p-1' : ''
          }`}>
            {digits.map((digit, idx) => (
              <div
                key={idx}
                onClick={() => inputRefs.current[idx]?.focus()}
                className={`relative w-9 h-11 sm:w-11 sm:h-13 bg-white rounded-[8px] border flex items-center justify-center cursor-text transition-all ${
                  inputRefs.current[idx] === document.activeElement
                    ? 'border-[#111111] ring-2 ring-[#111111]/10'
                    : digit
                    ? 'border-[#bbbbbb]'
                    : 'border-[#dddddd]'
                }`}
              >
                {/* Hidden / Transparent Native Input untuk Mobile Keyboard & Accessibility */}
                <input
                  ref={el => {
                    inputRefs.current[idx] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ke-${idx + 1}`}
                  className="absolute inset-0 w-full h-full opacity-0 text-center cursor-text"
                />

                {/* Tampilan Visual Masking Titik (Hidden angka jadi titik) */}
                {digit ? (
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#111111] pointer-events-none transform scale-110" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d0d0d0] pointer-events-none" />
                )}
              </div>
            ))}
          </div>

          {errorMsg ? (
            <p className="text-xs font-medium text-[#cf1124] mt-3 text-center">
              {errorMsg}
            </p>
          ) : (
            <p className="text-[11px] text-[#888888] mt-3 text-center">
              Aksi ini dilindungi keamanan sistem demi integritas data operasional.
            </p>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-2.5 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#555555] bg-white border border-[#dddddd] rounded-[8px] md:rounded-[6px] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white rounded-[8px] md:rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDestructive
                ? 'bg-[#cf1124] hover:bg-[#b00e1e]'
                : 'bg-[#111111] hover:bg-[#2b2b2b]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
