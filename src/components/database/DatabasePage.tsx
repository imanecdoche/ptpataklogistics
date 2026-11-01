import React, { useState, useEffect, useMemo } from 'react';
import {
  MasterVehicle,
  MasterDriver,
  Client,
  DispatchTransaction,
  MaterialItem,
  MasterQuarry,
  SystemUser
} from '@/types/database';
import {
  subscribeMasterVehicles,
  saveMasterVehicle,
  deleteMasterVehicle,
  combineVehicleData,
  subscribeMasterDrivers,
  saveMasterDriver,
  deleteMasterDriver,
  subscribeMasterQuarries
} from '@/lib/databaseMasterService';
import { subscribeClients } from '@/lib/clientService';
import {
  getMaterials,
  subscribeAllTransactions,
  updateDispatchTransaction,
  deleteDispatchTransaction,
  settleTransaction,
  UpdateDispatchPayload
} from '@/lib/dispatcherService';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { formatTruckPlate, isValidRegionCode, extractRegionCode } from '@/components/ui/TruckPlateInput';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { EditDispatchModal } from '@/components/dispatcher/EditDispatchModal';
import { CustomSelectCombobox } from '@/components/ui/CustomSelectCombobox';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { matchesDateQuery, formatDateID } from '@/lib/dateSearchUtils';
import { formatVolumeDisplay } from '@/lib/volumeUtils';
import { DynamicEntityText } from '@/components/ui/DynamicEntityText';
import {
  resolveTransactionEntities,
  resolveClientName,
  resolveMaterialName,
  resolveCreatorName
} from '@/lib/entityResolver';
import { subscribeSystemUsers } from '@/lib/userManagementService';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatPersonNameLive } from '@/lib/nameUtils';
import { useProjectFilter } from '@/context/ProjectFilterContext';

type SubTab = 'ritase' | 'vehicles' | 'drivers';
type TimeRangeFilter = 'all' | 'today' | 'this_month' | 'last_30_days';
type StatusFilter = 'all' | 'TEMPO' | 'LUNAS';
type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'revenue_desc'
  | 'revenue_asc'
  | 'profit_desc'
  | 'profit_asc';

interface DatabasePageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: any, subTabId: string) => void;
}

