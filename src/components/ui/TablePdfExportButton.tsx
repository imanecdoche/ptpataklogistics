import React, { useState } from 'react';
import { Icons8Pdf } from '@/components/icons/Icons8';
import {
  TablePdfColumn,
  TablePdfFilterSummary,
  PageOrientation,
} from '@/lib/pdfExportService';
import { TablePdfExportModal } from '@/components/ui/TablePdfExportModal';

export interface TablePdfExportButtonProps {
  tableId?: string;
  title?: string;
  subtitle?: string;
  fileName?: string;
  columns?: TablePdfColumn[];
  data?: any[];
  filtersSummary?: TablePdfFilterSummary[];
  grandTotals?: { [columnIndex: number]: string };
  totalLabel?: string;
  defaultOrientation?: PageOrientation;
  className?: string;
  label?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md';

  /**
   * Backward-compatibility for legacy props generator
   */
  getPdfProps?: () => any | Promise<any>;
}

export function TablePdfExportButton({
  tableId = 'table_general',
  title = 'Laporan Data',
  subtitle,
  fileName,
  columns = [],
  data = [],
  filtersSummary,
  grandTotals,
  totalLabel,
  defaultOrientation,
  className = '',
  label = 'Export PDF',
  iconOnly = false,
  size = 'md',
  getPdfProps,
}: TablePdfExportButtonProps): React.JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvedProps, setResolvedProps] = useState<{
    title: string;
    subtitle?: string;
    columns: TablePdfColumn[];
    data: any[];
    filtersSummary?: TablePdfFilterSummary[];
    grandTotals?: { [columnIndex: number]: string };
    totalLabel?: string;
    defaultOrientation?: PageOrientation;
  } | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (getPdfProps) {
      try {
        const legacy = await getPdfProps();
        if (legacy) {
          const legacyColumns: TablePdfColumn[] = (legacy.columns || []).map((c: any) => ({
            header: c.header,
            dataKey: c.accessor || c.dataKey,
            align: c.align || 'left',
            format: c.format,
          }));

          setResolvedProps({
            title: legacy.metadata?.title || title,
            subtitle: legacy.metadata?.subtitle || subtitle,
            columns: legacyColumns,
            data: legacy.data || data,
            filtersSummary: legacy.metadata?.filtersSummary || filtersSummary,
            grandTotals: legacy.metadata?.grandTotals || grandTotals,
            totalLabel: legacy.metadata?.totalLabel || totalLabel,
            defaultOrientation: legacy.orientation || defaultOrientation,
          });
          setIsModalOpen(true);
          return;
        }
      } catch (err) {
        console.error('[TablePdfExportButton] Failed to resolve getPdfProps:', err);
      }
    }

    setResolvedProps({
      title,
      subtitle,
      columns,
      data,
      filtersSummary,
      grandTotals,
      totalLabel,
      defaultOrientation,
    });
    setIsModalOpen(true);
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-[11px] rounded-[6px] gap-1.5'
      : 'px-3 py-2 text-xs rounded-[6px] gap-2';

  const modalData = resolvedProps || {
    title,
    subtitle,
    columns,
    data,
    filtersSummary,
    grandTotals,
    totalLabel,
    defaultOrientation,
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={label}
        aria-label={label}
        className={`inline-flex items-center justify-center font-semibold transition-all cursor-pointer select-none bg-[#f5f5f5] hover:bg-[#ebebeb] active:bg-[#e0e0e0] text-[#111111] shadow-2xs active:scale-[0.98] whitespace-nowrap shrink-0 border-none ${sizeClasses} ${className}`}
      >
        <Icons8Pdf size={size === 'sm' ? 15 : 17} className="text-[#111111] shrink-0" />
        {!iconOnly && (
          <span className="hidden sm:inline whitespace-nowrap">{label}</span>
        )}
      </button>

      {isModalOpen && (
        <TablePdfExportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tableId={tableId}
          title={modalData.title}
          subtitle={modalData.subtitle}
          fileName={fileName}
          columns={modalData.columns}
          data={modalData.data}
          filtersSummary={modalData.filtersSummary}
          grandTotals={modalData.grandTotals}
          totalLabel={modalData.totalLabel}
          defaultOrientation={modalData.defaultOrientation}
        />
      )}
    </>
  );
}
