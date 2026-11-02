import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons8Close, Icons8Pdf } from '@/components/icons/Icons8';
import {
  TablePdfOptions,
  TablePdfColumn,
  TablePdfFilterSummary,
  PaperSize,
  PageOrientation,
  MarginPreset,
  exportTableToPdfBlobUrl,
  downloadTablePdf,
} from '@/lib/pdfExportService';

export interface TablePdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  title: string;
  subtitle?: string;
  fileName?: string;
  columns: TablePdfColumn[];
  data: any[];
  filtersSummary?: TablePdfFilterSummary[];
  grandTotals?: { [columnIndex: number]: string };
  totalLabel?: string;
  defaultOrientation?: PageOrientation;
}

interface UserPreferences {
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  orientation: PageOrientation;
  marginPreset: MarginPreset;
  customMarginMm: number;
  showLetterhead: boolean;
  showFiltersSummary: boolean;
  showSignatures: boolean;
  showPageNumbers: boolean;
  hiddenColumnKeys?: string[];
}

const PREF_STORAGE_PREFIX = 'patak_pdf_pref_';

export function TablePdfExportModal({
  isOpen,
  onClose,
  tableId,
  title,
  subtitle,
  fileName,
  columns,
  data,
  filtersSummary,
  grandTotals,
  totalLabel,
  defaultOrientation,
}: TablePdfExportModalProps): React.JSX.Element | null {
  // 1. Initial State from LocalStorage
  const storageKey = `${PREF_STORAGE_PREFIX}${tableId}`;

  const initialPreferences = useMemo<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          paperSize: parsed.paperSize || 'a4',
          customWidthMm: parsed.customWidthMm || 210,
          customHeightMm: parsed.customHeightMm || 297,
          orientation: parsed.orientation || defaultOrientation || (columns.length >= 6 ? 'landscape' : 'portrait'),
          marginPreset: parsed.marginPreset || 'normal',
          customMarginMm: parsed.customMarginMm || 10,
          showLetterhead: parsed.showLetterhead ?? true,
          showFiltersSummary: parsed.showFiltersSummary ?? true,
          showSignatures: parsed.showSignatures ?? true,
          showPageNumbers: parsed.showPageNumbers ?? true,
          hiddenColumnKeys: Array.isArray(parsed.hiddenColumnKeys) ? parsed.hiddenColumnKeys : [],
        };
      }
    } catch (e) {
      console.warn('[TablePdfExportModal] Failed to read preferences from localStorage:', e);
    }

    return {
      paperSize: 'a4',
      customWidthMm: 210,
      customHeightMm: 297,
      orientation: defaultOrientation || (columns.length >= 6 ? 'landscape' : 'portrait'),
      marginPreset: 'normal',
      customMarginMm: 10,
      showLetterhead: true,
      showFiltersSummary: true,
      showSignatures: true,
      showPageNumbers: true,
      hiddenColumnKeys: [],
    };
  }, [storageKey, defaultOrientation, columns.length]);

  // Form Controls State
  const [paperSize, setPaperSize] = useState<PaperSize>(initialPreferences.paperSize);
  const [customWidthMm, setCustomWidthMm] = useState<number>(initialPreferences.customWidthMm);
  const [customHeightMm, setCustomHeightMm] = useState<number>(initialPreferences.customHeightMm);
  const [orientation, setOrientation] = useState<PageOrientation>(initialPreferences.orientation);
  const [marginPreset, setMarginPreset] = useState<MarginPreset>(initialPreferences.marginPreset);
  const [customMarginMm, setCustomMarginMm] = useState<number>(initialPreferences.customMarginMm);
  const [showLetterhead, setShowLetterhead] = useState<boolean>(initialPreferences.showLetterhead);
  const [showFiltersSummary, setShowFiltersSummary] = useState<boolean>(initialPreferences.showFiltersSummary);
  const [showSignatures, setShowSignatures] = useState<boolean>(initialPreferences.showSignatures);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(initialPreferences.showPageNumbers);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>(initialPreferences.hiddenColumnKeys || []);

  const [customTitle, setCustomTitle] = useState<string>(title);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Mobile View Tab: 'preview' vs 'settings'
  const [mobileTab, setMobileTab] = useState<'preview' | 'settings'>('preview');

  // Preview Blob URL
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const previousUrlRef = useRef<string | null>(null);

  // Sync title when prop changes
  useEffect(() => {
    setCustomTitle(title);
  }, [title]);

  // Sync hidden columns when tableId / initialPreferences changes
  useEffect(() => {
    setHiddenColumnKeys(initialPreferences.hiddenColumnKeys || []);
  }, [initialPreferences.hiddenColumnKeys]);

  // Filter Active Columns
  const visibleColumns = useMemo<TablePdfColumn[]>(() => {
    const active = columns.filter(col => {
      const key = col.dataKey || col.header;
      return !hiddenColumnKeys.includes(key);
    });
    return active.length > 0 ? active : columns.slice(0, 1);
  }, [columns, hiddenColumnKeys]);

  // Remap Grand Totals to align accurately with visible columns
  const mappedGrandTotals = useMemo(() => {
    if (!grandTotals) return undefined;

    const remapped: { [newColIdx: number]: string } = {};

    visibleColumns.forEach((vCol, newIdx) => {
      const origIdx = columns.findIndex(c => (c.dataKey || c.header) === (vCol.dataKey || vCol.header));
      if (origIdx !== -1 && grandTotals[origIdx] !== undefined) {
        remapped[newIdx] = grandTotals[origIdx];
      }
    });

    if (grandTotals[0] !== undefined && remapped[0] === undefined) {
      remapped[0] = grandTotals[0];
    }

    return remapped;
  }, [grandTotals, visibleColumns, columns]);

  // Save Preferences to LocalStorage
  useEffect(() => {
    try {
      const prefs: UserPreferences = {
        paperSize,
        customWidthMm,
        customHeightMm,
        orientation,
        marginPreset,
        customMarginMm,
        showLetterhead,
        showFiltersSummary,
        showSignatures,
        showPageNumbers,
        hiddenColumnKeys,
      };
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch (e) {
      console.warn('[TablePdfExportModal] Failed to save preferences:', e);
    }
  }, [
    storageKey,
    paperSize,
    customWidthMm,
    customHeightMm,
    orientation,
    marginPreset,
    customMarginMm,
    showLetterhead,
    showFiltersSummary,
    showSignatures,
    showPageNumbers,
    hiddenColumnKeys,
  ]);

  // Build PDF Options
  const pdfOptions = useMemo<TablePdfOptions>(() => {
    return {
      title: customTitle || title,
      subtitle,
      fileName,
      columns: visibleColumns,
      data,
      paperSize,
      customWidthMm,
      customHeightMm,
      orientation,
      marginPreset,
      customMarginMm,
      showLetterhead,
      showFiltersSummary,
      showSignatures,
      showPageNumbers,
      filtersSummary,
      grandTotals: mappedGrandTotals,
      totalLabel,
      customNotes,
    };
  }, [
    customTitle,
    title,
    subtitle,
    fileName,
    visibleColumns,
    data,
    paperSize,
    customWidthMm,
    customHeightMm,
    orientation,
    marginPreset,
    customMarginMm,
    showLetterhead,
    showFiltersSummary,
    showSignatures,
    showPageNumbers,
    filtersSummary,
    mappedGrandTotals,
    totalLabel,
    customNotes,
  ]);

  // Generate Live Preview Blob URL (Debounced 150ms for smooth interaction)
  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    const timer = setTimeout(() => {
      try {
        const newUrl = exportTableToPdfBlobUrl(pdfOptions);
        if (previousUrlRef.current) {
          URL.revokeObjectURL(previousUrlRef.current);
        }
        previousUrlRef.current = newUrl;
        setPreviewBlobUrl(newUrl);
      } catch (err) {
        console.error('[TablePdfExportModal] Error generating preview blob:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, pdfOptions]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  // Keyboard navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadTablePdf(pdfOptions, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 select-none">
      {/* Container Full Width & Full Height */}
      <div className="w-full h-full bg-[#fbfbfb] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 px-4 sm:px-6 bg-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-[6px] bg-[#111111] flex items-center justify-center shrink-0">
              <Icons8Pdf size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-[#111111] tracking-tight truncate">
                  Pratinjau Ekspor PDF Resmi
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-[#f0f0f0] text-[#555555] rounded-[4px] whitespace-nowrap">
                  {data.length} Baris Data
                </span>
              </div>
              <p className="text-[11px] text-[#666666] truncate">
                PT Patak Abadi Jaya • {customTitle || title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden bg-[#f0f0f0] p-0.5 rounded-[6px]">
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                  mobileTab === 'preview'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666]'
                }`}
              >
                Pratinjau
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('settings')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] transition-colors ${
                  mobileTab === 'settings'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666]'
                }`}
              >
                Pengaturan
              </button>
            </div>

            {/* Action: Download PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-[#111111] hover:bg-[#2b2b2b] active:scale-[0.98] text-white text-xs font-semibold rounded-[6px] flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Icons8Pdf size={16} className="text-white shrink-0" />
              <span>Unduh Dokumen PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              aria-label="Tutup Pratinjau PDF"
              className="w-8 h-8 rounded-[6px] bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#444444] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icons8Close size={18} />
            </button>
          </div>
        </header>

        {/* Modal Main Content: Split Desktop View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Kolom Kiri / Tengah: Interactive Live PDF Blob Viewer */}
          <section
            className={`flex-1 p-3 sm:p-5 flex flex-col min-w-0 bg-[#ebebeb] relative ${
              mobileTab === 'settings' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {isGenerating && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-[#111111]/85 text-white text-xs rounded-full shadow-md flex items-center space-x-2 pointer-events-none">
                <svg
                  className="animate-spin w-3.5 h-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Menyusun lembar PDF...</span>
              </div>
            )}

            <div className="w-full h-full rounded-[8px] bg-white shadow-md overflow-hidden flex flex-col">
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="PDF Document Preview"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#888888]">
                  <p className="text-xs">Memuat pratinjau dokumen...</p>
                </div>
              )}
            </div>
          </section>

          {/* Kolom Kanan: Settings Panel (Solid-Filled Controls, Zero Native OS Select) */}
          <aside
            className={`w-full md:w-[360px] lg:w-[400px] shrink-0 bg-white border-l border-[#eaeaea] flex flex-col overflow-y-auto p-4 sm:p-5 space-y-5 ${
              mobileTab === 'preview' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div>
              <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Pengaturan Lembar & Format
              </h2>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Konfigurasi disimpan otomatis di browser untuk tabel ini.
              </p>
            </div>

            {/* 1. Paper Size Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#222222] block">
                Ukuran Kertas (Paper Size)
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#f5f5f5] p-1 rounded-[6px]">
                {(
                  [
                    { id: 'a4', label: 'A4' },
                    { id: 'f4', label: 'F4 / Folio' },
                    { id: 'letter', label: 'Letter' },
                    { id: 'legal', label: 'Legal' },
                    { id: 'continuous', label: 'Bersambung' },
                    { id: 'custom', label: 'Kustom mm' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaperSize(item.id)}
                    className={`h-8 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                      paperSize === item.id
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#555555] hover:text-[#111111]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {paperSize === 'continuous' && (
                <div className="p-2 bg-[#f9f9f9] rounded-[6px] border border-[#eaeaea] text-[11px] text-[#555555] leading-relaxed">
                  <span className="font-semibold text-[#111111] block">Mode Kertas Bersambung (1 Lembar Utuh)</span>
                  Dokumen dicetak memanjang ke bawah tanpa potongan/jeda halaman. Lebar standar {orientation === 'landscape' ? '297 mm' : '210 mm'}, tinggi otomatis pas dengan seluruh baris tabel.
                </div>
              )}

              {/* Custom Size Inputs if custom selected */}
              {paperSize === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div>
                    <span className="text-[10px] text-[#777777] block mb-1">Lebar (mm)</span>
                    <input
                      type="number"
                      min={80}
                      max={1000}
                      value={customWidthMm}
                      onChange={e => setCustomWidthMm(Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-xs bg-[#f5f5f5] rounded-[4px] outline-none text-[#111111]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block mb-1">Tinggi (mm)</span>
                    <input
                      type="number"
                      min={80}
                      max={1000}
                      value={customHeightMm}
                      onChange={e => setCustomHeightMm(Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-xs bg-[#f5f5f5] rounded-[4px] outline-none text-[#111111]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Orientation Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#222222] block">
                {paperSize === 'continuous' ? 'Lebar Lembar Bersambung' : 'Orientasi Cetak'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#f5f5f5] p-1 rounded-[6px]">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`h-8 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  {paperSize === 'continuous' ? 'Landscape (297 mm)' : 'Landscape (Mendatar)'}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`h-8 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#555555] hover:text-[#111111]'
                  }`}
                >
                  {paperSize === 'continuous' ? 'Portrait (210 mm)' : 'Portrait (Tegak)'}
                </button>
              </div>
            </div>

            {/* 3. Margin Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#222222] block">
                Margin Tepi Dokumen
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-[#f5f5f5] p-1 rounded-[6px]">
                {(
                  [
                    { id: 'compact', label: '6 mm' },
                    { id: 'normal', label: '10 mm' },
                    { id: 'wide', label: '15 mm' },
                    { id: 'custom', label: 'Kustom' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMarginPreset(item.id)}
                    className={`h-8 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                      marginPreset === item.id
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'text-[#555555] hover:text-[#111111]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {marginPreset === 'custom' && (
                <div className="pt-1.5">
                  <span className="text-[10px] text-[#777777] block mb-1">Margin (mm)</span>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={customMarginMm}
                    onChange={e => setCustomMarginMm(Number(e.target.value))}
                    className="w-full h-8 px-2.5 text-xs bg-[#f5f5f5] rounded-[4px] outline-none text-[#111111]"
                  />
                </div>
              )}
            </div>

            {/* 4. Column Visibility Selector (Accordion / Panel) */}
            <div className="space-y-2 pt-2 border-t border-[#eaeaea]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-[#222222] block">
                    Kolom Tabel
                  </label>
                  <span className="text-[10px] text-[#777777] block">
                    {visibleColumns.length} dari {columns.length} kolom tampil di cetakan
                  </span>
                </div>
                {hiddenColumnKeys.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setHiddenColumnKeys([])}
                      className="px-2 py-0.5 text-[11px] font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[4px] transition-colors cursor-pointer"
                      title="Tampilkan semua kolom"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setHiddenColumnKeys([])}
                      className="px-2 py-0.5 text-[11px] font-semibold text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[4px] transition-colors cursor-pointer"
                      title="Kembalikan ke susunan asli"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Grid Toggle Chips */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {columns.map((col, idx) => {
                  const key = col.dataKey || col.header || `col_${idx}`;
                  const isVisible = !hiddenColumnKeys.includes(key);
                  const isLastVisible = isVisible && visibleColumns.length === 1;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isLastVisible}
                      onClick={() => {
                        if (isLastVisible) return;
                        setHiddenColumnKeys(prev =>
                          isVisible ? [...prev, key] : prev.filter(k => k !== key)
                        );
                      }}
                      className={`h-8 px-2 text-xs font-medium rounded-[6px] flex items-center justify-between transition-all cursor-pointer text-left ${
                        isVisible
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'bg-[#f5f5f5] text-[#888888] hover:bg-[#ebebeb] hover:text-[#111111]'
                      } ${isLastVisible ? 'opacity-80 cursor-not-allowed' : ''}`}
                      title={
                        isLastVisible
                          ? 'Minimal satu kolom harus tetap tampil'
                          : `${isVisible ? 'Sembunyikan' : 'Tampilkan'} kolom ${col.header}`
                      }
                    >
                      <span className="truncate pr-1">{col.header}</span>
                      {isVisible ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-[#aaaaaa]">Off</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Structural Feature Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#eaeaea]">
              <label className="text-xs font-semibold text-[#222222] block">
                Elemen Dokumen Formal
              </label>

              <div className="space-y-2 text-xs">
                {/* Kop Surat */}
                <label className="flex items-center space-x-2.5 p-2 rounded-[6px] bg-[#f9f9f9] hover:bg-[#f4f4f4] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showLetterhead}
                    onChange={e => setShowLetterhead(e.target.checked)}
                    className="rounded text-[#111111] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[#333333] font-medium">
                    Kop Surat Resmi PT Patak Abadi Jaya
                  </span>
                </label>

                {/* Filter Summary */}
                <label className="flex items-center space-x-2.5 p-2 rounded-[6px] bg-[#f9f9f9] hover:bg-[#f4f4f4] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showFiltersSummary}
                    onChange={e => setShowFiltersSummary(e.target.checked)}
                    className="rounded text-[#111111] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[#333333] font-medium">
                    Tampilkan Ringkasan Kriteria Filter / Pencarian
                  </span>
                </label>

                {/* Signatures */}
                <label className="flex items-center space-x-2.5 p-2 rounded-[6px] bg-[#f9f9f9] hover:bg-[#f4f4f4] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={e => setShowSignatures(e.target.checked)}
                    className="rounded text-[#111111] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[#333333] font-medium">
                    Kolom Pengesahan & Tanda Tangan Resmi
                  </span>
                </label>

                {/* Page Numbers */}
                <label className="flex items-center space-x-2.5 p-2 rounded-[6px] bg-[#f9f9f9] hover:bg-[#f4f4f4] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={e => setShowPageNumbers(e.target.checked)}
                    className="rounded text-[#111111] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[#333333] font-medium">
                    Nomor Halaman & Tanda Air Footer
                  </span>
                </label>
              </div>
            </div>

            {/* 6. Custom Document Title & Notes */}
            <div className="space-y-3 pt-2 border-t border-[#eaeaea]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#222222] block">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Ketik judul dokumen..."
                  className="w-full h-8 px-2.5 text-xs bg-[#f5f5f5] rounded-[4px] outline-none text-[#111111] focus:bg-[#ebebeb] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#222222] block">
                  Catatan Kaki Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Contoh: Dokumen dicetak untuk keperluan audit internal..."
                  className="w-full p-2 text-xs bg-[#f5f5f5] rounded-[4px] outline-none text-[#111111] focus:bg-[#ebebeb] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Bottom Download CTA inside Panel */}
            <div className="pt-3 mt-auto">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full h-10 bg-[#111111] hover:bg-[#2b2b2b] active:scale-[0.99] text-white text-xs font-bold rounded-[6px] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Icons8Pdf size={16} className="text-white" />
                <span>
                  Unduh Dokumen PDF ({paperSize === 'continuous' ? 'Bersambung' : orientation})
                </span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
