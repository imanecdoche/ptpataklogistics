import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type PaperSize = 'a4' | 'f4' | 'letter' | 'legal' | 'custom';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'compact' | 'wide' | 'custom';

export interface TablePdfColumn {
  header: string;
  dataKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: number; // Approximate width weight in mm
  format?: (value: any, row: any, index: number) => string;
}

export interface TablePdfFilterSummary {
  label: string;
  value: string;
}

export interface TablePdfOptions {
  title: string;
  subtitle?: string;
  fileName?: string;
  columns: TablePdfColumn[];
  data: any[];
  // Settings
  paperSize?: PaperSize;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation?: PageOrientation;
  marginPreset?: MarginPreset;
  customMarginMm?: number;
  // Feature Toggles
  showLetterhead?: boolean;
  showFiltersSummary?: boolean;
  showSignatures?: boolean;
  showPageNumbers?: boolean;
  // Data additions
  filtersSummary?: TablePdfFilterSummary[];
  grandTotals?: { [columnIndex: number]: string };
  totalLabel?: string;
  customNotes?: string;
}

/**
 * Standard paper dimensions in mm [width, height] in portrait orientation.
 */
export const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'custom'>, [number, number]> = {
  a4: [210, 297],
  f4: [215, 330], // Standar F4 / Folio Indonesia
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
};

export const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, number> = {
  compact: 6,
  normal: 10,
  wide: 15,
};

/**
 * Resolves paper format tuple [width, height] in portrait for jsPDF initialization
 */
function resolvePaperFormat(options: TablePdfOptions): [number, number] {
  if (options.paperSize === 'custom') {
    const w = Math.max(100, options.customWidthMm || 210);
    const h = Math.max(100, options.customHeightMm || 297);
    return [w, h];
  }
  const sizeKey = options.paperSize || 'a4';
  return PAPER_DIMENSIONS[sizeKey] || PAPER_DIMENSIONS.a4;
}

/**
 * Resolves margin in mm
 */
function resolveMargin(options: TablePdfOptions): number {
  if (options.marginPreset === 'custom') {
    return Math.max(4, options.customMarginMm || 10);
  }
  const presetKey = options.marginPreset || 'normal';
  return MARGIN_PRESETS[presetKey] || 10;
}

/**
 * Generates an official, publication-grade vector PDF document from tabular data.
 */
