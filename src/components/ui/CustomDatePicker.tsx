import React, { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  className?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'solid-white';
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function CustomDatePicker({
  value,
  onChange,
  className = '',
  fullWidth = false,
  variant = 'default'
}: CustomDatePickerProps): React.JSX.Element {
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Parse YYYY-MM-DD ke objek Date lokal
  const parseDate = (str: string): Date => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const selectedDate = parseDate(value);
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-indexed

  // Sinkronisasi view saat value berubah
  useEffect(() => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  const handleOpen = (): void => {
    setIsRendered(true);
    setIsClosing(true);
    // Request animation frame agar transisi awal ke state terbuka berjalan mulus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsClosing(false);
      });
    });
  };

  const handleClose = (): void => {
    setIsClosing(true);
    setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      setDragOffset(0);
    }, 220);
  };

  // Tutup dropdown saat klik di luar (desktop popover)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isRendered && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRendered, isClosing]);

  // Format tampilan tombol trigger (contoh: "30 Okt 2026")
  const formatTriggerLabel = (d: Date): string => {
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()]?.slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Navigasi Bulan
  const handlePrevMonth = (): void => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (): void => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Tombol Pintas Hari Ini
  const handleSetToday = (): void => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    handleClose();
  };

  // Kalkulasi hari dalam bulan
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Minggu

  const handleSelectDay = (day: number): void => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    handleClose();
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number): boolean => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  // Touch gesture swipe down to close
  const handleTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) {
      touchStartY.current = touch.clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) {
      const diff = touch.clientY - touchStartY.current;
      if (diff > 0) {
        setDragOffset(diff);
      }
    }
  };

  const handleTouchEnd = (): void => {
    if (dragOffset > 70) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full block' : 'inline-block'} ${className}`}>
      {/* Tombol Pemicu Custom Date Picker */}
      <button
        type="button"
        onClick={() => {
          if (isRendered) {
            handleClose();
          } else {
            handleOpen();
          }
        }}
        className={`${
          fullWidth
            ? 'w-full px-3 py-2 justify-between'
            : 'px-3 py-1.5'
        } ${
          variant === 'solid-white'
            ? 'bg-white border-none text-black font-semibold hover:bg-white/90'
            : 'bg-[#f5f5f5] hover:bg-[#ebebeb] active:bg-[#e5e5e5] text-[#111111] border-none'
        } outline-none rounded-[6px] text-xs font-mono font-medium transition-colors flex items-center gap-2 select-none`}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 ${variant === 'solid-white' ? 'text-black' : 'text-[#666666]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatTriggerLabel(selectedDate)}</span>
        </div>

        {fullWidth && (
          <span className={`text-[10px] font-sans ${variant === 'solid-white' ? 'text-black font-medium' : 'text-[#888888]'}`}>Ubah</span>
        )}
      </button>

      {/* Popover / Modal Kalender dengan Animasi Buka Tutup Halus */}
      {isRendered && (
        <>
          {/* Mobile Backdrop Dim dengan Transisi Fade */}
          <div
            className={`md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
              isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={handleClose}
          />

          {/* Kalender Container dengan Animasi Slide & Scale */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
            className={`fixed md:absolute z-50 bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-0 md:top-full md:mt-1.5 w-full md:w-72 bg-white rounded-t-[16px] md:rounded-[10px] p-4 select-none shadow-xl md:shadow-lg border border-[#eaeaea] transition-all duration-200 ease-out ${
              isClosing
                ? 'translate-y-full md:translate-y-[-8px] opacity-0 pointer-events-none'
                : 'translate-y-0 md:translate-y-0 opacity-100'
            }`}
          >
            {/* Drag Handle Bar di Layar Mobile */}
            <div className="md:hidden w-10 h-1 bg-[#dddddd] rounded-full mx-auto mb-3" />

            {/* Header Kalender: Bulan/Tahun & Tombol Navigasi */}
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <span className="text-xs font-semibold text-[#111111]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-[4px] hover:bg-[#f5f5f5] text-[#555555] transition-colors cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-[4px] hover:bg-[#f5f5f5] text-[#555555] transition-colors cursor-pointer"
                  aria-label="Bulan Berikutnya"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Nama Hari */}
            <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
              {DAY_NAMES.map(name => (
                <span key={name} className="text-[10px] font-medium text-[#888888]">
                  {name}
                </span>
              ))}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1 pt-1 text-center text-xs font-mono">
              {/* Padding hari awal bulan */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-7 w-7" />
              ))}

              {/* Tanggal Hari */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const active = isSelected(dayNumber);
                const today = isToday(dayNumber);

                return (
                  <button
                    key={dayNumber}
                    type="button"
                    onClick={() => handleSelectDay(dayNumber)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#171717] text-white font-bold'
                        : today
                        ? 'bg-[#f0f0f0] text-[#111111] font-bold hover:bg-[#e5e5e5]'
                        : 'text-[#333333] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Footer: Tombol Hari Ini & Tutup (Mobile) */}
            <div className="pt-3 mt-3 border-t border-[#eaeaea] flex items-center justify-between">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-xs font-medium text-[#111111] hover:underline cursor-pointer"
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-[#888888] hover:text-[#111111] md:hidden cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

