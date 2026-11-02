import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from '@/lib/currencyUtils';

export type PaperSize = 'a4' | 'f4' | 'letter' | 'legal' | 'continuous' | 'custom';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'compact' | 'wide' | 'custom';

export interface TablePdfColumn {
  header: string;
  dataKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string; // Approximate width weight in mm or percentage
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
  continuousWidthMm?: number;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation?: PageOrientation;
  marginPreset?: MarginPreset;
  customMarginMm?: number;
  fontSize?: number; // Custom font size in pt (default: 7.2)
  columnWidths?: Record<string, number>; // Custom manual column widths in mm (key: dataKey or col index)
  // Feature Toggles
  showLetterhead?: boolean;
  showFiltersSummary?: boolean;
  showSignatures?: boolean;
  showPageNumbers?: boolean;
  groupByMaterial?: boolean;
  preventTextWrapping?: boolean;
  // Data additions
  filtersSummary?: TablePdfFilterSummary[];
  grandTotals?: { [columnIndex: number]: string };
  totalLabel?: string;
  customNotes?: string;
}

/**
 * Standard paper dimensions in mm [width, height] in portrait orientation.
 */
export const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'custom' | 'continuous'>, [number, number]> = {
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
    const w = Math.max(30, options.customWidthMm || 210);
    const h = Math.max(30, options.customHeightMm || 297);
    return [w, h];
  }
  if (options.paperSize === 'continuous') {
    const rollWidth = options.orientation === 'portrait' ? 210 : 297;
    return [rollWidth, 297];
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
 * Renders all document elements (Kop, Title, Filter, AutoTable, Signatures, Footers)
 * Returns the final bottom Y coordinate.
 */
function renderPdfBody(
  doc: jsPDF,
  options: TablePdfOptions,
  marginMm: number,
  isContinuous: boolean = false
): number {
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

  // 4. SUSUN DATA TABEL (DENGAN SUPPORT GROUP BY MATERIAL DALAM 1 LEMBAR)
  const headers = options.columns.map(col => col.header.toUpperCase());

  const hasMaterial = options.data.some(d => Boolean(d.materialName || d.material));
  const isGroupingByMaterial = Boolean(options.groupByMaterial && hasMaterial);

  let bodyRows: any[] = [];

  if (isGroupingByMaterial) {
    // Kelompokkan data per jenis material
    const groups = new Map<string, any[]>();
    options.data.forEach(row => {
      const mat = (row.materialName || row.material || 'Material Lainnya').trim();
      if (!groups.has(mat)) {
        groups.set(mat, []);
      }
      groups.get(mat)!.push(row);
    });

    let overallRowIdx = 0;
    groups.forEach((groupRows, matName) => {
      // Baris Sub-Header Kelompok Material
      const groupVolume = groupRows.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
      const unitStr = groupRows[0]?.unit || 'DT';
      const volumeSummary = groupVolume > 0 ? ` • Total Muatan: ${groupVolume.toLocaleString('id-ID')} ${unitStr}` : '';

      bodyRows.push([
        {
          content: `KELOMPOK MATERIAL: ${matName.toUpperCase()} (${groupRows.length} RITASE${volumeSummary})`,
          colSpan: options.columns.length,
          styles: {
            fillColor: [238, 242, 246],
            textColor: [17, 24, 39],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 7.5,
          },
        },
      ]);

      // Baris-baris data dalam kelompok ini
      groupRows.forEach(row => {
        const rowCells = options.columns.map(col => {
          if (col.format) {
            return col.format(col.dataKey ? row[col.dataKey] : undefined, row, overallRowIdx);
          }
          if (col.dataKey && row[col.dataKey] !== undefined && row[col.dataKey] !== null) {
            return String(row[col.dataKey]);
          }
          return '-';
        });
        bodyRows.push(rowCells);
        overallRowIdx++;
      });

      // Baris Subtotal Kelompok Material
      const subtotalRow = options.columns.map((col, cIdx) => {
        if (cIdx === 0) {
          return {
            content: `SUBTOTAL ${matName.toUpperCase()} (${groupRows.length} Rit):`,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [17, 17, 17] },
          };
        }

        const dKey = (col.dataKey || '').toLowerCase();
        const headerLower = col.header.toLowerCase();

        // Tagihan Jual / Omset
        if (dKey === 'totalrevenue' || dKey.includes('revenue') || headerLower.includes('tagihan') || headerLower.includes('jual')) {
          const sum = groupRows.reduce((acc, r) => acc + (Number(r.totalRevenue) || 0), 0);
          return {
            content: formatRupiah(sum),
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [17, 17, 17] },
          };
        }

        // Biaya Kuari / Beli
        if (dKey === 'totalbuycost' || dKey.includes('buy') || headerLower.includes('beli') || headerLower.includes('kuari')) {
          const sum = groupRows.reduce((acc, r) => acc + (Number(r.totalBuyCost) || 0), 0);
          return {
            content: formatRupiah(sum),
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [17, 17, 17] },
          };
        }

        // Beban Ops
        if (dKey === 'operationalcost' || dKey.includes('ops') || headerLower.includes('ops')) {
          const sum = groupRows.reduce((acc, r) => acc + (Number(r.operationalCost) || 0), 0);
          return {
            content: formatRupiah(sum),
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: [17, 17, 17] },
          };
        }

        // Laba Bersih
        if (dKey === 'netprofit' || dKey.includes('profit') || headerLower.includes('laba')) {
          const sum = groupRows.reduce((acc, r) => acc + (Number(r.netProfit) || 0), 0);
          return {
            content: formatRupiah(sum),
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250], textColor: sum >= 0 ? [0, 128, 96] : [207, 17, 36] },
          };
        }

        // Volume / Muatan
        if (dKey === 'quantity' || dKey === 'volume' || headerLower.includes('muatan') || headerLower.includes('volume')) {
          const sum = groupRows.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
          return {
            content: `${sum.toLocaleString('id-ID')} ${groupRows[0]?.unit || 'DT'}`,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 247, 250] },
          };
        }

        return { content: '', styles: { fillColor: [245, 247, 250] } };
      });

      bodyRows.push(subtotalRow);
    });
  } else {
    // Normal sequential flat rows
    bodyRows = options.data.map((row, rIdx) => {
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
  }

  // Footer / Grand Total Baris
  let footRows: string[][] | undefined = undefined;
  if (options.grandTotals && options.data.length > 0) {
    const footRow = options.columns.map((_col, cIdx) => {
      const totalVal = options.grandTotals?.[cIdx];
      if (cIdx === 0 && !totalVal) {
        return options.totalLabel || (isGroupingByMaterial ? 'GRAND TOTAL (SEMUA MATERIAL)' : 'TOTAL');
      }
      return totalVal || '';
    });
    footRows = [footRow];
  }

  // Font Size Resolution & Metrics
  const tableFontSize = options.fontSize && options.fontSize >= 4 ? options.fontSize : 7.2;
  const headerFontSize = Math.min(11, Math.max(6, Math.round((tableFontSize + 0.3) * 10) / 10));
  const footFontSize = Math.min(11, Math.max(6, Math.round((tableFontSize + 0.3) * 10) / 10));
  const paddingMm = 2;

  // Column styles mapping & dynamic content-fit anti-wrapping calculation
  const columnStylesMap: { [key: number]: any } = {};

  // Temporary font setup to measure exact character width
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(tableFontSize);

  options.columns.forEach((col, idx) => {
    const colKey = col.dataKey || col.header || String(idx);
    const manualWidth = options.columnWidths?.[colKey] ?? options.columnWidths?.[String(idx)];

    if (manualWidth && manualWidth > 0) {
      // 1. User manual override takes highest priority
      columnStylesMap[idx] = {
        halign: col.align || 'left',
        cellWidth: manualWidth,
      };
    } else if (col.width && !options.preventTextWrapping) {
      // 2. Predefined static width from column spec
      columnStylesMap[idx] = {
        halign: col.align || 'left',
        cellWidth: col.width,
      };
    } else if (options.preventTextWrapping) {
      // 3. Dynamic content-fit: measure maximum text width in header, data, and totals
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(headerFontSize);
      let maxTextWidth = doc.getTextWidth(col.header.toUpperCase()) + 1.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(tableFontSize);

      const sampleRows = options.data.slice(0, 150);
      for (let rIdx = 0; rIdx < sampleRows.length; rIdx++) {
        const row = sampleRows[rIdx];
        let text = '';
        if (col.format) {
          text = col.format(col.dataKey ? row[col.dataKey] : undefined, row, rIdx) || '';
        } else if (col.dataKey && row[col.dataKey] != null) {
          text = String(row[col.dataKey]);
        }
        const w = doc.getTextWidth(text);
        if (w > maxTextWidth) maxTextWidth = w;
      }

      if (options.grandTotals?.[idx]) {
        doc.setFont('helvetica', 'bold');
        const totalW = doc.getTextWidth(options.grandTotals[idx]);
        if (totalW > maxTextWidth) maxTextWidth = totalW;
      }

      // Safe width = max content text width + padding on both sides (2 * 2mm) + safety spacing (2.5mm)
      const safeColWidth = Math.ceil(maxTextWidth + paddingMm * 2 + 2.5);

      columnStylesMap[idx] = {
        halign: col.align || 'left',
        cellWidth: Math.max(14, safeColWidth),
      };
    } else {
      columnStylesMap[idx] = {
        halign: col.align || 'left',
      };
    }
  });

  // 5. RENDER TABEL DENGAN AUTO-TABLE
  autoTable(doc, {
    startY: currentY + 1,
    margin: {
      left: marginMm,
      right: marginMm,
      top: marginMm,
      bottom: isContinuous ? marginMm : marginMm + 10,
    },
    head: [headers],
    body: bodyRows.length > 0 ? bodyRows : [['Tidak ada data yang sesuai dengan filter / pencarian.']],
    foot: footRows,
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      font: 'helvetica',
      fontSize: tableFontSize,
      cellPadding: paddingMm,
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      textColor: [20, 20, 20],
      overflow: 'linebreak', // Always linebreak (never visible to avoid bleed/collision)
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontSize: headerFontSize,
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
      fontSize: footFontSize,
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
    },
    columnStyles: columnStylesMap,
  });

  let postTableY = (doc as any).lastAutoTable.finalY + 8;

  // 6. CATATAN KUSTOM (JIKA ADA)
  if (options.customNotes && options.customNotes.trim()) {
    if (!isContinuous && postTableY + 12 > pageHeight - marginMm - 20) {
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
    if (!isContinuous && postTableY + signBlockHeight > pageHeight - marginMm - 10) {
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

    postTableY = lineY + 8;
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
      if (isContinuous) {
        doc.text('Dokumen Bersambung • 1 Lembar Penuh', pageWidth - marginMm, pageHeight - 5, {
          align: 'right',
        });
      } else {
        doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginMm, pageHeight - 5, {
          align: 'right',
        });
      }
    }
  }

  return postTableY;
}

