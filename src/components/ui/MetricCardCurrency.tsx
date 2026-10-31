import React, { useRef, useState, useLayoutEffect } from 'react';

interface MetricCardCurrencyProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorClassName?: string;
  forceCompact?: boolean;
}

/**
 * Komponen khusus untuk menampilkan angka nominal uang pada Kartu Metrik (KPI Cards)
 * Mematuhi Rule 99 dan Rule 116:
 * 1. Font sans-serif tebal (font-bold tracking-tight), tanpa font-mono.
 * 2. Simbol "Rp" lebih kecil (text-xs / text-sm), font-semibold, semi-transparan (opacity-50).
 * 3. Menempel rapat tanpa spasi dengan jarak mikro (gap-0.5).
 * 4. Untuk nilai negatif, tanda minus diletakkan paling depan sebelum "Rp" (-Rp500.000) dengan warna merah (#cf1124).
 * 5. Deteksi overflow otomatis: jika nominal terlalu panjang untuk wadah / tidak muat,
 *    otomatis dipotong 3 digit nol terakhir dengan akhiran 'K' (contoh: 1.000.000.000 -> 1.000.000K).
 */
export function MetricCardCurrency({
  amount,
  className = '',
  size = 'lg',
  colorClassName,
  forceCompact = false
}: MetricCardCurrencyProps): React.JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(Math.round(amount || 0));
  const fullFormatted = absVal.toLocaleString('id-ID');

  // Format ringkas K (potong 3 digit nol)
  const compactVal = Math.round(absVal / 1000);
  const compactFormatted = compactVal.toLocaleString('id-ID');
  const canCompact = absVal >= 1000;

  const sizeClass =
    size === 'xl'
      ? 'text-2xl'
      : size === 'lg'
      ? 'text-xl md:text-2xl'
      : size === 'md'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const rpSizeClass = size === 'xl' ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs';

  useLayoutEffect(() => {
    if (forceCompact) return;

    const checkOverflow = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;

      const parent = container.parentElement;
      const availableWidth = parent ? parent.clientWidth : container.clientWidth;
      const fullWidth = measure.scrollWidth;

      // Jika teks penuh melebihi ruang yang tersedia, aktifkan format ringkas K
      if (availableWidth > 0 && fullWidth > availableWidth) {
        setIsOverflowing(true);
      } else {
        setIsOverflowing(false);
      }
    };

    checkOverflow();

    const parentEl = containerRef.current?.parentElement;
    if (!parentEl) return;

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(parentEl);
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [amount, forceCompact, size]);

  const shouldUseCompact = canCompact && (forceCompact || isOverflowing);
  const displayValue = shouldUseCompact ? compactFormatted : fullFormatted;
  const fullTooltip = `${isNegative ? '-Rp ' : 'Rp '}${fullFormatted}`;

  return (
    <span
      ref={containerRef}
      title={fullTooltip}
      className={`inline-flex items-baseline gap-0.5 font-bold tracking-tight select-text max-w-full ${
        colorClassName || (isNegative ? 'text-[#cf1124]' : 'text-[#111111]')
      } ${sizeClass} ${className}`}
    >
      {/* Invisible measurement element to gauge full text width without flicker */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible fixed left-[-9999px] top-[-9999px] pointer-events-none whitespace-nowrap inline-flex items-baseline gap-0.5"
      >
        {isNegative && <span className="font-bold -mr-0.5">-</span>}
        <span className={`${rpSizeClass} font-semibold opacity-50`}>Rp</span>
        <span>{fullFormatted}</span>
      </span>

      {isNegative && <span className="font-bold -mr-0.5">-</span>}
      <span className={`${rpSizeClass} font-semibold opacity-50 select-none`}>Rp</span>
      <span className="truncate">{displayValue}</span>
      {shouldUseCompact && (
        <span className="font-bold text-[0.85em] opacity-90 select-none -ml-0.5">K</span>
      )}
    </span>
  );
}