export function DatabasePage({
  userEmail,
  activeSubTab: propActiveSubTab,
  onNavigateSubTab
}: DatabasePageProps): React.JSX.Element {
  const { projects, isDispatcherUser, isWatcherUser } = useProjectFilter();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(() => {
    if (propActiveSubTab === 'vehicles' || propActiveSubTab === 'drivers' || propActiveSubTab === 'ritase') {
      return propActiveSubTab;
    }
    return 'ritase';
  });

  useEffect(() => {
    if (propActiveSubTab === 'vehicles' || propActiveSubTab === 'drivers' || propActiveSubTab === 'ritase') {
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab]);

  const handleSelectSubTab = (sub: SubTab) => {
    setActiveSubTab(sub);
    setSearchQuery('');
    onNavigateSubTab?.('database', sub);
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Data Collections
  const [masterVehicles, setMasterVehicles] = useState<MasterVehicle[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [drivers, setDrivers] = useState<MasterDriver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sorting states khusus Riwayat Ritase
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRangeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Modals Tambah Baru
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Form input states Tambah Baru
  const [inputPlate, setInputPlate] = useState('');
  const [inputPlateDriver, setInputPlateDriver] = useState('');
  const [inputPlateType, setInputPlateType] = useState('Dump Truck');
  const [inputPlateNotes, setInputPlateNotes] = useState('');
  const [plateError, setPlateError] = useState('');

  const [inputDriverName, setInputDriverName] = useState('');
  const [inputDriverPhone, setInputDriverPhone] = useState('');
  const [inputDriverPlate, setInputDriverPlate] = useState('');
  const [inputDriverNotes, setInputDriverNotes] = useState('');

  // Modals & Target Edit
  const [selectedDetailTx, setSelectedDetailTx] = useState<DispatchTransaction | null>(null);
  const [selectedEditTx, setSelectedEditTx] = useState<DispatchTransaction | null>(null);

  const [editVehicleTarget, setEditVehicleTarget] = useState<MasterVehicle | null>(null);
  const [editDriverTarget, setEditDriverTarget] = useState<MasterDriver | null>(null);

  // State Eksekusi Otorisasi PIN
  const [pinModalConfig, setPinModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetLabel?: string;
    isDestructive?: boolean;
    confirmText?: string;
    onExecute: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onExecute: () => {}
  });

  // Pelunasan Piutang Confirm Dialog
  const [settleTarget, setSettleTarget] = useState<DispatchTransaction | null>(null);

  // Subscriptions & Initial Fetch
  useEffect(() => {
    setIsLoading(true);

    const unsubVehicles = subscribeMasterVehicles(list => {
      setMasterVehicles(list);
    });

    const unsubDrivers = subscribeMasterDrivers(list => {
      setDrivers(list);
    });

    const unsubClients = subscribeClients(list => {
      setClients(list);
    });

    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list);
      setIsLoading(false);
    });

    const unsubQuarries = subscribeMasterQuarries(list => {
      setQuarries(list);
    });

    const unsubUsers = subscribeSystemUsers(list => {
      setSystemUsers(list);
    });

    getMaterials().then(setMaterials).catch(console.error);

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubClients();
      unsubTx();
      unsubQuarries();
      unsubUsers();
    };
  }, []);

  // Format Helper
  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };



  // Agregasi seluruh data armada (manual + riwayat transaksi)
  const combinedVehicles = useMemo(() => {
    return combineVehicleData(transactions, masterVehicles);
  }, [transactions, masterVehicles]);

  // Maps Master Data untuk Dynamic Entity Resolution (SSoT)
  const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const materialsMap = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);
  const quarriesMap = useMemo(() => new Map(quarries.map(q => [q.id, q])), [quarries]);
  const vehiclesMap = useMemo(() => {
    const m = new Map<string, MasterVehicle>();
    combinedVehicles.forEach(v => {
      if (v.plateNumber) m.set(v.plateNumber.replace(/\s+/g, '').toUpperCase(), v);
      if (v.id) m.set(v.id.replace(/\s+/g, '').toUpperCase(), v);
    });
    return m;
  }, [combinedVehicles]);
  const driversMap = useMemo(() => {
    const m = new Map<string, MasterDriver>();
    drivers.forEach(d => {
      m.set(d.name.trim().toLowerCase(), d);
      if (d.id) m.set(d.id, d);
    });
    return m;
  }, [drivers]);

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

  const systemUsersMap = useMemo(() => {
    const map = new Map<string, SystemUser>();
    systemUsers.forEach(u => {
      map.set(u.email.toLowerCase(), u);
      if (u.id) map.set(u.id, u);
      if (u.uid) map.set(u.uid, u);
    });
    return map;
  }, [systemUsers]);

  // Filter & Urutkan Data Transaksi Ritase (Riwayat Ritase)
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Filter Rentang Waktu
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentYearMonth = todayStr.slice(0, 7);

    if (timeRangeFilter === 'today') {
      result = result.filter(tx => tx.deliveryDate === todayStr);
    } else if (timeRangeFilter === 'this_month') {
      result = result.filter(tx => tx.deliveryDate.startsWith(currentYearMonth));
    } else if (timeRangeFilter === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      result = result.filter(tx => tx.deliveryDate >= thirtyDaysAgo);
    }

    // 2. Filter Status Pembayaran
    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.status === statusFilter);
    }

    // 3. Filter Jenis Material (Dynamic Name Match)
    if (materialFilter !== 'all') {
      result = result.filter(tx => {
        const mat = resolveMaterialName(tx.materialId, tx.materialName, materialsMap);
        return mat.name.toLowerCase() === materialFilter.toLowerCase();
      });
    }

    // 4. Filter Klien (Dynamic Name Match)
    if (clientFilter !== 'all') {
      result = result.filter(tx => {
        const cli = resolveClientName(tx.clientId, tx.clientName || tx.customerName, clientsMap);
        return cli.name.toLowerCase() === clientFilter.toLowerCase();
      });
    }

    // 5. Filter Pencarian Text (Dynamic Entity Match)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tx => {
        const ent = resolveTransactionEntities(tx, entityMaps);
        return (
          tx.ticketNumber.toLowerCase().includes(q) ||
          (tx.suratJalan && tx.suratJalan.toLowerCase().includes(q)) ||
          ent.truck.name.toLowerCase().includes(q) ||
          ent.driver.name.toLowerCase().includes(q) ||
          ent.client.name.toLowerCase().includes(q) ||
          ent.project.name.toLowerCase().includes(q) ||
          ent.quarry.name.toLowerCase().includes(q) ||
          ent.material.name.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          matchesDateQuery(tx.deliveryDate || tx.date, q)
        );
      });
    }

    // 6. Sorting Multi-Opsi
    result.sort((a, b) => {
      if (sortOption === 'date_desc') {
        const diff = (b.deliveryDate || '').localeCompare(a.deliveryDate || '');
        if (diff !== 0) return diff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      } else if (sortOption === 'date_asc') {
        const diff = (a.deliveryDate || '').localeCompare(b.deliveryDate || '');
        if (diff !== 0) return diff;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      } else if (sortOption === 'revenue_desc') {
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      } else if (sortOption === 'revenue_asc') {
        return (a.totalRevenue || 0) - (b.totalRevenue || 0);
      } else if (sortOption === 'profit_desc') {
        return (b.netProfit || 0) - (a.netProfit || 0);
      } else if (sortOption === 'profit_asc') {
        return (a.netProfit || 0) - (b.netProfit || 0);
      }
      return 0;
    });

    return result;
  }, [transactions, timeRangeFilter, statusFilter, materialFilter, clientFilter, searchQuery, sortOption, entityMaps, materialsMap, clientsMap]);

  // Kalkulasi Ringkasan Finansial Riwayat Ritase yang Difilter
  const ritaseMetrics = useMemo(() => {
    const totalRitase = filteredTransactions.length;
    const totalOmset = filteredTransactions.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
    const totalBelanjaKuari = filteredTransactions.reduce((acc, curr) => acc + (curr.totalBuyCost || 0), 0);
    const totalLabaBersih = filteredTransactions.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    return { totalRitase, totalOmset, totalBelanjaKuari, totalLabaBersih };
  }, [filteredTransactions]);

  // Opsi Dropdown Filter Riwayat Ritase (Custom UI - Rule 87 & Rule 97)
  const timeRangeOptions = useMemo(
    () => [
      { id: 'all', label: 'Semua Waktu (All-Time)' },
      { id: 'today', label: 'Hari Ini' },
      { id: 'this_month', label: 'Bulan Ini' },
      { id: 'last_30_days', label: '30 Hari Terakhir' }
    ],
    []
  );

  const statusFilterOptions = useMemo(
    () => [
      { id: 'all', label: 'Semua Status' },
      { id: 'TEMPO', label: 'TEMPO (Belum Lunas)' },
      { id: 'LUNAS', label: 'LUNAS' }
    ],
    []
  );

  const materialFilterOptions = useMemo(
    () => [
      { id: 'all', label: 'Semua Material' },
      ...materials.map(m => ({ id: m.name, label: m.name }))
    ],
    [materials]
  );

  const clientFilterOptions = useMemo(
    () => [
      { id: 'all', label: 'Semua Klien' },
      ...clients.map(c => ({ id: c.name, label: c.name }))
    ],
    [clients]
  );

  const sortOptions = useMemo(
    () => {
      const base = [
        { id: 'date_desc', label: 'Tanggal Terbaru' },
        { id: 'date_asc', label: 'Tanggal Terlama' },
        { id: 'revenue_desc', label: 'Omset Tertinggi' },
        { id: 'revenue_asc', label: 'Omset Terendah' }
      ];
      if (!isDispatcherUser && !isWatcherUser) {
        base.push(
          { id: 'profit_desc', label: 'Laba Tertinggi' },
          { id: 'profit_asc', label: 'Laba Terendah' }
        );
      }
      return base;
    },
    [isDispatcherUser]
  );

  // Filtered lists Master Data
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return combinedVehicles;
    return combinedVehicles.filter(
      v =>
        v.plateNumber.toUpperCase().includes(q) ||
        (v.driverName && v.driverName.toUpperCase().includes(q))
    );
  }, [combinedVehicles, searchQuery]);

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        (d.phoneNumber && d.phoneNumber.includes(q)) ||
        (d.defaultPlate && d.defaultPlate.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);


  // Aksi Tambah Baru
  const handleSaveVehicle = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const formatted = formatTruckPlate(inputPlate);
    const region = extractRegionCode(formatted);
    if (!isValidRegionCode(region)) {
      setPlateError('Kode wilayah TNKB tidak valid');
      return;
    }

    try {
      await saveMasterVehicle(formatted, inputPlateDriver, inputPlateType, inputPlateNotes);
      setIsVehicleModalOpen(false);
      setInputPlate('');
      setInputPlateDriver('');
      setInputPlateNotes('');
      setPlateError('');
    } catch (err: any) {
      setPlateError(err.message || 'Gagal menyimpan armada');
    }
  };

  const handleSaveDriver = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputDriverName.trim()) return;

    try {
      await saveMasterDriver(
        inputDriverName,
        inputDriverPhone,
        inputDriverPlate ? formatTruckPlate(inputDriverPlate) : undefined,
        inputDriverNotes
      );
      setIsDriverModalOpen(false);
      setInputDriverName('');
      setInputDriverPhone('');
      setInputDriverPlate('');
      setInputDriverNotes('');
    } catch (err) {
      console.error('Gagal menyimpan supir:', err);
    }
  };


  // Helper Pemicu Otorisasi PIN
  const requestAuthorization = (
    title: string,
    description: string,
    targetLabel: string,
    onExecute: () => Promise<void> | void,
    isDestructive: boolean = false,
    confirmText: string = 'Konfirmasi Otorisasi'
  ) => {
    setPinModalConfig({
      isOpen: true,
      title,
      description,
      targetLabel,
      isDestructive,
      confirmText,
      onExecute
    });
  };

  // Aksi Hapus Tiket Ritase (Destruktif + Sinkronisasi Kas)
  const handleDeleteRitase = (tx: DispatchTransaction) => {
    requestAuthorization(
      'Hapus Tiket Ritase',
      'Tiket ritase akan dihapus permanen dan seluruh mutasi kas terkait di Buku Kas akan otomatis dibersihkan.',
      `${tx.ticketNumber} - ${tx.truckPlate}`,
      async () => {
        await deleteDispatchTransaction(tx.id, tx.ticketNumber);
      },
      true,
      'Hapus Tiket & Bersihkan Kas'
    );
  };

  // Aksi Update Tiket Ritase
  const handleUpdateRitase = async (payload: UpdateDispatchPayload) => {
    if (!selectedEditTx) return;
    await updateDispatchTransaction(selectedEditTx.id, selectedEditTx.ticketNumber, payload, userEmail);
    setSelectedEditTx(null);
  };

  // Aksi Pelunasan Piutang
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
    <div className="space-y-4 w-full select-none">
      {/* 1. SUB-KATEGORI NAVIGASI TAB */}
      <div className="bg-white rounded-[10px] p-1.5 border border-[#eaeaea] flex items-center gap-1 overflow-x-auto select-none">
        {/* Tab 1: Riwayat Ritase (First Tab) */}
        <button
          type="button"
          onClick={() => handleSelectSubTab('ritase')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'ritase'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Riwayat Ritase</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'ritase' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {transactions.length}
          </span>
        </button>

        {/* Tab 2: Armada & Plat Nomor */}
        <button
          type="button"
          onClick={() => handleSelectSubTab('vehicles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'vehicles'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Armada & Plat Nomor</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'vehicles' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {combinedVehicles.length}
          </span>
        </button>

        {/* Tab 3: Daftar Supir */}
        <button
          type="button"
          onClick={() => handleSelectSubTab('drivers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'drivers'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Daftar Supir</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'drivers' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {drivers.length}
          </span>
        </button>
      </div>

      {/* 2. KONTROL FILTER & SEARCH BAR */}
      <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#eaeaea] space-y-3">
        {/* Baris Utama: Search Bar & Tombol Tambah */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <img
              src="/icons/search.png"
              alt="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'ritase'
                  ? 'Cari tiket, plat, supir, tanggal (misal 28-10-26)...'
                  : activeSubTab === 'vehicles'
                  ? 'Cari plat nomor atau nama supir...'
                  : 'Cari nama atau nomor HP supir...'
              }
              className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-[8px] pl-9 pr-3.5 py-2 text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'vehicles' && !isDispatcherUser && !isWatcherUser && (
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Daftarkan Armada Baru</span>
              </button>
            )}

            {activeSubTab === 'drivers' && !isDispatcherUser && !isWatcherUser && (
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Supir Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar Khusus Riwayat Ritase: Rentang Waktu, Status, Material, Klien, dan Sorting (Rule 97) */}
        {activeSubTab === 'ritase' && (
          <div className="pt-3 border-t border-[#f0f0f0]">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Rentang Waktu */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#777777] text-[11px] font-medium">Waktu</label>
                <CustomSelectCombobox
                  options={timeRangeOptions}
                  value={timeRangeFilter}
                  onChange={val => setTimeRangeFilter(val as TimeRangeFilter)}
                  variant="white"
                  searchable={false}
                />
              </div>

              {/* 2. Status Pembayaran */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#777777] text-[11px] font-medium">Status</label>
                <CustomSelectCombobox
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={val => setStatusFilter(val as StatusFilter)}
                  variant="white"
                  searchable={false}
                />
              </div>

              {/* 3. Material */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#777777] text-[11px] font-medium">Material</label>
                <CustomSelectCombobox
                  options={materialFilterOptions}
                  value={materialFilter}
                  onChange={val => setMaterialFilter(val)}
                  variant="white"
                  searchable={true}
                />
              </div>

              {/* 4. Klien */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[#777777] text-[11px] font-medium">Klien</label>
                <CustomSelectCombobox
                  options={clientFilterOptions}
                  value={clientFilter}
                  onChange={val => setClientFilter(val)}
                  variant="white"
                  searchable={true}
                />
              </div>

              {/* 5. Sorting (Lebar Penuh 2 Kolom di Layar Mobile) */}
              <div className="flex flex-col gap-1.5 col-span-2 lg:col-span-1">
                <label className="text-[#777777] text-[11px] font-medium">Urutkan</label>
                <CustomSelectCombobox
                  options={sortOptions}
                  value={sortOption}
                  onChange={val => setSortOption(val as SortOption)}
                  variant="white"
                  searchable={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. METRIC CARDS RINGKASAN KHUSUS TAB RIWAYAT RITASE (Aturan 71: 1 kolom di mobile) */}
      {activeSubTab === 'ritase' && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isDispatcherUser ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-3 md:gap-4`}>
          {/* Card 1: Total Ritase */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Total Ritase Terfilter</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[#111111]">
                {ritaseMetrics.totalRitase}
              </span>
              <span className="text-xs text-[#777777]">trip</span>
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Dari seluruh armada aktif</span>
          </div>

          {/* Card 2: Total Omset Penjualan */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Total Omset (Piutang)</span>
            <div className="mt-2">
              <MetricCardCurrency amount={ritaseMetrics.totalOmset} />
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Bruto penjualan material</span>
          </div>

          {/* Card 3: Belanja Modal Kuari */}
          {!isDispatcherUser && (
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">Total Belanja Kuari</span>
              <div className="mt-2">
                <MetricCardCurrency amount={ritaseMetrics.totalBelanjaKuari} />
              </div>
              <span className="text-[11px] text-[#888888] mt-1">Beban beli material tunai</span>
            </div>
          )}

          {/* Card 4: Estimasi Laba Bersih */}
          {!isDispatcherUser && (
            <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
              <span className="text-[11px] font-medium text-[#666666]">Estimasi Laba Bersih</span>
              <div className="mt-2">
                <MetricCardCurrency
                  amount={ritaseMetrics.totalLabaBersih}
                  colorClassName={
                    ritaseMetrics.totalLabaBersih < 0 ? 'text-[#cf1124]' : 'text-[#008060]'
                  }
                />
              </div>
              <span className="text-[11px] text-[#888888] mt-1">Net profit setelah ops & kuari</span>
            </div>
          )}
        </div>
      )}

      {/* 4. TABEL DATA SESUAI SUB-TAB AKTIF */}
      <div className="bg-white rounded-[10px] border border-[#eaeaea] overflow-hidden">
        {/* ============================================================== */}
        {/* TAB 1: RIWAYAT RITASE (Aturan 66: fixed-width, nowrap, sticky) */}
        {/* ============================================================== */}
        {activeSubTab === 'ritase' && (
          <div className="overflow-x-auto select-text max-h-[640px]">
            <table className="w-full min-w-[1555px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">No. Tiket</th>
                  <th className="py-2.5 px-3 w-[105px] min-w-[105px] whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3 w-[110px] min-w-[110px] whitespace-nowrap">No. Plat</th>
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Supir</th>
                  <th className="py-2.5 px-3 w-[150px] min-w-[150px] whitespace-nowrap">Proyek Tujuan</th>
                  <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Konsumen</th>
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Kuari Asal</th>
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">Material</th>
                  <th className="py-2.5 px-3 w-[90px] min-w-[90px] whitespace-nowrap">Vol</th>
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Harga Jual</th>
                  {!isDispatcherUser && (
                    <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Harga Beli</th>
                  )}
                  <th className="py-2.5 px-3 w-[110px] min-w-[110px] whitespace-nowrap">Beban Ops</th>
                  {!isDispatcherUser && (
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
                    <td colSpan={isDispatcherUser ? 14 : 16} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat riwayat ritase...' : 'Tidak ada data ritase yang sesuai filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const ent = resolveTransactionEntities(tx, entityMaps);
                    return (
                      <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#111111] whitespace-nowrap w-[140px] align-middle">
                          {tx.ticketNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-[#555555] whitespace-nowrap w-[105px] align-middle">
                          {formatDateID(tx.deliveryDate || tx.date)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[110px] align-middle">
                          <DynamicEntityText
                            name={ent.truck.name}
                            isOrphan={ent.truck.isOrphan}
                            tooltipText={ent.truck.tooltipText}
                            className="font-mono font-bold text-[#111111]"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                          <DynamicEntityText
                            name={ent.driver.name}
                            isOrphan={ent.driver.isOrphan}
                            tooltipText={ent.driver.tooltipText}
                            className="text-[#444444]"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[150px] align-middle">
                          <DynamicEntityText
                            name={ent.project.name}
                            isOrphan={ent.project.isOrphan}
                            tooltipText={ent.project.tooltipText}
                            className="text-[#444444]"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[160px] align-middle">
                          <DynamicEntityText
                            name={ent.client.name}
                            isOrphan={ent.client.isOrphan}
                            tooltipText={ent.client.tooltipText}
                            className="font-medium text-[#111111]"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                          <DynamicEntityText
                            name={ent.quarry.name}
                            isOrphan={ent.quarry.isOrphan}
                            tooltipText={ent.quarry.tooltipText}
                            className="text-[#555555]"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap w-[140px] align-middle">
                          <DynamicEntityText
                            name={ent.material.name}
                            isOrphan={ent.material.isOrphan}
                            tooltipText={ent.material.tooltipText}
                            className="text-[#555555]"
                          />
                        </td>
                      <td className="py-2.5 px-3 font-bold tracking-tight text-[#111111] whitespace-nowrap w-[90px] align-middle">
                        {formatVolumeDisplay(tx.quantity, tx.unit)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        <PricePerVolCell
                          unitPrice={tx.sellPricePerUnit}
                          totalPrice={tx.totalRevenue}
                          unit={tx.unit}
                          quantity={tx.quantity}
                        />
                      </td>
                      {!isDispatcherUser && (
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
                      {!isDispatcherUser && (
                        <td className={`py-2.5 px-3 font-bold tracking-tight whitespace-nowrap w-[125px] align-middle ${
                          tx.netProfit < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                        }`}>
                          {formatRupiah(tx.netProfit)}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={tx.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#111111] whitespace-nowrap w-[105px] align-middle">
                        {resolveCreatorName(tx.createdBy, systemUsersMap)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Lihat Rincian',
                                onClick: () => setSelectedDetailTx(tx)
                              },
                              {
                                label: 'Edit Tiket',
                                onClick: () => setSelectedEditTx(tx)
                              },
                              {
                                label: 'Tandai Lunas',
                                hidden: tx.status === 'LUNAS',
                                onClick: () => setSettleTarget(tx)
                              },
                              {
                                label: 'Salin No. Tiket',
                                onClick: () => navigator.clipboard.writeText(tx.ticketNumber)
                              },
                              {
                                label: 'Hapus Tiket',
                                variant: 'danger',
                                onClick: () => handleDeleteRitase(tx)
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
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ARMADA & PLAT NOMOR                                     */}
        {/* ============================================================== */}
        {activeSubTab === 'vehicles' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">No. Plat Truk</th>
                  <th className="py-2.5 px-3 w-[180px] min-w-[180px] whitespace-nowrap">Supir Terakhir / Default</th>
                  <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Tipe Armada</th>
                  <th className="py-2.5 px-3 w-[110px] min-w-[110px] text-center whitespace-nowrap">Total Ritase</th>
                  <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Sumber Data</th>
                  <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data armada...' : 'Belum ada data armada yang sesuai.'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#111111] whitespace-nowrap w-[140px] align-middle">
                        {v.plateNumber}
                      </td>
                      <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[180px] align-middle">
                        <RunningText
                          text={v.driverName}
                          placeholder="Belum tercatat"
                          className="text-[#444444]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap w-[130px] align-middle">
                        {v.truckType || 'Dump Truck'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold tracking-tight text-[#111111] whitespace-nowrap w-[110px] align-middle">
                        {v.totalTrips || 0} trip
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#777777] whitespace-nowrap w-[160px] align-middle">
                        {v.source === 'MANUAL' ? 'Terdaftar Master' : 'Riwayat Ritase'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data',
                                onClick: () => setEditVehicleTarget(v)
                              },
                              {
                                label: 'Salin Plat Nomor',
                                onClick: () => navigator.clipboard.writeText(v.plateNumber)
                              },
                              {
                                label: 'Hapus Armada',
                                variant: 'danger',
                                hidden: v.source !== 'MANUAL',
                                onClick: () =>
                                  requestAuthorization(
                                    'Hapus Data Armada',
                                    'Armada yang terdaftar di master akan dihapus dari daftar.',
                                    v.plateNumber,
                                    async () => {
                                      await deleteMasterVehicle(v.id);
                                    },
                                    true,
                                    'Hapus Armada'
                                  )
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DAFTAR SUPIR                                            */}
        {/* ============================================================== */}
        {activeSubTab === 'drivers' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 w-[170px] min-w-[170px] whitespace-nowrap">Nama Supir</th>
                  <th className="py-2.5 px-3 w-[150px] min-w-[150px] whitespace-nowrap">Nomor HP / WhatsApp</th>
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] whitespace-nowrap">Default Plat Truk</th>
                  <th className="py-2.5 px-3 w-[260px] min-w-[260px] whitespace-nowrap">Catatan</th>
                  <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data supir...' : 'Belum ada data supir tersimpan.'}
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(d => (
                    <tr key={d.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#111111] whitespace-nowrap w-[170px] align-middle">
                        <RunningText text={d.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                        {d.phoneNumber ? formatPhoneNumber(d.phoneNumber) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#111111] whitespace-nowrap w-[140px] align-middle">
                        {d.defaultPlate || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap w-[260px] align-middle">
                        <RunningText text={d.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data',
                                onClick: () => setEditDriverTarget(d)
                              },
                              {
                                label: 'Hubungi via WhatsApp',
                                hidden: !d.phoneNumber,
                                onClick: () => {
                                  if (d.phoneNumber) {
                                    const cleanNum = d.phoneNumber.replace(/[^0-9]/g, '');
                                    window.open(`https://wa.me/${cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum}`, '_blank');
                                  }
                                }
                              },
                              {
                                label: 'Salin Kontak',
                                hidden: !d.phoneNumber,
                                onClick: () => {
                                  if (d.phoneNumber) navigator.clipboard.writeText(d.phoneNumber);
                                }
                              },
                              {
                                label: 'Hapus Supir',
                                variant: 'danger',
                                onClick: () =>
                                  requestAuthorization(
                                    'Hapus Data Supir',
                                    'Data supir ini akan dihapus dari daftar master supir.',
                                    d.name,
                                    async () => {
                                      await deleteMasterDriver(d.id);
                                    },
                                    true,
                                    'Hapus Supir'
                                  )
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL EDIT TIKET RITASE DENGAN PIN OTORISASI                   */}
      {/* ============================================================== */}
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
          onClose={() => setSelectedDetailTx(null)}
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

      {/* ============================================================== */}
      {/* MODAL-MODAL EDIT MASTER DATA DENGAN PIN OTORISASI              */}
      {/* ============================================================== */}

      {/* 1. Edit Armada Modal */}
      {editVehicleTarget && (
        <CustomDialog
          isOpen={Boolean(editVehicleTarget)}
          onClose={() => setEditVehicleTarget(null)}
          title="Edit Data Armada"
          description={`Koreksi rincian armada plat nomor ${editVehicleTarget.plateNumber}.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Otorisasi Edit Armada',
                'Simpan pembaruan data armada truk.',
                editVehicleTarget.plateNumber,
                async () => {
                  await saveMasterVehicle(
                    editVehicleTarget.plateNumber,
                    editVehicleTarget.driverName,
                    editVehicleTarget.truckType,
                    editVehicleTarget.notes
                  );
                  setEditVehicleTarget(null);
                }
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor Plat Truk (Terkunci)</label>
              <input
                type="text"
                value={editVehicleTarget.plateNumber}
                disabled
                className="w-full font-mono font-bold bg-[#f5f5f5] border border-[#dddddd] rounded-[8px] px-3.5 py-2 text-xs text-[#555555]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Sopir Default</label>
              <input
                type="text"
                value={editVehicleTarget.driverName || ''}
                onChange={e => setEditVehicleTarget({ ...editVehicleTarget, driverName: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Tipe Armada</label>
              <input
                type="text"
                value={editVehicleTarget.truckType || ''}
                onChange={e => setEditVehicleTarget({ ...editVehicleTarget, truckType: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Catatan</label>
              <input
                type="text"
                value={editVehicleTarget.notes || ''}
                onChange={e => setEditVehicleTarget({ ...editVehicleTarget, notes: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditVehicleTarget(null)}
                className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </CustomDialog>
      )}

      {/* 2. Edit Supir Modal */}
      {editDriverTarget && (
        <CustomDialog
          isOpen={Boolean(editDriverTarget)}
          onClose={() => setEditDriverTarget(null)}
          title="Edit Profil Supir"
          description={`Koreksi data profil dan nomor kontak supir ${editDriverTarget.name}.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Otorisasi Edit Supir',
                'Simpan pembaruan data supir armada.',
                editDriverTarget.name,
                async () => {
                  await saveMasterDriver(
                    editDriverTarget.name,
                    editDriverTarget.phoneNumber,
                    editDriverTarget.defaultPlate,
                    editDriverTarget.notes,
                    editDriverTarget.id
                  );
                  setEditDriverTarget(null);
                }
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Supir</label>
              <input
                type="text"
                value={editDriverTarget.name}
                onChange={e => setEditDriverTarget({ ...editDriverTarget, name: formatPersonNameLive(e.target.value) })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor HP / WhatsApp</label>
              <PhoneInput
                value={editDriverTarget.phoneNumber || ''}
                onChange={val => setEditDriverTarget({ ...editDriverTarget, phoneNumber: val })}
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Default Plat Truk</label>
              <input
                type="text"
                value={editDriverTarget.defaultPlate || ''}
                onChange={e => setEditDriverTarget({ ...editDriverTarget, defaultPlate: formatTruckPlate(e.target.value) })}
                className="w-full font-mono uppercase bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Catatan</label>
              <input
                type="text"
                value={editDriverTarget.notes || ''}
                onChange={e => setEditDriverTarget({ ...editDriverTarget, notes: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditDriverTarget(null)}
                className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </CustomDialog>
      )}

      {/* ============================================================== */}
      {/* MODAL-MODAL TAMBAH MASTER DATA BARU                            */}
      {/* ============================================================== */}

      {/* Modal Tambah Armada Baru */}
      <CustomDialog
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setPlateError('');
        }}
        title="Daftarkan Armada Baru"
        description="Masukkan plat nomor resmi untuk pembakuan data armada di sistem."
      >
        <form onSubmit={handleSaveVehicle} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nomor Plat Truk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputPlate}
              onChange={e => {
                setInputPlate(formatTruckPlate(e.target.value));
                setPlateError('');
              }}
              placeholder="Contoh: B 9123 PDA"
              required
              className="w-full font-mono uppercase bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
            {plateError && <p className="text-red-500 text-[11px] mt-1">{plateError}</p>}
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Sopir Default (Opsional)
            </label>
            <input
              type="text"
              value={inputPlateDriver}
              onChange={e => setInputPlateDriver(formatPersonNameLive(e.target.value))}
              placeholder="Contoh: Pak Herman"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Tipe Armada
            </label>
            <input
              type="text"
              value={inputPlateType}
              onChange={e => setInputPlateType(e.target.value)}
              placeholder="Contoh: Dump Truck 6m3 / Tronton"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Catatan Armada (Opsional)
            </label>
            <input
              type="text"
              value={inputPlateNotes}
              onChange={e => setInputPlateNotes(e.target.value)}
              placeholder="Contoh: Armada langganan kuari Cilegon"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
            >
              Simpan Armada
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* Modal Tambah Supir Baru */}
      <CustomDialog
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        title="Tambah Supir Baru"
        description="Daftarkan profil supir untuk kemudahan pengisian form ritase."
      >
        <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Lengkap Supir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputDriverName}
              onChange={e => setInputDriverName(formatPersonNameLive(e.target.value))}
              placeholder="Contoh: Herman Suherman"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <PhoneInput
              value={inputDriverPhone}
              onChange={setInputDriverPhone}
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Default Plat Truk
            </label>
            <input
              type="text"
              value={inputDriverPlate}
              onChange={e => setInputDriverPlate(formatTruckPlate(e.target.value))}
              placeholder="Contoh: B 9123 PDA"
              className="w-full font-mono uppercase bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Catatan
            </label>
            <input
              type="text"
              value={inputDriverNotes}
              onChange={e => setInputDriverNotes(e.target.value)}
              placeholder="Contoh: Supir rute Cilegon"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsDriverModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
            >
              Simpan Supir
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* ============================================================== */}
      {/* DIALOG OTORISASI PIN TERPADU (DEFAULT "2008005")               */}
      {/* ============================================================== */}
      <PinAuthModal
        isOpen={pinModalConfig.isOpen}
        title={pinModalConfig.title}
        description={pinModalConfig.description}
        targetLabel={pinModalConfig.targetLabel}
        isDestructive={pinModalConfig.isDestructive}
        confirmText={pinModalConfig.confirmText}
        onSuccess={async () => {
          await pinModalConfig.onExecute();
          setPinModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