/**
 * Generates an official, publication-grade vector PDF document from tabular data.
 */
export function generateTablePdf(options: TablePdfOptions): jsPDF {
  const orientation = options.orientation || 'landscape';
  const marginMm = resolveMargin(options);

  // Mode Kertas Bersambung (Continuous Roll / 1 Lembar Panjang Tanpa Potong)
  if (options.paperSize === 'continuous') {
    let rollWidth = Math.max(
      50,
      options.continuousWidthMm || (orientation === 'landscape' ? 297 : 210)
    );

    // Pass 1: Ukur kebutuhan tinggi dalam canvas virtual panjang
    const measureDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [rollWidth, 30000], // 30 meter canvas virtual
      compress: false,
    });
    const measuredEndY = renderPdfBody(measureDoc, options, marginMm, true);

    // Hitung tinggi bersih pas lembar
    const calculatedHeight = Math.max(140, Math.ceil(measuredEndY + marginMm + 8));

    // Pass 2: Hasilkan lembar PDF bersambung presisi utuh 1 halaman
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [rollWidth, calculatedHeight],
      compress: true,
    });

    renderPdfBody(doc, options, marginMm, true);
    return doc;
  }

  // Custom Paper Dimensions (Width & Height in mm strictly specified by user)
  if (options.paperSize === 'custom') {
    const customW = Math.max(30, options.customWidthMm || 210);
    const customH = Math.max(30, options.customHeightMm || 297);
    // Align orientation with custom aspect ratio to prevent jsPDF from auto-flipping dimensions
    const customOrient = customW >= customH ? 'landscape' : 'portrait';
    const doc = new jsPDF({
      orientation: customOrient,
      unit: 'mm',
      format: [customW, customH],
      compress: true,
    });

    renderPdfBody(doc, options, marginMm, false);
    return doc;
  }

  // Standard Paged Document (A4, F4, Letter, Legal, Custom)
  const paperFormat = resolvePaperFormat(options);
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperFormat,
    compress: true,
  });

  renderPdfBody(doc, options, marginMm, false);
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
