import React, { useState, useEffect, useMemo } from 'react';
import { NavigationTab } from '@/components/layout/Sidebar';
import { ProjectSubJob, WorkerKasbonLog, DispatchTransaction, CashLedgerEntry } from '@/types/database';
import { subscribeProjectSubJobs, subscribeWorkerKasbonLogs } from '@/lib/projectFinanceService';
import { QuickRecordKasbonModal } from '@/components/labor/QuickRecordKasbonModal';

interface MobileThreePillarsWidgetProps {
  userEmail: string;
  transactions: DispatchTransaction[];
  cashEntries: CashLedgerEntry[];
  latestCash: number;
  totalRevenue: number;
  onNavigateTab?: (tab: NavigationTab, subTabId?: string) => void;
}

export function MobileThreePillarsWidget({
  userEmail,
  transactions,
  cashEntries,
  latestCash,
  totalRevenue,
  onNavigateTab
}: MobileThreePillarsWidgetProps): React.JSX.Element {
  const [subJobs, setSubJobs] = useState<ProjectSubJob[]>([]);
  const [kasbonLogs, setKasbonLogs] = useState<WorkerKasbonLog[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe SubJobs & Kasbon untuk pilar ke-3
  useEffect(() => {
    const unsubSub = subscribeProjectSubJobs(setSubJobs);
    const unsubBon = subscribeWorkerKasbonLogs(setKasbonLogs);
    return () => {
      unsubSub();
      unsubBon();
    };
  }, []);

  const formatRupiah = (val: number): string =>
    'Rp ' + Math.round(val).toLocaleString('id-ID');

  // Kalkulasi Kasbon Lapangan
  const kasbonMetrics = useMemo(() => {
    let totalWageBudget = 0;
    let totalKasbonPaid = 0;
    subJobs.forEach(s => {
      totalWageBudget += Number(s.contractAmountWorker) || 0;
      totalKasbonPaid += Number(s.totalKasbonPaid) || 0;
    });
    const remainingWage = Math.max(0, totalWageBudget - totalKasbonPaid);
    return {
      totalWageBudget,
      totalKasbonPaid,
      remainingWage,
      activeJobsCount: subJobs.length,
      bonCount: kasbonLogs.length
    };
  }, [subJobs, kasbonLogs]);

  // Kalkulasi Kas Masuk & Kas Keluar
  const cashFlowMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    cashEntries.forEach(c => {
      const amt = Number(c.amount) || 0;
      if (c.isCredit) totalIn += amt;
      else totalOut += amt;
    });
    return { totalIn, totalOut };
  }, [cashEntries]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="block md:hidden mb-4 select-none">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 p-3 bg-[#111111] text-white text-xs font-bold rounded-[8px] shadow-xl flex items-center justify-between">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Container 3 Pilar */}
      <div className="bg-[#111111] text-white rounded-[14px] p-4 shadow-lg space-y-3.5">
        {/* Header Widget & Quick Action Button */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#999999] uppercase block">
              Pusat Kendali Eksekutif (3 Pilar)
            </span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Monitoring Operasional Lapangan
            </h2>
          </div>

          {/* Tombol Utama: Catat Kasbon */}
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="px-3 py-1.5 bg-white text-[#111111] hover:bg-[#eaeaea] text-xs font-bold rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
          >
            <span>+ Catat Kasbon</span>
          </button>
        </div>

        {/* 3 Pilar Cards Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* PILAR 1: KAS & MODAL */}
          <div
            onClick={() => onNavigateTab?.('cash_ledger', 'cash_flow')}
            className="bg-[#1c1c1c] hover:bg-[#252525] p-3 rounded-[10px] transition-colors cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  1. DANA & KAS
                </span>
                <span className="text-[10px] text-[#555555]">→ Lihat Arus Kas</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5 truncate">
                {formatRupiah(latestCash)}
              </div>
              <div className="text-[10px] text-[#888888] font-mono mt-0.5">
                Masuk: <span className="text-emerald-400 font-semibold">{formatRupiah(cashFlowMetrics.totalIn)}</span>
                <span className="mx-1.5 text-[#444444]">|</span>
                Keluar: <span className="text-rose-400 font-semibold">{formatRupiah(cashFlowMetrics.totalOut)}</span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-[6px] bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
              💳
            </div>
          </div>

          {/* PILAR 2: PERPUTARAN MATERIAL (JUAL-BELI) */}
          <div
            onClick={() => onNavigateTab?.('ritase')}
            className="bg-[#1c1c1c] hover:bg-[#252525] p-3 rounded-[10px] transition-colors cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  2. PERPUTARAN MATERIAL
                </span>
                <span className="text-[10px] text-[#555555]">→ Lihat Ritase</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5 truncate">
                {formatRupiah(totalRevenue)}
              </div>
              <div className="text-[10px] text-[#888888] mt-0.5">
                Total Muatan: <strong className="text-white font-bold">{transactions.length}</strong> Tiket Ritase
              </div>
            </div>
            <div className="w-7 h-7 rounded-[6px] bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
              🚛
            </div>
          </div>

          {/* PILAR 3: KASBON LAPANGAN & BORONGAN */}
          <div
            onClick={() => onNavigateTab?.('hok_labor', 'kasbon_borongan')}
            className="bg-[#1c1c1c] hover:bg-[#252525] p-3 rounded-[10px] transition-colors cursor-pointer flex items-center justify-between gap-3 border-l-4 border-amber-500"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  3. KASBON & BORONGAN
                </span>
                <span className="text-[10px] text-[#888888]">→ Cek MCK / Paving</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5 truncate">
                {formatRupiah(kasbonMetrics.totalKasbonPaid)}
                <span className="text-[11px] font-normal text-[#888888] ml-1.5 font-sans">
                  ditarik
                </span>
              </div>
              <div className="text-[10px] text-[#888888] font-mono mt-0.5">
                Sisa Hak Upah: <strong className="text-emerald-400 font-bold">{formatRupiah(kasbonMetrics.remainingWage)}</strong>
                <span className="mx-1.5 text-[#444444]">|</span>
                <strong className="text-white">{kasbonMetrics.activeJobsCount}</strong> Pekerjaan
              </div>
            </div>
            <div className="w-7 h-7 rounded-[6px] bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
              👷
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Record Kasbon */}
      {isRecordModalOpen && (
        <QuickRecordKasbonModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          userEmail={userEmail}
          onSuccess={showToast}
        />
      )}
    </div>
  );
}
