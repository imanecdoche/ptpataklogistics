import React, { useState } from 'react';
import { Project } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordProjectPayment } from '@/lib/cashLedgerService';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { X, AlertCircle } from 'lucide-react';

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
  const [receiptUrl, setReceiptUrl] = useState<string>('');
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
        receiptUrl,
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Surface: Mobile Bottom Sheet Drawer */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10 border-none">
        {/* Header Modal Bersih: Judul di tengah pada mobile */}
        <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0">
          <div className="w-full text-center md:text-left">
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
            className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-[6px] font-medium flex items-center gap-2 border-none">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
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

          {/* Upload Bukti Kwitansi / Transfer */}
          <ReceiptUpload
            value={receiptUrl}
            onChange={setReceiptUrl}
            label="Unggah Bukti Pelunasan / Kwitansi"
            folder="receipts/project_payments"
          />

          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="flex-1 md:flex-none py-2.5 px-5 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[8px] font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
