import React from 'react';

interface DynamicEntityTextProps {
  name: string;
  isOrphan?: boolean;
  tooltipText?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Komponen teks nama entitas dinamis (Klien, Proyek, Material, Kuari, Armada, Supir)
 * Menampilkan nama terbaru dari Master, atau nama historis dengan icon peringatan
 * segitiga merah jika ID master tidak ditemukan/terhapus.
 */
export function DynamicEntityText({
  name,
  isOrphan = false,
  tooltipText = 'Entitas master tidak ditemukan atau telah dihapus',
  className = '',
  iconClassName = ''
}: DynamicEntityTextProps): React.JSX.Element {
  if (!name || name === '-') {
    return <span className={className}>-</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 max-w-full align-middle">
      <span className={`truncate ${className}`}>{name}</span>
      {isOrphan && (
        <span
          className="relative group/warn inline-flex items-center flex-shrink-0 cursor-help"
          title={tooltipText}
        >
          <img
            src="/icons/warning-triangle.png"
            alt="Peringatan Master"
            className={`w-3.5 h-3.5 object-contain inline-block align-middle ${iconClassName}`}
          />
          {/* Tooltip Mengambang saat Kursor Di-hover */}
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/warn:flex items-center bg-[#111111] text-white text-[10px] font-sans font-medium px-2 py-1 rounded-[4px] shadow-xl whitespace-nowrap z-50 border-none">
            {tooltipText}
          </span>
        </span>
      )}
    </span>
  );
}
