import React, { useState, useEffect, useMemo } from 'react';
import { Project, ProjectSubJob, WorkerKasbonLog, EmployeeKasbonLog, LaborJobType } from '@/types/database';
import {
  subscribeProjectSubJobs,
  subscribeWorkerKasbonLogs,
  subscribeEmployeeKasbonLogs,
  deleteWorkerKasbon,
  deleteEmployeeKasbon
} from '@/lib/projectFinanceService';
import { subscribeProjects } from '@/lib/projectService';
import { subscribeLaborJobTypes, getLaborJobTypes } from '@/lib/laborService';
import { QuickRecordKasbonModal } from '@/components/labor/QuickRecordKasbonModal';
import { LaborJobTypeModal } from './LaborJobTypeModal';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { formatDateID, matchesDateQuery } from '@/lib/dateSearchUtils';

interface LaborPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: any, subTabId?: string) => void;
}

export function LaborPage({
  userEmail,
  activeSubTab = 'kasbon_borongan',
  onNavigateSubTab
}: LaborPageProps): React.JSX.Element {
  // Mapping activeSubTab awal (mendukung backward-compatibility 'payments')
  const initialSub =
    activeSubTab === 'job_types'
      ? 'job_types'
      : activeSubTab === 'kasbon_employee'
      ? 'kasbon_employee'
      : 'kasbon_borongan';

  const [currentSubTab, setCurrentSubTab] = useState<'kasbon_borongan' | 'kasbon_employee' | 'job_types'>(initialSub);

  // Data States
  const [subJobs, setSubJobs] = useState<ProjectSubJob[]>([]);
  const [workerKasbonLogs, setWorkerKasbonLogs] = useState<WorkerKasbonLog[]>([]);
  const [employeeKasbonLogs, setEmployeeKasbonLogs] = useState<EmployeeKasbonLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobTypes, setJobTypes] = useState<LaborJobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalDefaultSubJobId, setRecordModalDefaultSubJobId] = useState<string | undefined>(undefined);
  const [recordModalDefaultProjectId, setRecordModalDefaultProjectId] = useState<string | undefined>(undefined);
  const [isJobTypeModalOpen, setIsJobTypeModalOpen] = useState(false);
  const [selectedJobTypeForEdit, setSelectedJobTypeForEdit] = useState<LaborJobType | null>(null);

  // Dialog Konfirmasi Hapus
  const [deleteTargetWorkerBon, setDeleteTargetWorkerBon] = useState<WorkerKasbonLog | null>(null);
  const [deleteTargetEmployeeBon, setDeleteTargetEmployeeBon] = useState<EmployeeKasbonLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (activeSubTab === 'kasbon_borongan' || activeSubTab === 'kasbon_employee' || activeSubTab === 'job_types') {
      setCurrentSubTab(activeSubTab);
    } else if (activeSubTab === 'payments') {
      setCurrentSubTab('kasbon_borongan');
    }
  }, [activeSubTab]);

  useEffect(() => {
    setIsLoading(true);

    const unsubSub = subscribeProjectSubJobs(subs => {
      setSubJobs(subs);
      setIsLoading(false);
    });

    const unsubWorkerBon = subscribeWorkerKasbonLogs(logs => {
      setWorkerKasbonLogs(logs);
    });

    const unsubEmpBon = subscribeEmployeeKasbonLogs(logs => {
      setEmployeeKasbonLogs(logs);
    });

    const unsubProjs = subscribeProjects(projs => {
      setProjects(projs);
    });

    const unsubJobs = subscribeLaborJobTypes(types => {
      setJobTypes(types);
    });

    getLaborJobTypes().catch(console.warn);

    return () => {
      unsubSub();
      unsubWorkerBon();
      unsubEmpBon();
      unsubProjs();
      unsubJobs();
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectSubTab = (sub: 'kasbon_borongan' | 'kasbon_employee' | 'job_types') => {
    setCurrentSubTab(sub);
    if (onNavigateSubTab) {
      onNavigateSubTab('hok_labor', sub);
    }
  };

  const formatRupiah = (val: number): string =>
    'Rp ' + Math.round(val).toLocaleString('id-ID');

  // Filter Sub-Pekerjaan Fisik
  const filteredSubJobs = useMemo(() => {
    return subJobs.filter(s => {
      if (selectedProjectFilter !== 'ALL' && s.projectId !== selectedProjectFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.jobName.toLowerCase().includes(q) ||
        (s.workerLeaderName && s.workerLeaderName.toLowerCase().includes(q)) ||
        (s.projectName && s.projectName.toLowerCase().includes(q))
      );
    });
  }, [subJobs, selectedProjectFilter, searchQuery]);

  // Filter Worker Kasbon Logs
  const filteredWorkerKasbon = useMemo(() => {
    return workerKasbonLogs.filter(w => {
      if (selectedProjectFilter !== 'ALL' && w.projectId !== selectedProjectFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        w.workerLeaderName.toLowerCase().includes(q) ||
        w.subJobName.toLowerCase().includes(q) ||
        (w.projectName && w.projectName.toLowerCase().includes(q)) ||
        (w.note && w.note.toLowerCase().includes(q)) ||
        matchesDateQuery(w.date, q)
      );
    });
  }, [workerKasbonLogs, selectedProjectFilter, searchQuery]);

  // Filter Employee Kasbon Logs
  const filteredEmployeeKasbon = useMemo(() => {
    return employeeKasbonLogs.filter(e => {
      if (selectedProjectFilter !== 'ALL' && e.projectId !== selectedProjectFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        e.employeeName.toLowerCase().includes(q) ||
        (e.projectName && e.projectName.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q)) ||
        matchesDateQuery(e.date, q)
      );
    });
  }, [employeeKasbonLogs, selectedProjectFilter, searchQuery]);

  // Ringkasan Finansial Kasbon Tukang (Contoh Papah: MCK Rp 15 Jt, Kasbon Rp 3 Jt -> Sisa Rp 12 Jt)
  const boronganSummary = useMemo(() => {
    let totalWageBudget = 0;
    let totalKasbonPaid = 0;
    filteredSubJobs.forEach(s => {
      totalWageBudget += Number(s.contractAmountWorker) || 0;
      totalKasbonPaid += Number(s.totalKasbonPaid) || 0;
    });
    const remainingWage = Math.max(0, totalWageBudget - totalKasbonPaid);
    return {
      totalWageBudget,
      totalKasbonPaid,
      remainingWage,
      subJobCount: filteredSubJobs.length,
      bonCount: filteredWorkerKasbon.length
    };
  }, [filteredSubJobs, filteredWorkerKasbon]);

  // Ringkasan Kasbon Karyawan
  const employeeSummary = useMemo(() => {
    const total = filteredEmployeeKasbon.reduce((acc, c) => acc + (c.amount || 0), 0);
    return {
      totalKasbon: total,
      count: filteredEmployeeKasbon.length
    };
  }, [filteredEmployeeKasbon]);

  // Handler Hapus Kasbon Tukang
  const handleConfirmDeleteWorkerBon = async () => {
    if (!deleteTargetWorkerBon) return;
    try {
      setIsDeleting(true);
      await deleteWorkerKasbon(
        deleteTargetWorkerBon.id,
        deleteTargetWorkerBon.subJobId,
        deleteTargetWorkerBon.amount
      );
      showToast(`Catatan kasbon ${deleteTargetWorkerBon.workerLeaderName} sebesar ${formatRupiah(deleteTargetWorkerBon.amount)} berhasil dihapus dan saldo upah dipulihkan.`);
      setDeleteTargetWorkerBon(null);
    } catch (err) {
      console.error('Gagal hapus kasbon tukang:', err);
      showToast('Gagal menghapus kasbon tukang.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Hapus Kasbon Karyawan
  const handleConfirmDeleteEmployeeBon = async () => {
    if (!deleteTargetEmployeeBon) return;
    try {
      setIsDeleting(true);
      await deleteEmployeeKasbon(deleteTargetEmployeeBon.id);
      showToast(`Catatan kasbon tim ${deleteTargetEmployeeBon.employeeName} sebesar ${formatRupiah(deleteTargetEmployeeBon.amount)} berhasil dihapus.`);
      setDeleteTargetEmployeeBon(null);
    } catch (err) {
      console.error('Gagal hapus kasbon tim:', err);
      showToast('Gagal menghapus kasbon tim.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 font-sans select-none">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 shadow-lg flex items-center gap-2 text-xs font-bold transition-all rounded-[6px] ${
            toastMsg.type === 'success' ? 'bg-[#111111] text-white' : 'bg-[#cf1124] text-white'
          }`}
        >
          <span>{toastMsg.type === 'success' ? '✓' : '✕'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white p-5 rounded-[10px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/icons/layers.png" alt="Kasbon" className="w-7 h-7 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-[#111111] tracking-tight">
                Kasbon & Upah Tukang Lapangan
              </h1>
              <p className="text-xs text-[#666666] mt-0.5">
                Monitoring nilai borongan, kasbon berjalan, dan sisa hak mandor (MCK, Paving, Drainase) & tim.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Utama: Catat Kasbon Baru */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRecordModalDefaultSubJobId(undefined);
              setRecordModalDefaultProjectId(undefined);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <span>+ Catat Kasbon Baru</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Solid-Filled Tokens per /auditaislop) */}
      <div className="flex items-center justify-between border-b border-[#eaeaea] pb-2">
        <div className="flex items-center gap-1.5 bg-[#f0f0f0] p-1 rounded-[8px]">
          <button
            type="button"
            onClick={() => handleSelectSubTab('kasbon_borongan')}
            className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              currentSubTab === 'kasbon_borongan'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            👷 Kasbon Tukang & Borongan ({subJobs.length})
          </button>
          <button
            type="button"
            onClick={() => handleSelectSubTab('kasbon_employee')}
            className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              currentSubTab === 'kasbon_employee'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            👥 Kasbon Tim & Relawan ({employeeKasbonLogs.length})
          </button>
          <button
            type="button"
            onClick={() => handleSelectSubTab('job_types')}
            className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer whitespace-nowrap ${
              currentSubTab === 'job_types'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            ⚙ Tipe Pekerjaan & Master Tarif ({jobTypes.length})
          </button>
        </div>
      </div>

      {/* Kontrol Filter Proyek & Pencarian Global */}
      {currentSubTab !== 'job_types' && (
        <div className="bg-white p-3.5 rounded-[10px] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#666666] whitespace-nowrap">Filter Proyek:</span>
            <select
              value={selectedProjectFilter}
              onChange={e => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f5f5f5] text-xs font-semibold text-[#111111] rounded-[6px] border-none focus:bg-white focus:outline-none transition-colors"
            >
              <option value="ALL">Semua Proyek Lapangan</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari mandor, pekerjaan, tanggal..."
              className="w-full px-3 py-1.5 bg-[#f5f5f5] text-xs text-[#111111] rounded-[6px] border-none focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-[#888888] hover:text-[#111111]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 1: KASBON TUKANG & BORONGAN ================= */}
      {currentSubTab === 'kasbon_borongan' && (
        <div className="space-y-5">
          {/* 3 KPI Summary Cards Borongan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Total Kontrak Borongan */}
            <div className="bg-white p-4 rounded-[10px] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wide">
                Total Nilai Kontrak Borongan
              </span>
              <div className="text-xl font-bold font-mono text-[#111111] mt-1.5">
                {formatRupiah(boronganSummary.totalWageBudget)}
              </div>
              <span className="text-[10px] text-[#888888] mt-1">
                Pagu upah fisik ({boronganSummary.subJobCount} sub-pekerjaan)
              </span>
            </div>

            {/* Card 2: Total Kasbon Ditarik */}
            <div className="bg-white p-4 rounded-[10px] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#cf1124] uppercase tracking-wide">
                Total Kasbon Ditarik (Panjar)
              </span>
              <div className="text-xl font-bold font-mono text-[#cf1124] mt-1.5">
                {formatRupiah(boronganSummary.totalKasbonPaid)}
              </div>
              <span className="text-[10px] text-[#888888] mt-1">
                Akumulasi kasbon berjalan ({boronganSummary.bonCount} transaksi)
              </span>
            </div>

            {/* Card 3: Sisa Hak Upah Tukang */}
            <div className="bg-white p-4 rounded-[10px] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                Sisa Hak Upah Borongan
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1.5">
                {formatRupiah(boronganSummary.remainingWage)}
              </div>
              <span className="text-[10px] text-[#888888] mt-1">
                Sisa hak yang belum ditarik mandor
              </span>
            </div>
          </div>

          {/* TABEL 1: DAFTAR SUB-PEKERJAAN & SALDO BORONGAN (MCK, PAVING, DRAINASE) */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaeaea] bg-[#f9f9f9] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                  Daftar Sub-Pekerjaan Fisik & Saldo Hak Borongan
                </h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Perhitungan otomatis nilai borongan vs kasbon ditarik (sesuai contoh Papah: MCK Rp 15 Jt - Bon Rp 3 Jt = Sisa Rp 12 Jt).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto select-text">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center whitespace-nowrap">No</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Sub-Pekerjaan Fisik</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Proyek Lapangan</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Mandor / Kepala Tukang</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Nilai Borongan</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Kasbon Ditarik</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Sisa Hak Borongan</th>
                    <th className="py-2.5 px-3 text-right w-[110px] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeee]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#888888]">
                        Memuat data sub-pekerjaan fisik...
                      </td>
                    </tr>
                  ) : filteredSubJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#888888]">
                        Belum ada sub-pekerjaan fisik terdaftar. Tambahkan sub-pekerjaan di tab Proyek Lapangan.
                      </td>
                    </tr>
                  ) : (
                    filteredSubJobs.map((s, idx) => {
                      const totalBudget = Number(s.contractAmountWorker) || 0;
                      const kasbonPaid = Number(s.totalKasbonPaid) || 0;
                      const remaining = s.remainingWorkerPay ?? Math.max(0, totalBudget - kasbonPaid);

                      return (
                        <tr key={s.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-[#888888]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#111111]">
                            <div>{s.jobName}</div>
                            <span className="text-[10px] font-normal text-[#777777]">
                              {s.unit !== 'PAKET'
                                ? `Volume: ${s.volume || 0} ${s.unit}`
                                : 'Kontrak Borongan Tetap'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-[#333333]">
                            {s.projectName || 'Proyek Lapangan'}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#111111]">
                            {s.workerLeaderName || 'Belum Ditentukan'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#111111]">
                            {formatRupiah(totalBudget)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#cf1124]">
                            {formatRupiah(kasbonPaid)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(remaining)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setRecordModalDefaultProjectId(s.projectId);
                                setRecordModalDefaultSubJobId(s.id);
                                setIsRecordModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#111111] hover:bg-black text-white text-[11px] font-bold rounded-[6px] transition-colors cursor-pointer"
                            >
                              + Catat Bon
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2: RIWAYAT TRANSAKSI KASBON TUKANG */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaeaea] bg-[#f9f9f9]">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                Riwayat Transaksi Kasbon Tukang (Log Rincian Bon)
              </h3>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Setiap transaksi otomatis memotong kas di Buku Kas Utama (Kategori KASBON_MANDOR).
              </p>
            </div>

            <div className="overflow-x-auto select-text">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[110px] whitespace-nowrap">Tanggal</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Nama Mandor / Tukang</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Pekerjaan & Proyek</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal Kasbon</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Catatan / Keperluan</th>
                    <th className="py-2.5 px-3 text-right w-[90px] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeee]">
                  {filteredWorkerKasbon.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#888888]">
                        Belum ada riwayat transaksi kasbon tukang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkerKasbon.map(bon => (
                      <tr key={bon.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#555555] whitespace-nowrap">
                          {formatDateID(bon.date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#111111] whitespace-nowrap">
                          {bon.workerLeaderName}
                        </td>
                        <td className="py-2.5 px-3 text-[#333333]">
                          <span className="font-bold">{bon.subJobName}</span>
                          <span className="text-[11px] text-[#777777] block">{bon.projectName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#cf1124] whitespace-nowrap">
                          {formatRupiah(bon.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-[#555555]">
                          {bon.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDeleteTargetWorkerBon(bon)}
                            className="px-2.5 py-1 bg-[#fdf2f2] hover:bg-[#fae2e2] text-[#cf1124] text-[11px] font-bold rounded-[6px] transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2: KASBON TIM & RELAWAN ================= */}
      {currentSubTab === 'kasbon_employee' && (
        <div className="space-y-5">
          {/* KPI Summary Kasbon Karyawan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-[10px] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#cf1124] uppercase tracking-wide">
                Total Kasbon Tim & Relawan
              </span>
              <div className="text-xl font-bold font-mono text-[#cf1124] mt-1.5">
                {formatRupiah(employeeSummary.totalKasbon)}
              </div>
              <span className="text-[10px] text-[#888888] mt-1">
                Akumulasi kasbon karyawan internal proyek ({employeeSummary.count} transaksi)
              </span>
            </div>

            <div className="bg-white p-4 rounded-[10px] shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wide">
                Status Integrasi Buku Kas
              </span>
              <div className="text-sm font-bold text-[#111111] mt-1.5 flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓ Terhubung Otomatis</span>
              </div>
              <span className="text-[10px] text-[#888888] mt-1">
                Setiap kasbon langsung tercatat di Buku Kas Utama (KASBON_KARYAWAN)
              </span>
            </div>
          </div>

          {/* TABEL RIWAYAT KASBON TIM */}
          <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaeaea] bg-[#f9f9f9]">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wide">
                Daftar Kasbon Tim & Relawan Proyek
              </h3>
            </div>

            <div className="overflow-x-auto select-text">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-[110px] whitespace-nowrap">Tanggal</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Nama Karyawan / Relawan</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Proyek Lapangan</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal Kasbon</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Catatan / Keperluan</th>
                    <th className="py-2.5 px-3 text-right w-[90px] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeee]">
                  {filteredEmployeeKasbon.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#888888]">
                        Belum ada riwayat kasbon tim tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployeeKasbon.map(emp => (
                      <tr key={emp.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#555555] whitespace-nowrap">
                          {formatDateID(emp.date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#111111] whitespace-nowrap">
                          {emp.employeeName}
                        </td>
                        <td className="py-2.5 px-3 text-[#333333]">
                          {emp.projectName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#cf1124] whitespace-nowrap">
                          {formatRupiah(emp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-[#555555]">
                          {emp.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDeleteTargetEmployeeBon(emp)}
                            className="px-2.5 py-1 bg-[#fdf2f2] hover:bg-[#fae2e2] text-[#cf1124] text-[11px] font-bold rounded-[6px] transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 3: TIPE PEKERJAAN & MASTER TARIF ================= */}
      {currentSubTab === 'job_types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Master Tipe Pekerjaan Tukang Lapangan
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Konfigurasi tarif dan satuan perhitungan untuk MCK, Drainase, Paving Block, dsb.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedJobTypeForEdit(null);
                setIsJobTypeModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
            >
              + Tambah Tipe Pekerjaan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {jobTypes.map(job => (
              <div
                key={job.id}
                className="bg-white border border-[#eaeaea] rounded-[10px] p-4 flex flex-col justify-between hover:border-[#111111] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5]">
                    <span className="font-bold text-sm text-[#111111]">{job.name}</span>
                    <span className="text-[10px] font-bold bg-[#f0f0f0] text-[#444444] px-2 py-0.5 rounded">
                      {job.unit}
                    </span>
                  </div>

                  <div className="py-3">
                    <span className="text-[11px] text-[#888888] block">Tarif Acuan HOK</span>
                    <span className="text-lg font-bold tracking-tight text-[#111111] block mt-0.5">
                      {formatRupiah(job.defaultRate)}
                      <span className="text-xs font-normal text-[#666666] ml-1">
                        /{job.unit === 'm²' ? 'm²' : 'proyek'}
                      </span>
                    </span>
                    {job.description ? (
                      <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                        {job.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f5f5f5] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobTypeForEdit(job);
                      setIsJobTypeModalOpen(true);
                    }}
                    className="text-xs font-medium text-[#111111] hover:underline cursor-pointer"
                  >
                    Edit Konfigurasi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Quick Record Kasbon */}
      {isRecordModalOpen && (
        <QuickRecordKasbonModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setRecordModalDefaultSubJobId(undefined);
            setRecordModalDefaultProjectId(undefined);
          }}
          userEmail={userEmail}
          defaultProjectId={recordModalDefaultProjectId}
          defaultSubJobId={recordModalDefaultSubJobId}
          onSuccess={msg => showToast(msg)}
        />
      )}

      {/* Modal Tipe Pekerjaan */}
      {isJobTypeModalOpen && (
        <LaborJobTypeModal
          isOpen={isJobTypeModalOpen}
          onClose={() => {
            setIsJobTypeModalOpen(false);
            setSelectedJobTypeForEdit(null);
          }}
          jobType={selectedJobTypeForEdit}
          onSuccess={() => showToast('Tipe pekerjaan berhasil disimpan!')}
        />
      )}

      {/* Dialog Konfirmasi Hapus Kasbon Tukang */}
      {deleteTargetWorkerBon && (
        <CustomDialog
          isOpen={Boolean(deleteTargetWorkerBon)}
          onClose={() => setDeleteTargetWorkerBon(null)}
          title="Hapus Catatan Kasbon Tukang?"
          description={`Apakah Anda yakin ingin menghapus catatan kasbon "${deleteTargetWorkerBon.workerLeaderName}" sebesar ${formatRupiah(deleteTargetWorkerBon.amount)}? Saldo sisa hak upah tukang akan otomatis dipulihkan dan mutasi di Buku Kas Utama akan dibatalkan.`}
          confirmText="Ya, Hapus Kasbon"
          cancelText="Batal"
          isDestructive
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteWorkerBon}
        />
      )}

      {/* Dialog Konfirmasi Hapus Kasbon Karyawan */}
      {deleteTargetEmployeeBon && (
        <CustomDialog
          isOpen={Boolean(deleteTargetEmployeeBon)}
          onClose={() => setDeleteTargetEmployeeBon(null)}
          title="Hapus Catatan Kasbon Tim?"
          description={`Apakah Anda yakin ingin menghapus catatan kasbon tim "${deleteTargetEmployeeBon.employeeName}" sebesar ${formatRupiah(deleteTargetEmployeeBon.amount)}? Mutasi kas keluar di Buku Kas Utama akan otomatis dihapus.`}
          confirmText="Ya, Hapus Kasbon"
          cancelText="Batal"
          isDestructive
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteEmployeeBon}
        />
      )}
    </div>
  );
}
