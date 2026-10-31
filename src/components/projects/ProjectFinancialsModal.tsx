import React, { useState, useEffect } from 'react';
import {
  Project,
  ProjectSubJob,
  WorkerKasbonLog,
  ClientProjectPayment,
  DispatchTransaction
} from '@/types/database';
import {
  subscribeProjectSubJobs,
  subscribeWorkerKasbonLogs,
  subscribeClientPayments,
  deleteProjectSubJob
} from '@/lib/projectFinanceService';
import { subscribeAllTransactions } from '@/lib/dispatcherService';
import { formatRupiah } from '@/lib/currencyUtils';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { RecordSubJobModal } from './RecordSubJobModal';
import { RecordKasbonModal } from './RecordKasbonModal';
import { RecordClientPaymentModal } from './RecordClientPaymentModal';
import { WorkerKasbonPrintModal } from './WorkerKasbonPrintModal';

interface ProjectFinancialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  projects: Project[];
  userEmail: string;
}

export function ProjectFinancialsModal({
  isOpen,
  onClose,
  project,
  projects,
  userEmail
}: ProjectFinancialsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'subjobs' | 'material' | 'kasbon' | 'payments'>('subjobs');
  const [subJobs, setSubJobs] = useState<ProjectSubJob[]>([]);
  const [kasbonLogs, setKasbonLogs] = useState<WorkerKasbonLog[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientProjectPayment[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-Modals
  const [isSubJobModalOpen, setIsSubJobModalOpen] = useState(false);
  const [editingSubJob, setEditingSubJob] = useState<ProjectSubJob | null>(null);

  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const [targetSubJobForKasbon, setTargetSubJobForKasbon] = useState<string | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !project) return;
    setIsLoading(true);

    const unsubSubJobs = subscribeProjectSubJobs(list => {
      setSubJobs(list);
      setIsLoading(false);
    }, project.id);

    const unsubKasbon = subscribeWorkerKasbonLogs(list => {
      setKasbonLogs(list.filter(k => k.projectId === project.id));
    });

    const unsubPayments = subscribeClientPayments(list => {
      setClientPayments(list.filter(p => p.projectId === project.id || p.clientName.toLowerCase() === (project.clientName || '').toLowerCase()));
    }, project.id);

    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list.filter(t => t.projectId === project.id));
    });

    return () => {
      unsubSubJobs();
      unsubKasbon();
      unsubPayments();
      unsubTx();
    };
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Kalkulasi Keuangan Terpadu
  // 1. Material
  const totalMaterialRevenue = transactions.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
  const totalMaterialBuyCost = transactions.reduce((acc, t) => acc + (t.totalBuyCost || 0), 0);
  const totalMaterialOpsCost = transactions.reduce((acc, t) => acc + (t.operationalCost || 0), 0);

  // 2. Sub-Pekerjaan Fisik
  const totalSubJobsClientContract = subJobs.reduce((acc, s) => acc + (s.contractAmountClient || 0), 0);
  const totalSubJobsWorkerContract = subJobs.reduce((acc, s) => acc + (s.contractAmountWorker || 0), 0);
  // const totalKasbonPaid = subJobs.reduce((acc, s) => acc + (s.totalKasbonPaid || 0), 0);
  // const totalRemainingWorkerPay = Math.max(0, totalSubJobsWorkerContract - totalKasbonPaid);

  // 3. Pool Total Tagihan Global ke Klien / Kak Angga
  const totalProjectInvoice = totalMaterialRevenue + totalSubJobsClientContract;

  // 4. Total Pembayaran Klien Masuk
  const totalPaymentsReceived = clientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // 5. Sisa Piutang Berjalan Proyek (Total Tagihan - Pembayaran Masuk)
  const remainingReceivableBalance = Math.max(0, totalProjectInvoice - totalPaymentsReceived);

  // 6. Total Beban Biaya & Estimasi Laba Bersih
  const totalProjectCost = totalMaterialBuyCost + totalMaterialOpsCost + totalSubJobsWorkerContract;
  const netProjectProfit = totalProjectInvoice - totalProjectCost;

  const handleDeleteJob = async (id: string, name: string) => {
    if (!window.confirm(`Hapus sub-pekerjaan "${name}"? Catatan kasbon terkait akan tetap tersimpan di riwayat kas.`)) return;
    try {
      await deleteProjectSubJob(id);
    } catch (err) {
      console.error('Gagal menghapus sub-pekerjaan:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop (Tap on blur to close) */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal / Bottom Drawer Container */}
        <div 
          className="relative w-full md:max-w-5xl bg-white rounded-t-[20px] md:rounded-[16px] shadow-2xl flex flex-col h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 ease-out"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Panel */}
          <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex flex-col gap-3.5 flex-shrink-0">
            {/* Baris Atas: Info Proyek & Tombol Close di Pojok Kanan */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                    {project.name}
                  </h2>
                  <span className="text-xs text-[#666666] font-normal">
                    • {project.location}
                  </span>
                </div>
                <p className="text-xs text-[#666666] mt-0.5">
                  Klien / Pihak Proyek: <span className="font-bold text-[#111111]">{project.clientName || 'Mitra Proyek'}</span> • Investor: <span className="font-semibold text-[#111111]">{project.investorName}</span>
                </p>
              </div>

              {/* Tombol Tutup Modal di Pojok Kanan Atas */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[8px] transition-colors cursor-pointer -mr-1 -mt-1"
                title="Tutup Modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Baris Bawah: Deretan Tombol Aksi 1 Row Berjejer */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setEditingSubJob(null);
                  setIsSubJobModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[8px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Tambah Sub-Pekerjaan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-xs font-semibold rounded-[8px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Catat Bayar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetSubJobForKasbon(undefined);
                  setIsKasbonModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-xs font-semibold rounded-[8px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Kasbon Tukang</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-xs font-semibold rounded-[8px] transition-colors cursor-pointer whitespace-nowrap"
                title="Cetak Rekap Kasbon & Borongan Mandor"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Terpadu (Pool Tagihan & Saldo Berjalan) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-[#fafafa] border-b border-[#eaeaea] flex-shrink-0">
            {/* Metrik 1: Total Nilai Proyek (Global) */}
            <div className="bg-white p-3.5 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Total Nilai Tagihan (Pool)
              </span>
              <div className="mt-1">
                <MetricCardCurrency amount={totalProjectInvoice} size="md" colorClassName="text-[#111111]" />
              </div>
              <span className="text-[10px] text-[#888888] block mt-1">
                Material {formatRupiah(totalMaterialRevenue)} + Fisik {formatRupiah(totalSubJobsClientContract)}
              </span>
            </div>

            {/* Metrik 2: Total Pembayaran Diterima */}
            <div className="bg-white p-3.5 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Pembayaran Diterima (Kas Masuk)
              </span>
              <div className="mt-1">
                <MetricCardCurrency amount={totalPaymentsReceived} size="md" colorClassName="text-[#008060]" />
              </div>
              <span className="text-[10px] text-[#008060] block mt-1">
                {clientPayments.length} kali pembayaran termin
              </span>
            </div>

            {/* Metrik 3: Sisa Piutang Berjalan Proyek */}
            <div className="bg-white p-3.5 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Sisa Piutang Klien (Tempo)
              </span>
              <div className="mt-1">
                <MetricCardCurrency
                  amount={remainingReceivableBalance}
                  size="md"
                  colorClassName={remainingReceivableBalance > 0 ? "text-amber-800" : "text-[#008060]"}
                />
              </div>
              <span className="text-[10px] text-[#888888] block mt-1">
                {remainingReceivableBalance === 0 ? '✓ Lunas Sepenuhnya' : 'Otomatis terpotong saat bayar'}
              </span>
            </div>

            {/* Metrik 4: Estimasi Laba Bersih Proyek */}
            <div className="bg-white p-3.5 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Estimasi Laba Bersih Proyek
              </span>
              <div className="mt-1">
                <MetricCardCurrency
                  amount={netProjectProfit}
                  size="md"
                  colorClassName={netProjectProfit < 0 ? "text-[#cf1124]" : "text-[#008060]"}
                />
              </div>
              <span className="text-[10px] text-[#888888] block mt-1">
                Setelah beban material & tukang
              </span>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="px-5 pt-3 pb-0 border-b border-[#eaeaea] flex items-center gap-6 bg-white flex-shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('subjobs')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'subjobs'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Sub-Pekerjaan</span>
              <span className="text-[11px] font-semibold text-[#888888]">
                ({subJobs.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'material'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Ritase Material</span>
              <span className="text-[11px] font-semibold text-[#888888]">
                ({transactions.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kasbon')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'kasbon'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Kasbon Mandor</span>
              <span className="text-[11px] font-semibold text-[#888888]">
                ({kasbonLogs.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Pembayaran Klien</span>
              <span className="text-[11px] font-semibold text-[#888888]">
                ({clientPayments.length})
              </span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-[#f8f8f8]">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#888888] flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                <span>Memuat data finansial proyek...</span>
              </div>
            ) : activeTab === 'subjobs' ? (
              /* TAB 1: KARTU SUB-PEKERJAAN FISIK */
              subJobs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#888888] space-y-3 bg-white rounded-[12px] border border-[#eaeaea] p-8 max-w-lg mx-auto my-6">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#777777]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="font-bold text-[#111111] text-sm">Belum Ada Sub-Pekerjaan Fisik</p>
                  <p className="text-[#666666] text-xs leading-relaxed">
                    Daftarkan pekerjaan fisik lapangan seperti pembangunan MCK, paving block (m²), atau drainase (m³) untuk mengontrol kontrak klien dan kasbon tukang.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubJob(null);
                        setIsSubJobModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Daftarkan Sub-Pekerjaan Pertama</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subJobs.map(job => {
                    const percentTaken = job.contractAmountWorker > 0
                      ? Math.min(100, Math.round((job.totalKasbonPaid / job.contractAmountWorker) * 100))
                      : 0;

                    return (
                      <div
                        key={job.id}
                        className="bg-white border border-[#eaeaea] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-[#cccccc] transition-all"
                      >
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f0f0f0] text-[#555555] uppercase tracking-wider">
                              {job.jobType === 'MCK' ? 'MCK (Paket)' : job.jobType === 'PAVING_BLOCK' ? 'Paving Block (m²)' : job.jobType === 'DRAINASE' ? 'Drainase (m³)' : 'Borongan'}
                            </span>
                            <h3 className="text-sm font-bold text-[#111111] mt-1">
                              {job.jobName}
                            </h3>
                            <p className="text-[11px] text-[#666666] mt-0.5">
                              Mandor: <span className="font-bold text-[#111111]">{job.workerLeaderName}</span> {job.workerLeaderPhone ? `(${job.workerLeaderPhone})` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubJob(job);
                                setIsSubJobModalOpen(true);
                              }}
                              className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
                              title="Edit Sub-Pekerjaan"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id, job.jobName)}
                              className="p-1.5 text-[#888888] hover:text-[#cf1124] hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                              title="Hapus Sub-Pekerjaan"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Volume & Tarif Details */}
                        <div className="grid grid-cols-3 gap-2 text-xs p-2.5 bg-[#fafafa] rounded-[8px] border border-[#ececec]">
                          <div>
                            <span className="text-[10px] text-[#777777] block">Volume</span>
                            <span className="font-mono font-bold text-[#111111]">
                              {job.volume} {job.unit === 'M2' ? 'm²' : job.unit === 'M3' ? 'm³' : 'Pkt'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block">Tagihan Klien</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {formatRupiah(job.contractAmountClient)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block">Plafon Tukang</span>
                            <span className="font-mono font-bold text-amber-800">
                              {formatRupiah(job.contractAmountWorker)}
                            </span>
                          </div>
                        </div>

                        {/* Kasbon Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-[#666666]">
                              Kasbon Ditarik: <span className="font-mono font-bold text-[#cf1124]">{formatRupiah(job.totalKasbonPaid)}</span>
                            </span>
                            <span className="text-[#666666]">
                              Sisa Upah: <span className="font-mono font-bold text-[#008060]">{formatRupiah(job.remainingWorkerPay)}</span>
                            </span>
                          </div>

                          <div className="w-full h-2 bg-[#eeeeee] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${percentTaken}%` }}
                            />
                          </div>
                          <div className="text-right text-[10px] text-[#888888] font-mono">
                            {percentTaken}% plafon kasbon terpakai
                          </div>
                        </div>

                        {/* Action: Quick Kasbon Button */}
                        <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Margin: +{formatRupiah(job.companyMargin)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSubJobForKasbon(job.id);
                              setIsKasbonModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Input Kasbon</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'material' ? (
              /* TAB 2: LOGISTIK RITASE MATERIAL */
              transactions.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888] bg-white rounded-[12px] border border-[#eaeaea]">
                  Belum ada catatan ritase material armada untuk proyek ini.
                </div>
              ) : (
                <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal & Tiket</th>
                        <th className="py-2.5 px-3">Armada / Sopir</th>
                        <th className="py-2.5 px-3">Material & Muatan</th>
                        <th className="py-2.5 px-3">Kuari Asal</th>
                        <th className="py-2.5 px-3 text-right">Harga Jual</th>
                        <th className="py-2.5 px-3 text-right">Total Omset</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 font-mono">
                            <span className="font-bold text-[#111111] block">{tx.ticketNumber}</span>
                            <span className="text-[10px] text-[#888888]">{tx.deliveryDate || tx.date}</span>
                          </td>
                          <td className="py-2 px-3 font-medium text-[#111111]">
                            {tx.truckPlate} {tx.driverName ? `(${tx.driverName})` : ''}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold block text-[#111111]">{tx.materialName}</span>
                            <span className="text-[10px] text-[#666666] font-mono">{tx.quantity} {tx.unit}</span>
                          </td>
                          <td className="py-2 px-3 text-[#666666]">{tx.quarryName || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatRupiah(tx.sellPricePerUnit)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#111111]">{formatRupiah(tx.totalRevenue)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              tx.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'kasbon' ? (
              /* TAB 3: RIWAYAT BON-BON KASBON TUKANG */
              kasbonLogs.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888] bg-white rounded-[12px] border border-[#eaeaea]">
                  Belum ada catatan bon tukang yang ditarik untuk proyek ini.
                </div>
              ) : (
                <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
                  <div className="p-3 border-b border-[#eaeaea] bg-[#fafafa] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111]">
                      Daftar Penarikan Kasbon Lapangan ({kasbonLogs.length} Bukti Bon)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#111111] text-white rounded-[6px] hover:bg-black transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Cetak Lembar Bon</span>
                    </button>
                  </div>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Mandor / Kepala Tukang</th>
                        <th className="py-2.5 px-3">Sub-Pekerjaan</th>
                        <th className="py-2.5 px-3 text-right">Nominal Kasbon</th>
                        <th className="py-2.5 px-3">Catatan / Keperluan</th>
                        <th className="py-2.5 px-3">Dicatat Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {kasbonLogs.map(bon => (
                        <tr key={bon.id} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 font-mono font-medium">{bon.date}</td>
                          <td className="py-2 px-3 font-bold text-[#111111]">{bon.workerLeaderName}</td>
                          <td className="py-2 px-3 text-[#555555]">{bon.subJobName}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#cf1124]">
                            {formatRupiah(bon.amount)}
                          </td>
                          <td className="py-2 px-3 text-[#666666]">{bon.note || '-'}</td>
                          <td className="py-2 px-3 font-mono text-[10px] text-[#888888]">
                            {bon.recordedBy?.split('@')[0] || 'Admin'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* TAB 4: RIWAYAT PEMBAYARAN KLIEN (POOL) */
              clientPayments.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888] bg-white rounded-[12px] border border-[#eaeaea]">
                  Belum ada catatan pembayaran masuk dari klien untuk proyek ini.
                </div>
              ) : (
                <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
                  <div className="p-3 border-b border-[#eaeaea] bg-[#fafafa]">
                    <span className="text-xs font-bold text-[#111111]">
                      Daftar Pembayaran Termin Masuk ({clientPayments.length} Pembukuan)
                    </span>
                  </div>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal Masuk</th>
                        <th className="py-2.5 px-3">Klien / Pembayar</th>
                        <th className="py-2.5 px-3 text-right">Nominal Masuk</th>
                        <th className="py-2.5 px-3">Metode & Referensi</th>
                        <th className="py-2.5 px-3">Catatan</th>
                        <th className="py-2.5 px-3">Pencatat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {clientPayments.map(pay => (
                        <tr key={pay.id} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 font-mono font-medium">{pay.paymentDate}</td>
                          <td className="py-2 px-3 font-bold text-[#111111]">{pay.clientName}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            +{formatRupiah(pay.amount)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-[#111111] block">{pay.paymentMethod || 'Transfer'}</span>
                            {pay.referenceNumber && (
                              <span className="font-mono text-[10px] text-[#777777]">{pay.referenceNumber}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#666666]">{pay.note || '-'}</td>
                          <td className="py-2 px-3 font-mono text-[10px] text-[#888888]">
                            {pay.recordedBy?.split('@')[0] || 'Admin'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: CATAT / EDIT SUB-PEKERJAAN */}
      <RecordSubJobModal
        isOpen={isSubJobModalOpen}
        onClose={() => {
          setIsSubJobModalOpen(false);
          setEditingSubJob(null);
        }}
        projects={projects}
        defaultProjectId={project.id}
        editSubJob={editingSubJob}
      />

      {/* SUB-MODAL 2: CATAT KASBON TUKANG */}
      <RecordKasbonModal
        isOpen={isKasbonModalOpen}
        onClose={() => {
          setIsKasbonModalOpen(false);
          setTargetSubJobForKasbon(undefined);
        }}
        subJobs={subJobs}
        defaultSubJobId={targetSubJobForKasbon}
        userEmail={userEmail}
      />

      {/* SUB-MODAL 3: CATAT PEMBAYARAN KLIEN */}
      <RecordClientPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        projects={projects}
        clients={[]}
        defaultProjectId={project.id}
        defaultClientId={project.clientId}
        currentReceivableBalance={remainingReceivableBalance}
        userEmail={userEmail}
      />

      {/* SUB-MODAL 4: CETAK LEMBAR AUDIT REKAP BON MANDOR */}
      <WorkerKasbonPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        projectName={project.name}
        clientName={project.clientName}
        subJobs={subJobs}
        kasbonLogs={kasbonLogs}
      />
    </>
  );
}
