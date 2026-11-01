import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DispatchTransaction,
  MaterialItem,
  Client,
  MasterQuarry,
  MasterVehicle,
  MasterDriver,
  SystemUser
} from '@/types/database';
import {
  subscribeAllTransactions,
  updateDispatchTransaction,
  deleteDispatchTransaction,
  settleTransaction,
  UpdateDispatchPayload,
  getMaterials
} from '@/lib/dispatcherService';
import { subscribeClients } from '@/lib/clientService';
import {
  subscribeMasterVehicles,
  subscribeMasterDrivers,
  subscribeMasterQuarries
} from '@/lib/databaseMasterService';
import { subscribeSystemUsers } from '@/lib/userManagementService';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { DynamicEntityText } from '@/components/ui/DynamicEntityText';
import {
  resolveTransactionEntities,
  resolveCreatorName
} from '@/lib/entityResolver';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { TicketApprovalRequest } from '@/types/database';
import { submitApprovalRequest, subscribePendingApprovals } from '@/lib/approvalService';
import { RequestDeleteModal } from '@/components/dispatcher/RequestDeleteModal';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { EditDispatchModal } from '@/components/dispatcher/EditDispatchModal';
import {
  DispatchFilterPopover,
  DispatchFilterState
} from '@/components/dispatcher/DispatchFilterPopover';
import { formatRupiah, formatRupiahCompact } from '@/lib/currencyUtils';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';
import { formatVolumeDisplay } from '@/lib/volumeUtils';
import { X } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';

interface DispatchHistoryPageProps {
  userEmail: string;
  initialTicketId?: string;
  onDetailModalChange?: (tx: DispatchTransaction | null) => void;
}

