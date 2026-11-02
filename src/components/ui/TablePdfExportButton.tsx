import React, { useState } from 'react';
import { Icons8Pdf } from '@/components/icons/Icons8';
import {
  TablePdfColumn,
  TablePdfFilterSummary,
  PageOrientation,
} from '@/lib/pdfExportService';
import { TablePdfExportModal } from '@/components/ui/TablePdfExportModal';
import { AddToQuickReportModal } from '@/components/quick_reports/AddToQuickReportModal';
import { QuickReportPdfPreferences } from '@/lib/quickReportService';

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
  showAddToQuickReports?: boolean;

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
  showAddToQuickReports = true,
  getPdfProps,
}: TablePdfExportButtonProps): React.JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickReportModalOpen, setIsQuickReportModalOpen] = useState(false);
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

  const resolveCurrentProps = async () => {
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

          const resolved = {
            title: legacy.metadata?.title || title,
            subtitle: legacy.metadata?.subtitle || subtitle,
            columns: legacyColumns,
            data: legacy.data || data,
            filtersSummary: legacy.metadata?.filtersSummary || filtersSummary,
            grandTotals: legacy.metadata?.grandTotals || grandTotals,
            totalLabel: legacy.metadata?.totalLabel || totalLabel,
            defaultOrientation: legacy.orientation || defaultOrientation,
          };
          setResolvedProps(resolved);
          return resolved;
        }
      } catch (err) {
        console.error('[TablePdfExportButton] Failed to resolve getPdfProps:', err);
      }
    }

    const fallback = {
      title,
      subtitle,
      columns,
      data,
      filtersSummary,
      grandTotals,
      totalLabel,
      defaultOrientation,
    };
    setResolvedProps(fallback);
    return fallback;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await resolveCurrentProps();
    setIsModalOpen(true);
  };

  const handleOpenQuickReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await resolveCurrentProps();
    setIsQuickReportModalOpen(true);
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

  // Baca preferensi tersimpan untuk tableId ini dari localStorage
  const exportType = tableId.replace(/_[a-zA-Z0-9_-]{10,}$/, '');
  let currentPreferences: QuickReportPdfPreferences = {
    paperSize: 'a4',
    orientation: defaultOrientation || (modalData.columns.length >= 6 ? 'landscape' : 'portrait'),
    marginPreset: 'normal',
    fontSize: 7.2,
    showLetterhead: true,
    showFiltersSummary: true,
    showSignatures: true,
    showPageNumbers: true,
    groupByMaterial: true,
    preventTextWrapping: true,
  };

  try {
    const saved = localStorage.getItem(`patak_pdf_pref_${exportType}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      currentPreferences = {
        ...currentPreferences,
        ...parsed,
      };
    }
  } catch (e) {
    // ignore
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5 shrink-0">
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

        {showAddToQuickReports && (
          <button
            type="button"
            onClick={handleOpenQuickReport}
            title="Tambah ke Laporan Cepat"
            aria-label="Tambah ke Laporan Cepat"
            className={`inline-flex items-center justify-center font-semibold transition-all cursor-pointer select-none bg-[#f5f5f5] hover:bg-[#ebebeb] active:bg-[#e0e0e0] text-[#111111] shadow-2xs active:scale-[0.98] whitespace-nowrap shrink-0 border-none ${sizeClasses}`}
          >
            <img
              src="/icons/quick-reports.png"
              alt="Laporan Cepat"
              className={size === 'sm' ? 'w-3.5 h-3.5 object-contain' : 'w-4 h-4 object-contain'}
            />
            <span className="hidden xl:inline whitespace-nowrap">Tambah ke Laporan Cepat</span>
          </button>
        )}
      </div>

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

      {isQuickReportModalOpen && (
        <AddToQuickReportModal
          isOpen={isQuickReportModalOpen}
          onClose={() => setIsQuickReportModalOpen(false)}
          tableId={tableId}
          title={modalData.title}
          subtitle={modalData.subtitle}
          fileName={fileName}
          pdfPreferences={currentPreferences}
          filtersSummary={modalData.filtersSummary}
        />
      )}
    </>
  );
}
