import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Investor,
  Project,
  InvestorProjectLink,
  ProfitShareScheme,
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
  recordInvestorTalanganInstallment,
  subscribeInvestorPayouts,
  recordInvestorPayout
} from '@/lib/investorService';
import { subscribeProjects } from '@/lib/projectService';
import { subscribeAllTransactions } from '@/lib/dispatcherService';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { formatDateID } from '@/lib/dateSearchUtils';
import { calculateInvestorFinancials } from '@/lib/investorFinanceUtils';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatEntityNameLive } from '@/lib/nameUtils';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';
import { InvestorLedgerModal } from './InvestorLedgerModal';
import { InvestorTransferModal } from './InvestorTransferModal';
import { PayTalanganModal } from './PayTalanganModal';
import { ReceiptLightboxModal } from '@/components/ui/ReceiptLightboxModal';
import { ImageIcon, X } from 'lucide-react';

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

interface InvestorsPageProps {
  userEmail?: string;
}

export function InvestorsPage({ userEmail = 'fatih@patak.dev' }: InvestorsPageProps): React.JSX.Element {
  const { isInvestorUser, lockedInvestorId, selectedProjectId, projects: allProjects, isWatcherUser } = useProjectFilter();
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
  const [profitShareScheme, setProfitShareScheme] = useState<ProfitShareScheme>('PERCENTAGE');
  const [profitSharePercentage, setProfitSharePercentage] = useState<number>(50);
  const [fixedMonthlyAmount, setFixedMonthlyAmount] = useState<number>(0);
  const [fixedPayoutDay, setFixedPayoutDay] = useState<number>(25);
  const [investmentStartDate, setInvestmentStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
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

  // Pay Talangan & Lightbox Modal State
  const [payTalanganTarget, setPayTalanganTarget] = useState<InvestorTransferLog | null>(null);
  const [activeReceiptLightbox, setActiveReceiptLightbox] = useState<string | null>(null);

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

    if (isInvestorUser && lockedInvestorId) {
      result = result.filter(i => i.id === lockedInvestorId);
    } else if (isInvestorUser && selectedProjectId && selectedProjectId !== 'ALL') {
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
  }, [investors, isInvestorUser, lockedInvestorId, selectedProjectId, allProjects, searchQuery]);

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

  // Hitung estimasi hak bagi hasil akumulasi per investor (Mendukung Persentase & Fixed Bulanan)
  const investorFinancialsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateInvestorFinancials>>();
    investors.forEach(inv => {
      const fin = calculateInvestorFinancials({
        investor: inv,
        projects,
        transactions,
        payouts
      });
      map.set(inv.id, fin);
    });
    return map;
  }, [investors, projects, transactions, payouts]);

  const investorProfitShareMap = useMemo(() => {
    const map = new Map<string, number>();
    investorFinancialsMap.forEach((fin, invId) => {
      map.set(invId, fin.remainingProfitShare);
    });
    return map;
  }, [investorFinancialsMap]);


  // Hitung akumulasi transfer & talangan aktif per investor
  const investorTransferBalanceMap = useMemo(() => {
    const map = new Map<string, { totalIn: number; totalOut: number; net: number }>();

    transfers.forEach(tr => {
      // Hitung mutasi aktif (talangan belum lunas atau realokasi modal)
      const isEffective = tr.status === 'BELUM_LUNAS' || tr.category === 'MIGRASI_MODAL';
      if (!isEffective) return;

      if (tr.fromInvestorId) {
        const cur = map.get(tr.fromInvestorId) || { totalIn: 0, totalOut: 0, net: 0 };
        cur.totalOut += (tr.amount || 0);
        cur.net -= (tr.amount || 0);
        map.set(tr.fromInvestorId, cur);
      }

      if (tr.toInvestorId) {
        const cur = map.get(tr.toInvestorId) || { totalIn: 0, totalOut: 0, net: 0 };
        cur.totalIn += (tr.amount || 0);
        cur.net += (tr.amount || 0);
        map.set(tr.toInvestorId, cur);
      }
    });

    return map;
  }, [transfers]);

  // Total talangan aktif yang belum lunas (memperhitungkan sisa setelah dicicil)
  const totalUnsettledTalangan = useMemo(() => {
    return transfers
      .filter(t => t.status === 'BELUM_LUNAS')
      .reduce((acc, t) => {
        const remaining = t.remainingAmount ?? (t.paidAmount ? Math.max(0, t.amount - t.paidAmount) : t.amount);
        return acc + (remaining || 0);
      }, 0);
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
    setProfitShareScheme('PERCENTAGE');
    setProfitSharePercentage(50);
    setFixedMonthlyAmount(0);
    setFixedPayoutDay(25);
    setInvestmentStartDate(new Date().toISOString().slice(0, 10));
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
        profitShareScheme: p.profitShareScheme || profitShareScheme || 'PERCENTAGE',
        profitSharePercentage: p.profitSharePercentage ?? profitSharePercentage ?? 50,
        fixedMonthlyAmount: p.fixedMonthlyAmount ?? fixedMonthlyAmount ?? 0,
        fixedPayoutDay: p.fixedPayoutDay ?? fixedPayoutDay ?? 25,
        investmentStartDate: p.investmentStartDate || investmentStartDate || new Date().toISOString().slice(0, 10)
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

  const handleUpdateAddProjectScheme = (projectId: string, scheme: ProfitShareScheme) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitShareScheme: scheme } : p
    );
    setAddLinkedProjects(updated);
  };

  const handleUpdateAddProjectProfitShare = (projectId: string, pct: number) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitSharePercentage: pct } : p
    );
    setAddLinkedProjects(updated);
  };

  const handleUpdateAddProjectFixedAmount = (projectId: string, amt: number) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, fixedMonthlyAmount: amt } : p
    );
    setAddLinkedProjects(updated);
  };

  const handleUpdateAddProjectFixedDay = (projectId: string, day: number) => {
    const updated = addLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, fixedPayoutDay: day } : p
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
        profitShareScheme,
        profitSharePercentage: Number(profitSharePercentage) || 0,
        fixedMonthlyAmount: Number(fixedMonthlyAmount) || 0,
        fixedPayoutDay: Number(fixedPayoutDay) || 25,
        investmentStartDate,
        linkedProjects: addLinkedProjects,
        notes: notes.trim()
      });
      setIsAddOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Edit Investor
  const handleOpenEdit = (inv: Investor) => {
    setEditTarget({
      ...inv,
      profitShareScheme: inv.profitShareScheme || 'PERCENTAGE',
      profitSharePercentage: inv.profitSharePercentage ?? 50,
      fixedMonthlyAmount: inv.fixedMonthlyAmount ?? 0,
      fixedPayoutDay: inv.fixedPayoutDay ?? 25,
      investmentStartDate: inv.investmentStartDate || inv.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    });
    const links: InvestorProjectLink[] = (inv.linkedProjects && inv.linkedProjects.length > 0)
      ? inv.linkedProjects
      : projects
          .filter(p => p.investorId === inv.id)
          .map(p => ({
            projectId: p.id,
            projectName: p.name,
            capitalAllocation: p.initialDeposit || 0,
            profitShareScheme: p.profitShareScheme || inv.profitShareScheme || 'PERCENTAGE',
            profitSharePercentage: p.profitSharePercentage ?? inv.profitSharePercentage ?? 50,
            fixedMonthlyAmount: p.fixedMonthlyAmount ?? inv.fixedMonthlyAmount ?? 0,
            fixedPayoutDay: p.fixedPayoutDay ?? inv.fixedPayoutDay ?? 25,
            investmentStartDate: p.investmentStartDate || inv.investmentStartDate || inv.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)
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
        profitShareScheme: p.profitShareScheme || editTarget?.profitShareScheme || 'PERCENTAGE',
        profitSharePercentage: p.profitSharePercentage ?? editTarget?.profitSharePercentage ?? 50,
        fixedMonthlyAmount: p.fixedMonthlyAmount ?? editTarget?.fixedMonthlyAmount ?? 0,
        fixedPayoutDay: p.fixedPayoutDay ?? editTarget?.fixedPayoutDay ?? 25,
        investmentStartDate: p.investmentStartDate || editTarget?.investmentStartDate || new Date().toISOString().slice(0, 10)
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

  const handleUpdateEditProjectScheme = (projectId: string, scheme: ProfitShareScheme) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitShareScheme: scheme } : p
    );
    setEditLinkedProjects(updated);
  };

  const handleUpdateEditProjectProfitShare = (projectId: string, pct: number) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, profitSharePercentage: pct } : p
    );
    setEditLinkedProjects(updated);
  };

  const handleUpdateEditProjectFixedAmount = (projectId: string, amt: number) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, fixedMonthlyAmount: amt } : p
    );
    setEditLinkedProjects(updated);
  };

  const handleUpdateEditProjectFixedDay = (projectId: string, day: number) => {
    const updated = editLinkedProjects.map(p =>
      p.projectId === projectId ? { ...p, fixedPayoutDay: day } : p
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
          profitShareScheme: editTarget.profitShareScheme || 'PERCENTAGE',
          profitSharePercentage: Number(editTarget.profitSharePercentage) || 0,
          fixedMonthlyAmount: Number(editTarget.fixedMonthlyAmount) || 0,
          fixedPayoutDay: Number(editTarget.fixedPayoutDay) || 25,
          investmentStartDate: editTarget.investmentStartDate || '',
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
    receiptUrl?: string;
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

  // Otorisasi Aksi Pelunasan Talangan Penuh (Legacy)
  
  // Otorisasi Aksi Bayar Cicilan Talangan Bertahap
  const handleConfirmPayTalangan = (payload: {
    transferId: string;
    amount: number;
    date: string;
    note: string;
    receiptUrl: string;
  }) => {
    setPinTargetLabel(`Bayar Cicilan Talangan ${formatRupiah(payload.amount)} (Ref: ${payload.transferId})`);
    setPendingAction(() => async () => {
      await recordInvestorTalanganInstallment({
        ...payload,
        userEmail
      });
      setPayTalanganTarget(null);
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
      {!isInvestorUser && !isWatcherUser && (
        <MobileTitlebarAction>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <img
                src="/icons/transfer.png"
                alt=""
                className="w-3 h-3 object-contain brightness-0 invert pointer-events-none"
              />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <img
                src="/icons/plus.png"
                alt=""
                className="w-3 h-3 object-contain brightness-0 invert pointer-events-none"
              />
              <span>Investor</span>
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
          {/* Search Input di Kiri (Rule 98) */}
          <div className="relative w-full sm:w-72">
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

          {!isInvestorUser && !isWatcherUser && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs"
              >
                <img
                  src="/icons/transfer.png"
                  alt=""
                  className="w-3.5 h-3.5 object-contain brightness-0 invert pointer-events-none"
                />
                <span>Transfer Antar-Investor</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs"
              >
                <img
                  src="/icons/plus.png"
                  alt=""
                  className="w-3.5 h-3.5 object-contain brightness-0 invert pointer-events-none"
                />
                <span>Tambah Investor</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabel Master Investor */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[760px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[220px] min-w-[220px] whitespace-nowrap">Nama Investor</th>
                <th className="py-2.5 px-3 w-[240px] min-w-[240px] whitespace-nowrap">Proyek Terkait & Profit Share</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] text-right whitespace-nowrap" title="Modal disetor disesuaikan transfer dan talangan aktif">Modal Bersih Berjalan</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Hak Bagi Hasil</th>
                <th className="py-2.5 px-3 w-[100px] min-w-[100px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Memuat data master investor...
                  </td>
                </tr>
              ) : filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
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
                      <td className="py-2.5 px-3 whitespace-nowrap w-[220px] align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedLedgerInvestor(inv)}
                          className="font-bold text-[#111111] hover:text-[#008060] hover:underline text-left block truncate cursor-pointer"
                          title="Buka Buku Kas & Detail Investor"
                        >
                          {inv.name}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-[#111111] whitespace-nowrap w-[240px] align-middle">
                        {linkedProjects.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {linkedProjects.map(p => {
                              const isFixed = p.profitShareScheme === 'FIXED_MONTHLY' || (!p.profitShareScheme && inv.profitShareScheme === 'FIXED_MONTHLY');
                              const fixedAmt = p.fixedMonthlyAmount ?? inv.fixedMonthlyAmount ?? 0;
                              const dueDay = p.fixedPayoutDay ?? inv.fixedPayoutDay ?? 25;
                              const pct = p.profitSharePercentage ?? inv.profitSharePercentage ?? 50;
                              return (
                                <div key={p.id} className="text-xs truncate flex items-center gap-1.5">
                                  <span className="font-semibold text-[#111111]">{p.name}</span>
                                  {isFixed ? (
                                    <span className="text-[10px] font-bold text-white bg-[#0284c7] px-2 py-0.5 rounded-full inline-block border-none whitespace-nowrap flex-shrink-0">
                                      Fixed: {formatRupiah(fixedAmt)}/bln (Tgl {dueDay})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-white bg-[#15803d] px-2 py-0.5 rounded-full inline-block border-none whitespace-nowrap flex-shrink-0">
                                      {pct}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          inv.profitShareScheme === 'FIXED_MONTHLY' ? (
                            <span className="text-[10px] font-bold text-white bg-[#0284c7] px-2 py-0.5 rounded-full inline-block border-none whitespace-nowrap flex-shrink-0">
                              Fixed: {formatRupiah(inv.fixedMonthlyAmount || 0)}/bln (Tgl {inv.fixedPayoutDay || 25})
                            </span>
                          ) : inv.profitSharePercentage ? (
                            <span className="text-[10px] font-bold text-white bg-[#15803d] px-2 py-0.5 rounded-full inline-block border-none whitespace-nowrap flex-shrink-0">
                              {inv.profitSharePercentage}%
                            </span>
                          ) : (
                            <span className="text-[#888888]">-</span>
                          )
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[150px] align-middle">
                        {(() => {
                          const base = inv.initialCapital || 0;
                          const tInfo = investorTransferBalanceMap.get(inv.id) || { totalIn: 0, totalOut: 0, net: 0 };
                          const effective = base + tInfo.net;
                          return (
                            <div className="flex flex-col items-end">
                              <span className="font-bold tracking-tight text-[#111111]">
                                {formatRupiah(effective)}
                              </span>
                              {tInfo.net !== 0 ? (
                                <span
                                  className={`text-[10px] font-semibold mt-0.5 ${
                                    tInfo.net > 0 ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                  title={`Modal Awal: ${formatRupiah(base)} | Mutasi Transfer: ${tInfo.net > 0 ? '+' : ''}${formatRupiah(tInfo.net)}`}
                                >
                                  {tInfo.net > 0
                                    ? `(+ ${formatRupiah(tInfo.net)})`
                                    : `(- ${formatRupiah(Math.abs(tInfo.net))})`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#888888] mt-0.5">Modal Murni</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap w-[140px] align-middle text-[#008060]">
                        {formatRupiah(profitShareRemaining)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[100px] align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerInvestor(inv)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-[6px] transition-colors cursor-pointer select-none hover:bg-[#f0f0f0] active:bg-[#e5e5e5]"
                            title="Buku Kas & Rekap Ekuitas"
                          >
                            <img
                              src="/icons/ledger.png"
                              alt="Buku Kas"
                              className="w-4 h-4 object-contain pointer-events-none"
                            />
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
                <th className="py-2.5 px-3">Tanggal</th>
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
                      <span className="font-mono font-medium text-[#111111]">{formatDateID(tr.date)}</span>
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
                      <div>{formatRupiah(tr.amount)}</div>
                      {tr.paidAmount !== undefined && tr.paidAmount > 0 && tr.status === 'BELUM_LUNAS' && (
                        <div className="text-[10px] font-medium text-[#cf1124]">
                          Sisa: {formatRupiah(tr.remainingAmount ?? (tr.amount - tr.paidAmount))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {tr.status === 'BELUM_LUNAS' ? (
                        <span className="text-[10px] font-bold bg-[#f0f0f0] text-[#555555] px-2 py-0.5 rounded-[4px] border-none">
                          Belum Lunas
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#e6f4ea] text-[#137333] px-2 py-0.5 rounded-[4px] border-none">
                          Lunas
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#666666] max-w-[200px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{tr.note || '-'}</span>
                        {tr.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveReceiptLightbox(tr.receiptUrl || null)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] text-[10px] font-semibold rounded-[4px] border-none cursor-pointer transition-colors whitespace-nowrap"
                            title="Lihat Bukti Kwitansi"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Bukti</span>
                          </button>
                        ) : tr.installments?.some(i => i.receiptUrl) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const found = tr.installments?.find(i => i.receiptUrl)?.receiptUrl;
                              if (found) setActiveReceiptLightbox(found);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] text-[10px] font-semibold rounded-[4px] border-none cursor-pointer transition-colors whitespace-nowrap"
                            title="Lihat Bukti Cicilan"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Bukti</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                    {!isInvestorUser && (
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {tr.status === 'BELUM_LUNAS' ? (
                          <button
                            type="button"
                            onClick={() => setPayTalanganTarget(tr)}
                            className="px-3 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-[11px] font-semibold rounded-[6px] border-none cursor-pointer transition-colors shadow-sm"
                          >
                            Bayar
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsAddOpen(false)} 
          />
          
          <div className="relative w-full md:max-w-xl bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Tambah Investor Baru</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Daftarkan profil mitra pemodal tetap dan kaitkan alokasi proyek
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateAdd} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
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

              {/* Section Skema Bagi Hasil Investor */}
              <div className="p-3.5 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-3">
                <div>
                  <span className="font-semibold text-xs text-[#111111] block">
                    Skema Bagi Hasil Investor
                  </span>
                  <span className="text-[11px] text-[#666666] block">
                    Pilih skema default bagi hasil: Persentase dari laba ritase atau Nominal tetap bulanan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eeeeee] rounded-[8px]">
                  <button
                    type="button"
                    onClick={() => setProfitShareScheme('PERCENTAGE')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer border-none ${
                      profitShareScheme === 'PERCENTAGE'
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-transparent text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    Persentase Laba (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfitShareScheme('FIXED_MONTHLY')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer border-none ${
                      profitShareScheme === 'FIXED_MONTHLY'
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-transparent text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    Nominal Tetap Bulanan (Rp)
                  </button>
                </div>

                {profitShareScheme === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-[#333333] font-semibold mb-1">
                      Porsi Bagi Hasil Investor (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={profitSharePercentage}
                        onChange={e => setProfitSharePercentage(Number(e.target.value) || 0)}
                        className="w-24 bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs font-bold text-[#111111] outline-none focus:border-[#111111]"
                      />
                      <span className="text-xs text-[#666666]">
                        % dari laba bersih ritase proyek yang didanai
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#333333] font-semibold mb-1">
                          Nominal Tetap per Bulan (Rp) <span className="text-red-500">*</span>
                        </label>
                        <CurrencyInput
                          value={fixedMonthlyAmount}
                          onChange={setFixedMonthlyAmount}
                          placeholder="0"
                          variant="solid-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[#333333] font-semibold mb-1">
                          Tanggal Jatuh Tempo Bulanan <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#666666]">Tiap tgl</span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={fixedPayoutDay}
                            onChange={e => setFixedPayoutDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                            className="w-16 bg-white border border-[#eaeaea] rounded-[6px] px-2 py-2 text-xs font-bold text-center text-[#111111] outline-none focus:border-[#111111]"
                          />
                          <span className="text-xs text-[#666666]">per bulan</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#333333] font-semibold mb-1">
                        Tanggal Mulai Investasi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={investmentStartDate}
                        onChange={e => setInvestmentStartDate(e.target.value)}
                        className="w-full sm:w-48 bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                      />
                      <span className="text-[11px] text-[#888888] block mt-1">
                        Periode bagi hasil bulanan dihitung dari tanggal mulai ini.
                      </span>
                    </div>
                  </div>
                )}
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
                    {addLinkedProjects.map(link => {
                      const isFixed = link.profitShareScheme === 'FIXED_MONTHLY';
                      return (
                        <div
                          key={link.projectId}
                          className="bg-white border border-[#eaeaea] rounded-[6px] p-2.5 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-[#111111] block truncate">
                                {link.projectName}
                              </span>
                              <span className="text-[10px] font-mono text-[#888888] block">
                                {link.projectId}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveAddProjectLink(link.projectId)}
                              className="text-[#cf1124] hover:bg-red-50 p-1 rounded transition-colors cursor-pointer text-xs"
                              title="Hapus Kaitan Proyek"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#f0f0f0] items-end">
                            <div>
                              <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                Alokasi Modal (Rp)
                              </label>
                              <CurrencyInput
                                value={link.capitalAllocation}
                                onChange={val => handleUpdateAddProjectAllocation(link.projectId, val)}
                                className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                Skema Proyek
                              </label>
                              <div className="flex items-center gap-1 bg-[#eeeeee] p-0.5 rounded-[4px]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAddProjectScheme(link.projectId, 'PERCENTAGE')}
                                  className={`flex-1 py-0.5 text-[10px] font-bold rounded-[3px] border-none cursor-pointer ${
                                    !isFixed ? 'bg-[#111111] text-white' : 'text-[#666666]'
                                  }`}
                                >
                                  % Laba
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAddProjectScheme(link.projectId, 'FIXED_MONTHLY')}
                                  className={`flex-1 py-0.5 text-[10px] font-bold rounded-[3px] border-none cursor-pointer ${
                                    isFixed ? 'bg-[#0284c7] text-white' : 'text-[#666666]'
                                  }`}
                                >
                                  Rp Fixed
                                </button>
                              </div>
                            </div>

                            <div>
                              {isFixed ? (
                                <div className="flex items-center gap-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                      Nominal/Bln
                                    </label>
                                    <CurrencyInput
                                      value={link.fixedMonthlyAmount ?? 0}
                                      onChange={val => handleUpdateAddProjectFixedAmount(link.projectId, val)}
                                      className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                                    />
                                  </div>
                                  <div className="w-14">
                                    <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                      Tgl
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="31"
                                      value={link.fixedPayoutDay ?? 25}
                                      onChange={e => handleUpdateAddProjectFixedDay(link.projectId, Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                                      className="w-full text-xs font-bold text-center px-1 py-1 border border-[#eaeaea] rounded outline-none"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                    Bagi Hasil (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={link.profitSharePercentage ?? 50}
                                    onChange={e => handleUpdateAddProjectProfitShare(link.projectId, Number(e.target.value) || 0)}
                                    className="w-full text-xs font-bold text-center px-2 py-1 border border-[#eaeaea] rounded outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    Otomatis terakumulasi dari proyek
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
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#666666] bg-white border border-[#eaeaea] rounded-[8px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[8px] cursor-pointer border-none shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setEditTarget(null)} 
          />
          
          <div className="relative w-full md:max-w-xl bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Edit Investor: {editTarget.name}</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Perbarui profil, relasi proyek yang didanai, dan alokasi modal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
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

              {/* Section Skema Bagi Hasil Investor (Edit) */}
              <div className="p-3.5 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-3">
                <div>
                  <span className="font-semibold text-xs text-[#111111] block">
                    Skema Bagi Hasil Investor
                  </span>
                  <span className="text-[11px] text-[#666666] block">
                    Pilih skema default bagi hasil: Persentase dari laba ritase atau Nominal tetap bulanan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eeeeee] rounded-[8px]">
                  <button
                    type="button"
                    onClick={() => setEditTarget({ ...editTarget, profitShareScheme: 'PERCENTAGE' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer border-none ${
                      editTarget.profitShareScheme !== 'FIXED_MONTHLY'
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-transparent text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    Persentase Laba (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTarget({ ...editTarget, profitShareScheme: 'FIXED_MONTHLY' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer border-none ${
                      editTarget.profitShareScheme === 'FIXED_MONTHLY'
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-transparent text-[#666666] hover:text-[#111111]'
                    }`}
                  >
                    Nominal Tetap Bulanan (Rp)
                  </button>
                </div>

                {editTarget.profitShareScheme !== 'FIXED_MONTHLY' ? (
                  <div>
                    <label className="block text-[#333333] font-semibold mb-1">
                      Porsi Bagi Hasil Investor (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editTarget.profitSharePercentage ?? 50}
                        onChange={e => setEditTarget({ ...editTarget, profitSharePercentage: Number(e.target.value) || 0 })}
                        className="w-24 bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs font-bold text-[#111111] outline-none focus:border-[#111111]"
                      />
                      <span className="text-xs text-[#666666]">
                        % dari laba bersih ritase proyek yang didanai
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#333333] font-semibold mb-1">
                          Nominal Tetap per Bulan (Rp) <span className="text-red-500">*</span>
                        </label>
                        <CurrencyInput
                          value={editTarget.fixedMonthlyAmount || 0}
                          onChange={val => setEditTarget({ ...editTarget, fixedMonthlyAmount: val })}
                          placeholder="0"
                          variant="solid-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[#333333] font-semibold mb-1">
                          Tanggal Jatuh Tempo Bulanan <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#666666]">Tiap tgl</span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={editTarget.fixedPayoutDay || 25}
                            onChange={e => setEditTarget({ ...editTarget, fixedPayoutDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                            className="w-16 bg-white border border-[#eaeaea] rounded-[6px] px-2 py-2 text-xs font-bold text-center text-[#111111] outline-none focus:border-[#111111]"
                          />
                          <span className="text-xs text-[#666666]">per bulan</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#333333] font-semibold mb-1">
                        Tanggal Mulai Investasi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={editTarget.investmentStartDate || ''}
                        onChange={e => setEditTarget({ ...editTarget, investmentStartDate: e.target.value })}
                        className="w-full sm:w-48 bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                      />
                      <span className="text-[11px] text-[#888888] block mt-1">
                        Periode bagi hasil bulanan dihitung dari tanggal mulai ini.
                      </span>
                    </div>
                  </div>
                )}
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
                    {editLinkedProjects.map(link => {
                      const isFixed = link.profitShareScheme === 'FIXED_MONTHLY';
                      return (
                        <div
                          key={link.projectId}
                          className="bg-white border border-[#eaeaea] rounded-[6px] p-2.5 flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-[#111111] block truncate">
                                {link.projectName}
                              </span>
                              <span className="text-[10px] font-mono text-[#888888] block">
                                {link.projectId}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveEditProjectLink(link.projectId)}
                              className="text-[#cf1124] hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer text-xs"
                              title="Hapus Kaitan Proyek"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#f0f0f0] items-end">
                            <div>
                              <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                Alokasi Modal (Rp)
                              </label>
                              <CurrencyInput
                                value={link.capitalAllocation}
                                onChange={val => handleUpdateEditProjectAllocation(link.projectId, val)}
                                className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                Skema Proyek
                              </label>
                              <div className="flex items-center gap-1 bg-[#eeeeee] p-0.5 rounded-[4px]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEditProjectScheme(link.projectId, 'PERCENTAGE')}
                                  className={`flex-1 py-0.5 text-[10px] font-bold rounded-[3px] border-none cursor-pointer ${
                                    !isFixed ? 'bg-[#111111] text-white' : 'text-[#666666]'
                                  }`}
                                >
                                  % Laba
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEditProjectScheme(link.projectId, 'FIXED_MONTHLY')}
                                  className={`flex-1 py-0.5 text-[10px] font-bold rounded-[3px] border-none cursor-pointer ${
                                    isFixed ? 'bg-[#0284c7] text-white' : 'text-[#666666]'
                                  }`}
                                >
                                  Rp Fixed
                                </button>
                              </div>
                            </div>

                            <div>
                              {isFixed ? (
                                <div className="flex items-center gap-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                      Nominal/Bln
                                    </label>
                                    <CurrencyInput
                                      value={link.fixedMonthlyAmount ?? 0}
                                      onChange={val => handleUpdateEditProjectFixedAmount(link.projectId, val)}
                                      className="w-full text-xs font-bold tracking-tight text-[#111111] px-2 py-1 border border-[#eaeaea] rounded"
                                    />
                                  </div>
                                  <div className="w-14">
                                    <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                      Tgl
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="31"
                                      value={link.fixedPayoutDay ?? 25}
                                      onChange={e => handleUpdateEditProjectFixedDay(link.projectId, Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                                      className="w-full text-xs font-bold text-center px-1 py-1 border border-[#eaeaea] rounded outline-none"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[10px] text-[#666666] font-medium mb-0.5">
                                    Bagi Hasil (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={link.profitSharePercentage ?? 50}
                                    onChange={e => handleUpdateEditProjectProfitShare(link.projectId, Number(e.target.value) || 0)}
                                    className="w-full text-xs font-bold text-center px-2 py-1 border border-[#eaeaea] rounded outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    Otomatis terakumulasi dari proyek
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
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#666666] bg-white border border-[#eaeaea] rounded-[8px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[8px] cursor-pointer border-none shadow-sm"
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

      {/* Modal Bayar Cicilan Talangan Bertahap */}
      <PayTalanganModal
        isOpen={Boolean(payTalanganTarget)}
        onClose={() => setPayTalanganTarget(null)}
        transfer={payTalanganTarget}
        onConfirm={handleConfirmPayTalangan}
      />

      {/* Modal Lightbox Foto Bukti Kwitansi */}
      <ReceiptLightboxModal
        isOpen={Boolean(activeReceiptLightbox)}
        onClose={() => setActiveReceiptLightbox(null)}
        imageUrl={activeReceiptLightbox}
      />

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
