import React, { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordDebtPayment } from '@/lib/cashLedgerService';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-[12px] border border-[#e5e5e5] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111111]">
              Bayar / Cicil Hutang Bpk. Pei
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Hutang usaha perseroan non-ritase (Pokok Awal: Rp 18.000.000)
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

          {/* Info Status Hutang & Kas */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-[#fafafa] border border-[#eaeaea] rounded-[8px] text-xs">
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

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#666666] hover:bg-[#f5f5f5] rounded-[6px] transition-colors border-none bg-transparent cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0 || amount > remainingDebt}
              className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[6px] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Bayar Cicilan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
