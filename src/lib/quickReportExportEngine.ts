import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuickReportShortcut } from '@/lib/quickReportService';
import {
  TablePdfColumn,
  TablePdfOptions,
  downloadTablePdf
} from '@/lib/pdfExportService';
import { formatRupiah } from '@/lib/currencyUtils';

/**
 * Filter data transaksi ritase berdasarkan savedFilters
 */
function filterDispatchTransactions(items: any[], filters: Record<string, any> = {}): any[] {
  return items.filter(item => {
    // 1. Proyek
    if (filters.projectId && filters.projectId !== 'ALL') {
      if (item.projectId !== filters.projectId && item.projectName !== filters.projectId) {
        return false;
      }
    }
    // 2. Kuari
    if (filters.quarryName && filters.quarryName !== 'ALL') {
      if ((item.quarryName || '').toLowerCase() !== filters.quarryName.toLowerCase()) {
        return false;
      }
    }
    // 3. Material
    if (filters.materialName && filters.materialName !== 'ALL') {
      if ((item.materialName || '').toLowerCase() !== filters.materialName.toLowerCase()) {
        return false;
      }
    }
    // 4. Klien
    if (filters.clientName && filters.clientName !== 'ALL') {
      if ((item.clientName || '').toLowerCase() !== filters.clientName.toLowerCase()) {
        return false;
      }
    }
    // 5. Status Pembayaran
    if (filters.statusFilter && filters.statusFilter !== 'ALL') {
      if ((item.status || 'TEMPO') !== filters.statusFilter) {
        return false;
      }
    }
    // 6. Tanggal (deliveryDate YYYY-MM-DD)
    const itemDate = (item.deliveryDate || item.date || '').slice(0, 10);
    if (filters.startDate && itemDate < filters.startDate) return false;
    if (filters.endDate && itemDate > filters.endDate) return false;

    // 7. Text Search
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        (item.ticketNumber || '').toLowerCase().includes(q) ||
        (item.truckPlate || '').toLowerCase().includes(q) ||
        (item.driverName || '').toLowerCase().includes(q) ||
        (item.clientName || '').toLowerCase().includes(q) ||
        (item.quarryName || '').toLowerCase().includes(q) ||
        (item.materialName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Filter data arus kas
 */
function filterCashFlowEntries(items: any[], filters: Record<string, any> = {}): any[] {
  return items.filter(item => {
    if (filters.projectId && filters.projectId !== 'ALL') {
      if (item.projectId !== filters.projectId) return false;
    }
    if (filters.category && filters.category !== 'ALL') {
      if (item.category !== filters.category) return false;
    }
    const itemDate = (item.date || '').slice(0, 10);
    if (filters.startDate && itemDate < filters.startDate) return false;
    if (filters.endDate && itemDate > filters.endDate) return false;

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.projectName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Filter data pembayaran mandor / tukang
 */
function filterLaborPayments(items: any[], filters: Record<string, any> = {}): any[] {
  return items.filter(item => {
    if (filters.projectId && filters.projectId !== 'ALL') {
      if (item.projectId !== filters.projectId) return false;
    }
    if (filters.workerId && filters.workerId !== 'ALL') {
      if (item.workerId !== filters.workerId) return false;
    }
    const itemDate = (item.paymentDate || item.createdAt || '').slice(0, 10);
    if (filters.startDate && itemDate < filters.startDate) return false;
    if (filters.endDate && itemDate > filters.endDate) return false;

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        (item.workerName || '').toLowerCase().includes(q) ||
        (item.projectName || '').toLowerCase().includes(q) ||
        (item.jobTypeName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Eksekutor ekspor laporan dalam sekali klik dari Laporan Cepat
 */
export async function executeQuickReportExport(shortcut: QuickReportShortcut): Promise<void> {
  const exportType = shortcut.exportType || shortcut.tableId;
  const filters = shortcut.savedFilters || {};
  const prefs = shortcut.pdfPreferences;

  let columns: TablePdfColumn[] = [];
  let rawData: any[] = [];
  let grandTotals: { [key: number]: string } | undefined = undefined;
  let totalLabel = shortcut.title;

  // 1. Resolver untuk Ritase / Rekapitulasi Periode / Piutang Tempo
  if (
    exportType === 'dispatch_history' ||
    exportType === 'ritase' ||
    exportType === 'recap_volume' ||
    exportType === 'recap_financial' ||
    exportType === 'receivables'
  ) {
    const txSnap = await getDocs(collection(db, 'transactions'));
    let allTx: any[] = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Khusus Piutang: status wajib TEMPO
    if (exportType === 'receivables') {
      allTx = allTx.filter(t => (t.status || 'TEMPO') === 'TEMPO');
    }

    rawData = filterDispatchTransactions(allTx, filters);

    if (exportType === 'recap_volume') {
      columns = [
        { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
        { header: 'Tanggal', dataKey: 'deliveryDate', width: 22 },
        { header: 'No Surat Jalan', dataKey: 'ticketNumber', width: 28 },
        { header: 'Armada', dataKey: 'truckPlate', width: 24 },
        { header: 'Supir', dataKey: 'driverName', width: 26 },
        { header: 'Klien', dataKey: 'clientName', width: 30 },
        { header: 'Kuari', dataKey: 'quarryName', width: 28 },
        { header: 'Material', dataKey: 'materialName', width: 28 },
        {
          header: 'Muatan',
          dataKey: 'quantity',
          align: 'right',
          width: 24,
          format: (v, r) => `${Number(v || 0).toLocaleString('id-ID')} ${r.unit || 'DT'}`
        }
      ];
      grandTotals = {
        0: 'TOTAL RITASE OPERASIONAL',
        8: `${rawData.length} Ritase`
      };
    } else if (exportType === 'recap_financial') {
      columns = [
        { header: 'No', width: 10, format: (_v, _r, i) => String(i + 1), align: 'center' },
        { header: 'Tanggal', dataKey: 'deliveryDate', width: 20 },
        { header: 'Surat Jalan', dataKey: 'ticketNumber', width: 24 },
        { header: 'Klien', dataKey: 'clientName', width: 28 },
        { header: 'Kuari', dataKey: 'quarryName', width: 26 },
        { header: 'Material', dataKey: 'materialName', width: 26 },
        {
          header: 'Muatan',
          dataKey: 'quantity',
          align: 'right',
          width: 20,
          format: (v, r) => `${Number(v || 0).toLocaleString('id-ID')} ${r.unit || 'DT'}`
        },
        {
          header: 'Tagihan Jual',
          dataKey: 'totalRevenue',
          align: 'right',
          width: 28,
          format: v => formatRupiah(Number(v) || 0)
        },
        {
          header: 'Biaya Kuari',
          dataKey: 'totalBuyCost',
          align: 'right',
          width: 28,
          format: v => formatRupiah(Number(v) || 0)
        },
        {
          header: 'Beban Ops',
          dataKey: 'operationalCost',
          align: 'right',
          width: 26,
          format: v => formatRupiah(Number(v) || 0)
        },
        {
          header: 'Laba Bersih',
          dataKey: 'netProfit',
          align: 'right',
          width: 28,
          format: v => formatRupiah(Number(v) || 0)
        }
      ];

      const totSell = rawData.reduce((acc, r) => acc + (Number(r.totalRevenue) || 0), 0);
      const totBuy = rawData.reduce((acc, r) => acc + (Number(r.totalBuyCost) || 0), 0);
      const totOps = rawData.reduce((acc, r) => acc + (Number(r.operationalCost) || 0), 0);
      const totNet = rawData.reduce((acc, r) => acc + (Number(r.netProfit) || 0), 0);

      grandTotals = {
        0: 'TOTAL REKAPITULASI KEUANGAN',
        7: formatRupiah(totSell),
        8: formatRupiah(totBuy),
        9: formatRupiah(totOps),
        10: formatRupiah(totNet)
      };
    } else if (exportType === 'receivables') {
      columns = [
        { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
        { header: 'Tanggal', dataKey: 'deliveryDate', width: 24 },
        { header: 'No Surat Jalan', dataKey: 'ticketNumber', width: 28 },
        { header: 'Klien', dataKey: 'clientName', width: 34 },
        { header: 'Proyek', dataKey: 'projectName', width: 34 },
        {
          header: 'Tagihan Tempo',
          dataKey: 'totalRevenue',
          align: 'right',
          width: 32,
          format: v => formatRupiah(Number(v) || 0)
        },
        { header: 'Status', dataKey: 'status', align: 'center', width: 24, format: () => 'TEMPO' }
      ];
      const sumRevenue = rawData.reduce((acc, r) => acc + (Number(r.totalRevenue) || 0), 0);
      grandTotals = {
        0: 'TOTAL TAGIHAN TEMPO TERFILTER',
        5: formatRupiah(sumRevenue)
      };
    } else {
      // dispatch_history / ritase umum
      columns = [
        { header: 'No', width: 10, format: (_v, _r, i) => String(i + 1), align: 'center' },
        { header: 'Tanggal', dataKey: 'deliveryDate', width: 20 },
        { header: 'No Surat Jalan', dataKey: 'ticketNumber', width: 24 },
        { header: 'Armada', dataKey: 'truckPlate', width: 22 },
        { header: 'Supir', dataKey: 'driverName', width: 24 },
        { header: 'Klien', dataKey: 'clientName', width: 26 },
        { header: 'Kuari', dataKey: 'quarryName', width: 26 },
        { header: 'Material', dataKey: 'materialName', width: 26 },
        {
          header: 'Muatan',
          dataKey: 'quantity',
          align: 'right',
          width: 20,
          format: (v, r) => `${Number(v || 0).toLocaleString('id-ID')} ${r.unit || 'DT'}`
        },
        {
          header: 'Omset / Tagihan',
          dataKey: 'totalRevenue',
          align: 'right',
          width: 28,
          format: v => formatRupiah(Number(v) || 0)
        }
      ];
      const sumRevenue = rawData.reduce((acc, r) => acc + (Number(r.totalRevenue) || 0), 0);
      grandTotals = {
        0: `TOTAL (${rawData.length} Trip)`,
        9: formatRupiah(sumRevenue)
      };
    }
  }

  // 2. Resolver untuk Arus Kas (Cash Ledger)
  else if (exportType === 'cash_flow') {
    const snap = await getDocs(query(collection(db, 'cash_ledger'), orderBy('date', 'desc')));
    const allEntries: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rawData = filterCashFlowEntries(allEntries, filters);

    columns = [
      { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
      { header: 'Tanggal', dataKey: 'date', width: 24 },
      { header: 'Kategori', dataKey: 'category', width: 32 },
      { header: 'Proyek', dataKey: 'projectName', width: 34 },
      { header: 'Keterangan', dataKey: 'description', width: 44 },
      {
        header: 'Pemasukan (Masuk)',
        dataKey: 'amount',
        align: 'right',
        width: 32,
        format: (v, r) => (r.isCredit ? formatRupiah(Number(v) || 0) : '-')
      },
      {
        header: 'Pengeluaran (Keluar)',
        dataKey: 'amount',
        align: 'right',
        width: 32,
        format: (v, r) => (!r.isCredit ? formatRupiah(Number(v) || 0) : '-')
      }
    ];

    let inTotal = 0;
    let outTotal = 0;
    rawData.forEach(e => {
      if (e.isCredit) inTotal += e.amount || 0;
      else outTotal += e.amount || 0;
    });

    grandTotals = {
      0: 'TOTAL KAS BESAR TERFILTER',
      5: formatRupiah(inTotal),
      6: formatRupiah(outTotal)
    };
  }

  // 3. Resolver untuk Pembayaran Mandor & HOK Tukang
  else if (exportType === 'labor_payments' || exportType === 'hok_labor') {
    const snap = await getDocs(query(collection(db, 'labor_payments'), orderBy('createdAt', 'desc')));
    const allPayments: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rawData = filterLaborPayments(allPayments, filters);

    columns = [
      { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
      { header: 'Tanggal', dataKey: 'paymentDate', width: 24 },
      { header: 'Nama Mandor / Tukang', dataKey: 'workerName', width: 36 },
      { header: 'Proyek', dataKey: 'projectName', width: 36 },
      { header: 'Tipe Pekerjaan', dataKey: 'jobTypeName', width: 32 },
      {
        header: 'Nominal Upah',
        dataKey: 'totalAmount',
        align: 'right',
        width: 32,
        format: v => formatRupiah(Number(v) || 0)
      },
      { header: 'Keterangan', dataKey: 'notes', width: 40, format: v => v || '-' }
    ];

    const sumLabor = rawData.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
    grandTotals = {
      0: 'TOTAL UPAH TUKANG TERFILTER',
      5: formatRupiah(sumLabor)
    };
  }

  // 4. Resolver untuk Master Proyek
  else if (exportType === 'projects' || exportType === 'projects_list') {
    const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (filters.statusFilter && filters.statusFilter !== 'ALL') {
      rawData = rawData.filter(p => p.status === filters.statusFilter);
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      rawData = rawData.filter(
        p =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q) ||
          (p.clientName || '').toLowerCase().includes(q)
      );
    }

    columns = [
      { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
      { header: 'Kode', dataKey: 'code', width: 22 },
      { header: 'Nama Proyek', dataKey: 'name', width: 40 },
      { header: 'Klien', dataKey: 'clientName', width: 34 },
      { header: 'Investor', dataKey: 'investorName', width: 34 },
      {
        header: 'Total Deposit',
        dataKey: 'totalDeposit',
        align: 'right',
        width: 32,
        format: v => formatRupiah(Number(v) || 0)
      },
      {
        header: 'Saldo Kas Proyek',
        dataKey: 'currentBalance',
        align: 'right',
        width: 32,
        format: v => formatRupiah(Number(v) || 0)
      },
      { header: 'Status', dataKey: 'status', align: 'center', width: 24 }
    ];

    const totDeposit = rawData.reduce((acc, p) => acc + (Number(p.totalDeposit) || 0), 0);
    const totBalance = rawData.reduce((acc, p) => acc + (Number(p.currentBalance) || 0), 0);

    grandTotals = {
      0: 'TOTAL PROYEK TERFILTER',
      5: formatRupiah(totDeposit),
      6: formatRupiah(totBalance)
    };
  }

  // 5. Fallback ke koleksi generik jika belum terpetakan khusus
  else {
    try {
      const colName = exportType.includes('_') ? exportType.split('_')[0] : exportType;
      const snap = await getDocs(collection(db, colName || 'transactions'));
      rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      columns = [
        { header: 'No', width: 12, format: (_v, _r, i) => String(i + 1), align: 'center' },
        { header: 'ID', dataKey: 'id', width: 30 },
        { header: 'Keterangan', dataKey: 'name', width: 50, format: (v, r) => v || r.title || r.description || '-' }
      ];
    } catch (e) {
      console.warn('[quickReportExportEngine] Fallback collection error:', e);
      rawData = [];
    }
  }

  // Filter kolom tersembunyi (hiddenColumnKeys) jika pengguna pernah menyembunyikannya
  const hiddenKeys = prefs.hiddenColumnKeys || [];
  const activeColumns = columns.filter(c => {
    const key = c.dataKey || c.header;
    return !hiddenKeys.includes(key);
  });
  const finalColumns = activeColumns.length > 0 ? activeColumns : columns.slice(0, 1);

  // Remap grand totals jika ada kolom yang disembunyikan
  let remappedTotals: { [key: number]: string } | undefined = undefined;
  if (grandTotals) {
    remappedTotals = {};
    finalColumns.forEach((vCol, newIdx) => {
      const origIdx = columns.findIndex(c => (c.dataKey || c.header) === (vCol.dataKey || vCol.header));
      if (origIdx > 0 && grandTotals![origIdx] !== undefined) {
        remappedTotals![newIdx] = grandTotals![origIdx]!;
      }
    });
    if (grandTotals[0] !== undefined) {
      remappedTotals[0] = grandTotals[0];
    }
  }

  // Susun TablePdfOptions lengkap
  const pdfOptions: TablePdfOptions = {
    title: shortcut.title,
    subtitle: shortcut.subtitle,
    fileName:
      shortcut.fileName ||
      `${shortcut.name.replace(/[^a-zA-Z0-9_\s-]/g, '').trim().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    columns: finalColumns,
    data: rawData,
    paperSize: prefs.paperSize || 'a4',
    continuousWidthMm: prefs.continuousWidthMm || 210,
    customWidthMm: prefs.customWidthMm || 210,
    customHeightMm: prefs.customHeightMm || 297,
    orientation: prefs.orientation || 'landscape',
    marginPreset: prefs.marginPreset || 'normal',
    customMarginMm: prefs.customMarginMm || 10,
    fontSize: prefs.fontSize || 7.2,
    columnWidths: prefs.columnWidths || {},
    showLetterhead: prefs.showLetterhead ?? true,
    showFiltersSummary: prefs.showFiltersSummary ?? true,
    showSignatures: prefs.showSignatures ?? true,
    showPageNumbers: prefs.showPageNumbers ?? true,
    groupByMaterial: prefs.groupByMaterial ?? true,
    preventTextWrapping: prefs.preventTextWrapping ?? true,
    filtersSummary: shortcut.filtersSummary,
    grandTotals: remappedTotals,
    totalLabel: totalLabel,
    customNotes: prefs.customNotes || ''
  };

  // Trigger unduh instan ke browser
  downloadTablePdf(pdfOptions);
}
