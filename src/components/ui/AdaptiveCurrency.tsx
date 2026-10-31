import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { formatSimplifiedCurrency } from '@/lib/currencyUtils';

interface AdaptiveCurrencyProps {
  amount: number;
  className?: string;
  forceCompact?: boolean;
  prefix?: string; // Default: 'Rp'
  withSign?: boolean; // Tampilkan tanda plus (+) jika positif
}

/**
 * Komponen Universal Teks Nominal Mata Uang Adaptif (Auto-Simplification).
 * Mematuhi Aturan 125:
 * 1. Menampilkan format nominal Rupiah penuh standar (e.g. "Rp 125.230.000.000").
 * 2. Menggunakan ResizeObserver untuk mendeteksi kapasitas ruang parent wadah pembungkus.
 * 3. JIKA ruang parent sempit / teks kepanjangan dan mentok komponen lain,
 *    otomatis disederhanakan berjenjang menggunakan akhiran:
 *    - Ribuan: 'K' (e.g. Rp 750K)
 *    - Jutaan: 'Jt' (e.g. Rp 12,5 Jt; Rp 50 Jt)
 *    - Miliaran: 'Mil' (e.g. Rp 125,23 Mil)
 *    - Triliunan: 'Tri' (e.g. Rp 1,5 Tri)
 * 4. Atribut title selalu memuat nominal utuh presisi tanpa singkatan untuk kenyamanan tooltip hover.
 */
export function AdaptiveCurrency({
  amount,
  className = '',
  forceCompact = false,
  prefix = 'Rp',
  withSign = false
}: AdaptiveCurrencyProps): React.JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  const numVal = amount || 0;
  const isNegative = numVal < 0;
  const isPositive = numVal > 0;
  const absVal = Math.abs(Math.round(numVal));
  const fullFormatted = absVal.toLocaleString('id-ID');

  const signStr = isNegative ? '- ' : (withSign && isPositive ? '+ ' : '');
  const fullText = `${signStr}${prefix} ${fullFormatted}`;

  // Format ringkas berjenjang (K, Jt, Mil, Tri)
  const simplified = useMemo(() => formatSimplifiedCurrency(numVal), [numVal]);
  const canCompact = absVal >= 1000;

  useLayoutEffect(() => {
    if (forceCompact) return;

    const checkOverflow = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;

      const parent = container.parentElement;
      const availableWidth = parent ? parent.clientWidth : container.clientWidth;
      const fullWidth = measure.scrollWidth;

      // Jika teks nominal melebihi lebar wadah yang tersedia, aktifkan format ringkas
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
  }, [amount, forceCompact]);

  const shouldUseCompact = canCompact && (forceCompact || isOverflowing);

  return (
    <span
      ref={containerRef}
      title={fullText}
      className={`inline-flex items-baseline gap-0.5 whitespace-nowrap select-text ${className}`}
    >
      {/* Invisible measurement element to gauge full text width without layout thrashing */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible fixed left-[-9999px] top-[-9999px] pointer-events-none whitespace-nowrap inline-flex items-baseline"
      >
        {fullText}
      </span>

      {isNegative && <span className="font-semibold -mr-0.5">-</span>}
      {withSign && isPositive && <span className="font-semibold -mr-0.5">+</span>}
      {prefix && <span className="opacity-70 text-[0.85em] font-semibold">{prefix} </span>}
      <span className="truncate">
        {shouldUseCompact ? simplified.value : fullFormatted}
      </span>
      {shouldUseCompact && simplified.suffix && (
        <span className="font-semibold text-[0.85em] opacity-90 select-none ml-0.5">
          {simplified.suffix}
        </span>
      )}
    </span>
  );
}
