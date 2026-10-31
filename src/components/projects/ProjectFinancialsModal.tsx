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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
        {/* Modal Window Container */}
        <div 
          className="relative w-full max-w-5xl bg-white rounded-[16px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Panel */}
          <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                  {project.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-[#f0f0f0] font-medium text-[#555555]">
                  {project.location}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                Klien / Pihak Proyek: <span className="font-bold text-[#111111]">{project.clientName || 'Mitra Proyek'}</span> • Investor: <span className="font-semibold text-[#111111]">{project.investorName}</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>💰</span>
                <span>Catat Bayar (Klien)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSubJob(null);
                  setIsSubJobModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>🔨</span>
                <span>Tambah Sub-Pekerjaan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetSubJobForKasbon(undefined);
                  setIsKasbonModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>💸</span>
                <span>Input Kasbon Tukang</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-2.5 py-1.5 bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#333333] text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1 cursor-pointer"
                title="Cetak Rekap Kasbon & Borongan Mandor"
              >
                <span>🖨️</span>
                <span>Cetak Rekap</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 4 Kartu Metrik Terpadu (Pool Tagihan & Saldo Berjalan) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-[#fafafa] border-b border-[#eaeaea] flex-shrink-0">
            {/* Metrik 1: Total Nilai Proyek (Global) */}
            <div className="bg-white p-3 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Total Nilai Tagihan (Pool)
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-[#111111] block mt-1">
                {formatRupiah(totalProjectInvoice)}
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                Material {formatRupiah(totalMaterialRevenue)} + Fisik {formatRupiah(totalSubJobsClientContract)}
              </span>
            </div>

            {/* Metrik 2: Total Pembayaran Diterima */}
            <div className="bg-white p-3 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Pembayaran Diterima (Kas Masuk)
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 block mt-1">
                {formatRupiah(totalPaymentsReceived)}
              </span>
              <span className="text-[10px] text-emerald-800 block mt-0.5">
                {clientPayments.length} kali pembayaran termin
              </span>
            </div>

            {/* Metrik 3: Sisa Piutang Berjalan Proyek */}
            <div className="bg-white p-3 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Sisa Piutang Klien (Tempo)
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block mt-1 ${
                remainingReceivableBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {formatRupiah(remainingReceivableBalance)}
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                {remainingReceivableBalance === 0 ? '✓ Lunas Sepenuhnya' : 'Otomatis terpotong saat bayar'}
              </span>
            </div>

            {/* Metrik 4: Estimasi Laba Bersih Proyek */}
            <div className="bg-white p-3 rounded-[10px] border border-[#eaeaea]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
                Estimasi Laba Bersih Proyek
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block mt-1 ${
                netProjectProfit < 0 ? 'text-[#cf1124]' : 'text-emerald-800'
              }`}>
                {formatRupiah(netProjectProfit)}
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                Setelah beban material & tukang
              </span>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="px-5 pt-3 pb-0 border-b border-[#eaeaea] flex items-center gap-4 bg-white flex-shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('subjobs')}
              className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'subjobs'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Sub-Pekerjaan & Mandor</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#f0f0f0] text-[#555555]">
                {subJobs.length}
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
              <span>Logistik Ritase Material</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#f0f0f0] text-[#555555]">
                {transactions.length}
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
              <span>Riwayat Bon-Bon Kasbon</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
                {kasbonLogs.length}
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
              <span>Riwayat Pembayaran Klien</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                {clientPayments.length}
              </span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#f8f8f8]">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#888888] flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                <span>Memuat data finansial proyek...</span>
              </div>
            ) : activeTab === 'subjobs' ? (
              /* TAB 1: KARTU SUB-PEKERJAAN FISIK */
              subJobs.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888] space-y-3 bg-white rounded-[12px] border border-[#eaeaea] p-8">
                  <div className="text-3xl">🔨</div>
                  <p className="font-bold text-[#111111] text-sm">Belum Ada Sub-Pekerjaan Fisik</p>
                  <p className="max-w-md mx-auto text-[#666666]">
                    Daftarkan pekerjaan fisik lapangan seperti pembangunan MCK, paving block (m²), atau drainase (m³) untuk mengontrol kontrak klien dan kasbon tukang.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubJob(null);
                      setIsSubJobModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
                  >
                    + Daftarkan Sub-Pekerjaan Pertama
                  </button>
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
                              className="p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded"
                              title="Edit Sub-Pekerjaan"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id, job.jobName)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus Sub-Pekerjaan"
                            >
                              🗑️
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
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-[6px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>💸</span>
                            <span>+ Input Bon Mandor</span>
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
                      className="px-2.5 py-1 text-xs font-semibold bg-[#111111] text-white rounded-[6px] hover:bg-black transition-colors"
                    >
                      🖨️ Cetak Lembar Bon
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
