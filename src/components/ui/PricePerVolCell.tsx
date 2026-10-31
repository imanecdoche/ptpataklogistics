import React from 'react';
import { formatRupiah } from '@/lib/currencyUtils';

interface PricePerVolCellProps {
  unitPrice?: number;
  totalPrice?: number;
  unit?: string;
  quantity?: number;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

/**
 * Komponen sel tabel 2-baris untuk menampilkan harga ritase:
 * - Baris 1: Harga per volume / unit acuan (misal: "Rp 1.600.000 / DT", font-mono text-[11px] text-[#666666])
 * - Baris 2: Total harga volume (misal: "Rp 3.200.000", font-mono font-bold tracking-tight text-[#111111])
 */
export const PricePerVolCell: React.FC<PricePerVolCellProps> = ({
  unitPrice,
  totalPrice,
  unit,
  quantity,
  align = 'left',
  className = ''
}) => {
  const effectiveUnitPrice =
    unitPrice && unitPrice > 0
      ? unitPrice
      : quantity && quantity > 0 && totalPrice && totalPrice > 0
      ? Math.round(totalPrice / quantity)
      : 0;

  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`${alignClass} ${className} whitespace-nowrap`}>
      <span className="text-[11px] font-mono text-[#666666] block leading-tight">
        {formatRupiah(effectiveUnitPrice)}
        {unit ? ` / ${unit}` : ''}
      </span>
      <span className="font-mono font-bold tracking-tight text-[#111111] block mt-0.5 leading-tight">
        {formatRupiah(totalPrice || 0)}
      </span>
    </div>
  );
};
