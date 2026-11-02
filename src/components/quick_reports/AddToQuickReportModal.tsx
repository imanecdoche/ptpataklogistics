import React, { useState } from 'react';
import {
  QuickReportPdfPreferences,
  createQuickReportShortcut
} from '@/lib/quickReportService';
import { TablePdfFilterSummary } from '@/lib/pdfExportService';

export interface AddToQuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  categoryLabel?: string;
  title: string;
  subtitle?: string;
  fileName?: string;
  pdfPreferences: QuickReportPdfPreferences;
  savedFilters?: Record<string, any>;
  filtersSummary?: TablePdfFilterSummary[];
  onSuccess?: () => void;
}

export function AddToQuickReportModal({
  isOpen,
  onClose,
  tableId,
  categoryLabel,
  title,
  subtitle,
  fileName,
  pdfPreferences,
  savedFilters,
  filtersSummary,
  onSuccess
}: AddToQuickReportModalProps): React.JSX.Element | null {
  const [shortcutName, setShortcutName] = useState(title || 'Laporan Baru');
  const [customNotes, setCustomNotes] = useState(pdfPreferences.customNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const exportType = tableId.replace(/_[a-zA-Z0-9_-]{10,}$/, '');

  const resolvedCategory =
    categoryLabel ||
    (exportType.includes('recap_volume')
      ? 'Rekapitulasi Volume'
      : exportType.includes('recap_financial')
      ? 'Rekapitulasi Finansial'
      : exportType.includes('dispatch') || exportType.includes('ritase')
      ? 'Riwayat Ritase'
      : exportType.includes('cash_flow')
      ? 'Arus Kas'
      : exportType.includes('receivables')
      ? 'Piutang Tempo'
      : exportType.includes('labor') || exportType.includes('hok')
      ? 'HOK Tukang Lapangan'
      : exportType.includes('project')
      ? 'Master Proyek'
      : 'Laporan Umum');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcutName.trim()) {
      setErrorMsg('Nama pintasan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await createQuickReportShortcut({
        name: shortcutName.trim(),
        tableId,
        exportType,
        categoryLabel: resolvedCategory,
        title,
        subtitle,
        fileName,
        pdfPreferences: {
          ...pdfPreferences,
          customNotes: customNotes.trim()
        },
        savedFilters,
        filtersSummary
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[AddToQuickReportModal] Gagal menyimpan:', err);
      setErrorMsg(
        err?.message || 'Terjadi kendala saat menyimpan ke Cloud Firestore. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111111]">Tambah ke Laporan Cepat</h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Simpan konfigurasi laporan ini untuk ekspor instan sekali klik.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#e5e5e5] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-[#fdf2f2] text-xs text-[#cf1124] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Nama Pintasan */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
              Nama Pintasan Laporan <span className="text-[#cf1124]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={shortcutName}
              onChange={e => setShortcutName(e.target.value)}
              placeholder="Contoh: Rekap Ritase Bulanan A4"
              className="w-full px-3 py-2 bg-[#f9fafb] text-sm text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Ringkasan Konfigurasi yang Disimpan */}
          <div className="p-3 bg-[#f8f9fa] space-y-2 text-xs text-[#444444]">
            <div className="flex justify-between">
              <span className="text-[#666666]">Kategori:</span>
              <span className="font-semibold text-[#111111]">{resolvedCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Format Kertas:</span>
              <span className="font-semibold text-[#111111]">
                {pdfPreferences.paperSize.toUpperCase()} •{' '}
                {pdfPreferences.orientation === 'landscape' ? 'Landscape' : 'Portrait'} •{' '}
                {pdfPreferences.fontSize}pt
              </span>
            </div>
            {filtersSummary && filtersSummary.length > 0 && (
              <div>
                <span className="text-[#666666] block mb-1">Filter Aktif Tersimpan:</span>
                <div className="flex flex-wrap gap-1.5">
                  {filtersSummary.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#eef2f6] text-[#111111] text-[11px] font-medium"
                    >
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Catatan Kaki Dokumen (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
              Catatan Kaki PDF (Opsional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="Catatan tambahan yang akan dicetak di bagian bawah PDF..."
              className="w-full px-3 py-2 bg-[#f9fafb] text-xs text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#444444] bg-[#f0f0f0] hover:bg-[#e0e0e0] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[#111111] hover:bg-black transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan ke Laporan Cepat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
