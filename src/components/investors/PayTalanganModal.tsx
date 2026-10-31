import React, { useState } from 'react';
import { X, History } from 'lucide-react';
import { InvestorTransferLog } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { ReceiptLightboxModal } from '@/components/ui/ReceiptLightboxModal';

interface PayTalanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: InvestorTransferLog | null;
  onConfirm: (payload: {
    transferId: string;
    amount: number;
    date: string;
    note: string;
    receiptUrl: string;
  }) => void;
}

export function PayTalanganModal({
  isOpen,
  onClose,
  transfer,
  onConfirm
}: PayTalanganModalProps): React.JSX.Element | null {
  if (!isOpen || !transfer) return null;

  const totalAmount = transfer.totalAmount ?? transfer.amount ?? 0;
  const paidAmount = transfer.paidAmount ?? (transfer.status === 'LUNAS' ? totalAmount : 0);
  const remainingAmount = transfer.remainingAmount ?? Math.max(0, totalAmount - paidAmount);

  const getTodayString = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [amount, setAmount] = useState<number>(remainingAmount > 0 ? remainingAmount : 0);
  const [date, setDate] = useState<string>(getTodayString());
  const [note, setNote] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeReceiptPreview, setActiveReceiptPreview] = useState<string | null>(null);

  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal cicilan wajib lebih besar dari Rp 0.');
      return;
    }

    if (amount > remainingAmount) {
      setErrorMsg(`Nominal cicilan (${formatRupiah(amount)}) melebihi sisa hutang (${formatRupiah(remainingAmount)}).`);
      return;
    }

    setErrorMsg(null);
    onConfirm({
      transferId: transfer.id,
      amount,
      date,
      note: note.trim(),
      receiptUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Surface: Flat Filled, Zero Outline Stroke */}
      <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[88vh] overflow-hidden shadow-2xl z-10 border-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-[#111111] tracking-tight">
              Bayar Cicilan Talangan Investor
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Ref: {transfer.id} | {transfer.fromInvestorName} &rarr; {transfer.toInvestorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] rounded-[6px] border-none cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {/* Card Ringkasan Status Hutang: Filled Only */}
          <div className="bg-[#f8f8f8] p-3.5 rounded-[10px] space-y-2 border-none">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#777777] font-medium">Hutang Pokok Awal:</span>
              <span className="font-semibold text-[#111111]">{formatRupiah(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#777777] font-medium">Sudah Dibayarkan:</span>
              <span className="font-semibold text-[#008060]">{formatRupiah(paidAmount)}</span>
            </div>
            <div className="pt-2 flex justify-between items-center bg-[#efefef] px-3 py-2 rounded-[6px]">
              <span className="text-xs font-bold text-[#111111]">Sisa Kewajiban Hutang:</span>
              <span className="text-sm font-bold text-[#cf1124]">{formatRupiah(remainingAmount)}</span>
            </div>
          </div>

          {/* Riwayat Cicilan Sebelumnya (jika ada) */}
          {transfer.installments && transfer.installments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                <History className="w-3.5 h-3.5 text-[#555555]" />
                <span>Riwayat Cicilan Terbayar ({transfer.installments.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {transfer.installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-2.5 bg-[#f5f5f5] rounded-[8px] flex items-center justify-between text-xs border-none"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111111]">{formatRupiah(inst.amount)}</span>
                        <span className="text-[10px] text-[#777777]">{inst.date}</span>
                      </div>
                      {inst.note && (
                        <p className="text-[11px] text-[#666666] mt-0.5">{inst.note}</p>
                      )}
                    </div>
                    {inst.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveReceiptPreview(inst.receiptUrl || null)}
                        className="px-2 py-1 bg-[#e0e0e0] hover:bg-[#d5d5d5] text-[#111111] text-[10px] font-semibold rounded-[4px] border-none cursor-pointer transition-colors"
                      >
                        Lihat Bukti
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Pembayaran Cicilan */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-[#666666]">
                  Nominal Cicilan yang Dibayar (Rp)
                </label>
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(remainingAmount)}
                    className="text-[10px] font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] px-2 py-0.5 rounded-[4px] border-none cursor-pointer transition-colors"
                  >
                    Bayar Sisa Penuh
                  </button>
                )}
              </div>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                className="w-full text-base font-bold bg-[#f5f5f5] text-[#111111] rounded-[8px] px-3.5 py-2.5 border-none focus:bg-[#efefef] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#666666] block mb-1">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold bg-[#f5f5f5] text-[#111111] rounded-[8px] px-3 py-2 border-none focus:bg-[#efefef] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#666666] block mb-1">
                Catatan / Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Transfer bank BCA cicilan ke-1"
                className="w-full text-xs bg-[#f5f5f5] text-[#111111] rounded-[8px] px-3 py-2 border-none focus:bg-[#efefef] focus:outline-none"
              />
            </div>

            {/* Upload Bukti Kwitansi / Struk Transfer */}
            <ReceiptUpload
              value={receiptUrl}
              onChange={setReceiptUrl}
              label="Unggah Bukti Transfer / Kwitansi"
              folder="receipts/talangan"
            />

            {errorMsg && (
              <p className="text-xs text-[#cf1124] font-medium bg-[#fce8e6] p-2 rounded-[6px]">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] text-xs font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
              >
                Lanjutkan (Verifikasi PIN)
              </button>
            </div>
          </form>
        </div>
      </div>

      <ReceiptLightboxModal
        isOpen={Boolean(activeReceiptPreview)}
        onClose={() => setActiveReceiptPreview(null)}
        imageUrl={activeReceiptPreview}
      />
    </div>
  );
}
