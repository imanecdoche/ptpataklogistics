import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectSubJob } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import {
  subscribeProjectSubJobs,
  recordWorkerKasbon,
  recordEmployeeKasbon
} from '@/lib/projectFinanceService';
import { subscribeProjects } from '@/lib/projectService';

interface QuickRecordKasbonModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  defaultProjectId?: string;
  defaultSubJobId?: string;
  onSuccess?: (msg: string) => void;
}

export function QuickRecordKasbonModal({
  isOpen,
  onClose,
  userEmail,
  defaultProjectId,
  defaultSubJobId,
  onSuccess
}: QuickRecordKasbonModalProps): React.JSX.Element | null {
  // Transisi Keluar Halus (Graceful Unmounting per /auditaislop)
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form Type: 'worker' (Mandor / Tukang Fisik) | 'employee' (Tim / Relawan Proyek)
  const [kasbonType, setKasbonType] = useState<'worker' | 'employee'>('worker');

  // Master Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [allSubJobs, setAllSubJobs] = useState<ProjectSubJob[]>([]);

  // Form Fields
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');
  const [selectedSubJobId, setSelectedSubJobId] = useState<string>(defaultSubJobId || '');
  const [recipientName, setRecipientName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initialFocusRef = useRef<HTMLInputElement | null>(null);

  // Handle Mount & Unmount lifecycle
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Subscribe Projects & SubJobs
  useEffect(() => {
    if (!mounted) return;

    const unsubProjects = subscribeProjects(projs => {
      const active = projs.filter(p => p.status !== 'COMPLETED');
      setProjects(active);
      if (!selectedProjectId && active.length > 0) {
        setSelectedProjectId(defaultProjectId || active[0]!.id);
      }
    });

    const unsubSubJobs = subscribeProjectSubJobs(subs => {
      setAllSubJobs(subs);
    });

    return () => {
      unsubProjects();
      unsubSubJobs();
    };
  }, [mounted, defaultProjectId, selectedProjectId]);

  // SubJobs yang relevan dengan project terpilih
  const availableSubJobs = useMemo(() => {
    if (!selectedProjectId) return [];
    return allSubJobs.filter(s => s.projectId === selectedProjectId);
  }, [allSubJobs, selectedProjectId]);

  // Auto-select SubJob saat project berubah
  useEffect(() => {
    if (availableSubJobs.length > 0) {
      const currentExists = availableSubJobs.some(s => s.id === selectedSubJobId);
      if (!currentExists) {
        setSelectedSubJobId(availableSubJobs[0]!.id);
      }
    } else {
      setSelectedSubJobId('');
    }
  }, [availableSubJobs, selectedSubJobId]);

  // Auto-fill nama mandor jika sub-pekerjaan terpilih
  const activeSubJob = useMemo(() => {
    return availableSubJobs.find(s => s.id === selectedSubJobId);
  }, [availableSubJobs, selectedSubJobId]);

  useEffect(() => {
    if (kasbonType === 'worker' && activeSubJob?.workerLeaderName && !recipientName) {
      setRecipientName(activeSubJob.workerLeaderName);
    }
  }, [activeSubJob, kasbonType, recipientName]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleTriggerClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, isSubmitting]);

  const handleTriggerClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const formatRupiah = (val: number): string =>
    'Rp ' + Math.round(val).toLocaleString('id-ID');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedProjectId) {
      setErrorMsg('Pilih proyek terlebih dahulu.');
      return;
    }

    if (!recipientName.trim()) {
      setErrorMsg(kasbonType === 'worker' ? 'Nama mandor / tukang wajib diisi.' : 'Nama karyawan / tim wajib diisi.');
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMsg('Nominal kasbon harus lebih dari Rp 0.');
      return;
    }

    if (kasbonType === 'worker' && !selectedSubJobId) {
      setErrorMsg('Pilih sub-pekerjaan fisik (MCK, Paving, Drainase) untuk kasbon tukang.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const prjName = selectedProject?.name || 'Proyek Lapangan';

      if (kasbonType === 'worker') {
        const subName = activeSubJob?.jobName || 'Pekerjaan Fisik';
        await recordWorkerKasbon({
          subJobId: selectedSubJobId,
          subJobName: subName,
          projectId: selectedProjectId,
          projectName: prjName,
          workerLeaderName: recipientName.trim(),
          date,
          amount,
          note: note.trim(),
          receiptUrl: receiptUrl.trim() || undefined,
          userEmail
        });
        if (onSuccess) {
          onSuccess(`Kasbon tukang ${recipientName} sebesar ${formatRupiah(amount)} berhasil dicatat!`);
        }
      } else {
        await recordEmployeeKasbon({
          projectId: selectedProjectId,
          projectName: prjName,
          employeeName: recipientName.trim(),
          date,
          amount,
          note: note.trim(),
          receiptUrl: receiptUrl.trim() || undefined,
          userEmail
        });
        if (onSuccess) {
          onSuccess(`Kasbon tim ${recipientName} sebesar ${formatRupiah(amount)} berhasil dicatat!`);
        }
      }

      handleTriggerClose();
    } catch (err: any) {
      console.error('[QuickRecordKasbonModal] Gagal simpan kasbon:', err);
      setErrorMsg(err?.message || 'Gagal menyimpan kasbon. Periksa koneksi data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop (Solid Dimmed without blur per /auditaislop) */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleTriggerClose}
      />

      {/* Modal Desktop (Locked Fixed Dimensions) & Mobile Bottom Drawer (h-[85dvh]) */}
      <div
        className={`relative w-full md:w-[500px] md:h-[620px] h-[85dvh] max-h-[85dvh] md:max-h-[620px] bg-white rounded-t-[16px] md:rounded-[12px] flex flex-col overflow-hidden z-10 shadow-2xl transition-transform duration-200 ease-out select-text ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header (Centered title, zero pill/drag handle bar per /auditaislop) */}
        <div className="px-5 py-4 border-b border-[#f0f0f0] bg-white flex items-center justify-between flex-shrink-0">
          <div className="w-8" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wide">
              Catat Kasbon Lapangan
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Otomatis memotong sisa hak borongan & mutasi Buku Kas
            </p>
          </div>
          <button
            type="button"
            onClick={handleTriggerClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Toggle Tipe Kasbon (Solid-Filled Only per /auditaislop) */}
        <div className="p-3 bg-[#fafafa] border-b border-[#f0f0f0] flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eeeeee] rounded-[8px]">
            <button
              type="button"
              onClick={() => {
                setKasbonType('worker');
                setRecipientName(activeSubJob?.workerLeaderName || '');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-[6px] transition-all whitespace-nowrap cursor-pointer ${
                kasbonType === 'worker'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              👷 Kasbon Tukang (Fisik)
            </button>
            <button
              type="button"
              onClick={() => {
                setKasbonType('employee');
                setRecipientName('');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-[6px] transition-all whitespace-nowrap cursor-pointer ${
                kasbonType === 'employee'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              👥 Kasbon Tim / Relawan
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-[#fdf2f2] text-xs text-[#cf1124] font-medium rounded-[6px]">
              {errorMsg}
            </div>
          )}

          {/* 1. Pilih Proyek */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
              Proyek Lapangan <span className="text-[#cf1124]">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName || 'Mitra'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Khusus Kasbon Tukang: Pilih Sub-Pekerjaan Fisik */}
          {kasbonType === 'worker' && (
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
                Sub-Pekerjaan Fisik (MCK / Paving / Drainase) <span className="text-[#cf1124]">*</span>
              </label>
              {availableSubJobs.length > 0 ? (
                <select
                  value={selectedSubJobId}
                  onChange={e => setSelectedSubJobId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
                >
                  {availableSubJobs.map(s => {
                    const totalBudget = Number(s.contractAmountWorker) || 0;
                    const kasbonPaid = Number(s.totalKasbonPaid) || 0;
                    const remaining = s.remainingWorkerPay ?? Math.max(0, totalBudget - kasbonPaid);

                    return (
                      <option key={s.id} value={s.id}>
                        {s.jobName} — Mandor: {s.workerLeaderName || 'Belum Ditentukan'} (Sisa Hak: {formatRupiah(remaining)})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="p-3 bg-[#fff8e6] text-amber-800 text-xs rounded-[6px]">
                  Proyek ini belum mendaftarkan sub-pekerjaan fisik (MCK, Paving, dll). Daftarkan sub-pekerjaan di tab Proyek atau catat sebagai Kasbon Tim.
                </div>
              )}

              {/* Info Sisa Hak Borongan (Contoh Kasbon Papah) */}
              {activeSubJob && (
                <div className="mt-2 p-2.5 bg-[#f9fafb] rounded-[6px] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#666666]">
                    Nilai Borongan: <strong className="text-[#111111] font-bold">{formatRupiah(activeSubJob.contractAmountWorker)}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Sisa Hak: {formatRupiah(activeSubJob.remainingWorkerPay ?? Math.max(0, (Number(activeSubJob.contractAmountWorker) || 0) - (Number(activeSubJob.totalKasbonPaid) || 0)))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Nama Penerima Kasbon */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
              {kasbonType === 'worker' ? 'Nama Mandor / Tukang' : 'Nama Karyawan / Relawan'}{' '}
              <span className="text-[#cf1124]">*</span>
            </label>
            <input
              ref={initialFocusRef}
              type="text"
              required
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder={kasbonType === 'worker' ? 'Contoh: Pak Dede / Mandor A' : 'Contoh: Fatih / Budi'}
              className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
            />
          </div>

          {/* 4. Tanggal & Nominal Kasbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
                Tanggal Kasbon <span className="text-[#cf1124]">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
                Nominal Kasbon (Rp) <span className="text-[#cf1124]">*</span>
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-bold text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
              />
            </div>
          </div>

          {/* 5. Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
              Catatan / Keperluan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Panjar mingguan ke-2 material semen & upah"
              className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
            />
          </div>

          {/* 6. Link Bukti Kwitansi / Struk (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-[#333333] mb-1 uppercase tracking-wide">
              URL Bukti Transfer / Kwitansi (Opsional)
            </label>
            <input
              type="text"
              value={receiptUrl}
              onChange={e => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#f5f5f5] text-xs font-medium text-[#111111] rounded-[6px] focus:bg-white focus:outline-none transition-colors border-none"
            />
          </div>
        </form>

        {/* Sticky Action Footer (Wajib menempel di dasar per /auditaislop) */}
        <div className="sticky bottom-0 inset-x-0 z-10 mt-auto bg-white p-4 border-t border-[#f0f0f0] flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleTriggerClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#333333] text-xs font-bold rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (kasbonType === 'worker' && !selectedSubJobId)}
            className="px-5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Kasbon</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
