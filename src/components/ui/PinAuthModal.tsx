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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-[12px] border border-[#eaeaea] shadow-xl overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Dialog */}
        <div className="p-5 md:p-6 border-b border-[#eaeaea]">
          <h3 className="text-base font-semibold text-[#111111]">
            {title}
          </h3>
          <p className="text-xs text-[#666666] mt-1 leading-relaxed">
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

        {/* Body: 7 Kotak Digit Terpisah dengan Masking Titik (●) */}
        <div className="p-5 md:p-6 bg-[#fafafa]/50 flex flex-col items-center">
          <label className="text-xs font-semibold text-[#444444] mb-3 self-start">
            Masukkan Sandi Otorisasi (7 Digit):
          </label>

          <div className={`flex items-center justify-center gap-2 sm:gap-2.5 transition-transform duration-100 ${
            isShaking ? 'translate-x-1 animate-pulse ring-1 ring-red-400 rounded-lg p-1' : ''
          }`}>
            {digits.map((digit, idx) => (
              <div
                key={idx}
                onClick={() => inputRefs.current[idx]?.focus()}
                className={`relative w-10 h-12 sm:w-11 sm:h-13 bg-white rounded-[8px] border flex items-center justify-center cursor-text transition-all ${
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
                  <span className="w-3 h-3 rounded-full bg-[#111111] pointer-events-none transform scale-110" />
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

        {/* Footer Tombol Aksi */}
        <div className="p-4 px-5 md:px-6 bg-white border-t border-[#eaeaea] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#555555] bg-white border border-[#dddddd] rounded-[6px] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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
