import React, { useState } from 'react';
import { CashFlowType } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordCashLedgerEntry } from '@/lib/cashLedgerService';

interface RecordMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSuccess: () => void;
}

const MUTATION_TYPES: { id: CashFlowType; label: string; isCredit: boolean }[] = [
  { id: 'TOPUP_MODAL', label: 'Top-up Modal Investasi (Kas Masuk)', isCredit: true },
  { id: 'MODAL_AWAL', label: 'Setoran Modal Awal (Kas Masuk)', isCredit: true },
  { id: 'PELUNASAN_PIUTANG', label: 'Penerimaan Pelunasan Piutang (Kas Masuk)', isCredit: true },
  { id: 'BIAYA_OPERASIONAL', label: 'Biaya Operasional Umum / Kantor (Kas Keluar)', isCredit: false },
  { id: 'BELI_MATERIAL', label: 'Belanja Material Non-Ritase (Kas Keluar)', isCredit: false },
  { id: 'CICILAN_HUTANG', label: 'Pembayaran Cicilan Hutang Lain (Kas Keluar)', isCredit: false },
  { id: 'BAGI_HASIL_INVESTOR', label: 'Penyerahan Bagi Hasil / Dividen Investor (Kas Keluar)', isCredit: false },
  { id: 'TRANSFER_INVESTOR', label: 'Transfer / Realokasi Dana Internal (Kas Keluar)', isCredit: false }
];

export function RecordMutationModal({
  isOpen,
  onClose,
  userEmail,
  onSuccess
}: RecordMutationModalProps): React.JSX.Element | null {
  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayString());
  const [selectedType, setSelectedType] = useState<CashFlowType>('BIAYA_OPERASIONAL');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTypeConfig = MUTATION_TYPES.find(m => m.id === selectedType) || MUTATION_TYPES[0];

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal mutasi kas wajib lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Keterangan / deskripsi mutasi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await recordCashLedgerEntry({
        date: `${date}T12:00:00.000Z`,
        type: selectedType,
        amount,
        isCredit: Boolean(currentTypeConfig?.isCredit),
        description: description.trim(),
        referenceId: referenceId.trim(),
        createdByName: userEmail
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal mencatat mutasi kas:', err);
      setErrorMsg('Terjadi kesalahan saat mencatat mutasi kas ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-[12px] border border-[#e5e5e5] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111111]">
              Catat Mutasi Kas Manual
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Pencatatan kas masuk atau kas keluar non-ritase operasional
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[6px] font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tanggal */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              Tanggal Transaksi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none transition-colors"
            />
          </div>

          {/* Kategori Mutasi */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              Kategori Mutasi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as CashFlowType)}
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-medium outline-none transition-colors cursor-pointer appearance-none pr-8"
              >
                {MUTATION_TYPES.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#777777]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="text-[10px] text-[#777777] mt-1 font-medium">
              Status Arus Kas: <span className={currentTypeConfig?.isCredit ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {currentTypeConfig?.isCredit ? '(+) Kas Masuk' : '(-) Kas Keluar'}
              </span>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              Nominal Transaksi (Rp) <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              required
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              Keterangan / Keperluan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembelian bensin & konsumsi rapat lapangan"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none transition-colors"
            />
          </div>

          {/* No. Bukti / Referensi */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              No. Referensi / Kwitansi (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: KWT-0023 / BUKTI-TRF"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] font-medium outline-none transition-colors"
            />
          </div>

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
              disabled={isSubmitting || amount <= 0 || !description.trim()}
              className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[6px] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