export function DispatchHistoryPage({
  userEmail,
  initialTicketId,
  onDetailModalChange
}: DispatchHistoryPageProps): React.JSX.Element {
  const { projects, selectedProjectId, isDispatcherUser, isInvestorUser, isWatcherUser } = useProjectFilter();
  const hideMargin = isDispatcherUser || isInvestorUser;

  // Data Collections
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [masterVehicles, setMasterVehicles] = useState<MasterVehicle[]>([]);
  const [drivers, setDrivers] = useState<MasterDriver[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement | null>(null);

  const [filters, setFilters] = useState<DispatchFilterState>({
    datePreset: 'ALL',
    startDate: '',
    endDate: '',
    projectId: 'ALL',
    quarryId: 'ALL',
    materialId: 'ALL',
    status: 'ALL'
  });

  // Pagination State (Rule 126: 20 baris per halaman)
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-reset halaman ke 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, selectedProjectId]);

  // Modals Detail, Edit, Settle & PIN
  const [selectedDetailTx, setSelectedDetailTx] = useState<DispatchTransaction | null>(null);
  const [selectedEditTx, setSelectedEditTx] = useState<DispatchTransaction | null>(null);
  const [settleTarget, setSettleTarget] = useState<DispatchTransaction | null>(null);
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetLabel: string;
    onExecute: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    targetLabel: '',
    onExecute: async () => {}
  });


  // State Permohonan Approval Tiket
  const [pendingApprovals, setPendingApprovals] = useState<TicketApprovalRequest[]>([]);
  const [requestDeleteTx, setRequestDeleteTx] = useState<DispatchTransaction | null>(null);

  useEffect(() => {
    const unsub = subscribePendingApprovals(setPendingApprovals);
    return () => unsub();
  }, []);

  const pendingApprovalsMap = useMemo(
    () => new Map(pendingApprovals.map(r => [r.ticketId, r])),
    [pendingApprovals]
  );

  // Subscribe seluruh master & transaksi
  useEffect(() => {
    setIsLoading(true);
    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list);
      setIsLoading(false);
    });

    const unsubClients = subscribeClients(setClients);
    const unsubQuarries = subscribeMasterQuarries(setQuarries);
    const unsubVehicles = subscribeMasterVehicles(setMasterVehicles);
    const unsubDrivers = subscribeMasterDrivers(setDrivers);
    const unsubUsers = subscribeSystemUsers(setSystemUsers);
    getMaterials().then(setMaterials).catch(console.error);

    return () => {
      unsubTx();
      unsubClients();
      unsubQuarries();
      unsubVehicles();
      unsubDrivers();
      unsubUsers();
    };
  }, []);

  const handleOpenDetailTx = (tx: DispatchTransaction | null) => {
    setSelectedDetailTx(tx);
    onDetailModalChange?.(tx);
  };

  useEffect(() => {
    if (initialTicketId && transactions.length > 0) {
      const found = transactions.find(t => t.id === initialTicketId);
      if (found) {
        setSelectedDetailTx(found);
      }
    } else if (!initialTicketId && selectedDetailTx) {
      setSelectedDetailTx(null);
    }
  }, [initialTicketId, transactions]);

  // Entity Maps untuk SSoT Dynamic Resolution
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const materialsMap = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);
  const quarriesMap = useMemo(() => new Map(quarries.map(q => [q.id, q])), [quarries]);
  const vehiclesMap = useMemo(() => {
    const m = new Map<string, MasterVehicle>();
    masterVehicles.forEach(v => {
      m.set(v.plateNumber.replace(/\s+/g, '').toUpperCase(), v);
      if (v.id) m.set(v.id.replace(/\s+/g, '').toUpperCase(), v);
    });
    return m;
  }, [masterVehicles]);
  const driversMap = useMemo(() => {
    const m = new Map<string, MasterDriver>();
    drivers.forEach(d => {
      m.set(d.name.trim().toLowerCase(), d);
      if (d.id) m.set(d.id, d);
    });
    return m;
  }, [drivers]);
  const systemUsersMap = useMemo(() => {
    const map = new Map<string, SystemUser>();
    systemUsers.forEach(u => {
      map.set(u.email.toLowerCase(), u);
      if (u.id) map.set(u.id, u);
      if (u.uid) map.set(u.uid, u);
    });
    return map;
  }, [systemUsers]);

  const entityMaps = useMemo(
    () => ({
      clients: clientsMap,
      projects: projectsMap,
      materials: materialsMap,
      quarries: quarriesMap,
      vehicles: vehiclesMap,
      drivers: driversMap
    }),
    [clientsMap, projectsMap, materialsMap, quarriesMap, vehiclesMap, driversMap]
  );

  // Quick Preset Selection
  const handleQuickPreset = (preset: DispatchFilterState['datePreset']) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;

    if (preset === 'TODAY') {
      setFilters(prev => ({
        ...prev,
        datePreset: 'TODAY',
        startDate: today,
        endDate: today
      }));
    } else if (preset === '15D') {
      const past15 = new Date();
      past15.setDate(past15.getDate() - 14);
      const past15Str = `${past15.getFullYear()}-${String(past15.getMonth() + 1).padStart(2, '0')}-${String(past15.getDate()).padStart(2, '0')}`;
      setFilters(prev => ({
        ...prev,
        datePreset: '15D',
        startDate: past15Str,
        endDate: today
      }));
    } else if (preset === '30D') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      const past30Str = `${past30.getFullYear()}-${String(past30.getMonth() + 1).padStart(2, '0')}-${String(past30.getDate()).padStart(2, '0')}`;
      setFilters(prev => ({
        ...prev,
        datePreset: '30D',
        startDate: past30Str,
        endDate: today
      }));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = `${y}-${m}-01`;
      setFilters(prev => ({
        ...prev,
        datePreset: 'THIS_MONTH',
        startDate: firstDay,
        endDate: today
      }));
    } else if (preset === 'ALL') {
      setFilters(prev => ({
        ...prev,
        datePreset: 'ALL',
        startDate: '',
        endDate: ''
      }));
    }
  };

  // Filter Data Transaksi Lintas Seluruh Dimensi
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Filter Global Proyek Header (Rule 107)
    if (selectedProjectId !== 'ALL') {
      result = result.filter(tx => tx.projectId === selectedProjectId);
    } else if (filters.projectId !== 'ALL') {
      result = result.filter(tx => tx.projectId === filters.projectId);
    }

    // 2. Filter Tanggal & Periode
    if (filters.datePreset === 'TODAY') {
      const todayStr = new Date().toISOString().slice(0, 10);
      result = result.filter(tx => (tx.deliveryDate || '').slice(0, 10) === todayStr);
    } else if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        result = result.filter(tx => (tx.deliveryDate || '').slice(0, 10) >= filters.startDate);
      }
      if (filters.endDate) {
        result = result.filter(tx => (tx.deliveryDate || '').slice(0, 10) <= filters.endDate);
      }
    }

    // 3. Filter Kuari Asal
    if (filters.quarryId !== 'ALL') {
      result = result.filter(tx => tx.quarryId === filters.quarryId);
    }

    // 4. Filter Jenis Material
    if (filters.materialId !== 'ALL') {
      result = result.filter(tx => tx.materialId === filters.materialId);
    }

    // 5. Filter Status Pembayaran
    if (filters.status !== 'ALL') {
      result = result.filter(tx => tx.status === filters.status);
    }

    // 6. Global Text Search Multi-Atribut
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tx => {
        const ent = resolveTransactionEntities(tx, entityMaps);
        const creatorName = resolveCreatorName(tx.createdBy, systemUsersMap).toLowerCase();
        return (
          tx.ticketNumber.toLowerCase().includes(q) ||
          (tx.suratJalan && tx.suratJalan.toLowerCase().includes(q)) ||
          ent.truck.name.toLowerCase().includes(q) ||
          ent.driver.name.toLowerCase().includes(q) ||
          ent.project.name.toLowerCase().includes(q) ||
          ent.client.name.toLowerCase().includes(q) ||
          ent.quarry.name.toLowerCase().includes(q) ||
          ent.material.name.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          creatorName.includes(q) ||
          matchesDateQuery(tx.deliveryDate || tx.date, q)
        );
      });
    }

    return result;
  }, [transactions, selectedProjectId, filters, searchQuery, entityMaps, systemUsersMap]);

  // Transaksi terpotong per halaman (Rule 126: 20 per halaman)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredTransactions.slice(start, start + 20);
  }, [filteredTransactions, currentPage]);

  // 4 Kartu Metrik Ringkasan KPI
  const metrics = useMemo(() => {
    let dtVolume = 0;
    let tonVolume = 0;
    let totalOmset = 0;
    let totalLaba = 0;

    filteredTransactions.forEach(tx => {
      if (tx.unit === 'DT') {
        dtVolume += Number(tx.quantity || 0);
      } else if (tx.unit === 'Ton' || tx.unit === 'Tonase') {
        tonVolume += Number(tx.quantity || 0);
      }
      totalOmset += Number(tx.totalRevenue || 0);
      totalLaba += Number(tx.netProfit || 0);
    });

    return {
      trips: filteredTransactions.length,
      dtVolume: Math.round(dtVolume),
      tonVolume: Number(tonVolume.toFixed(1)),
      totalOmset,
      totalLaba
    };
  }, [filteredTransactions]);

  // Kalkulasi Sticky Footer Summary Riwayat Ritase
  const filteredSummary = useMemo(() => {
    let dtVolume = 0;
    let tonVolume = 0;
    let totalRevenue = 0;
    let totalBuyCost = 0;
    let totalOperationalCost = 0;
    let totalNetProfit = 0;

    filteredTransactions.forEach(tx => {
      if (tx.unit === 'DT') {
        dtVolume += Number(tx.quantity || 0);
      } else if (tx.unit === 'Ton' || tx.unit === 'Tonase') {
        tonVolume += Number(tx.quantity || 0);
      }
      totalRevenue += Number(tx.totalRevenue || 0);
      totalBuyCost += Number(tx.totalBuyCost || 0);
      totalOperationalCost += Number(tx.operationalCost || 0);
      totalNetProfit += Number(tx.netProfit || 0);
    });

    return {
      count: filteredTransactions.length,
      dtVolume: Math.round(dtVolume),
      tonVolume: Number(tonVolume.toFixed(1)),
      totalRevenue,
      totalBuyCost,
      totalOperationalCost,
      totalNetProfit
    };
  }, [filteredTransactions]);

  // Hitung berapa filter aktif di luar default
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.datePreset !== 'ALL') count++;
    if (filters.projectId !== 'ALL' && selectedProjectId === 'ALL') count++;
    if (filters.quarryId !== 'ALL') count++;
    if (filters.materialId !== 'ALL') count++;
    if (filters.status !== 'ALL') count++;
    return count;
  }, [filters, selectedProjectId]);

  // Aksi Update & Delete Tiket
  const handleUpdateRitase = async (payload: UpdateDispatchPayload) => {
    if (!selectedEditTx) return;
    await updateDispatchTransaction(selectedEditTx.id, selectedEditTx.ticketNumber, payload, userEmail);
    setSelectedEditTx(null);
  };

  const handleDeleteRitase = (tx: DispatchTransaction) => {
    setPinModalConfig({
      isOpen: true,
      title: 'Hapus Tiket Ritase',
      description: `Tiket ${tx.ticketNumber} beserta catatan mutasi kasnya akan dihapus permanen dari sistem.`,
      targetLabel: tx.ticketNumber,
      onExecute: async () => {
        await deleteDispatchTransaction(tx.id, tx.ticketNumber);
      }
    });
  };

  const handleConfirmSettle = async () => {
    if (!settleTarget) return;
    try {
      await settleTransaction(settleTarget.id, settleTarget.ticketNumber, settleTarget.totalRevenue, userEmail);
    } catch (err) {
      console.error('Gagal melunasi tiket:', err);
    } finally {
      setSettleTarget(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none pb-12">
      {/* 1. ROW 4 KARTU METRIK KPI RINGKASAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Ritase */}
        <div className="bg-white rounded-[10px] p-3.5 md:p-4 border border-[#dcdcdc] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-medium text-[#777777]">Total Ritase</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111111]">
              {metrics.trips}
            </span>
            <span className="text-xs text-[#666666] font-medium">Trip</span>
          </div>
          <span className="text-[10px] text-[#888888] mt-0.5">Pengiriman material</span>
        </div>

        {/* Card 2: Total Volume (DT & Ton - Rule 116) */}
        <div className="bg-white rounded-[10px] p-3.5 md:p-4 border border-[#dcdcdc] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-medium text-[#777777]">Total Muatan Volume</span>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-[#111111]">
              {metrics.dtVolume} <span className="text-xs font-semibold text-[#666666]">DT</span>
            </span>
            <span className="text-sm text-[#bbbbbb] font-normal">|</span>
            <span className="text-base md:text-lg font-bold tracking-tight text-[#444444]">
              {metrics.tonVolume} <span className="text-xs font-semibold text-[#777777]">Ton</span>
            </span>
          </div>
          <span className="text-[10px] text-[#888888] mt-0.5">Akumulasi dump truck & tonase</span>
        </div>

        {/* Card 3: Total Omset (Tempo / Piutang) */}
        <div className="bg-white rounded-[10px] p-3.5 md:p-4 border border-[#dcdcdc] flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-medium text-[#777777]">Total Nilai Tagihan (Omset)</span>
          <div className="mt-1">
            <span
              title={formatRupiah(metrics.totalOmset)}
              className="text-xl md:text-2xl font-bold tracking-tight text-[#111111] block truncate"
            >
              {formatRupiahCompact(metrics.totalOmset)}
            </span>
          </div>
          <span className="text-[10px] text-[#888888] mt-0.5">Penjualan ke kontraktor & pembeli</span>
        </div>

        {/* Card 4: Estimasi Laba Bersih (Terproteksi RBAC) */}
        {!hideMargin ? (
          <div className="bg-white rounded-[10px] p-3.5 md:p-4 border border-[#dcdcdc] flex flex-col justify-between shadow-xs">
            <span className="text-[11px] font-medium text-[#777777]">Estimasi Laba Bersih</span>
            <div className="mt-1">
              <span
                title={formatRupiah(metrics.totalLaba)}
                className={`text-xl md:text-2xl font-bold tracking-tight block truncate ${
                  metrics.totalLaba < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                }`}
              >
                {formatRupiahCompact(metrics.totalLaba)}
              </span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5">Net profit setelah ops & kuari</span>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] p-3.5 md:p-4 border border-[#dcdcdc] flex flex-col justify-between shadow-xs opacity-75">
            <span className="text-[11px] font-medium text-[#777777]">Status Riwayat</span>
            <div className="mt-1">
              <span className="text-base md:text-lg font-bold tracking-tight text-[#111111]">
                Terverifikasi
              </span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5">Log data riwayat ritase aktif</span>
          </div>
        )}
      </div>

      {/* 2. TOOLBAR KONTROL TERPADU: SEARCH (KIRI) | QUICK PRESETS (TENGAH) | FILTER POPOVER (KANAN) */}
      <div className="bg-white border border-[#dcdcdc] rounded-[10px] p-2.5 md:p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shadow-xs relative">
        {/* Sisi Kiri: Global Instant Search Box */}
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <img
            src="/icons/search.png"
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari tiket, plat, supir, proyek, tanggal (misal 28-10-26)..."
            className="w-full bg-[#f8f8f8] hover:bg-[#f2f2f2] focus:bg-white border border-[#eaeaea] focus:border-[#111111] rounded-[8px] pl-9 pr-8 py-2 text-xs text-[#111111] placeholder:text-[#888888] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#888888] hover:text-[#111111] p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sisi Tengah: Quick-Preset Pills Periode */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {[
            { id: 'TODAY', label: 'Hari Ini' },
            { id: '15D', label: '15 Hari' },
            { id: '30D', label: '30 Hari' },
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: 'ALL', label: 'Semua Waktu' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleQuickPreset(p.id as DispatchFilterState['datePreset'])}
              className={`px-3 py-1.5 rounded-[7px] text-xs whitespace-nowrap transition-all border ${
                filters.datePreset === p.id
                  ? 'bg-[#111111] text-white border-[#111111] font-semibold shadow-xs'
                  : 'bg-white text-[#555555] border-[#e2e2e2] hover:bg-[#f5f5f5] hover:text-[#111111]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sisi Kanan: Tombol Popover Filter Lengkap */}
        <div className="relative flex items-center justify-end">
          <button
            ref={filterBtnRef}
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer ${
              activeFiltersCount > 0 || isFilterOpen
                ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                : 'bg-white text-[#333333] border-[#dcdcdc] hover:bg-[#f5f5f5]'
            }`}
          >
            <img
              src="/icons/filter-slider.png"
              alt="Filter"
              className={`w-3.5 h-3.5 object-contain ${
                activeFiltersCount > 0 || isFilterOpen ? 'brightness-0 invert' : ''
              }`}
            />
            <span>Filter Detail</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Anchored Popover Filter (Desktop) & Drawer (Mobile) */}
          <DispatchFilterPopover
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            anchorRef={filterBtnRef}
            filters={filters}
            onApply={newFilters => setFilters(newFilters)}
            onReset={() =>
              setFilters({
                datePreset: 'ALL',
                startDate: '',
                endDate: '',
                projectId: 'ALL',
                quarryId: 'ALL',
                materialId: 'ALL',
                status: 'ALL'
              })
            }
            projects={projects}
            quarries={quarries}
            materials={materials}
          />
        </div>
      </div>

      {/* 3. TABEL DATA RIWAYAT RITASE FULL-WIDTH */}
      <div className="w-full bg-white border border-[#dcdcdc] rounded-[10px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto select-text max-h-[720px] w-full">
          <table className="w-full min-w-[1280px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f8f8f8] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3 w-[115px] min-w-[115px] whitespace-nowrap">No. Plat</th>
                <th className="py-2.5 px-3 w-[250px] min-w-[250px] whitespace-nowrap">Proyek Tujuan</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Kuari Asal</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Material</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Harga Jual</th>
                {!hideMargin && (
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Harga Beli</th>
                )}
                <th className="py-2.5 px-3 w-[110px] min-w-[110px] whitespace-nowrap">Beban Ops</th>
                {!hideMargin && (
                  <th className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap">Laba Bersih</th>
                )}
                <th className="py-2.5 px-3 w-[180px] min-w-[180px] whitespace-nowrap">Catatan Ritase</th>
                <th className="py-2.5 px-3 w-[105px] min-w-[105px] whitespace-nowrap">Dibuat Oleh</th>
                {!isWatcherUser && <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={hideMargin ? 10 : 12}
                    className="py-12 text-center text-xs text-[#888888] whitespace-nowrap"
                  >
                    {isLoading
                      ? 'Memuat seluruh riwayat ritase armada...'
                      : 'Tidak ada catatan ritase yang sesuai dengan parameter filter atau pencarian Anda.'}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => {
                  const ent = resolveTransactionEntities(tx, entityMaps);
                  const creatorName = resolveCreatorName(tx.createdBy, systemUsersMap);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#fafafa] transition-colors group cursor-default"
                    >
                      {/* Tanggal & No. Tiket */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        <div className="flex flex-col items-start gap-0.5 max-w-full">
                          <span className="font-mono font-medium text-[#111111]">
                            {formatDateID(tx.deliveryDate || tx.date)}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] text-[#666666]">
                              {tx.ticketNumber}
                            </span>
                            {pendingApprovalsMap.has(tx.id) && (
                              <span
                                className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-[4px] border-none flex items-center ${
                                  pendingApprovalsMap.get(tx.id)?.type === 'DELETE'
                                    ? 'bg-[#fce8e6] text-[#cf1124]'
                                    : 'bg-[#fef3c7] text-[#92400e]'
                                }`}
                                title={`Sedang diajukan oleh ${pendingApprovalsMap.get(tx.id)?.requestedByName}: "${pendingApprovalsMap.get(tx.id)?.reason}"`}
                              >
                                <span>Menunggu ACC {pendingApprovalsMap.get(tx.id)?.type === 'DELETE' ? 'Hapus' : 'Edit'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* No. Plat & Supir */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-[115px] align-middle">
                        <div className="flex flex-col items-start gap-0.5 max-w-full">
                          <DynamicEntityText
                            name={ent.truck.name}
                            isOrphan={ent.truck.isOrphan}
                            tooltipText={ent.truck.tooltipText}
                            className="font-mono font-bold text-[#111111]"
                          />
                          <DynamicEntityText
                            name={ent.driver.name}
                            isOrphan={ent.driver.isOrphan}
                            tooltipText={ent.driver.tooltipText}
                            className="text-[11px] text-[#666666] block truncate"
                          />
                        </div>
                      </td>

                      {/* Proyek Tujuan & Klien */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-[250px] min-w-[250px] align-middle">
                        <div className="flex flex-col items-start gap-0.5 max-w-full">
                          <DynamicEntityText
                            name={ent.project.name}
                            isOrphan={ent.project.isOrphan}
                            tooltipText={ent.project.tooltipText}
                            className="font-medium text-[#111111] block truncate"
                          />
                          {ent.client.name && (
                            <DynamicEntityText
                              name={ent.client.name}
                              isOrphan={ent.client.isOrphan}
                              tooltipText={ent.client.tooltipText}
                              className="text-[11px] text-[#666666] block truncate"
                            />
                          )}
                        </div>
                      </td>

                      {/* Kuari Asal */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        <DynamicEntityText
                          name={ent.quarry.name}
                          isOrphan={ent.quarry.isOrphan}
                          tooltipText={ent.quarry.tooltipText}
                          className="text-[#555555]"
                        />
                      </td>

                      {/* Material & Volume (Sama-sama Bold) */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        <div className="flex flex-col items-start gap-0.5 max-w-full">
                          <DynamicEntityText
                            name={ent.material.name}
                            isOrphan={ent.material.isOrphan}
                            tooltipText={ent.material.tooltipText}
                            className="font-bold text-[#111111] block truncate"
                          />
                          <span className="font-bold text-[11px] text-[#111111] tracking-tight block">
                            {formatVolumeDisplay(tx.quantity, tx.unit)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        <PricePerVolCell
                          unitPrice={tx.sellPricePerUnit}
                          totalPrice={tx.totalRevenue}
                          unit={tx.unit}
                          quantity={tx.quantity}
                        />
                      </td>
                      {!hideMargin && (
                        <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                          <PricePerVolCell
                            unitPrice={tx.buyPricePerUnit}
                            totalPrice={tx.totalBuyCost}
                            unit={tx.unit}
                            quantity={tx.quantity}
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 font-bold tracking-tight text-[#555555] whitespace-nowrap w-[110px] align-middle">
                        {formatRupiah(tx.operationalCost)}
                      </td>
                      {!hideMargin && (
                        <td
                          className={`py-2.5 px-3 font-bold tracking-tight whitespace-nowrap w-[125px] align-middle ${
                            tx.netProfit < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                          }`}
                        >
                          {formatRupiah(tx.netProfit)}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={tx.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#111111] whitespace-nowrap w-[105px] align-middle">
                        {creatorName}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Lihat Rincian',
                                onClick: () => handleOpenDetailTx(tx)
                              },
                              {
                                label: isDispatcherUser ? 'Ajukan Koreksi Tiket' : 'Edit Tiket',
                                onClick: () => setSelectedEditTx(tx)
                              },
                              {
                                label: 'Tandai Lunas',
                                hidden: isDispatcherUser || tx.status === 'LUNAS',
                                onClick: () => setSettleTarget(tx)
                              },
                              {
                                label: 'Salin No. Tiket',
                                onClick: () => navigator.clipboard.writeText(tx.ticketNumber)
                              },
                              {
                                label: isDispatcherUser ? 'Ajukan Hapus Tiket' : 'Hapus Tiket',
                                variant: 'danger',
                                onClick: () => {
                                  if (isDispatcherUser) {
                                    setRequestDeleteTx(tx);
                                  } else {
                                    handleDeleteRitase(tx);
                                  }
                                }
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* STICKY FOOTER ROW: TOTAL RINGKASAN RITASE */}
            <tfoot className="sticky bottom-0 z-10 bg-[#f8f8f8] border-t-2 border-[#111111] text-[#111111] font-bold text-xs select-none shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
              <tr>
                <td className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap align-middle">
                  <span className="font-mono text-[11px] text-[#666666] uppercase font-bold tracking-wider">TOTAL</span>
                </td>
                <td className="py-2.5 px-3 w-[115px] min-w-[115px] whitespace-nowrap align-middle">
                  <span className="inline-block px-2.5 py-0.5 rounded-[4px] bg-[#111111] text-white font-bold text-[10px] tracking-wider uppercase whitespace-nowrap">
                    {filteredSummary.count} RITASE
                  </span>
                </td>
                <td className="py-2.5 px-3 w-[250px] min-w-[250px] whitespace-nowrap align-middle">
                  <span className="text-xs font-bold text-[#111111] block truncate">
                    {searchQuery.trim() ? `Pencarian: "${searchQuery.trim()}"` : 'Total Terfilter'}
                  </span>
                </td>
                <td className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap align-middle">
                  <div className="font-mono font-bold text-[11px] text-[#333333]">
                    {filteredSummary.dtVolume > 0 && `${filteredSummary.dtVolume} DT`}
                    {filteredSummary.dtVolume > 0 && filteredSummary.tonVolume > 0 && ' / '}
                    {filteredSummary.tonVolume > 0 && `${filteredSummary.tonVolume} Ton`}
                    {!filteredSummary.dtVolume && !filteredSummary.tonVolume && '-'}
                  </div>
                </td>
                <td className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap align-middle text-[#888888] font-normal text-[11px]">
                  Total Muatan
                </td>
                <td className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap align-middle font-mono font-bold text-[#111111] text-xs">
                  {formatRupiah(filteredSummary.totalRevenue)}
                </td>
                {!hideMargin && (
                  <td className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap align-middle font-mono font-bold text-[#555555] text-xs">
                    {formatRupiah(filteredSummary.totalBuyCost)}
                  </td>
                )}
                <td className="py-2.5 px-3 w-[110px] min-w-[110px] whitespace-nowrap align-middle font-mono font-bold text-[#555555] text-xs">
                  {formatRupiah(filteredSummary.totalOperationalCost)}
                </td>
                {!hideMargin && (
                  <td className="py-2.5 px-3 w-[125px] min-w-[125px] whitespace-nowrap align-middle font-mono font-bold text-xs">
                    <span className={filteredSummary.totalNetProfit < 0 ? 'text-[#cf1124]' : 'text-emerald-700'}>
                      {formatRupiah(filteredSummary.totalNetProfit)}
                    </span>
                  </td>
                )}
                <td className="py-2.5 px-3 w-[180px] min-w-[180px] whitespace-nowrap align-middle text-center text-[#888888] font-normal">
                  -
                </td>
                <td className="py-2.5 px-3 w-[105px] min-w-[105px] whitespace-nowrap align-middle text-center text-[#888888] font-normal">
                  -
                </td>
                {!isWatcherUser && (
                  <td className="py-2.5 px-3 w-[60px] min-w-[60px] whitespace-nowrap align-middle text-right text-[#888888] font-normal">
                    -
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Kontrol Pagination 20 Baris Universal (Rule 126) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={20}
          onPageChange={setCurrentPage}
          itemLabel="ritase"
        />
      </div>

      {/* MODAL EDIT TIKET RITASE */}
      {selectedEditTx && (
        <EditDispatchModal
          key={selectedEditTx.id}
          isOpen={Boolean(selectedEditTx)}
          transaction={selectedEditTx}
          materials={materials}
          clients={clients}
          quarries={quarries}
          onSave={handleUpdateRitase}
          onClose={() => setSelectedEditTx(null)}
        />
      )}

      {/* MODAL DETAIL RINCIAN TIKET RITASE */}
      {selectedDetailTx && (
        <DispatchDetailModal
          transaction={selectedDetailTx}
          onClose={() => handleOpenDetailTx(null)}
          entityMaps={entityMaps}
        />
      )}

      {/* DIALOG KONFIRMASI PELUNASAN PIUTANG */}
      <CustomDialog
        isOpen={Boolean(settleTarget)}
        onClose={() => setSettleTarget(null)}
        title="Konfirmasi Pelunasan Piutang"
        description={`Tandai transaksi tiket ${settleTarget?.ticketNumber} (${settleTarget?.customerName}) sebesar ${formatRupiah(settleTarget?.totalRevenue || 0)} sebagai LUNAS? Mutasi kas masuk akan otomatis dibukukan di Kas & Piutang.`}
        confirmText="Tandai Lunas"
        cancelText="Batal"
        onConfirm={handleConfirmSettle}
      />


      {/* MODAL PERMOHONAN HAPUS TIKET KHUSUS DISPATCHER */}
      <RequestDeleteModal
        isOpen={Boolean(requestDeleteTx)}
        transaction={requestDeleteTx}
        onClose={() => setRequestDeleteTx(null)}
        onSubmit={async reason => {
          if (!requestDeleteTx) return;
          await submitApprovalRequest({
            ticketId: requestDeleteTx.id,
            ticketNumber: requestDeleteTx.ticketNumber,
            type: 'DELETE',
            reason,
            currentData: requestDeleteTx,
            requestedBy: userEmail,
            requestedByName: userEmail.split('@')[0] || 'Dispatcher' || 'Dispatcher'
          });
          alert('Permohonan penghapusan tiket #' + requestDeleteTx.ticketNumber + ' telah dikirim ke Atasan untuk di-ACC.');
          setRequestDeleteTx(null);
        }}
      />

      {/* PIN AUTH MODAL UNTUK PENGHAPUSAN TIKET */}
      <PinAuthModal
        isOpen={pinModalConfig.isOpen}
        title={pinModalConfig.title}
        description={pinModalConfig.description}
        targetLabel={pinModalConfig.targetLabel}
        isDestructive={true}
        confirmText="Hapus Tiket"
        onSuccess={async () => {
          await pinModalConfig.onExecute();
          setPinModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
