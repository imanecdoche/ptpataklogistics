import React, { useState } from 'react';
import {
  QuickReportShortcut,
  updateQuickReportShortcut
} from '@/lib/quickReportService';
import { PaperSize, PageOrientation } from '@/lib/pdfExportService';

export interface EditQuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcut: QuickReportShortcut | null;
  onSuccess?: () => void;
}

export function EditQuickReportModal({
  isOpen,
  onClose,
  shortcut,
  onSuccess
}: EditQuickReportModalProps): React.JSX.Element | null {
  if (!isOpen || !shortcut) return null;

  const [name, setName] = useState(shortcut.name);
  const [paperSize, setPaperSize] = useState<PaperSize>(shortcut.pdfPreferences.paperSize || 'a4');
  const [orientation, setOrientation] = useState<PageOrientation>(shortcut.pdfPreferences.orientation || 'landscape');
  const [marginPreset, setMarginPreset] = useState<'compact' | 'normal' | 'wide' | 'custom'>(
    shortcut.pdfPreferences.marginPreset || 'normal'
  );
  const [fontSize, setFontSize] = useState<number>(shortcut.pdfPreferences.fontSize || 7.2);
  const [showLetterhead, setShowLetterhead] = useState<boolean>(shortcut.pdfPreferences.showLetterhead ?? true);
  const [showFiltersSummary, setShowFiltersSummary] = useState<boolean>(shortcut.pdfPreferences.showFiltersSummary ?? true);
  const [showSignatures, setShowSignatures] = useState<boolean>(shortcut.pdfPreferences.showSignatures ?? true);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(shortcut.pdfPreferences.showPageNumbers ?? true);
  const [groupByMaterial, setGroupByMaterial] = useState<boolean>(shortcut.pdfPreferences.groupByMaterial ?? true);
  const [preventTextWrapping, setPreventTextWrapping] = useState<boolean>(shortcut.pdfPreferences.preventTextWrapping ?? true);
  const [customNotes, setCustomNotes] = useState<string>(shortcut.pdfPreferences.customNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama pintasan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await updateQuickReportShortcut(shortcut.id, {
        name: name.trim(),
        pdfPreferences: {
          ...shortcut.pdfPreferences,
          paperSize,
          orientation,
          marginPreset,
          fontSize,
          showLetterhead,
          showFiltersSummary,
          showSignatures,
          showPageNumbers,
          groupByMaterial,
          preventTextWrapping,
          customNotes: customNotes.trim()
        }
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[EditQuickReportModal] Gagal menyimpan perubahan:', err);
      setErrorMsg('Gagal memperbarui pintasan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f8f9fa] flex items-center justify-between border-b border-[#e5e7eb]">
          <div>
            <h3 className="text-base font-bold text-[#111111]">Edit Pintasan Laporan</h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Sesuaikan nama dan preferensi layout PDF untuk pintasan ini.
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
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
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
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#f9fafb] text-sm text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Pengaturan Kertas & Orientasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
                Ukuran Kertas
              </label>
              <select
                value={paperSize}
                onChange={e => setPaperSize(e.target.value as PaperSize)}
                className="w-full px-3 py-2 bg-[#f9fafb] text-xs font-semibold text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
              >
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="f4">F4 / Folio (215 × 330 mm)</option>
                <option value="letter">Letter (216 × 279 mm)</option>
                <option value="legal">Legal (216 × 356 mm)</option>
                <option value="continuous">Kertas Bersambung (Roll)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
                Orientasi Dokumen
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 text-xs font-bold text-center transition-colors ${
                    orientation === 'portrait'
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#f0f0f0] text-[#444444] hover:bg-[#e0e0e0]'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 text-xs font-bold text-center transition-colors ${
                    orientation === 'landscape'
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#f0f0f0] text-[#444444] hover:bg-[#e0e0e0]'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>
          </div>

          {/* Margin & Font Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
                Margin Dokumen
              </label>
              <select
                value={marginPreset}
                onChange={e => setMarginPreset(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#f9fafb] text-xs font-semibold text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
              >
                <option value="normal">Normal (10 mm)</option>
                <option value="compact">Sempit (6 mm)</option>
                <option value="wide">Lebar (15 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
                Ukuran Font ({fontSize.toFixed(1)} pt)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[6.0, 7.2, 8.5, 10.0].map(pt => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setFontSize(pt)}
                    className={`py-2 text-xs font-semibold transition-colors ${
                      fontSize === pt
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#f0f0f0] text-[#444444] hover:bg-[#e0e0e0]'
                    }`}
                  >
                    {pt}pt
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles Elemen Formal */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-2 uppercase tracking-wide">
              Komponen Formal Dokumen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLetterhead}
                  onChange={e => setShowLetterhead(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Kop Perusahaan Resmi</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFiltersSummary}
                  onChange={e => setShowFiltersSummary(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Ringkasan Kriteria Filter</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={e => setShowSignatures(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Dua Blok Tanda Tangan</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPageNumbers}
                  onChange={e => setShowPageNumbers(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Nomor Halaman Resmi</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupByMaterial}
                  onChange={e => setGroupByMaterial(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Kelompokkan Per Material</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-[#f8f9fa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={preventTextWrapping}
                  onChange={e => setPreventTextWrapping(e.target.checked)}
                  className="rounded text-[#111111]"
                />
                <span className="font-medium text-[#111111]">Anti-Wrapped Text</span>
              </label>
            </div>
          </div>

          {/* Catatan Kaki Dokumen */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1.5 uppercase tracking-wide">
              Catatan Kaki Dokumen PDF
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
          <div className="pt-2 flex justify-end items-center gap-2 border-t border-[#e5e7eb]">
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
              className="px-4 py-2 text-xs font-bold text-white bg-[#111111] hover:bg-black transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
