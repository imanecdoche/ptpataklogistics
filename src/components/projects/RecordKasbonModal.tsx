import React, { useState, useEffect } from 'react';
import { ProjectSubJob } from '@/types/database';
import { recordWorkerKasbon } from '@/lib/projectFinanceService';
import { formatRupiah } from '@/lib/currencyUtils';

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

  if (!isOpen) return null;

  const targetSubJob = subJobs.find(s => s.id === selectedSubJobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubJob) {
      alert('Pilih sub-pekerjaan fisik terlebih dahulu.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Nominal kasbon harus lebih besar dari 0.');
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

      alert(`Kasbon mandor ${targetSubJob.workerLeaderName} sebesar ${formatRupiah(amount)} berhasil dicatat ke Buku Kas & memotong sisa upah.`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Gagal mencatat kasbon:', err);
      alert('Terjadi kesalahan saat mencatat kasbon tukang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newRemaining = targetSubJob
    ? Math.max(0, targetSubJob.remainingWorkerPay - (amount || 0))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Surface Dialog */}
      <div 
        className="relative w-full max-w-md bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
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
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
          >
            ✕
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
                  {s.jobName} • {s.workerLeaderName} ({s.projectName})
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
              <input
                type="number"
                min="1000"
                step="10000"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono font-bold text-[#111111] outline-none focus:border-[#111111]"
                autoFocus
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
              {isSubmitting ? 'Mencatat...' : '✓ Simpan Kasbon Tukang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
