import React, { useState, useEffect, useMemo } from 'react';
import { LaborJobType, LaborPayment, Project } from '@/types/database';
import {
  subscribeLaborJobTypes,
  subscribeLaborPayments,
  getLaborJobTypes
} from '@/lib/laborService';
import { subscribeProjects } from '@/lib/projectService';
import { LaborPaymentFormModal } from './LaborPaymentFormModal';
import { LaborJobTypeModal } from './LaborJobTypeModal';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';

interface LaborPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: any, subTabId?: string) => void;
}

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

export function LaborPage({
  userEmail,
  activeSubTab = 'payments',
  onNavigateSubTab
}: LaborPageProps): React.JSX.Element {
  const [currentSubTab, setCurrentSubTab] = useState<'payments' | 'job_types'>(
    activeSubTab === 'job_types' ? 'job_types' : 'payments'
  );
  const [payments, setPayments] = useState<LaborPayment[]>([]);
  const [jobTypes, setJobTypes] = useState<LaborJobType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isJobTypeModalOpen, setIsJobTypeModalOpen] = useState(false);
  const [selectedJobTypeForEdit, setSelectedJobTypeForEdit] = useState<LaborJobType | null>(null);

  useEffect(() => {
    if (activeSubTab === 'payments' || activeSubTab === 'job_types') {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    // 1. Subscribe Job Types (auto-seed default MCK, Drainase, Paving Block if empty)
    const unsubJobTypes = subscribeLaborJobTypes(types => {
      setJobTypes(types);
      setIsLoading(false);
    });

    // 2. Subscribe Payments
    const unsubPayments = subscribeLaborPayments(list => {
      setPayments(list);
    });

    // 3. Subscribe Projects
    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });

    // Inisialisasi awal job types jika kosong
    getLaborJobTypes().catch(console.warn);

    return () => {
      unsubJobTypes();
      unsubPayments();
      unsubProjects();
    };
  }, []);

  const handleSelectSubTab = (sub: 'payments' | 'job_types') => {
    setCurrentSubTab(sub);
    if (onNavigateSubTab) {
      onNavigateSubTab('hok_labor', sub);
    }
  };

  // Ringkasan Statistik
  const summary = useMemo(() => {
    let totalPaid = 0;
    let totalM2 = 0;
    payments.forEach(p => {
      totalPaid += p.totalAmount || 0;
      if (p.calculationType === 'PER_M2') {
        totalM2 += p.areaSquareMeter || 0;
      }
    });
    return {
      totalPaid,
      totalM2,
      count: payments.length
    };
  }, [payments]);

  // Filter Search
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter(
      p =>
        p.workerName.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.jobTypeName.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.workerPhone && p.workerPhone.includes(q)) ||
        matchesDateQuery(p.paymentDate, q)
    );
  }, [payments, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Subtab Switcher Header */}
      <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectSubTab('payments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              currentSubTab === 'payments'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f9f9f9]'
            }`}
          >
            Pembayaran HOK Tukang
          </button>
          <button
            type="button"
            onClick={() => handleSelectSubTab('job_types')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              currentSubTab === 'job_types'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f9f9f9]'
            }`}
          >
            Tipe Pekerjaan ({jobTypes.length})
          </button>
        </div>

        <div className="hidden sm:block text-[11px] text-[#888888]">
          Sistem Upah Lapangan: <span className="font-semibold text-[#111111]">m² & Borongan</span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#eaeaea] rounded-[10px] p-12 text-center text-xs text-[#888888]">
          Memuat data sistem upah tukang...
        </div>
      ) : currentSubTab === 'payments' ? (
        /* ================= SUBTAB 1: PEMBAYARAN HOK ================= */
        <div className="space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">
                Total Upah HOK Dibayarkan
              </span>
              <span className="text-xl font-bold tracking-tight text-[#cf1124] block mt-1">
                {formatRupiah(summary.totalPaid)}
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                Otomatis memotong kas & terhubung ke buku kas
              </span>
            </div>

            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">
                Total Volume Pengerjaan (m²)
              </span>
              <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
                {summary.totalM2.toLocaleString('id-ID')} m²
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                Akumulasi luas Drainase & Paving Block
              </span>
            </div>

            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">
                Total Transaksi Upah Tukang
              </span>
              <span className="text-xl font-bold tracking-tight text-emerald-700 block mt-1">
                {summary.count} Pembayaran
              </span>
              <span className="text-[10px] text-[#888888] block mt-0.5">
                Riwayat tanda terima upah mandor/tukang
              </span>
            </div>
          </div>

          {/* Tabel Pembayaran HOK */}
          <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
            <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
              <div className="text-xs text-[#666666]">
                Daftar pembayaran upah tukang lapangan (MCK, Drainase, Paving Block).
              </div>

              <div className="flex items-center gap-2">
                {/* Search Input (Rule 98) */}
                <div className="relative flex-1 sm:w-64">
                  <img
                    src="/icons/search.png"
                    alt="Search"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari tukang, proyek, tanggal (misal 28-10-26)..."
                    className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  + Catat Pembayaran HOK
                </button>
              </div>
            </div>

            <div className="overflow-x-auto select-text">
              <table className="w-full min-w-[950px] table-fixed text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-[110px] whitespace-nowrap">Tanggal</th>
                    <th className="py-2.5 px-3 w-[170px] whitespace-nowrap">Kepala Tukang / Mandor</th>
                    <th className="py-2.5 px-3 w-[180px] whitespace-nowrap">Proyek Lapangan</th>
                    <th className="py-2.5 px-3 w-[220px] whitespace-nowrap">Pekerjaan & Perhitungan</th>
                    <th className="py-2.5 px-3 w-[140px] text-right whitespace-nowrap">Total Upah</th>
                    <th className="py-2.5 px-3 w-[90px] text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#888888]">
                        Belum ada riwayat pembayaran HOK tukang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-[#555555] whitespace-nowrap align-middle">
                          {formatDateID(p.paymentDate)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <span className="font-bold text-[#111111] block">{p.workerName}</span>
                          <span className="text-[10px] font-mono text-[#888888] block">
                            {p.workerPhone || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <span className="font-semibold text-[#111111] block truncate">
                            {p.projectName}
                          </span>
                          {p.notes ? (
                            <span className="text-[10px] text-[#666666] block truncate">
                              {p.notes}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <span className="font-medium text-[#111111] block">
                            {p.jobTypeName}
                          </span>
                          <span className="text-[11px] text-[#666666] block">
                            {p.calculationType === 'PER_M2' ? (
                              <span>
                                {p.areaSquareMeter} m² × {formatRupiah(p.ratePerUnit)}/m²
                              </span>
                            ) : (
                              <span>Borongan @ {formatRupiah(p.ratePerUnit)}</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold tracking-tight text-[#111111] text-right whitespace-nowrap align-middle">
                          {formatRupiah(p.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap align-middle">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              p.status === 'LUNAS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SUBTAB 2: MASTER TIPE PEKERJAAN ================= */
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

      {/* Modal Form Pembayaran HOK */}
      <LaborPaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        jobTypes={jobTypes}
        projects={projects}
        userEmail={userEmail}
        onSuccess={() => {}}
      />

      {/* Modal Tipe Pekerjaan */}
      <LaborJobTypeModal
        isOpen={isJobTypeModalOpen}
        onClose={() => {
          setIsJobTypeModalOpen(false);
          setSelectedJobTypeForEdit(null);
        }}
        jobType={selectedJobTypeForEdit}
        onSuccess={() => {}}
      />
    </div>
  );
}
