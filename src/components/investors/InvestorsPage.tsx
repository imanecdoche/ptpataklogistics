import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Investor,
  Project,
  InvestorProjectLink,
  DispatchTransaction,
  InvestorPayout,
  InvestorTransferLog,
  InvestorTransferCategory
} from '@/types/database';
import {
  subscribeInvestors,
  saveInvestor,
  deleteInvestor,
  subscribeInvestorTransfers,
  createInvestorTransfer,
  settleInvestorTransfer,
  subscribeInvestorPayouts,
  recordInvestorPayout
} from '@/lib/investorService';
import { subscribeProjects } from '@/lib/projectService';
import { subscribeAllTransactions } from '@/lib/dispatcherService';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityNameLive } from '@/lib/nameUtils';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';
import { InvestorLedgerModal } from './InvestorLedgerModal';
import { InvestorTransferModal } from './InvestorTransferModal';

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

interface InvestorsPageProps {
  userEmail?: string;
}

export function InvestorsPage({ userEmail = 'fatih@patak.dev' }: InvestorsPageProps): React.JSX.Element {
  const { isInvestorUser, selectedProjectId, projects: allProjects } = useProjectFilter();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [transfers, setTransfers] = useState<InvestorTransferLog[]>([]);
  const [payouts, setPayouts] = useState<InvestorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferFilter, setTransferFilter] = useState<'ALL' | 'BELUM_LUNAS' | 'LUNAS'>('ALL');

  // Modal State Detail Buku Kas Investor
  const [selectedLedgerInvestor, setSelectedLedgerInvestor] = useState<Investor | null>(null);

  // Modal State Transfer Antar Investor
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Modal State Tambah Investor
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [addLinkedProjects, setAddLinkedProjects] = useState<InvestorProjectLink[]>([]);
  const [addProjectQuery, setAddProjectQuery] = useState('');
  const [isAddComboboxOpen, setIsAddComboboxOpen] = useState(false);
  const [addHighlightedIndex, setAddHighlightedIndex] = useState(0);
  const addComboboxRef = useRef<HTMLDivElement>(null);

  // Modal State Edit Investor
  const [editTarget, setEditTarget] = useState<Investor | null>(null);
  const [editLinkedProjects, setEditLinkedProjects] = useState<InvestorProjectLink[]>([]);
  const [editProjectQuery, setEditProjectQuery] = useState('');
  const [isEditComboboxOpen, setIsEditComboboxOpen] = useState(false);
  const [editHighlightedIndex, setEditHighlightedIndex] = useState(0);
  const editComboboxRef = useRef<HTMLDivElement>(null);

  // Pin Auth Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [pinTargetLabel, setPinTargetLabel] = useState('');

  useEffect(() => {
    const unsubInvestors = subscribeInvestors(list => {
      setInvestors(list);
      setIsLoading(false);
    });
    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });
    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list);
    });
    const unsubTransfers = subscribeInvestorTransfers(list => {
      setTransfers(list);
    });
    const unsubPayouts = subscribeInvestorPayouts(list => {
      setPayouts(list);
    });

    return () => {
      unsubInvestors();
      unsubProjects();
      unsubTx();
      unsubTransfers();
      unsubPayouts();
    };
  }, []);

  // Filter investor berdasarkan RBAC & search
  const filteredInvestors = useMemo(() => {
    let result = [...investors];

    if (isInvestorUser && selectedProjectId && selectedProjectId !== 'ALL') {
      const currentProj = allProjects.find(p => p.id === selectedProjectId);
      if (currentProj && currentProj.investorId) {
        result = result.filter(i => i.id === currentProj.investorId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.phoneNumber && i.phoneNumber.includes(q)) ||
          (i.bankAccount && i.bankAccount.toLowerCase().includes(q)) ||
          i.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [investors, isInvestorUser, selectedProjectId, allProjects, searchQuery]);

  // Statistik Ringkasan
  const totalCapital = useMemo(() => {
    return filteredInvestors.reduce((acc, i) => acc + (i.initialCapital || 0), 0);
  }, [filteredInvestors]);

  // Hitung proyek dan saldo kas berjalan per investor
  const investorProjectsMap = useMemo(() => {
    const map = new Map<string, { projects: Project[]; balance: number }>();
    projects.forEach(p => {
      const invId = p.investorId;
      if (!invId) return;
      const current = map.get(invId) || { projects: [], balance: 0 };
      current.projects.push(p);
      current.balance += p.currentBalance || 0;
      map.set(invId, current);
    });
    return map;
  }, [projects]);

  // Hitung estimasi hak bagi hasil akumulasi per investor
  const investorProfitShareMap = useMemo(() => {
    const map = new Map<string, number>();

    investors.forEach(inv => {
      const fundedProjects = projects.filter(p => p.investorId === inv.id);
      let totalEarned = 0;

      fundedProjects.forEach(proj => {
        const projTxs = transactions.filter(t => t.projectId === proj.id);
        const projRev = projTxs.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
        const projExp = projTxs.reduce((acc, t) => acc + (t.totalBuyCost || 0) + (t.operationalCost || 0), 0);
        const projNet = projRev - projExp;
        const sharePct = proj.profitSharePercentage || inv.profitSharePercentage || 50;
        if (projNet > 0) {
          totalEarned += projNet * (sharePct / 100);
        }
      });

      const withdrawn = payouts
        .filter(p => p.investorId === inv.id)
        .reduce((acc, p) => acc + (p.amount || 0), 0);

      map.set(inv.id, Math.max(0, totalEarned - withdrawn));
    });

    return map;
  }, [investors, projects, transactions, payouts]);

  // Total talangan aktif yang belum lunas
  const totalUnsettledTalangan = useMemo(() => {
    return transfers
      .filter(t => t.status === 'BELUM_LUNAS')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transfers]);

  // Filter daftar riwayat transfer
  const filteredTransfers = useMemo(() => {
    if (transferFilter === 'BELUM_LUNAS') {
      return transfers.filter(t => t.status === 'BELUM_LUNAS');
    }
    if (transferFilter === 'LUNAS') {
      return transfers.filter(t => t.status === 'LUNAS');
    }
    return transfers;
  }, [transfers, transferFilter]);

  // Otorisasi Aksi Tambah Investor
  const handleOpenAdd = () => {
    setName('');
    setPhoneNumber('');
    setBankAccount('');
    setInitialCapital(0);
    setNotes('');
    setAddLinkedProjects([]);
    setAddProjectQuery('');
    setIsAddComboboxOpen(false);
    setIsAddOpen(true);
  };

  const availableProjectsForAdd = useMemo(() => {
    const linkedIds = new Set(addLinkedProjects.map(p => p.projectId));
    const list = projects.filter(p => !linkedIds.has(p.id));
    if (!addProjectQuery.trim()) return list;
    const q = addProjectQuery.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
  }, [projects, addLinkedProjects, addProjectQuery]);

  const availableProjectsForEdit = useMemo(() => {
    const linkedIds = new Set(editLinkedProjects.map(p => p.projectId));
    const list = projects.filter(p => !linkedIds.has(p.id));
    if (!editProjectQuery.trim()) return list;
    const q = editProjectQuery.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
  }, [projects, editLinkedProjects, editProjectQuery]);

  const handleAddProjectLink = (p: Project) => {
    const updated = [
      ...addLinkedProjects,
      {
        projectId: p.id,
        projectName: p.name,
        capitalAllocation: p.initialDeposit || 0,
        profitSharePercentage: p.profitSharePercentage || 50
      }
    ];
    setAddLinkedProjects(updated);
    setAddProjectQuery('');
    setIsAddComboboxOpen(false);
    const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
    setInitialCapital(sum);
  };

  const handleRemoveAddProjectLink = (projectId: string) => {
    const updated = addLinkedProjects.filter(p => p.projectId !== projectId);
    setAddLinkedProjects(updated);
    const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
    setInitialCapital(sum);
  };

  const handleUpdateAddProjectAllocation = (projectId: string, alloc: number) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, capitalAllocation: alloc } : p
    );
    setAddLinkedProjects(updated);
    const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
    setInitialCapital(sum);
  };

  const handleUpdateAddProjectProfitShare = (projectId: string, pct: number) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitSharePercentage: pct } : p
    );
    setAddLinkedProjects(updated);
  };

  const handleInitiateAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setPinTargetLabel(`Tambah Investor: ${name}`);
    setPendingAction(() => async () => {
      await saveInvestor({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        bankAccount: bankAccount.trim(),
        initialCapital: initialCapital || 0,
        linkedProjects: addLinkedProjects,
        notes: notes.trim()
      });
      setIsAddOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Edit Investor
  const handleOpenEdit = (inv: Investor) => {
    setEditTarget(inv);
    const links: InvestorProjectLink[] = (inv.linkedProjects && inv.linkedProjects.length > 0)
      ? inv.linkedProjects
      : projects
          .filter(p => p.investorId === inv.id)
          .map(p => ({
            projectId: p.id,
            projectName: p.name,
            capitalAllocation: p.initialDeposit || 0,
            profitSharePercentage: p.profitSharePercentage || inv.profitSharePercentage || 50
          }));
    setEditLinkedProjects(links);
    setEditProjectQuery('');
    setIsEditComboboxOpen(false);
  };

  const handleAddEditProjectLink = (p: Project) => {
    const updated = [
      ...editLinkedProjects,
      {
        projectId: p.id,
        projectName: p.name,
        capitalAllocation: p.initialDeposit || 0,
        profitSharePercentage: p.profitSharePercentage || 50
      }
    ];
    setEditLinkedProjects(updated);
    setEditProjectQuery('');
    setIsEditComboboxOpen(false);
    if (editTarget) {
      const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
      setEditTarget({ ...editTarget, initialCapital: sum });
    }
  };

  const handleRemoveEditProjectLink = (projectId: string) => {
    const updated = editLinkedProjects.filter(p => p.projectId !== projectId);
    setEditLinkedProjects(updated);
    if (editTarget) {
      const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
      setEditTarget({ ...editTarget, initialCapital: sum });
    }
  };

  const handleUpdateEditProjectAllocation = (projectId: string, alloc: number) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, capitalAllocation: alloc } : p
    );
    setEditLinkedProjects(updated);
    if (editTarget) {
      const sum = updated.reduce((acc, cur) => acc + (cur.capitalAllocation || 0), 0);
      setEditTarget({ ...editTarget, initialCapital: sum });
    }
  };

  const handleUpdateEditProjectProfitShare = (projectId: string, pct: number) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitSharePercentage: pct } : p
    );
    setEditLinkedProjects(updated);
  };

  const handleInitiateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setPinTargetLabel(`Ubah Investor: ${editTarget.name}`);
    setPendingAction(() => async () => {
      await saveInvestor(
        {
          name: editTarget.name.trim(),
          phoneNumber: editTarget.phoneNumber?.trim(),
          bankAccount: editTarget.bankAccount?.trim(),
          initialCapital: editTarget.initialCapital || 0,
          linkedProjects: editLinkedProjects,
          notes: editTarget.notes?.trim()
        },
        editTarget.id
      );
      setEditTarget(null);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Hapus Investor
  const handleDeleteInvestor = (inv: Investor) => {
    setPinTargetLabel(`Hapus Investor: ${inv.name}`);
    setPendingAction(() => async () => {
      await deleteInvestor(inv.id);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Transfer Antar-Investor
  const handleInitiateTransfer = (payload: {
    date: string;
    fromInvestorId: string;
    fromInvestorName: string;
    fromProjectId?: string;
    fromProjectName?: string;
    toInvestorId: string;
    toInvestorName: string;
    toProjectId?: string;
    toProjectName?: string;
    amount: number;
    category: InvestorTransferCategory;
    note: string;
  }) => {
    setPinTargetLabel(`Transfer ${formatRupiah(payload.amount)}: ${payload.fromInvestorName} → ${payload.toInvestorName}`);
    setPendingAction(() => async () => {
      await createInvestorTransfer({
        ...payload,
        createdByName: userEmail
      });
      setIsTransferModalOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Pelunasan Talangan
  const handleInitiateSettleTalangan = (trans: InvestorTransferLog) => {
    setPinTargetLabel(`Lunasi Talangan ${formatRupiah(trans.amount)} (Ref: ${trans.id})`);
    setPendingAction(() => async () => {
      await settleInvestorTransfer(trans.id, userEmail);
    });
    setIsPinModalOpen(true);
  };

  // Eksekusi Payout Dividen
  const handleRecordPayout = async (payload: { amount: number; note: string; date?: string }) => {
    if (!selectedLedgerInvestor) return;
    setPinTargetLabel(`Penyerahan Bagi Hasil ${formatRupiah(payload.amount)} ke ${selectedLedgerInvestor.name}`);
    setPendingAction(() => async () => {
      await recordInvestorPayout({
        investorId: selectedLedgerInvestor.id,
        investorName: selectedLedgerInvestor.name,
        amount: payload.amount,
        note: payload.note,
        date: payload.date,
        createdByName: userEmail
      });
    });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;
    try {
      await pendingAction();
    } catch (err) {
      console.error('Gagal menjalankan aksi investor:', err);
    } finally {
      setIsPinModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Titlebar Action Button */}
      {!isInvestorUser && (
        <MobileTitlebarAction>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="px-2 py-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              ⇄ Transfer
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-2 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              + Investor
            </button>
          </div>
        </MobileTitlebarAction>
      )}

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Investor Terdaftar</span>
          <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
            {filteredInvestors.length} Mitra Pendana
          </span>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            Ekuitas pemodal di Kas Utama
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Modal Disetor</span>
          <div className="mt-1">
            <MetricCardCurrency amount={totalCapital} size="lg" />
          </div>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            Komitmen modal masuk perusahaan
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Talangan Operasional Aktif</span>
          <div className="mt-1">
            <MetricCardCurrency
              amount={totalUnsettledTalangan}
              size="lg"
              colorClassName={totalUnsettledTalangan > 0 ? 'text-amber-600' : 'text-[#888888]'}
            />
          </div>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            Pinjaman silang belum lunas
          </span>
        </div>
      </div>

      {/* 2. Main Content Card: Tabel Investor */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          <div className="text-xs text-[#666666]">
            Daftar profil pemodal tetap. Operasional ritase dibiayai terpusat melalui <span className="font-semibold text-[#111111]">Buku Kas Utama</span>.
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
                placeholder="Cari investor, kontak, bank..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isInvestorUser && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  ⇄ Transfer Antar-Investor
                </button>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  + Tambah Investor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Master Investor */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[1100px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[200px] min-w-[200px] whitespace-nowrap">Nama Investor</th>
                <th className="py-2.5 px-3 w-[150px] min-w-[150px] whitespace-nowrap">No. WhatsApp / HP</th>
                <th className="py-2.5 px-3 w-[170px] min-w-[170px] whitespace-nowrap">Rekening Bank</th>
                <th className="py-2.5 px-3 w-[210px] min-w-[210px] whitespace-nowrap">Proyek Terkait & Profit Share</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Modal Disetor</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Hak Bagi Hasil</th>
                <th className="py-2.5 px-3 w-[100px] min-w-[100px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Memuat data master investor...
                  </td>
                </tr>
              ) : filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Tidak ada data investor yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(inv => {
                  const invStats = investorProjectsMap.get(inv.id);
                  const linkedProjects = invStats?.projects || [];
                  const profitShareRemaining = investorProfitShareMap.get(inv.id) || 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap w-[200px] align-middle">
                        <span className="font-bold text-[#111111] block truncate">{inv.name}</span>
                        <span className="text-[10px] font-mono text-[#888888] block">{inv.id}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                        {inv.phoneNumber ? formatPhoneNumber(inv.phoneNumber) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[170px] align-middle">
                        <RunningText text={inv.bankAccount} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-2.5 px-3 text-[#111111] whitespace-nowrap w-[210px] align-middle">
                        {linkedProjects.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {linkedProjects.map(p => (
                              <div key={p.id} className="text-xs truncate">
                                <span className="font-semibold text-[#111111]">{p.name}</span>
                                {p.profitSharePercentage ? (
                                  <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                                    {p.profitSharePercentage}%
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#888888]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold tracking-tight text-[#111111] text-right whitespace-nowrap w-[130px] align-middle">
                        {formatRupiah(inv.initialCapital || 0)}
                      </td>
                      <td className="py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap w-[140px] align-middle text-[#008060]">
                        {formatRupiah(profitShareRemaining)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[100px] align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerInvestor(inv)}
                            className="px-2 py-1 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] rounded text-[11px] font-semibold cursor-pointer"
                            title="Buku Kas & Rekap Ekuitas"
                          >
                            Buku Kas
                          </button>
                          {!isInvestorUser && (
                            <TableActionMenu
                              items={[
                                {
                                  label: 'Buku Kas & Rekap Ekuitas',
                                  onClick: () => setSelectedLedgerInvestor(inv)
                                },
                                {
                                  label: 'Edit Data Investor',
                                  onClick: () => handleOpenEdit(inv)
                                },
                                {
                                  label: 'Salin ID Investor',
                                  onClick: () => navigator.clipboard.writeText(inv.id)
                                },
                                {
                                  label: 'Hapus Investor',
                                  variant: 'danger',
                                  onClick: () => handleDeleteInvestor(inv)
                                }
                              ]}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Section Riwayat Transfer & Talangan Antar-Investor */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          <div>
            <h4 className="text-xs font-bold text-[#111111]">
              Riwayat Transfer & Talangan Antar-Investor
            </h4>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Catatan subsidi silang, talangan operasional lapangan, dan realokasi modal antar mitra
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTransferFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                transferFilter === 'ALL'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]'
              }`}
            >
              Semua ({transfers.length})
            </button>
            <button
              type="button"
              onClick={() => setTransferFilter('BELUM_LUNAS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                transferFilter === 'BELUM_LUNAS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-[#eaeaea] text-amber-700 hover:bg-amber-50'
              }`}
            >
              Talangan Aktif ({transfers.filter(t => t.status === 'BELUM_LUNAS').length})
            </button>
            <button
              type="button"
              onClick={() => setTransferFilter('LUNAS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                transferFilter === 'LUNAS'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-[#eaeaea] text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Lunas ({transfers.filter(t => t.status === 'LUNAS').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[950px] text-left text-xs border-collapse">
            <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Tanggal / ID</th>
                <th className="py-2.5 px-3">Dari (Pengirim)</th>
                <th className="py-2.5 px-3">Ke (Penerima)</th>
                <th className="py-2.5 px-3">Kategori Mutasi</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Catatan</th>
                {!isInvestorUser && (
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#888888]">
                    Belum ada riwayat transfer atau talangan antar-investor.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-[#111111] block">{tr.date}</span>
                      <span className="text-[10px] font-mono text-[#888888] block">{tr.id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#111111] block">{tr.fromInvestorName}</span>
                      {tr.fromProjectName && (
                        <span className="text-[10px] text-[#666666] block">{tr.fromProjectName}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#111111] block">{tr.toInvestorName}</span>
                      {tr.toProjectName && (
                        <span className="text-[10px] text-[#666666] block">{tr.toProjectName}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-[#333333]">
                        {tr.category === 'TALANGAN_OPERASIONAL'
                          ? 'Talangan Operasional'
                          : tr.category === 'PENGEMBALIAN_TALANGAN'
                          ? 'Pengembalian Talangan'
                          : tr.category === 'MIGRASI_MODAL'
                          ? 'Migrasi Modal'
                          : tr.category === 'BAGI_HASIL_PROYEK'
                          ? 'Bagi Hasil Proyek'
                          : 'Lainnya'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#111111] whitespace-nowrap">
                      {formatRupiah(tr.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {tr.status === 'BELUM_LUNAS' ? (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                          Belum Lunas
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          Lunas
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#666666] max-w-[180px] truncate">
                      {tr.note || '-'}
                    </td>
                    {!isInvestorUser && (
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {tr.status === 'BELUM_LUNAS' ? (
                          <button
                            type="button"
                            onClick={() => handleInitiateSettleTalangan(tr)}
                            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded cursor-pointer"
                          >
                            Lunasi
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#888888]">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Investor Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] w-full max-w-xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Tambah Investor Baru</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Daftarkan profil mitra pemodal tetap dan kaitkan alokasi proyek
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#888888] hover:text-[#111111] text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#333333] font-semibold mb-1">
                  Nama Investor / Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(formatEntityNameLive(e.target.value))}
                  placeholder="Contoh: Bpk. Yadi atau PT Mitra Sejahtera"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#333333] font-semibold mb-1">Nomor Telepon / WhatsApp</label>
                  <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
                </div>

                <div>
                  <label className="block text-[#333333] font-semibold mb-1">Informasi Rekening Bank</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    placeholder="BCA 1234567890 a.n. Yadi"
                    className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Section Pengaitan Proyek & Alokasi Modal */}
              <div className="p-3.5 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-[#111111] block">
                      Proyek yang Didanai & Alokasi Modal
                    </span>
                    <span className="text-[11px] text-[#666666] block">
                      Ketik nama proyek, gunakan <kbd className="px-1 py-0.2 bg-[#eee] rounded text-[10px]">TAB</kbd> untuk melengkapi & <kbd className="px-1 py-0.2 bg-[#eee] rounded text-[10px]">ENTER</kbd> untuk menambahkan
                    </span>
                  </div>
                </div>

                <div className="relative" ref={addComboboxRef}>
                  <div className="relative">
                    <img
                      src="/icons/search.png"
                      alt="Search"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 object-contain opacity-50"
                    />
                    <input
                      type="text"
                      value={addProjectQuery}
                      onChange={e => {
                        setAddProjectQuery(e.target.value);
                        setIsAddComboboxOpen(true);
                        setAddHighlightedIndex(0);
                      }}
                      onFocus={() => setIsAddComboboxOpen(true)}
                      onKeyDown={e => {
                        if (availableProjectsForAdd.length === 0) return;
                        if (e.key === 'Tab') {
                          const top = availableProjectsForAdd[addHighlightedIndex] || availableProjectsForAdd[0];
                          if (top) {
                            setAddProjectQuery(top.name);
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setAddHighlightedIndex(prev => (prev + 1) % availableProjectsForAdd.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setAddHighlightedIndex(prev => (prev - 1 + availableProjectsForAdd.length) % availableProjectsForAdd.length);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = availableProjectsForAdd[addHighlightedIndex] || availableProjectsForAdd[0];
                          if (target) {
                            handleAddProjectLink(target);
                          }
                        }
                      }}
                      placeholder="Cari & kaitkan proyek (contoh: Situ Cikedal / Irigasi Cipeucang)..."
                      className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111]"
                    />
                  </div>

                  {isAddComboboxOpen && availableProjectsForAdd.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#eaeaea] rounded-[6px] shadow-lg max-h-48 overflow-y-auto z-20">
                      {availableProjectsForAdd.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProjectLink(p)}
                          className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between border-b border-[#f5f5f5] last:border-b-0 ${
                            idx === addHighlightedIndex ? 'bg-[#f0f0f0]' : 'hover:bg-[#fafafa]'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-[#111111] block">{p.name}</span>
                            <span className="text-[10px] text-[#888888]">{p.location || 'Lokasi proyek'}</span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium">+ Kaitkan</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {addLinkedProjects.length === 0 ? (
                  <div className="py-3 text-center text-[11px] text-[#999999] border border-dashed border-[#e5e5e5] rounded-[6px]">
                    Belum ada proyek yang dikaitkan ke investor ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addLinkedProjects.map(link => (
                      <div
                        key={link.projectId}
                        className="bg-white border border-[#eaeaea] rounded-[6px] p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-[#111111] block truncate">
                            {link.projectName}
                          </span>
                          <span className="text-[10px] font-mono text-[#888888] block">
                            {link.projectId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-32">
                            <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                              Alokasi Modal (Rp)
                            </label>
                            <CurrencyInput
                              value={link.capitalAllocation}
                              onChange={val => handleUpdateAddProjectAllocation(link.projectId, val)}
                              className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                            />
                          </div>

                          <div className="w-20">
                            <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                              Bagi Hasil (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={link.profitSharePercentage ?? 50}
                              onChange={e => handleUpdateAddProjectProfitShare(link.projectId, Number(e.target.value) || 0)}
                              className="w-full text-xs font-bold text-center px-2 py-1 border border-[#eaeaea] rounded outline-none focus:border-[#111111]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAddProjectLink(link.projectId)}
                            className="text-[#cf1124] hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer text-xs self-end sm:self-center"
                            title="Hapus Kaitan Proyek"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Modal Disetor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#333333] font-semibold">
                    Total Modal / Investasi Awal (Rp)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    ⚡ Otomatis terakumulasi dari proyek
                  </span>
                </div>
                <CurrencyInput
                  value={initialCapital}
                  onChange={setInitialCapital}
                  className="w-full text-sm font-bold tracking-tight text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#333333] font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Keterangan kontrak / perjanjian kemitraan..."
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#666666] bg-white border border-[#eaeaea] rounded-[6px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] cursor-pointer"
                >
                  Simpan Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Investor */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] w-full max-w-xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Edit Investor ({editTarget.id})</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Perbarui profil, relasi proyek yang didanai, dan alokasi modal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-[#888888] hover:text-[#111111] text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#333333] font-semibold mb-1">Nama Investor / Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editTarget.name}
                  onChange={e => setEditTarget({ ...editTarget, name: formatEntityNameLive(e.target.value) })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#333333] font-semibold mb-1">Nomor Telepon / WhatsApp</label>
                  <PhoneInput
                    value={editTarget.phoneNumber || ''}
                    onChange={val => setEditTarget({ ...editTarget, phoneNumber: val })}
                  />
                </div>

                <div>
                  <label className="block text-[#333333] font-semibold mb-1">Informasi Rekening Bank</label>
                  <input
                    type="text"
                    value={editTarget.bankAccount || ''}
                    onChange={e => setEditTarget({ ...editTarget, bankAccount: e.target.value })}
                    className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Section Pengaitan Proyek & Alokasi Modal (Edit) */}
              <div className="p-3.5 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-[#111111] block">
                      Proyek yang Didanai & Alokasi Modal
                    </span>
                    <span className="text-[11px] text-[#666666] block">
                      Ketik nama proyek, gunakan <kbd className="px-1 py-0.2 bg-[#eee] rounded text-[10px]">TAB</kbd> untuk melengkapi & <kbd className="px-1 py-0.2 bg-[#eee] rounded text-[10px]">ENTER</kbd> untuk menambahkan
                    </span>
                  </div>
                </div>

                <div className="relative" ref={editComboboxRef}>
                  <div className="relative">
                    <img
                      src="/icons/search.png"
                      alt="Search"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 object-contain opacity-50"
                    />
                    <input
                      type="text"
                      value={editProjectQuery}
                      onChange={e => {
                        setEditProjectQuery(e.target.value);
                        setIsEditComboboxOpen(true);
                        setEditHighlightedIndex(0);
                      }}
                      onFocus={() => setIsEditComboboxOpen(true)}
                      onKeyDown={e => {
                        if (availableProjectsForEdit.length === 0) return;
                        if (e.key === 'Tab') {
                          const top = availableProjectsForEdit[editHighlightedIndex] || availableProjectsForEdit[0];
                          if (top) {
                            setEditProjectQuery(top.name);
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setEditHighlightedIndex(prev => (prev + 1) % availableProjectsForEdit.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setEditHighlightedIndex(prev => (prev - 1 + availableProjectsForEdit.length) % availableProjectsForEdit.length);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = availableProjectsForEdit[editHighlightedIndex] || availableProjectsForEdit[0];
                          if (target) {
                            handleAddEditProjectLink(target);
                          }
                        }
                      }}
                      placeholder="Cari & kaitkan proyek (contoh: Situ Cikedal / Irigasi Cipeucang)..."
                      className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111]"
                    />
                  </div>

                  {isEditComboboxOpen && availableProjectsForEdit.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#eaeaea] rounded-[6px] shadow-lg max-h-48 overflow-y-auto z-20">
                      {availableProjectsForEdit.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddEditProjectLink(p)}
                          className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between border-b border-[#f5f5f5] last:border-b-0 ${
                            idx === editHighlightedIndex ? 'bg-[#f0f0f0]' : 'hover:bg-[#fafafa]'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-[#111111] block">{p.name}</span>
                            <span className="text-[10px] text-[#888888]">{p.location || 'Lokasi proyek'}</span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-medium">+ Kaitkan</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editLinkedProjects.length === 0 ? (
                  <div className="py-3 text-center text-[11px] text-[#999999] border border-dashed border-[#e5e5e5] rounded-[6px]">
                    Belum ada proyek yang dikaitkan ke investor ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editLinkedProjects.map(link => (
                      <div
                        key={link.projectId}
                        className="bg-white border border-[#eaeaea] rounded-[6px] p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-[#111111] block truncate">
                            {link.projectName}
                          </span>
                          <span className="text-[10px] font-mono text-[#888888] block">
                            {link.projectId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-32">
                            <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                              Alokasi Modal (Rp)
                            </label>
                            <CurrencyInput
                              value={link.capitalAllocation}
                              onChange={val => handleUpdateEditProjectAllocation(link.projectId, val)}
                              className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                            />
                          </div>

                          <div className="w-20">
                            <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                              Bagi Hasil (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={link.profitSharePercentage ?? 50}
                              onChange={e => handleUpdateEditProjectProfitShare(link.projectId, Number(e.target.value) || 0)}
                              className="w-full text-xs font-bold text-center px-2 py-1 border border-[#eaeaea] rounded outline-none focus:border-[#111111]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditProjectLink(link.projectId)}
                            className="text-[#cf1124] hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer text-xs self-end sm:self-center"
                            title="Hapus Kaitan Proyek"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Modal / Investasi Awal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#333333] font-semibold">
                    Total Modal / Investasi Awal (Rp)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    ⚡ Otomatis terakumulasi dari proyek
                  </span>
                </div>
                <CurrencyInput
                  value={editTarget.initialCapital || 0}
                  onChange={val => setEditTarget({ ...editTarget, initialCapital: val })}
                  className="w-full text-sm font-bold tracking-tight text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#333333] font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editTarget.notes || ''}
                  onChange={e => setEditTarget({ ...editTarget, notes: e.target.value })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3 py-1.5 text-xs text-[#666666] bg-white border border-[#eaeaea] rounded-[6px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buku Kas & Rekap Ekuitas Investor */}
      {selectedLedgerInvestor && (
        <InvestorLedgerModal
          investor={selectedLedgerInvestor}
          projects={projects}
          transactions={transactions}
          payouts={payouts}
          onClose={() => setSelectedLedgerInvestor(null)}
          onRecordPayout={handleRecordPayout}
          isInvestorUser={isInvestorUser}
        />
      )}

      {/* Modal Transfer Antar-Investor */}
      {isTransferModalOpen && (
        <InvestorTransferModal
          investors={investors}
          projects={projects}
          onClose={() => setIsTransferModalOpen(false)}
          onSubmitTransfer={handleInitiateTransfer}
        />
      )}

      {/* Pin Authorization Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Data Investor"
        description="Masukkan PIN otorisasi default (2008005) untuk memverifikasi tindakan pada data investor."
        targetLabel={pinTargetLabel}
        confirmText="Otorisasi Tindakan"
        onSuccess={handlePinSuccess}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
