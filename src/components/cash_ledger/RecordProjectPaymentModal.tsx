import React, { useState } from 'react';
import { Project } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordProjectPayment } from '@/lib/cashLedgerService';

interface RecordProjectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  userEmail: string;
  onSuccess: () => void;
}

export function RecordProjectPaymentModal({
  isOpen,
  onClose,
  projects,
  userEmail,
  onSuccess
}: RecordProjectPaymentModalProps): React.JSX.Element | null {
  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayString());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [settleMatchedTickets, setSettleMatchedTickets] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMsg('Pilih proyek terlebih dahulu.');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal pembayaran termin wajib lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await recordProjectPayment({
        projectId: selectedProjectId,
        projectName: currentProject?.name || 'Proyek Lapangan',
        amount,
        date: `${date}T12:00:00.000Z`,
        referenceId: referenceId.trim(),
        notes: notes.trim(),
        userEmail,
        settleMatchedTickets
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal mencatat pelunasan termin proyek:', err);
      setErrorMsg('Terjadi kesalahan saat mencatat pembayaran termin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-[12px] border border-[#e5e5e5] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111111]">
              Catat Pembayaran Termin Proyek
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Penerimaan pembayaran dari klien / pihak proyek (Kas Masuk & Pelunasan Piutang)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] text-base p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[6px] font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Tanggal Penerimaan Dana
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111] bg-white"
            />
          </div>

          {/* Pilihan Proyek */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Proyek Terkait
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111] bg-white cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">Tidak ada proyek terdaftar</option>
              ) : (
                projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Nominal Termin Masuk */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Nominal Diterima (Rp)
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="Contoh: 20.000.000"
              className="w-full text-sm font-bold tracking-tight text-[#111111]"
            />
          </div>

          {/* No. Bukti Transfer / Kwitansi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              No. Bukti / Referensi Bank <span className="text-[#888888] font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder="Contoh: TRF-BCA-88912 atau KWT-004"
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111] placeholder:text-[#aaaaaa]"
            />
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Keterangan Pembayaran <span className="text-[#888888] font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Pembayaran termin 1 proyek konservasi cikedal 15 ritase"
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111] placeholder:text-[#aaaaaa] resize-none"
            />
          </div>

          {/* Checkbox Auto-settle FIFO */}
          <label className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] cursor-pointer">
            <input
              type="checkbox"
              checked={settleMatchedTickets}
              onChange={e => setSettleMatchedTickets(e.target.checked)}
              className="mt-0.5 rounded border-[#d1d5db] text-[#111111] focus:ring-0 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#111111] block">
                Otomatis lunasi tiket tempo secara berurutan (FIFO)
              </span>
              <span className="text-[#666666] text-[11px] block mt-0.5">
                Sistem akan menandai tiket ritase berstatus TEMPO tertua pada proyek ini menjadi LUNAS hingga nominal mencukupi.
              </span>
            </div>
          </label>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#666666] hover:text-[#111111] bg-white border border-[#e5e5e5] rounded-[6px] hover:bg-[#fafafa] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] rounded-[6px] hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
