import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ProjectSubJob } from '@/types/database';
import { recordWorkerKasbon } from '@/lib/projectFinanceService';
import { formatRupiah } from '@/lib/currencyUtils';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useDialog } from '@/context/DialogContext';
import { useDrawerTransition } from '@/hooks/useDrawerTransition';

interface RecordKasbonModalProps {
  isOpen: boolean;
  onClose: () => void;
  subJobs: ProjectSubJob[];
  defaultSubJobId?: string;
  userEmail: string;
  onSuccess?: () => void;
}

export function RecordKasbonModal({
  isOpen,
  onClose,
  subJobs,
  defaultSubJobId,
  userEmail,
  onSuccess
}: RecordKasbonModalProps): React.JSX.Element | null {
  const [selectedSubJobId, setSelectedSubJobId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useDialog();
  const { isRendered, isVisible, handleClose } = useDrawerTransition(isOpen, onClose, { durationMs: 200 });

  useEffect(() => {
    if (defaultSubJobId) {
      setSelectedSubJobId(defaultSubJobId);
    } else if (subJobs.length > 0 && subJobs[0]) {
      setSelectedSubJobId(subJobs[0].id);
    }
    setDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setNote('');
  }, [defaultSubJobId, subJobs, isOpen]);

  if (!isRendered) return null;

  const targetSubJob = subJobs.find(s => s.id === selectedSubJobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubJob) {
      showAlert({
        title: 'Validasi Input',
        message: 'Pilih sub-pekerjaan fisik terlebih dahulu.'
      });
      return;
    }
    if (!amount || amount <= 0) {
      showAlert({
        title: 'Validasi Input',
        message: 'Nominal kasbon harus lebih besar dari 0.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await recordWorkerKasbon({
        subJobId: targetSubJob.id,
        subJobName: targetSubJob.jobName,
        projectId: targetSubJob.projectId,
        projectName: targetSubJob.projectName,
        workerLeaderName: targetSubJob.workerLeaderName,
        date,
        amount: Number(amount),
        note: note.trim(),
        userEmail
      });

      showAlert({
        title: 'Kasbon Berhasil Dicatat',
        message: `Kasbon mandor ${targetSubJob.workerLeaderName} sebesar ${formatRupiah(amount)} berhasil dicatat ke Buku Kas & memotong sisa upah.`
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Gagal mencatat kasbon:', err);
      showAlert({
        title: 'Kesalahan',
        message: 'Terjadi kesalahan saat mencatat kasbon tukang.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newRemaining = targetSubJob
    ? Math.max(0, targetSubJob.remainingWorkerPay - (amount || 0))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Surface Dialog */}
      <div 
        className={`relative w-full max-w-md bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col overflow-hidden shadow-2xl z-10 border-none transition-transform duration-200 ease-out transform ${
          isVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-4'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#fafafa] flex items-center justify-between flex-shrink-0 border-none">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                Catat Kasbon / Panjar Tukang
              </h3>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Input bon fisik tukang, memotong plafon upah borongan & mencatat kas keluar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-[6px] text-[#555555] hover:text-[#111111] bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center transition-colors border-none cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-white text-xs">
          {/* Pilihan Sub-Pekerjaan */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Pekerjaan & Mandor Penerima Kasbon <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubJobId}
              onChange={e => setSelectedSubJobId(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
            >
              {subJobs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.jobName} - {s.workerLeaderName} ({s.projectName})
                </option>
              ))}
            </select>
          </div>

          {/* Status Plafon Saat Ini */}
          {targetSubJob && (
            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#666666]">Mandor / Kepala Tukang:</span>
                <span className="font-bold text-[#111111]">{targetSubJob.workerLeaderName}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#666666]">Batas Kontrak Borongan:</span>
                <span className="font-mono font-bold text-[#111111]">
                  {formatRupiah(targetSubJob.contractAmountWorker)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#666666]">Total Kasbon Ditarik:</span>
                <span className="font-mono font-bold text-amber-700">
                  {formatRupiah(targetSubJob.totalKasbonPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#ececec]">
                <span className="text-[#666666] font-semibold">Sisa Hak Upah Saat Ini:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatRupiah(targetSubJob.remainingWorkerPay)}
                </span>
              </div>
            </div>
          )}

          {/* Tanggal & Nominal Kasbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Tanggal Penarikan Kasbon
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono font-semibold text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Nominal Kasbon (Rp) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Keterangan Bon */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Catatan / Keperluan Kasbon (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Kasbon mingguan tukang / Uang makan & solar"
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>

          {/* Simulasi Sisa Upah Baru */}
          {amount > 0 && targetSubJob && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-amber-800 block">Sisa Upah Setelah Kasbon Ini</span>
                <span className="font-mono font-bold text-amber-900 text-sm">
                  {formatRupiah(newRemaining)}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                - {formatRupiah(amount)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#f0f0f0] rounded-[8px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || amount <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-[8px] transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? 'Mencatat...' : 'Simpan Kasbon Tukang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
