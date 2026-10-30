import React from 'react';

interface MetricCardCurrencyProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorClassName?: string;
}

/**
 * Komponen khusus untuk menampilkan angka nominal uang pada Kartu Metrik (KPI Cards)
 * Mematuhi Rule 99:
 * 1. Font sans-serif tebal (font-bold tracking-tight), tanpa font-mono.
 * 2. Simbol "Rp" lebih kecil (text-xs / text-sm), font-semibold, semi-transparan (opacity-50).
 * 3. Menempel rapat tanpa spasi dengan jarak mikro (gap-0.5).
 * 4. Untuk nilai negatif, tanda minus diletakkan paling depan sebelum "Rp" (-Rp500.000) dengan warna merah (#cf1124).
 */
export function MetricCardCurrency({
  amount,
  className = '',
  size = 'lg',
  colorClassName
}: MetricCardCurrencyProps): React.JSX.Element {
  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(Math.round(amount || 0));
  const formatted = absVal.toLocaleString('id-ID');

  const sizeClass =
    size === 'xl'
      ? 'text-2xl'
      : size === 'lg'
      ? 'text-xl md:text-2xl'
      : size === 'md'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const rpSizeClass = size === 'xl' ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs';

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 font-bold tracking-tight select-text ${
        colorClassName || (isNegative ? 'text-[#cf1124]' : 'text-[#111111]')
      } ${sizeClass} ${className}`}
    >
      {isNegative && <span className="font-bold -mr-0.5">-</span>}
      <span className={`${rpSizeClass} font-semibold opacity-50 select-none`}>Rp</span>
      <span>{formatted}</span>
    </span>
  );
}
