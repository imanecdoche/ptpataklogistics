import React, { useState, useEffect } from 'react';
import {
  Project,
  ProjectSubJob,
  WorkerKasbonLog,
  EmployeeKasbonLog,
  ClientProjectPayment,
  DispatchTransaction
} from '@/types/database';
import {
  subscribeProjectSubJobs,
  subscribeWorkerKasbonLogs,
  subscribeEmployeeKasbonLogs,
  subscribeClientPayments,
  deleteProjectSubJob,
  deleteEmployeeKasbon
} from '@/lib/projectFinanceService';
import { subscribeAllTransactions } from '@/lib/dispatcherService';
import { formatRupiah } from '@/lib/currencyUtils';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { formatDateID } from '@/lib/dateSearchUtils';
import { formatVolumeDisplay } from '@/lib/volumeUtils';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { RecordSubJobModal } from './RecordSubJobModal';
import { RecordKasbonModal } from './RecordKasbonModal';
import { RecordEmployeeKasbonModal } from './RecordEmployeeKasbonModal';
import { RecordClientPaymentModal } from './RecordClientPaymentModal';
import { WorkerKasbonPrintModal } from './WorkerKasbonPrintModal';
import { Loader2, Trash2, Eye, X, Plus, Pencil } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

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
  const [activeTab, setActiveTab] = useState<'subjobs' | 'material' | 'kasbon' | 'employee_kasbon' | 'payments'>('subjobs');
  const [subJobs, setSubJobs] = useState<ProjectSubJob[]>([]);
  const [kasbonLogs, setKasbonLogs] = useState<WorkerKasbonLog[]>([]);
  const [employeeKasbonLogs, setEmployeeKasbonLogs] = useState<EmployeeKasbonLog[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientProjectPayment[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-Modals
  const [isSubJobModalOpen, setIsSubJobModalOpen] = useState(false);
  const [editingSubJob, setEditingSubJob] = useState<ProjectSubJob | null>(null);

  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const [targetSubJobForKasbon, setTargetSubJobForKasbon] = useState<string | undefined>(undefined);

  const [isEmployeeKasbonModalOpen, setIsEmployeeKasbonModalOpen] = useState(false);
  const [activeReceiptPreview, setActiveReceiptPreview] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { showAlert, showConfirm } = useDialog();

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

    const unsubEmployeeKasbon = subscribeEmployeeKasbonLogs(list => {
      setEmployeeKasbonLogs(list.filter(k => k.projectId === project.id));
    }, project.id);

    const unsubPayments = subscribeClientPayments(list => {
      setClientPayments(list.filter(p => p.projectId === project.id || p.clientName.toLowerCase() === (project.clientName || '').toLowerCase()));
    }, project.id);

    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list.filter(t => t.projectId === project.id));
    });

    return () => {
      unsubSubJobs();
      unsubKasbon();
      unsubEmployeeKasbon();
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

  // 3. Kasbon Karyawan / Tim Internal Proyek
  const totalEmployeeKasbon = employeeKasbonLogs.reduce((acc, k) => acc + (k.amount || 0), 0);

  // 4. Pool Total Tagihan Global ke Klien / Kak Angga
  const totalProjectInvoice = totalMaterialRevenue + totalSubJobsClientContract;

  // 5. Total Pembayaran Klien Masuk
  const totalPaymentsReceived = clientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // 6. Sisa Piutang Berjalan Proyek (Total Tagihan - Pembayaran Masuk)
  const remainingReceivableBalance = Math.max(0, totalProjectInvoice - totalPaymentsReceived);

  // 7. Total Beban Biaya & Estimasi Laba Bersih
  const totalProjectCost = totalMaterialBuyCost + totalMaterialOpsCost + totalSubJobsWorkerContract;
  const projectGrossMargin = totalProjectInvoice - totalProjectCost;
  const netProjectProfit = projectGrossMargin - totalEmployeeKasbon;

  const handleDeleteJob = (id: string, name: string) => {
    showConfirm({
      title: 'Hapus Sub-Pekerjaan',
      message: `Hapus sub-pekerjaan "${name}"?\n\nCatatan: Catatan kasbon terkait akan tetap tersimpan di riwayat kas.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteProjectSubJob(id);
        } catch (err) {
          console.error('Gagal menghapus sub-pekerjaan:', err);
          showAlert({
            title: 'Kesalahan',
            message: 'Gagal menghapus sub-pekerjaan fisik.'
          });
        }
      }
    });
  };

  const handleDeleteEmployeeKasbon = (id: string, name: string, amount: number) => {
    showConfirm({
      title: 'Hapus Kasbon Karyawan',
      message: `Hapus catatan kasbon karyawan "${name}" sebesar ${formatRupiah(amount)}?\n\nCatatan: Mutasi di Buku Kas Utama tetap tersimpan untuk riwayat audit.`,
      confirmText: 'Hapus Kasbon',
      cancelText: 'Batal',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteEmployeeKasbon(id);
        } catch (err) {
          console.error('Gagal menghapus kasbon karyawan:', err);
          showAlert({
            title: 'Kesalahan',
            message: 'Gagal menghapus kasbon karyawan.'
          });
        }
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop (Solid Dimmed without blur) */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal / Bottom Drawer Container */}
        <div 
          className="relative w-full md:max-w-5xl bg-white rounded-t-[20px] md:rounded-[16px] shadow-2xl flex flex-col h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 ease-out"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Panel (Compact) */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#eaeaea] bg-white flex flex-col gap-2.5 flex-shrink-0">
            {/* Baris Atas: Info Proyek & Tombol Close di Pojok Kanan */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-[#111111] tracking-tight">
                  {project.name}
                </h2>
                <p className="text-[11px] text-[#666666] mt-0.5 truncate">
                  Klien: <span className="font-semibold text-[#111111]">{project.clientName || 'Mitra Proyek'}</span>
                  <span className="mx-1.5 text-[#cccccc]">|</span>
                  Investor: <span className="font-semibold text-[#111111]">{project.investorName}</span>
                </p>
              </div>

              {/* Tombol Tutup Modal di Pojok Kanan Atas */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer -mr-1 -mt-0.5"
                title="Tutup Modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Baris Bawah: Deretan Tombol Aksi 1 Row Berjejer */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setEditingSubJob(null);
                  setIsSubJobModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111] hover:bg-black text-white text-[11px] sm:text-xs font-semibold rounded-[6px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Sub-Pekerjaan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-[11px] sm:text-xs font-semibold rounded-[6px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-[11px] sm:text-xs font-semibold rounded-[6px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Kasbon Tukang</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEmployeeKasbonModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-[11px] sm:text-xs font-semibold rounded-[6px] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Kasbon Karyawan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db] text-[11px] sm:text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
                title="Cetak Rekap Kasbon & Borongan Mandor"
              >
                <svg className="w-3.5 h-3.5 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Terpadu (Compact & Ramping) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 sm:px-5 sm:py-3 bg-[#fafafa] border-b border-[#eaeaea] flex-shrink-0">
            {/* Metrik 1: Total Kontrak */}
            <div className="bg-white p-2.5 sm:p-3 rounded-[8px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Total Kontrak
              </span>
              <div className="mt-0.5">
                <MetricCardCurrency amount={totalProjectInvoice} size="md" colorClassName="text-[#111111]" />
              </div>
              <span className="text-[10px] text-[#888888] block mt-0.5 truncate" title={`Material ${formatRupiah(totalMaterialRevenue)} + Fisik ${formatRupiah(totalSubJobsClientContract)}`}>
                Material {formatRupiah(totalMaterialRevenue)} + Fisik {formatRupiah(totalSubJobsClientContract)}
              </span>
            </div>

            {/* Metrik 2: Terbayar */}
            <div className="bg-white p-2.5 sm:p-3 rounded-[8px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Terbayar
              </span>
              <div className="mt-0.5">
                <MetricCardCurrency amount={totalPaymentsReceived} size="md" colorClassName="text-[#008060]" />
              </div>
              <span className="text-[10px] text-[#008060] block mt-0.5 truncate">
                {clientPayments.length} kali termin
              </span>
            </div>

            {/* Metrik 3: Sisa Piutang */}
            <div className="bg-white p-2.5 sm:p-3 rounded-[8px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Sisa Piutang
              </span>
              <div className="mt-0.5">
                <MetricCardCurrency
                  amount={remainingReceivableBalance}
                  size="md"
                  colorClassName={remainingReceivableBalance > 0 ? "text-amber-800" : "text-[#008060]"}
                />
              </div>
              <span className="text-[10px] text-[#888888] block mt-0.5 truncate">
                {remainingReceivableBalance === 0 ? 'Lunas Sepenuhnya' : 'Otomatis terpotong saat bayar'}
              </span>
            </div>

            {/* Metrik 4: Laba Bersih */}
            <div className="bg-white p-2.5 sm:p-3 rounded-[8px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Laba Bersih
              </span>
              <div className="mt-0.5">
                <MetricCardCurrency
                  amount={netProjectProfit}
                  size="md"
                  colorClassName={netProjectProfit < 0 ? "text-[#cf1124]" : "text-[#008060]"}
                />
              </div>
              <span className="text-[10px] text-[#888888] block mt-0.5 truncate" title={totalEmployeeKasbon > 0 ? `Margin ${formatRupiah(projectGrossMargin)} - Kasbon ${formatRupiah(totalEmployeeKasbon)}` : 'Setelah beban material & tukang'}>
                {totalEmployeeKasbon > 0
                  ? `Margin ${formatRupiah(projectGrossMargin)} - Kasbon ${formatRupiah(totalEmployeeKasbon)}`
                  : 'Setelah beban material & tukang'}
              </span>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="px-4 sm:px-5 pt-2 pb-0 border-b border-[#eaeaea] flex items-center gap-5 sm:gap-6 bg-white flex-shrink-0 overflow-x-auto scrollbar-none">
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
              onClick={() => setActiveTab('employee_kasbon')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'employee_kasbon'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Kasbon Karyawan</span>
              <span className="text-[11px] font-semibold text-[#888888]">
                ({employeeKasbonLogs.length})
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
                <Loader2 className="w-5 h-5 text-[#111111] animate-spin" />
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
                        className="bg-white border border-[#eaeaea] rounded-[10px] p-3.5 sm:p-4 shadow-xs space-y-2.5 hover:border-[#cccccc] transition-all"
                      >
                        {/* Title & Actions (Sejajar: Input Kasbon, Edit, Hapus - Icon Only) */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#111111] truncate">
                              {job.jobName}
                            </h3>
                            <p className="text-[11px] text-[#666666] mt-0.5 truncate">
                              Mandor: <span className="font-semibold text-[#111111]">{job.workerLeaderName}</span> {job.workerLeaderPhone ? `(${job.workerLeaderPhone})` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {/* Tombol Input Kasbon Mandor (Icon Only) */}
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSubJobForKasbon(job.id);
                                setIsKasbonModalOpen(true);
                              }}
                              className="p-1.5 text-[#555555] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
                              title="Input Kasbon Mandor"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {/* Tombol Edit Sub-Pekerjaan (Icon Only) */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubJob(job);
                                setIsSubJobModalOpen(true);
                              }}
                              className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
                              title="Edit Sub-Pekerjaan"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {/* Tombol Hapus Sub-Pekerjaan (Icon Only) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id, job.jobName)}
                              className="p-1.5 text-[#888888] hover:text-[#cf1124] hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                              title="Hapus Sub-Pekerjaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Volume, Tagihan Klien, & Plafon Tukang (Tanpa Box / Unboxed) */}
                        <div className="grid grid-cols-3 gap-2 text-xs py-0.5">
                          <div>
                            <span className="text-[10px] text-[#777777] block font-medium">Volume</span>
                            <span className="font-mono font-bold text-[#111111]">
                              {job.volume} {job.unit === 'M2' ? 'm²' : job.unit === 'M3' ? 'm³' : 'Pkt'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block font-medium">Tagihan Klien</span>
                            <span className="font-mono font-bold text-[#111111]">
                              {formatRupiah(job.contractAmountClient)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block font-medium">Plafon Tukang</span>
                            <span className="font-mono font-bold text-[#111111]">
                              {formatRupiah(job.contractAmountWorker)}
                            </span>
                          </div>
                        </div>

                        {/* Kasbon Terpakai / Plafon (Format: Rp n / Rp n) */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-[#111111] font-mono">
                              <span className="font-bold text-[#111111]">{formatRupiah(job.totalKasbonPaid)}</span>
                              <span className="text-[#111111] mx-1">/</span>
                              <span className="font-medium text-[#111111]">{formatRupiah(job.contractAmountWorker)}</span>
                            </span>
                            <span className="text-[11px] text-[#111111]">
                              Sisa: <span className="font-mono font-bold text-[#111111]">{formatRupiah(job.remainingWorkerPay)}</span>
                            </span>
                          </div>

                          {/* Progress Bar Warna HITAM & Persentase n% di Samping Kanan */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#eeeeee] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#111111] rounded-full transition-all duration-300"
                                style={{ width: `${percentTaken}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-[#111111] flex-shrink-0">
                              {percentTaken}%
                            </span>
                          </div>
                        </div>

                        {/* Nominal Margin di bawah Progress Bar tanpa Divider */}
                        <div className="text-[11px] font-semibold text-[#111111]">
                          Margin: +{formatRupiah(job.companyMargin)}
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
                <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-x-auto">
                  <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                    <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Tanggal & Tiket</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Armada / Sopir</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Material & Muatan</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Kuari Asal</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Harga Beli</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Harga Jual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 font-mono whitespace-nowrap">
                            <span className="font-bold text-[#111111] block">{tx.ticketNumber}</span>
                            <span className="text-[10px] text-[#888888]">{formatDateID(tx.deliveryDate || tx.date)}</span>
                          </td>
                          <td className="py-2 px-3 font-medium text-[#111111] whitespace-nowrap">
                            {tx.truckPlate} {tx.driverName ? `(${tx.driverName})` : ''}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-semibold block text-[#111111]">{tx.materialName}</span>
                            <span className="text-[10px] text-[#666666] font-mono">{formatVolumeDisplay(tx.quantity, tx.unit)}</span>
                          </td>
                          <td className="py-2 px-3 text-[#666666] whitespace-nowrap">{tx.quarryName || '-'}</td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <PricePerVolCell
                              unitPrice={tx.buyPricePerUnit}
                              totalPrice={tx.totalBuyCost}
                              unit={tx.unit}
                              quantity={tx.quantity}
                              align="right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <PricePerVolCell
                              unitPrice={tx.sellPricePerUnit}
                              totalPrice={tx.totalRevenue}
                              unit={tx.unit}
                              quantity={tx.quantity}
                              align="right"
                            />
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-xs text-left border-collapse">
                      <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Mandor / Kepala Tukang</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Sub-Pekerjaan</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal Kasbon</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Catatan / Keperluan</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Dicatat Oleh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea]">
                        {kasbonLogs.map(bon => (
                          <tr key={bon.id} className="hover:bg-[#fafafa]">
                            <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">{formatDateID(bon.date)}</td>
                            <td className="py-2 px-3 font-bold text-[#111111] whitespace-nowrap">{bon.workerLeaderName}</td>
                            <td className="py-2 px-3 text-[#555555] whitespace-nowrap">{bon.subJobName}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#cf1124] whitespace-nowrap">
                              {formatRupiah(bon.amount)}
                            </td>
                            <td className="py-2 px-3 text-[#666666] whitespace-nowrap">{bon.note || '-'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-[#888888] whitespace-nowrap">
                              {bon.recordedBy?.split('@')[0] || 'Admin'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : activeTab === 'employee_kasbon' ? (
              /* TAB: RIWAYAT KASBON KARYAWAN / TIM PROYEK */
              employeeKasbonLogs.length === 0 ? (
                <div className="py-14 text-center text-xs text-[#888888] space-y-3 bg-white rounded-[12px] border border-[#eaeaea] p-8 max-w-lg mx-auto my-6">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#777777]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="font-bold text-[#111111] text-sm">Belum Ada Catatan Kasbon Karyawan</p>
                  <p className="text-[#666666] text-xs leading-relaxed">
                    Catat kasbon operasional untuk tim/karyawan lapangan proyek (Pengawas, Admin Lapangan, Logistik). Kasbon ini langsung memotong kas fisik di Buku Kas dan memotong sisa laba bersih proyek.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEmployeeKasbonModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[8px] transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Catat Kasbon Karyawan</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Banner Ringkasan Kasbon Karyawan */}
                  <div className="bg-white p-3.5 rounded-[10px] border border-[#eaeaea] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                        Total Kasbon Karyawan / Tim Proyek
                      </span>
                      <span className="text-base font-bold font-mono text-[#cf1124] block mt-0.5">
                        {formatRupiah(totalEmployeeKasbon)}
                      </span>
                      <span className="text-[10px] text-[#666666] block mt-0.5">
                        Memotong langsung saldo kas fisik dan mengurangi porsi laba bersih siap bagi
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEmployeeKasbonModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Tambah Kasbon</span>
                    </button>
                  </div>

                  {/* Tabel Riwayat Kasbon Karyawan */}
                  <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-xs text-left border-collapse">
                        <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3 whitespace-nowrap">Tanggal</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Nama Karyawan & Peran</th>
                            <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal Kasbon</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Catatan / Keperluan</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Bukti TF / Kwitansi</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Dicatat Oleh</th>
                            <th className="py-2.5 px-3 text-center whitespace-nowrap">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeaea]">
                          {employeeKasbonLogs.map(emp => (
                            <tr key={emp.id} className="hover:bg-[#fafafa]">
                              <td className="py-2.5 px-3 font-mono font-medium whitespace-nowrap">{formatDateID(emp.date)}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-bold text-[#111111] block">{emp.employeeName}</span>
                                {emp.role && (
                                  <span className="text-[10px] text-[#666666] block">{emp.role}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#cf1124] whitespace-nowrap">
                                {formatRupiah(emp.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-[#666666] max-w-xs truncate" title={emp.note || '-'}>
                                {emp.note || '-'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {emp.receiptUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveReceiptPreview(emp.receiptUrl || null)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] rounded text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3 text-[#555555]" />
                                    <span>Lihat Foto</span>
                                  </button>
                                ) : (
                                  <span className="text-[#999999] text-[11px]">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[10px] text-[#888888] whitespace-nowrap">
                                {emp.recordedBy?.split('@')[0] || 'Admin'}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployeeKasbon(emp.id, emp.employeeName, emp.amount)}
                                  className="p-1 text-[#888888] hover:text-[#cf1124] hover:bg-red-50 rounded-[4px] transition-colors cursor-pointer"
                                  title="Hapus Kasbon Karyawan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-xs text-left border-collapse">
                      <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tanggal Masuk</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Klien / Pembayar</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal Masuk</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Metode & Referensi</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Catatan</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Pencatat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeaea]">
                        {clientPayments.map(pay => (
                          <tr key={pay.id} className="hover:bg-[#fafafa]">
                            <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">{formatDateID(pay.paymentDate)}</td>
                            <td className="py-2 px-3 font-bold text-[#111111] whitespace-nowrap">{pay.clientName}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              +{formatRupiah(pay.amount)}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-medium text-[#111111] block">{pay.paymentMethod || 'Transfer'}</span>
                              {pay.referenceNumber && (
                                <span className="font-mono text-[10px] text-[#777777]">{pay.referenceNumber}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[#666666] whitespace-nowrap">{pay.note || '-'}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-[#888888] whitespace-nowrap">
                              {pay.recordedBy?.split('@')[0] || 'Admin'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

      {/* SUB-MODAL 5: CATAT KASBON KARYAWAN */}
      <RecordEmployeeKasbonModal
        isOpen={isEmployeeKasbonModalOpen}
        onClose={() => setIsEmployeeKasbonModalOpen(false)}
        project={project}
        userEmail={userEmail}
      />

      {/* LIGHTBOX PREVIEW BUKTI TRANSFER / KWITANSI */}
      {activeReceiptPreview && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveReceiptPreview(null)}
        >
          <div 
            className="relative max-w-xl max-h-[85vh] bg-white rounded-[12px] p-2 overflow-hidden shadow-2xl cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-[#eaeaea]">
              <span className="text-xs font-bold text-[#111111]">Foto Bukti Kasbon Karyawan</span>
              <button
                type="button"
                onClick={() => setActiveReceiptPreview(null)}
                className="p-1 text-[#555555] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={activeReceiptPreview}
                alt="Bukti Transfer Kasbon"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
