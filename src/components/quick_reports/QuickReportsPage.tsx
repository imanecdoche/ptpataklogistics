import React, { useState, useEffect, useMemo } from 'react';
import {
  QuickReportShortcut,
  subscribeQuickReports,
  deleteQuickReportShortcut
} from '@/lib/quickReportService';
import { executeQuickReportExport } from '@/lib/quickReportExportEngine';
import { EditQuickReportModal } from '@/components/quick_reports/EditQuickReportModal';
import { CustomDialog } from '@/components/ui/CustomDialog';

interface QuickReportsPageProps {
  userEmail: string;
}

export function QuickReportsPage({ userEmail: _userEmail }: QuickReportsPageProps): React.JSX.Element {
  const [shortcuts, setShortcuts] = useState<QuickReportShortcut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Modal Edit State
  const [editingShortcut, setEditingShortcut] = useState<QuickReportShortcut | null>(null);

  // Dialog Hapus State
  const [deletingShortcut, setDeletingShortcut] = useState<QuickReportShortcut | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsub = subscribeQuickReports(data => {
      setShortcuts(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;
    const q = searchQuery.toLowerCase().trim();
    return shortcuts.filter(s => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchCat = s.categoryLabel.toLowerCase().includes(q);
      const matchFilter = (s.filtersSummary || []).some(
        f => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
      );
      return matchName || matchCat || matchFilter;
    });
  }, [shortcuts, searchQuery]);

  const handleExport = async (shortcut: QuickReportShortcut) => {
    try {
      setExportingId(shortcut.id);
      await executeQuickReportExport(shortcut);
      showToast(`Laporan "${shortcut.name}" berhasil diekspor!`);
    } catch (err) {
      console.error('[QuickReportsPage] Gagal ekspor:', err);
      showToast(`Gagal mengekspor "${shortcut.name}". Periksa koneksi data.`, 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingShortcut) return;
    try {
      setIsDeleting(true);
      await deleteQuickReportShortcut(deletingShortcut.id);
      showToast(`Pintasan "${deletingShortcut.name}" berhasil dihapus.`);
      setDeletingShortcut(null);
    } catch (err) {
      console.error('[QuickReportsPage] Gagal menghapus:', err);
      showToast('Gagal menghapus pintasan. Silakan coba lagi.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 shadow-lg flex items-center gap-2 text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#111111] text-white'
              : 'bg-[#cf1124] text-white'
          }`}
        >
          <span>{toastMessage.type === 'success' ? '✓' : '✕'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/icons/quick-reports.png"
              alt="Laporan Cepat"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-[#111111] tracking-tight">
                Laporan Cepat (1-Click Export)
              </h1>
              <p className="text-xs text-[#666666] mt-0.5">
                Pusat pintasan ekspor laporan instan. Ekspor PDF dengan seluruh format dan filter tersimpan dalam sekali klik.
              </p>
            </div>
          </div>
        </div>

        {/* Counter & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pintasan laporan..."
              className="w-full px-3 py-2 bg-[#f9fafb] text-xs text-[#111111] border border-[#d1d5db] focus:outline-none focus:border-[#111111]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-[#888888] hover:text-[#111111]"
              >
                ✕
              </button>
            )}
          </div>
          <div className="px-3 py-2 bg-[#f0f0f0] text-xs font-bold text-[#333333] whitespace-nowrap">
            {shortcuts.length} Pintasan
          </div>
        </div>
      </div>

      {/* Main Content: Table or Empty State */}
      <div className="bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#666666] font-medium">
            Memuat daftar pintasan Laporan Cepat dari Firestore...
          </div>
        ) : filteredShortcuts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-[#f5f5f5] flex items-center justify-center">
              <img src="/icons/quick-reports.png" alt="Kosong" className="w-6 h-6 opacity-40" />
            </div>
            <h3 className="text-sm font-bold text-[#111111]">
              {searchQuery ? 'Tidak Ada Pintasan yang Cocok' : 'Belum Ada Pintasan Laporan Cepat'}
            </h3>
            <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `Tidak ditemukan pintasan dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Anda dapat menambahkan laporan ke daftar ini dengan mengklik tombol "Tambah ke Laporan Cepat" pada toolbar tabel mana saja (Riwayat Ritase, Rekapitulasi, Kas, Proyek, dll).'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Pintasan Laporan</th>
                  <th className="py-3 px-4">Kategori Laporan</th>
                  <th className="py-3 px-4">Format Dokumen PDF</th>
                  <th className="py-3 px-4">Filter Aktif Tersimpan</th>
                  <th className="py-3 px-4">Terakhir Diubah</th>
                  <th className="py-3 px-4 text-right w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee] text-xs">
                {filteredShortcuts.map((s, idx) => {
                  const prefs = s.pdfPreferences;
                  const isThisExporting = exportingId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-[#fafafa] transition-colors">
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-mono text-[#888888]">
                        {idx + 1}
                      </td>

                      {/* Nama Pintasan */}
                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        <div>{s.name}</div>
                        {s.title && s.title !== s.name && (
                          <div className="text-[11px] font-normal text-[#777777] mt-0.5">
                            {s.title}
                          </div>
                        )}
                      </td>

                      {/* Kategori Laporan */}
                      <td className="py-3.5 px-4 font-medium text-[#333333]">
                        {s.categoryLabel || s.exportType}
                      </td>

                      {/* Format Dokumen PDF */}
                      <td className="py-3.5 px-4 text-[#555555]">
                        <span className="font-semibold text-[#111111]">
                          {prefs.paperSize.toUpperCase()}
                        </span>{' '}
                        • {prefs.orientation === 'landscape' ? 'Landscape' : 'Portrait'} •{' '}
                        {prefs.fontSize}pt
                      </td>

                      {/* Filter Aktif Tersimpan */}
                      <td className="py-3.5 px-4">
                        {s.filtersSummary && s.filtersSummary.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {s.filtersSummary.map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-1.5 py-0.5 bg-[#f0f2f5] text-[10px] text-[#333333] font-medium"
                              >
                                {f.label}: {f.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#999999] italic">Semua Data Kumulatif</span>
                        )}
                      </td>

                      {/* Terakhir Diubah */}
                      <td className="py-3.5 px-4 text-[#666666] font-mono text-[11px]">
                        {s.updatedAt ? s.updatedAt.slice(0, 10) : s.createdAt.slice(0, 10)}
                      </td>

                      {/* Aksi: Ekspor, Edit, Hapus */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Ekspor 1-Klik */}
                          <button
                            type="button"
                            onClick={() => handleExport(s)}
                            disabled={isThisExporting || exportingId !== null}
                            className={`px-3 py-1.5 text-xs font-bold text-white transition-colors flex items-center gap-1.5 ${
                              isThisExporting
                                ? 'bg-[#555555] cursor-wait'
                                : 'bg-[#111111] hover:bg-black'
                            }`}
                            title="Ekspor PDF sekarang dalam 1-klik"
                          >
                            {isThisExporting ? (
                              <>
                                <span className="inline-block animate-spin">⟳</span>
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <span>⬇</span>
                                <span>Ekspor</span>
                              </>
                            )}
                          </button>

                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => setEditingShortcut(s)}
                            disabled={exportingId !== null}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#333333] bg-[#f0f0f0] hover:bg-[#e0e0e0] transition-colors"
                            title="Edit konfigurasi pintasan ini"
                          >
                            Edit
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setDeletingShortcut(s)}
                            disabled={exportingId !== null}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#cf1124] bg-[#fdf2f2] hover:bg-[#fae2e2] transition-colors"
                            title="Hapus pintasan ini"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit Komprehensif */}
      {editingShortcut && (
        <EditQuickReportModal
          isOpen={Boolean(editingShortcut)}
          shortcut={editingShortcut}
          onClose={() => setEditingShortcut(null)}
          onSuccess={() => showToast('Perubahan pintasan berhasil disimpan!')}
        />
      )}

      {/* Dialog Konfirmasi Hapus */}
      {deletingShortcut && (
        <CustomDialog
          isOpen={Boolean(deletingShortcut)}
          onClose={() => setDeletingShortcut(null)}
          title="Hapus Pintasan Laporan Cepat?"
          description={`Apakah Anda yakin ingin menghapus pintasan "${deletingShortcut.name}"? Pintasan ini akan dihapus permanen dari daftar Laporan Cepat.`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
          isDestructive
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
