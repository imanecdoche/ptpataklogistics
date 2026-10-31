import React, { useState, useEffect } from 'react';
import { CashLedgerEntry, CashFlowType } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { updateCashLedgerEntry } from '@/lib/cashLedgerService';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { ParsedBankReceipt } from '@/lib/receiptScanner';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface EditCashLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CashLedgerEntry | null;
  userEmail: string;
  onSuccess: () => void;
}

const ALL_CASHFLOW_TYPES: { id: CashFlowType; label: string }[] = [
  { id: 'MODAL_AWAL', label: 'Setoran Modal Awal' },
  { id: 'TOPUP_MODAL', label: 'Top-up Modal Investasi' },
  { id: 'HUTANG_PIHAK_KETIGA', label: 'Pinjaman / Hutang Pihak Ketiga' },
  { id: 'PELUNASAN_PIUTANG', label: 'Pelunasan Piutang / Termin' },
  { id: 'BELI_MATERIAL', label: 'Belanja Material' },
  { id: 'BIAYA_OPERASIONAL', label: 'Biaya Operasional / HOK Supir' },
  { id: 'KASBON_TUKANG', label: 'Kasbon Mandor / Tukang' },
  { id: 'CICILAN_HUTANG', label: 'Pembayaran Cicilan Hutang' },
  { id: 'BAGI_HASIL_INVESTOR', label: 'Bagi Hasil Investor' },
  { id: 'TRANSFER_INVESTOR', label: 'Transfer / Talangan Antar-Investor' }
];

export function EditCashLedgerModal({
  isOpen,
  onClose,
  entry,
  userEmail,
  onSuccess
}: EditCashLedgerModalProps): React.JSX.Element | null {
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<CashFlowType>('BIAYA_OPERASIONAL');
  const [isCredit, setIsCredit] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  const handleReceiptScan = (parsed: ParsedBankReceipt) => {
    if (parsed.date) setDate(parsed.date);
    if (parsed.amount && parsed.amount > 0) setAmount(parsed.amount);
    if (parsed.referenceId) setReferenceId(parsed.referenceId);
    if (parsed.notesSummary) {
      setDescription(prev => (prev.trim() ? `${prev.trim()} - ${parsed.notesSummary}` : parsed.notesSummary || ''));
    }
  };

  useEffect(() => {
    if (entry) {
      const parsedDate = entry.date ? entry.date.slice(0, 10) : '';
      setDate(parsedDate);
      setType(entry.type);
      setIsCredit(Boolean(entry.isCredit));
      setAmount(entry.amount || 0);
      setDescription(entry.description || '');
      setReferenceId(entry.referenceId || '');
      setReceiptUrl(entry.receiptUrl || '');
      setErrorMsg(null);
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const handlePreSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal mutasi kas wajib lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Keterangan / deskripsi mutasi wajib diisi.');
      return;
    }
    setErrorMsg(null);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (): Promise<void> => {
    setIsPinModalOpen(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await updateCashLedgerEntry({
        entryId: entry.id,
        date: date ? `${date}T12:00:00.000Z` : entry.date,
        type,
        amount,
        isCredit,
        description: description.trim(),
        referenceId: referenceId.trim(),
        receiptUrl,
        updatedByName: userEmail
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui mutasi kas:', err);
      setErrorMsg('Terjadi kesalahan saat memperbarui mutasi kas di database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal Surface */}
        <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10 border-none">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Edit Mutasi Buku Kas
              </h3>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Perubahan nominal akan otomatis merevisi running balance seluruh kas.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#888888] hover:text-[#111111] p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handlePreSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-[6px] font-medium flex items-center gap-2 border-none">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Tanggal Mutasi
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#eaeaea] rounded-[8px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors"
                  required
                />
              </div>

              {/* Arah Arus Kas: Kas Masuk / Kas Keluar */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Arah Aliran Kas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCredit(true)}
                    className={`py-2 px-3 text-xs font-semibold rounded-[8px] border-none transition-colors cursor-pointer ${
                      isCredit
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
                    }`}
                  >
                    Kas Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCredit(false)}
                    className={`py-2 px-3 text-xs font-semibold rounded-[8px] border-none transition-colors cursor-pointer ${
                      !isCredit
                        ? 'bg-[#cf1124] text-white'
                        : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
                    }`}
                  >
                    Kas Keluar (-)
                  </button>
                </div>
              </div>

              {/* Kategori Mutasi */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Kategori Mutasi
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CashFlowType)}
                  className="w-full bg-[#f9f9f9] border border-[#eaeaea] rounded-[8px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors cursor-pointer"
                >
                  {ALL_CASHFLOW_TYPES.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Nominal Mutasi (Rp)
                </label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="Rp 0"
                  className="w-full bg-[#f9f9f9] border border-[#eaeaea] rounded-[8px] px-3 py-2 text-sm font-bold text-[#111111] outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Keterangan / Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Belanja solar armada truk B 5000 CAA"
                  className="w-full bg-[#f9f9f9] border border-[#eaeaea] rounded-[8px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors resize-none"
                  required
                />
              </div>

              {/* Nomor Referensi (Opsional) */}
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Nomor Referensi (Opsional)
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={e => setReferenceId(e.target.value)}
                  placeholder="Contoh: PTK-20261030-9429 atau KSB-01"
                  className="w-full bg-[#f9f9f9] border border-[#eaeaea] rounded-[8px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111] transition-colors font-mono"
                />
              </div>

              {/* Upload Foto Bukti Transaksi */}
              <div>
                <ReceiptUpload
                  value={receiptUrl}
                  onChange={setReceiptUrl}
                  onScanComplete={handleReceiptScan}
                  folder="cash_ledger"
                  label="Foto Bukti Kwitansi / Struk (Opsional)"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#eaeaea] bg-white flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-[#555555] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[8px] border-none transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2c2c2e] rounded-[8px] border-none transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Menyinkronkan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PIN Auth Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Otorisasi Edit Mutasi Kas"
        description="Masukkan PIN Keamanan untuk mengonfirmasi pengubahan data buku kas dan rekalkulasi saldo."
      />
    </>
  );
}