export function generateTablePdf(options: TablePdfOptions): jsPDF {
  const orientation = options.orientation || 'landscape';
  const paperFormat = resolvePaperFormat(options);
  const marginMm = resolveMargin(options);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperFormat,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;

  let currentY = marginMm;

  // 1. KOP SURAT RESMI PT PATAK ABADI JAYA
  if (options.showLetterhead !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 17, 17);
    doc.text('PT PATAK ABADI JAYA', marginMm, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      'Sistem Operasional Logistik, Distribusi Armada, Finansial & Kasbon Lapangan',
      marginMm,
      currentY + 8.5
    );

    // Metadata Waktu Cetak di Sisi Kanan Kop
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Waktu Cetak: ${nowStr}`, pageWidth - marginMm, currentY + 4, {
      align: 'right',
    });
    doc.text('Status: Dokumen Resmi Terverifikasi', pageWidth - marginMm, currentY + 8.5, {
      align: 'right',
    });

    // Garis Kop Formal (Garis tebal atas, garis tipis bawah)
    currentY += 12;
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.65);
    doc.line(marginMm, currentY, pageWidth - marginMm, currentY);

    currentY += 0.8;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.line(marginMm, currentY, pageWidth - marginMm, currentY);

    currentY += 3.5;
  }

  // 2. JUDUL DOKUMEN & SUBTITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 17, 17);
  doc.text((options.title || 'Laporan Data').toUpperCase(), marginMm, currentY + 3.5);

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(options.subtitle, marginMm, currentY + 7.5);
    currentY += 9.5;
  } else {
    currentY += 5.5;
  }

  // 3. RINGKASAN FILTER & PENCARIAN AKTIF
  if (
    options.showFiltersSummary !== false &&
    options.filtersSummary &&
    options.filtersSummary.length > 0
  ) {
    currentY += 1;
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.2);

    const filterTexts = options.filtersSummary.map(f => `${f.label}: ${f.value}`).join('  |  ');
    const filterBoxHeight = 6.5;

    doc.rect(marginMm, currentY, contentWidth, filterBoxHeight, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(`Kriteria Filter: ${filterTexts}`, marginMm + 3, currentY + 4.2);

    currentY += filterBoxHeight + 2;
  }

  // 4. SUSUN DATA TABEL
  const headers = options.columns.map(col => col.header.toUpperCase());

  const rows = options.data.map((row, rIdx) => {
    return options.columns.map(col => {
      if (col.format) {
        return col.format(col.dataKey ? row[col.dataKey] : undefined, row, rIdx);
      }
      if (col.dataKey && row[col.dataKey] !== undefined && row[col.dataKey] !== null) {
        return String(row[col.dataKey]);
      }
      return '-';
    });
  });

  // Footer / Grand Total Baris
  let footRows: string[][] | undefined = undefined;
  if (options.grandTotals && options.data.length > 0) {
    const footRow = options.columns.map((_col, cIdx) => {
      const totalVal = options.grandTotals?.[cIdx];
      if (cIdx === 0 && !totalVal) {
        return options.totalLabel || 'TOTAL';
      }
      return totalVal || '';
    });
    footRows = [footRow];
  }

  // Column styles mapping
  const columnStylesMap: { [key: number]: any } = {};
  options.columns.forEach((col, idx) => {
    columnStylesMap[idx] = {
      halign: col.align || 'left',
    };
  });

  // 5. RENDER TABEL DENGAN AUTO-TABLE
  autoTable(doc, {
    startY: currentY + 1,
    margin: {
      left: marginMm,
      right: marginMm,
      top: marginMm,
      bottom: marginMm + 10,
    },
    head: [headers],
    body: rows.length > 0 ? rows : [['Tidak ada data yang sesuai dengan filter / pencarian.']],
    foot: footRows,
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [20, 20, 20],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [180, 180, 180],
      lineWidth: 0.25,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    footStyles: {
      fillColor: [234, 234, 234],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
    },
    columnStyles: columnStylesMap,
  });

  let postTableY = (doc as any).lastAutoTable.finalY + 8;

  // 6. CATATAN KUSTOM (JIKA ADA)
  if (options.customNotes && options.customNotes.trim()) {
    if (postTableY + 12 > pageHeight - marginMm - 20) {
      doc.addPage();
      postTableY = marginMm + 10;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(`Catatan: ${options.customNotes.trim()}`, marginMm, postTableY);
    postTableY += 8;
  }

  // 7. BLOK TANDA TANGAN FORMAL
  if (options.showSignatures !== false) {
    const signBlockHeight = 35;
    if (postTableY + signBlockHeight > pageHeight - marginMm - 10) {
      doc.addPage();
      postTableY = marginMm + 10;
    }

    const signWidth = 65;
    const leftX = marginMm + 10;
    const rightX = pageWidth - marginMm - signWidth - 10;

    // Blok Kiri
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text('Dibuat & Diverifikasi Oleh,', leftX + signWidth / 2, postTableY, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 100, 100);
    doc.text('Administrasi & Operasional', leftX + signWidth / 2, postTableY + 3.8, {
      align: 'center',
    });

    const lineY = postTableY + 24;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(leftX + 5, lineY, leftX + signWidth - 5, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text('( ................................................... )', leftX + signWidth / 2, lineY + 4, {
      align: 'center',
    });

    // Blok Kanan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text('Mengetahui & Menyetujui,', rightX + signWidth / 2, postTableY, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 100, 100);
    doc.text('Manajemen PT Patak Abadi Jaya', rightX + signWidth / 2, postTableY + 3.8, {
      align: 'center',
    });

    doc.line(rightX + 5, lineY, rightX + signWidth - 5, lineY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text('( ................................................... )', rightX + signWidth / 2, lineY + 4, {
      align: 'center',
    });
  }

  // 8. PENOMORAN HALAMAN DAN TANDA AIR FOOTER DI SETIAP HALAMAN
  if (options.showPageNumbers !== false) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(120, 120, 120);

      // Kiri: identitas dokumen
      doc.text(
        'PT Patak Abadi Jaya • Sistem Logistik & Rekapitulasi Finansial',
        marginMm,
        pageHeight - 5
      );

      // Kanan: Penomoran halaman
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginMm, pageHeight - 5, {
        align: 'right',
      });
    }
  }

  return doc;
}

/**
 * Generates an in-memory Blob URL for interactive iframe preview.
 * Returns a revokable Object URL.
 */
export function exportTableToPdfBlobUrl(options: TablePdfOptions): string {
  const doc = generateTablePdf(options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Triggers instant browser download of the generated PDF file.
 */
export function downloadTablePdf(options: TablePdfOptions, fallbackFileName?: string): void {
  const doc = generateTablePdf(options);
  const sanitizedTitle = (options.title || 'Laporan')
    .trim()
    .replace(/[^a-zA-Z0-9_\s-]/g, '')
    .replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = options.fileName || fallbackFileName || `${sanitizedTitle}_${dateStr}.pdf`;

  doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
