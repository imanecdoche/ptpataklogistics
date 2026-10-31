import React, { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordDebtPayment } from '@/lib/cashLedgerService';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { X, AlertCircle } from 'lucide-react';

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingDebt: number;
  currentCashBalance: number;
  userEmail: string;
  onSuccess: () => void;
}

export function PayDebtModal({
  isOpen,
  onClose,
  remainingDebt,
  currentCashBalance,
  userEmail,
  onSuccess
}: PayDebtModalProps): React.JSX.Element | null {
  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayString());
  const [amount, setAmount] = useState<number>(0);
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal pembayaran cicilan wajib lebih dari 0.');
      return;
    }

    if (amount > remainingDebt) {
      setErrorMsg(`Nominal cicilan (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa hutang (Rp ${remainingDebt.toLocaleString('id-ID')}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await recordDebtPayment({
        amount,
        date: `${date}T12:00:00.000Z`,
        referenceId: referenceId.trim(),
        notes: notes.trim(),
        receiptUrl,
        userEmail
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal mencatat cicilan hutang:', err);
      setErrorMsg('Terjadi kesalahan saat mencatat cicilan hutang ke database.');
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
              Bayar / Cicil Hutang Bpk. Pei
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Hutang usaha perseroan non-ritase (Pokok Awal: Rp 23.000.000)
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

            {/* Info Status Hutang & Kas */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#fafafa] rounded-[8px] text-xs border-none">
              <div>
                <span className="text-[10px] text-[#777777] block font-medium">Sisa Hutang Bpk. Pei:</span>
                <span className="text-sm font-bold tracking-tight text-[#111111]">
                  Rp {remainingDebt.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#777777] block font-medium">Saldo Kas Tersedia:</span>
                <span className={`text-sm font-bold tracking-tight ${currentCashBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  Rp {currentCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Tanggal Pembayaran */}
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Tanggal Pembayaran / Transfer <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none transition-colors"
              />
            </div>

            {/* Nominal Pembayaran */}
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Nominal Cicilan / Pelunasan (Rp) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                required
              />
              <div className="flex items-center justify-between text-[10px] text-[#888888] mt-1">
                <span>Sisa setelah pembayaran ini:</span>
                <span className="font-bold text-[#111111]">
                  Rp {Math.max(0, remainingDebt - (amount || 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Nomor Bukti / Referensi */}
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                No. Referensi / Bukti Transfer (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: TRF-BCA-20261030-01"
                value={referenceId}
                onChange={e => setReferenceId(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] font-medium outline-none transition-colors"
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Catatan / Keterangan
              </label>
              <input
                type="text"
                placeholder="Contoh: Pembayaran cicilan tahap 1 via transfer"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none transition-colors"
              />
            </div>

            {/* Upload Bukti Kwitansi / Transfer */}
            <ReceiptUpload
              value={receiptUrl}
              onChange={setReceiptUrl}
              label="Unggah Bukti Transfer / Kwitansi"
              folder="receipts/debt_pei"
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
              disabled={isSubmitting || amount <= 0 || amount > remainingDebt}
              className="flex-1 md:flex-none py-2.5 px-5 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[8px] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Bayar Cicilan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
