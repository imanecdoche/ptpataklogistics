import React, { useState, useEffect, useMemo } from 'react';
import {
  MasterVehicle,
  MasterDriver,
  MasterQuarry,
  Investor,
  Client,
  DispatchTransaction,
  MaterialItem,
  Project
} from '@/types/database';
import {
  subscribeMasterVehicles,
  saveMasterVehicle,
  deleteMasterVehicle,
  combineVehicleData,
  subscribeMasterDrivers,
  saveMasterDriver,
  deleteMasterDriver,
  subscribeMasterQuarries,
  saveMasterQuarry,
  deleteMasterQuarry
} from '@/lib/databaseMasterService';
import {
  subscribeInvestors,
  saveInvestor,
  deleteInvestor
} from '@/lib/investorService';
import { subscribeClients, deleteClient, updateClient } from '@/lib/clientService';
import {
  getMaterials,
  subscribeAllTransactions,
  updateDispatchTransaction,
  deleteDispatchTransaction,
  settleTransaction,
  UpdateDispatchPayload
} from '@/lib/dispatcherService';
import {
  subscribeProjects,
  saveProject,
  deleteProject
} from '@/lib/projectService';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { formatTruckPlate, isValidRegionCode, extractRegionCode } from '@/components/ui/TruckPlateInput';
import { NewClientModal } from '@/components/ui/NewClientModal';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { DispatchDetailModal } from '@/components/dispatcher/DispatchDetailModal';
import { EditDispatchModal } from '@/components/dispatcher/EditDispatchModal';

type SubTab = 'ritase' | 'projects' | 'vehicles' | 'drivers' | 'clients' | 'quarries' | 'investors';
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
}

export function DatabasePage({ userEmail }: DatabasePageProps): React.JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ritase');
  const [searchQuery, setSearchQuery] = useState('');

  // Data Collections
  const [masterVehicles, setMasterVehicles] = useState<MasterVehicle[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [drivers, setDrivers] = useState<MasterDriver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
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
  const [isQuarryModalOpen, setIsQuarryModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

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

  const [inputQuarryName, setInputQuarryName] = useState('');
  const [inputQuarryLocation, setInputQuarryLocation] = useState('');
  const [inputQuarryPIC, setInputQuarryPIC] = useState('');
  const [inputQuarryPhone, setInputQuarryPhone] = useState('');

  const [inputInvestorName, setInputInvestorName] = useState('');
  const [inputInvestorPhone, setInputInvestorPhone] = useState('');
  const [inputInvestorBank, setInputInvestorBank] = useState('');
  const [inputInvestorCapital, setInputInvestorCapital] = useState<number>(0);
  const [inputInvestorNotes, setInputInvestorNotes] = useState('');

  const [inputProjectName, setInputProjectName] = useState('');
  const [inputProjectLocation, setInputProjectLocation] = useState('');
  const [inputProjectInvestorId, setInputProjectInvestorId] = useState('');
  const [inputProjectClientId, setInputProjectClientId] = useState('');
  const [inputProjectInitialDeposit, setInputProjectInitialDeposit] = useState<number>(0);
  const [inputProjectNotes, setInputProjectNotes] = useState('');

  // Modals & Target Edit
  const [selectedDetailTx, setSelectedDetailTx] = useState<DispatchTransaction | null>(null);
  const [selectedEditTx, setSelectedEditTx] = useState<DispatchTransaction | null>(null);

  const [editVehicleTarget, setEditVehicleTarget] = useState<MasterVehicle | null>(null);
  const [editDriverTarget, setEditDriverTarget] = useState<MasterDriver | null>(null);
  const [editClientTarget, setEditClientTarget] = useState<Client | null>(null);
  const [editQuarryTarget, setEditQuarryTarget] = useState<MasterQuarry | null>(null);
  const [editInvestorTarget, setEditInvestorTarget] = useState<Investor | null>(null);
  const [editProjectTarget, setEditProjectTarget] = useState<Project | null>(null);

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

    const unsubQuarries = subscribeMasterQuarries(list => {
      setQuarries(list);
    });

    const unsubInvestors = subscribeInvestors(list => {
      setInvestors(list);
    });

    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });

    const unsubTx = subscribeAllTransactions(list => {
      setTransactions(list);
      setIsLoading(false);
    });

    getMaterials().then(setMaterials).catch(console.error);

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubClients();
      unsubQuarries();
      unsubInvestors();
      unsubProjects();
      unsubTx();
    };
  }, []);

  // Format Helper
  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // Filter Data Proyek
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.investorName.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [projects, searchQuery]);

  // Agregasi seluruh data armada (manual + riwayat transaksi)
  const combinedVehicles = useMemo(() => {
    return combineVehicleData(transactions, masterVehicles);
  }, [transactions, masterVehicles]);

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

    // 3. Filter Jenis Material
    if (materialFilter !== 'all') {
      result = result.filter(tx => tx.materialName.toLowerCase() === materialFilter.toLowerCase());
    }

    // 4. Filter Klien
    if (clientFilter !== 'all') {
      result = result.filter(tx => {
        const cName = (tx.customerName || tx.clientName || '').toLowerCase();
        return cName === clientFilter.toLowerCase();
      });
    }

    // 5. Filter Pencarian Text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        tx =>
          tx.ticketNumber.toLowerCase().includes(q) ||
          tx.truckPlate.toLowerCase().includes(q) ||
          (tx.driverName && tx.driverName.toLowerCase().includes(q)) ||
          (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
          (tx.clientName && tx.clientName.toLowerCase().includes(q)) ||
          (tx.quarryName && tx.quarryName.toLowerCase().includes(q)) ||
          tx.materialName.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
      );
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
  }, [transactions, timeRangeFilter, statusFilter, materialFilter, clientFilter, searchQuery, sortOption]);

  // Kalkulasi Ringkasan Finansial Riwayat Ritase yang Difilter
  const ritaseMetrics = useMemo(() => {
    const totalRitase = filteredTransactions.length;
    const totalOmset = filteredTransactions.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
    const totalBelanjaKuari = filteredTransactions.reduce((acc, curr) => acc + (curr.totalBuyCost || 0), 0);
    const totalLabaBersih = filteredTransactions.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    return { totalRitase, totalOmset, totalBelanjaKuari, totalLabaBersih };
  }, [filteredTransactions]);

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

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.picName && c.picName.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
    );
  }, [clients, searchQuery]);

  const filteredQuarries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quarries;
    return quarries.filter(
      qry =>
        qry.name.toLowerCase().includes(q) ||
        (qry.location && qry.location.toLowerCase().includes(q)) ||
        (qry.contactPerson && qry.contactPerson.toLowerCase().includes(q))
    );
  }, [quarries, searchQuery]);

  const filteredInvestors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return investors;
    return investors.filter(
      inv =>
        inv.name.toLowerCase().includes(q) ||
        (inv.phoneNumber && inv.phoneNumber.includes(q)) ||
        (inv.bankAccount && inv.bankAccount.toLowerCase().includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q))
    );
  }, [investors, searchQuery]);

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

  const handleSaveQuarry = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputQuarryName.trim()) return;

    try {
      await saveMasterQuarry(
        inputQuarryName,
        inputQuarryLocation,
        inputQuarryPIC,
        inputQuarryPhone
      );
      setIsQuarryModalOpen(false);
      setInputQuarryName('');
      setInputQuarryLocation('');
      setInputQuarryPIC('');
      setInputQuarryPhone('');
    } catch (err) {
      console.error('Gagal menyimpan kuari:', err);
    }
  };

  const handleSaveInvestor = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputInvestorName.trim()) return;

    try {
      await saveInvestor({
        name: inputInvestorName,
        phoneNumber: inputInvestorPhone,
        bankAccount: inputInvestorBank,
        initialCapital: Number(inputInvestorCapital) || 0,
        notes: inputInvestorNotes
      });
      setIsInvestorModalOpen(false);
      setInputInvestorName('');
      setInputInvestorPhone('');
      setInputInvestorBank('');
      setInputInvestorCapital(0);
      setInputInvestorNotes('');
    } catch (err) {
      console.error('Gagal menyimpan investor:', err);
    }
  };

  const handleSaveProject = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputProjectName.trim()) return;

    const inv = investors.find(i => i.id === inputProjectInvestorId);
    const cl = clients.find(c => c.id === inputProjectClientId);

    try {
      await saveProject({
        name: inputProjectName,
        location: inputProjectLocation,
        investorId: inputProjectInvestorId,
        investorName: inv?.name || 'Investor Umum',
        clientId: inputProjectClientId,
        clientName: cl?.name || 'Klien Umum',
        initialDeposit: Number(inputProjectInitialDeposit) || 0,
        notes: inputProjectNotes
      });
      setIsProjectModalOpen(false);
      setInputProjectName('');
      setInputProjectLocation('');
      setInputProjectInvestorId('');
      setInputProjectClientId('');
      setInputProjectInitialDeposit(0);
      setInputProjectNotes('');
    } catch (err) {
      console.error('Gagal menyimpan proyek:', err);
    }
  };

  const handleDeleteProject = (proj: Project) => {
    requestAuthorization(
      'Hapus Data Proyek',
      'Proyek akan dihapus dari sistem. Pastikan tidak ada tiket ritase berjalan yang terikat pada proyek ini.',
      proj.name,
      async () => {
        await deleteProject(proj.id);
      },
      true,
      'Hapus Proyek'
    );
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
      `${tx.ticketNumber} • ${tx.truckPlate}`,
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
          onClick={() => {
            setActiveSubTab('ritase');
            setSearchQuery('');
          }}
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

        {/* Tab 2: Master Proyek */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('projects');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Master Proyek</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'projects' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {projects.length}
          </span>
        </button>

        {/* Tab 3: Armada & Plat Nomor */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('vehicles');
            setSearchQuery('');
          }}
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

        {/* Tab 4: Daftar Supir */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('drivers');
            setSearchQuery('');
          }}
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

        {/* Tab 5: Klien / Pelanggan */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('clients');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'clients'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Klien / Pelanggan</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'clients' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {clients.length}
          </span>
        </button>

        {/* Tab 6: Kuari Asal */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('quarries');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'quarries'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Kuari Asal</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'quarries' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {quarries.length}
          </span>
        </button>

        {/* Tab 7: Investor & Permodalan */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('investors');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'investors'
              ? 'bg-[#111111] text-white'
              : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
          }`}
        >
          <span>Investor</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
              activeSubTab === 'investors' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#777777]'
            }`}
          >
            {investors.length}
          </span>
        </button>
      </div>

      {/* 2. KONTROL FILTER & SEARCH BAR */}
      <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#eaeaea] space-y-3">
        {/* Baris Utama: Search Bar & Tombol Tambah */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'ritase'
                  ? 'Cari tiket, plat nomor, supir, klien, material, catatan...'
                  : activeSubTab === 'projects'
                  ? 'Cari nama proyek, lokasi, investor, atau klien...'
                  : activeSubTab === 'vehicles'
                  ? 'Cari plat nomor atau nama supir...'
                  : activeSubTab === 'drivers'
                  ? 'Cari nama atau nomor HP supir...'
                  : activeSubTab === 'clients'
                  ? 'Cari nama klien / perusahaan...'
                  : activeSubTab === 'quarries'
                  ? 'Cari nama kuari atau lokasi tambang...'
                  : 'Cari nama investor, kontak, atau rekening...'
              }
              className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'projects' && (
              <button
                type="button"
                onClick={() => {
                  if (investors.length > 0 && investors[0]) setInputProjectInvestorId(investors[0].id);
                  if (clients.length > 0 && clients[0]) setInputProjectClientId(clients[0].id);
                  setIsProjectModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Proyek Baru</span>
              </button>
            )}

            {activeSubTab === 'vehicles' && (
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Daftarkan Armada Baru</span>
              </button>
            )}

            {activeSubTab === 'drivers' && (
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Supir Baru</span>
              </button>
            )}

            {activeSubTab === 'clients' && (
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Klien Baru</span>
              </button>
            )}

            {activeSubTab === 'quarries' && (
              <button
                type="button"
                onClick={() => setIsQuarryModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Kuari Baru</span>
              </button>
            )}

            {activeSubTab === 'investors' && (
              <button
                type="button"
                onClick={() => setIsInvestorModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Tambah Investor Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar Khusus Riwayat Ritase: Rentang Waktu, Status, Material, Klien, dan Sorting */}
        {activeSubTab === 'ritase' && (
          <div className="pt-2 border-t border-[#f0f0f0] flex flex-wrap items-center gap-2 text-xs">
            {/* Rentang Waktu */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#888888] text-[11px] font-medium">Waktu:</span>
              <select
                value={timeRangeFilter}
                onChange={e => setTimeRangeFilter(e.target.value as TimeRangeFilter)}
                className="px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e0e0e0] rounded-[6px] text-xs font-medium text-[#222222] focus:outline-none focus:border-[#111111]"
              >
                <option value="all">Semua Waktu (All-Time)</option>
                <option value="today">Hari Ini</option>
                <option value="this_month">Bulan Ini</option>
                <option value="last_30_days">30 Hari Terakhir</option>
              </select>
            </div>

            {/* Status Pembayaran */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#888888] text-[11px] font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e0e0e0] rounded-[6px] text-xs font-medium text-[#222222] focus:outline-none focus:border-[#111111]"
              >
                <option value="all">Semua Status</option>
                <option value="TEMPO">TEMPO (Belum Lunas)</option>
                <option value="LUNAS">LUNAS</option>
              </select>
            </div>

            {/* Material */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#888888] text-[11px] font-medium">Material:</span>
              <select
                value={materialFilter}
                onChange={e => setMaterialFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e0e0e0] rounded-[6px] text-xs font-medium text-[#222222] focus:outline-none focus:border-[#111111] max-w-[150px] truncate"
              >
                <option value="all">Semua Material</option>
                {materials.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Klien */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#888888] text-[11px] font-medium">Klien:</span>
              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e0e0e0] rounded-[6px] text-xs font-medium text-[#222222] focus:outline-none focus:border-[#111111] max-w-[160px] truncate"
              >
                <option value="all">Semua Klien</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[#888888] text-[11px] font-medium">Urutkan:</span>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                className="px-2.5 py-1.5 bg-[#f9f9f9] border border-[#e0e0e0] rounded-[6px] text-xs font-medium text-[#222222] focus:outline-none focus:border-[#111111]"
              >
                <option value="date_desc">Tanggal Terbaru</option>
                <option value="date_asc">Tanggal Terlama</option>
                <option value="revenue_desc">Omset Tertinggi</option>
                <option value="revenue_asc">Omset Terendah</option>
                <option value="profit_desc">Laba Tertinggi</option>
                <option value="profit_asc">Laba Terendah</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. METRIC CARDS RINGKASAN KHUSUS TAB RIWAYAT RITASE (Aturan 71: 1 kolom di mobile) */}
      {activeSubTab === 'ritase' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Total Ritase */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Total Ritase Terfilter</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {ritaseMetrics.totalRitase}
              </span>
              <span className="text-xs text-[#777777]">trip</span>
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Dari seluruh armada aktif</span>
          </div>

          {/* Card 2: Total Omset Penjualan */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Total Omset (Piutang)</span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-bold font-mono text-[#111111]">
                {formatRupiah(ritaseMetrics.totalOmset)}
              </span>
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Bruto penjualan material</span>
          </div>

          {/* Card 3: Belanja Modal Kuari */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Total Belanja Kuari</span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-bold font-mono text-[#111111]">
                {formatRupiah(ritaseMetrics.totalBelanjaKuari)}
              </span>
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Beban beli material tunai</span>
          </div>

          {/* Card 4: Estimasi Laba Bersih */}
          <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-[#666666]">Estimasi Laba Bersih</span>
            <div className="mt-2">
              <span className={`text-lg sm:text-xl font-bold font-mono ${
                ritaseMetrics.totalLabaBersih < 0 ? 'text-[#cf1124]' : 'text-[#008060]'
              }`}>
                {formatRupiah(ritaseMetrics.totalLabaBersih)}
              </span>
            </div>
            <span className="text-[11px] text-[#888888] mt-1">Net profit setelah ops & kuari</span>
          </div>
        </div>
      )}

      {/* 4. TABEL DATA SESUAI SUB-TAB AKTIF */}
      <div className="bg-white rounded-[10px] border border-[#eaeaea] overflow-hidden">
        {/* ============================================================== */}
        {/* TAB 1: RIWAYAT RITASE (Aturan 66: fixed-width, nowrap, sticky) */}
        {/* ============================================================== */}
        {activeSubTab === 'ritase' && (
          <div className="overflow-x-auto select-text max-h-[640px]">
            <table className="w-full min-w-[1680px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5 w-[140px] min-w-[140px] whitespace-nowrap">No. Tiket</th>
                  <th className="py-2.5 px-3.5 w-[105px] min-w-[105px] whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3.5 w-[110px] min-w-[110px] whitespace-nowrap">No. Plat</th>
                  <th className="py-2.5 px-3.5 w-[130px] min-w-[130px] whitespace-nowrap">Supir</th>
                  <th className="py-2.5 px-3.5 w-[160px] min-w-[160px] whitespace-nowrap">Klien / Proyek</th>
                  <th className="py-2.5 px-3.5 w-[130px] min-w-[130px] whitespace-nowrap">Kuari Asal</th>
                  <th className="py-2.5 px-3.5 w-[140px] min-w-[140px] whitespace-nowrap">Material</th>
                  <th className="py-2.5 px-3.5 w-[90px] min-w-[90px] whitespace-nowrap">Vol</th>
                  <th className="py-2.5 px-3.5 w-[110px] min-w-[110px] whitespace-nowrap">Harga Jual</th>
                  <th className="py-2.5 px-3.5 w-[125px] min-w-[125px] whitespace-nowrap">Total Omset</th>
                  <th className="py-2.5 px-3.5 w-[125px] min-w-[125px] whitespace-nowrap">Belanja Kuari</th>
                  <th className="py-2.5 px-3.5 w-[110px] min-w-[110px] whitespace-nowrap">Beban Ops</th>
                  <th className="py-2.5 px-3.5 w-[125px] min-w-[125px] whitespace-nowrap">Laba Bersih</th>
                  <th className="py-2.5 px-3.5 w-[85px] min-w-[85px] whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 w-[180px] min-w-[180px] whitespace-nowrap">Catatan Ritase</th>
                  <th className="py-2.5 px-3.5 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-10 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat riwayat ritase...' : 'Tidak ada data ritase yang sesuai filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#111111] whitespace-nowrap w-[140px] align-middle">
                        {tx.ticketNumber}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#444444] whitespace-nowrap w-[105px] align-middle">
                        {tx.deliveryDate}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#111111] whitespace-nowrap w-[110px] align-middle">
                        {tx.truckPlate}
                      </td>
                      <td className="py-3 px-3.5 text-[#444444] whitespace-nowrap w-[130px] align-middle">
                        <RunningText text={tx.driverName} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-3.5 font-medium text-[#111111] whitespace-nowrap w-[160px] align-middle">
                        <RunningText text={tx.customerName || tx.clientName} className="font-medium text-[#111111]" />
                      </td>
                      <td className="py-3 px-3.5 text-[#555555] whitespace-nowrap w-[130px] align-middle">
                        <RunningText text={tx.quarryName} placeholder="-" className="text-[#555555]" />
                      </td>
                      <td className="py-3 px-3.5 text-[#555555] whitespace-nowrap w-[140px] align-middle">
                        {tx.materialName}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#111111] whitespace-nowrap w-[90px] align-middle">
                        {tx.quantity} {tx.unit}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#444444] whitespace-nowrap w-[110px] align-middle">
                        {formatRupiah(tx.sellPricePerUnit)}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-[#111111] whitespace-nowrap w-[125px] align-middle">
                        {formatRupiah(tx.totalRevenue)}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#555555] whitespace-nowrap w-[125px] align-middle">
                        {formatRupiah(tx.totalBuyCost)}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#555555] whitespace-nowrap w-[110px] align-middle">
                        {formatRupiah(tx.operationalCost)}
                      </td>
                      <td className={`py-3 px-3.5 font-mono font-bold whitespace-nowrap w-[125px] align-middle ${
                        tx.netProfit < 0 ? 'text-[#cf1124]' : 'text-[#008060]'
                      }`}>
                        {formatRupiah(tx.netProfit)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap w-[85px] align-middle">
                        {tx.status === 'LUNAS' ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#008060]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
                            LUNAS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#d97706]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                            TEMPO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[#666666] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={tx.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap w-[60px] align-middle">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: MASTER PROYEK                                             */}
        {/* ============================================================== */}
        {activeSubTab === 'projects' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[1070px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[180px] min-w-[180px] whitespace-nowrap">Nama Proyek</th>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] whitespace-nowrap">Lokasi</th>
                  <th className="py-2.5 px-4 w-[160px] min-w-[160px] whitespace-nowrap">Investor Pendana</th>
                  <th className="py-2.5 px-4 w-[160px] min-w-[160px] whitespace-nowrap">Klien / Pemilik</th>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] text-right whitespace-nowrap">Modal Awal Disetor</th>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] text-right whitespace-nowrap">Saldo Kas Berjalan</th>
                  <th className="py-2.5 px-4 w-[90px] min-w-[90px] text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data proyek...' : 'Belum ada data proyek terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap w-[180px] align-middle">
                        <span className="font-bold text-[#111111] block truncate">
                          {proj.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#888888] block">
                          {proj.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[140px] align-middle">
                        <RunningText text={proj.location} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 text-[#111111] whitespace-nowrap w-[160px] align-middle font-medium">
                        <RunningText text={proj.investorName} placeholder="Umum" className="text-[#111111]" />
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[160px] align-middle">
                        <RunningText text={proj.clientName} placeholder="Umum" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#111111] text-right whitespace-nowrap w-[140px] align-middle">
                        {formatRupiah(proj.initialDeposit || 0)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-right whitespace-nowrap w-[140px] align-middle text-[#008060]">
                        {formatRupiah(proj.currentBalance || 0)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap w-[90px] align-middle">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            proj.status === 'COMPLETED'
                              ? 'bg-[#f0fdf4] text-[#166534]'
                              : proj.status === 'ON_HOLD'
                              ? 'bg-[#fefce8] text-[#854d0e]'
                              : 'bg-[#eff6ff] text-[#1e40af]'
                          }`}
                        >
                          {proj.status === 'COMPLETED' ? 'SELESAI' : proj.status === 'ON_HOLD' ? 'HOLD' : 'AKTIF'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data Proyek',
                                onClick: () => setEditProjectTarget(proj)
                              },
                              {
                                label: 'Salin ID Proyek',
                                onClick: () => navigator.clipboard.writeText(proj.id)
                              },
                              {
                                label: 'Hapus Proyek',
                                variant: 'danger',
                                onClick: () => handleDeleteProject(proj)
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
        {/* TAB 3: ARMADA & PLAT NOMOR                                     */}
        {/* ============================================================== */}
        {activeSubTab === 'vehicles' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] whitespace-nowrap">No. Plat Truk</th>
                  <th className="py-2.5 px-4 w-[180px] min-w-[180px] whitespace-nowrap">Supir Terakhir / Default</th>
                  <th className="py-2.5 px-4 w-[130px] min-w-[130px] whitespace-nowrap">Tipe Armada</th>
                  <th className="py-2.5 px-4 w-[110px] min-w-[110px] text-center whitespace-nowrap">Total Ritase</th>
                  <th className="py-2.5 px-4 w-[160px] min-w-[160px] whitespace-nowrap">Sumber Data</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data armada...' : 'Belum ada data armada yang sesuai.'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#111111] whitespace-nowrap w-[140px] align-middle">
                        {v.plateNumber}
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[180px] align-middle">
                        <RunningText
                          text={v.driverName}
                          placeholder="Belum tercatat"
                          className="text-[#444444]"
                        />
                      </td>
                      <td className="py-3 px-4 text-[#666666] whitespace-nowrap w-[130px] align-middle">
                        {v.truckType || 'Dump Truck'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-[#111111] whitespace-nowrap w-[110px] align-middle">
                        {v.totalTrips || 0} trip
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#777777] whitespace-nowrap w-[160px] align-middle">
                        {v.source === 'MANUAL' ? 'Terdaftar Master' : 'Riwayat Ritase'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
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
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[170px] min-w-[170px] whitespace-nowrap">Nama Supir</th>
                  <th className="py-2.5 px-4 w-[150px] min-w-[150px] whitespace-nowrap">Nomor HP / WhatsApp</th>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] whitespace-nowrap">Default Plat Truk</th>
                  <th className="py-2.5 px-4 w-[260px] min-w-[260px] whitespace-nowrap">Catatan</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data supir...' : 'Belum ada data supir tersimpan.'}
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(d => (
                    <tr key={d.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111111] whitespace-nowrap w-[170px] align-middle">
                        <RunningText text={d.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                        {d.phoneNumber || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#111111] whitespace-nowrap w-[140px] align-middle">
                        {d.defaultPlate || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#666666] whitespace-nowrap w-[260px] align-middle">
                        <RunningText text={d.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
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

        {/* ============================================================== */}
        {/* TAB 4: KLIEN / PELANGGAN                                       */}
        {/* ============================================================== */}
        {activeSubTab === 'clients' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[210px] min-w-[210px] whitespace-nowrap">Nama Klien / Perusahaan</th>
                  <th className="py-2.5 px-4 w-[120px] min-w-[120px] whitespace-nowrap">Tipe</th>
                  <th className="py-2.5 px-4 w-[160px] min-w-[160px] whitespace-nowrap">PIC Lapangan</th>
                  <th className="py-2.5 px-4 w-[150px] min-w-[150px] whitespace-nowrap">Nomor HP / WA</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data klien...' : 'Belum ada klien tersimpan.'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111111] whitespace-nowrap w-[210px] align-middle">
                        <RunningText text={c.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-3 px-4 text-[#666666] whitespace-nowrap w-[120px] align-middle">
                        {c.type || 'PERORANGAN'}
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[160px] align-middle">
                        <RunningText text={c.picName} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                        {c.phoneNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data',
                                onClick: () => setEditClientTarget(c)
                              },
                              {
                                label: 'Hubungi via WhatsApp',
                                hidden: !c.phoneNumber,
                                onClick: () => {
                                  if (c.phoneNumber) {
                                    const cleanNum = c.phoneNumber.replace(/[^0-9]/g, '');
                                    window.open(`https://wa.me/${cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum}`, '_blank');
                                  }
                                }
                              },
                              {
                                label: 'Salin Kontak',
                                hidden: !c.phoneNumber,
                                onClick: () => {
                                  if (c.phoneNumber) navigator.clipboard.writeText(c.phoneNumber);
                                }
                              },
                              {
                                label: 'Hapus Klien',
                                variant: 'danger',
                                onClick: () =>
                                  requestAuthorization(
                                    'Hapus Data Klien',
                                    'Data klien ini akan dihapus dari sistem master klien.',
                                    c.name,
                                    async () => {
                                      await deleteClient(c.id);
                                    },
                                    true,
                                    'Hapus Klien'
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
        {/* TAB 5: KUARI ASAL                                              */}
        {/* ============================================================== */}
        {activeSubTab === 'quarries' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[190px] min-w-[190px] whitespace-nowrap">Nama Kuari / Pemasok</th>
                  <th className="py-2.5 px-4 w-[220px] min-w-[220px] whitespace-nowrap">Lokasi Tambang</th>
                  <th className="py-2.5 px-4 w-[160px] min-w-[160px] whitespace-nowrap">PIC Tambang</th>
                  <th className="py-2.5 px-4 w-[150px] min-w-[150px] whitespace-nowrap">Kontak / HP</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredQuarries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data kuari...' : 'Belum ada kuari tersimpan.'}
                    </td>
                  </tr>
                ) : (
                  filteredQuarries.map(qry => (
                    <tr key={qry.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111111] whitespace-nowrap w-[190px] align-middle">
                        <RunningText text={qry.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[220px] align-middle">
                        <RunningText text={qry.location} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[160px] align-middle">
                        <RunningText text={qry.contactPerson} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                        {qry.phoneNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data',
                                onClick: () => setEditQuarryTarget(qry)
                              },
                              {
                                label: 'Hubungi via WhatsApp',
                                hidden: !qry.phoneNumber,
                                onClick: () => {
                                  if (qry.phoneNumber) {
                                    const cleanNum = qry.phoneNumber.replace(/[^0-9]/g, '');
                                    window.open(`https://wa.me/${cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum}`, '_blank');
                                  }
                                }
                              },
                              {
                                label: 'Salin Info Kontak',
                                hidden: !qry.phoneNumber,
                                onClick: () => {
                                  if (qry.phoneNumber) navigator.clipboard.writeText(qry.phoneNumber);
                                }
                              },
                              {
                                label: 'Hapus Kuari',
                                variant: 'danger',
                                onClick: () =>
                                  requestAuthorization(
                                    'Hapus Data Kuari',
                                    'Data lokasi kuari ini akan dihapus dari daftar.',
                                    qry.name,
                                    async () => {
                                      await deleteMasterQuarry(qry.id);
                                    },
                                    true,
                                    'Hapus Kuari'
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
        {/* TAB 6: INVESTOR & PERMODALAN                                   */}
        {/* ============================================================== */}
        {activeSubTab === 'investors' && (
          <div className="overflow-x-auto select-text">
            <table className="w-full min-w-[890px] table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-[190px] min-w-[190px] whitespace-nowrap">Nama Investor / Pemodal</th>
                  <th className="py-2.5 px-4 w-[140px] min-w-[140px] whitespace-nowrap">Nomor Kontak / WA</th>
                  <th className="py-2.5 px-4 w-[210px] min-w-[210px] whitespace-nowrap">Informasi Rekening / Bank</th>
                  <th className="py-2.5 px-4 w-[170px] min-w-[170px] text-right whitespace-nowrap">Modal / Investasi Awal</th>
                  <th className="py-2.5 px-4 w-[180px] min-w-[180px] whitespace-nowrap">Catatan</th>
                  <th className="py-2.5 px-4 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filteredInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#888888] whitespace-nowrap">
                      {isLoading ? 'Memuat data investor...' : 'Belum ada data investor tersimpan.'}
                    </td>
                  </tr>
                ) : (
                  filteredInvestors.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111111] whitespace-nowrap w-[190px] align-middle">
                        <RunningText text={inv.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#444444] whitespace-nowrap w-[140px] align-middle">
                        {inv.phoneNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#444444] whitespace-nowrap w-[210px] align-middle">
                        <RunningText text={inv.bankAccount} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#111111] text-right whitespace-nowrap w-[170px] align-middle">
                        {formatRupiah(inv.initialCapital || 0)}
                      </td>
                      <td className="py-3 px-4 text-[#666666] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={inv.notes} placeholder="-" className="text-[#666666]" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data',
                                onClick: () => setEditInvestorTarget(inv)
                              },
                              {
                                label: 'Hubungi via WhatsApp',
                                hidden: !inv.phoneNumber,
                                onClick: () => {
                                  if (inv.phoneNumber) {
                                    const cleanNum = inv.phoneNumber.replace(/[^0-9]/g, '');
                                    window.open(`https://wa.me/${cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum}`, '_blank');
                                  }
                                }
                              },
                              {
                                label: 'Salin Rekening',
                                hidden: !inv.bankAccount,
                                onClick: () => {
                                  if (inv.bankAccount) navigator.clipboard.writeText(inv.bankAccount);
                                }
                              },
                              {
                                label: 'Hapus Investor',
                                variant: 'danger',
                                onClick: () =>
                                  requestAuthorization(
                                    'Hapus Data Investor',
                                    'Data investor dan catatan modal ini akan dihapus permanen dari sistem.',
                                    inv.name,
                                    async () => {
                                      await deleteInvestor(inv.id);
                                    },
                                    true,
                                    'Hapus Investor'
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
          isOpen={Boolean(selectedEditTx)}
          transaction={selectedEditTx}
          materials={materials}
          clients={clients}
          onSave={handleUpdateRitase}
          onClose={() => setSelectedEditTx(null)}
        />
      )}

      {/* MODAL DETAIL RINCIAN TIKET RITASE */}
      {selectedDetailTx && (
        <DispatchDetailModal
          transaction={selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
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
                onChange={e => setEditDriverTarget({ ...editDriverTarget, name: e.target.value })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                value={editDriverTarget.phoneNumber || ''}
                onChange={e => setEditDriverTarget({ ...editDriverTarget, phoneNumber: e.target.value })}
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
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

      {/* 3. Edit Klien Modal */}
      {editClientTarget && (
        <CustomDialog
          isOpen={Boolean(editClientTarget)}
          onClose={() => setEditClientTarget(null)}
          title="Edit Data Klien"
          description={`Koreksi informasi kontak dan PIC klien ${editClientTarget.name}.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Otorisasi Edit Klien',
                'Simpan pembaruan data pelanggan.',
                editClientTarget.name,
                async () => {
                  await updateClient(editClientTarget.id, {
                    name: editClientTarget.name,
                    picName: editClientTarget.picName,
                    phoneNumber: editClientTarget.phoneNumber
                  });
                  setEditClientTarget(null);
                }
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Perusahaan / Klien</label>
              <input
                type="text"
                value={editClientTarget.name}
                onChange={e => setEditClientTarget({ ...editClientTarget, name: e.target.value })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">PIC Lapangan</label>
              <input
                type="text"
                value={editClientTarget.picName || ''}
                onChange={e => setEditClientTarget({ ...editClientTarget, picName: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                value={editClientTarget.phoneNumber || ''}
                onChange={e => setEditClientTarget({ ...editClientTarget, phoneNumber: e.target.value })}
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditClientTarget(null)}
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

      {/* 4. Edit Kuari Modal */}
      {editQuarryTarget && (
        <CustomDialog
          isOpen={Boolean(editQuarryTarget)}
          onClose={() => setEditQuarryTarget(null)}
          title="Edit Data Kuari"
          description={`Koreksi lokasi dan kontak PIC kuari ${editQuarryTarget.name}.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Otorisasi Edit Kuari',
                'Simpan pembaruan data kuari / tambang.',
                editQuarryTarget.name,
                async () => {
                  await saveMasterQuarry(
                    editQuarryTarget.name,
                    editQuarryTarget.location,
                    editQuarryTarget.contactPerson,
                    editQuarryTarget.phoneNumber,
                    editQuarryTarget.notes,
                    editQuarryTarget.id
                  );
                  setEditQuarryTarget(null);
                }
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Kuari</label>
              <input
                type="text"
                value={editQuarryTarget.name}
                onChange={e => setEditQuarryTarget({ ...editQuarryTarget, name: e.target.value })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Lokasi Tambang</label>
              <input
                type="text"
                value={editQuarryTarget.location || ''}
                onChange={e => setEditQuarryTarget({ ...editQuarryTarget, location: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">PIC Tambang</label>
              <input
                type="text"
                value={editQuarryTarget.contactPerson || ''}
                onChange={e => setEditQuarryTarget({ ...editQuarryTarget, contactPerson: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor Telepon Kuari</label>
              <input
                type="tel"
                value={editQuarryTarget.phoneNumber || ''}
                onChange={e => setEditQuarryTarget({ ...editQuarryTarget, phoneNumber: e.target.value })}
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditQuarryTarget(null)}
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

      {/* 5. Edit Investor Modal */}
      {editInvestorTarget && (
        <CustomDialog
          isOpen={Boolean(editInvestorTarget)}
          onClose={() => setEditInvestorTarget(null)}
          title="Edit Data Investor"
          description={`Koreksi profil dan rincian pemodal ${editInvestorTarget.name}.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Otorisasi Edit Investor',
                'Simpan pembaruan data dan informasi modal investor.',
                editInvestorTarget.name,
                async () => {
                  await saveInvestor(
                    {
                      name: editInvestorTarget.name,
                      phoneNumber: editInvestorTarget.phoneNumber,
                      bankAccount: editInvestorTarget.bankAccount,
                      initialCapital: Number(editInvestorTarget.initialCapital) || 0,
                      notes: editInvestorTarget.notes
                    },
                    editInvestorTarget.id
                  );
                  setEditInvestorTarget(null);
                }
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Nama Investor / Pemodal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editInvestorTarget.name}
                onChange={e => setEditInvestorTarget({ ...editInvestorTarget, name: e.target.value })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nomor Kontak / WhatsApp</label>
              <input
                type="tel"
                value={editInvestorTarget.phoneNumber || ''}
                onChange={e => setEditInvestorTarget({ ...editInvestorTarget, phoneNumber: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Informasi Rekening / Bank</label>
              <input
                type="text"
                value={editInvestorTarget.bankAccount || ''}
                onChange={e => setEditInvestorTarget({ ...editInvestorTarget, bankAccount: e.target.value })}
                placeholder="Contoh: BCA 123456789 a.n PT Investama"
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Modal / Investasi Awal (Rp)</label>
              <input
                type="number"
                value={editInvestorTarget.initialCapital || 0}
                onChange={e => setEditInvestorTarget({ ...editInvestorTarget, initialCapital: Number(e.target.value) || 0 })}
                min="0"
                step="500000"
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Catatan</label>
              <input
                type="text"
                value={editInvestorTarget.notes || ''}
                onChange={e => setEditInvestorTarget({ ...editInvestorTarget, notes: e.target.value })}
                placeholder="Contoh: Pemodal pengadaan unit dump truck"
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditInvestorTarget(null)}
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

      {/* 6. Edit Proyek Modal */}
      {editProjectTarget && (
        <CustomDialog
          isOpen={Boolean(editProjectTarget)}
          onClose={() => setEditProjectTarget(null)}
          title="Edit Data Proyek"
          description={`Koreksi data proyek ${editProjectTarget.name} dan alokasi investor pendana.`}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              requestAuthorization(
                'Edit Data Proyek',
                'Perubahan data proyek akan memperbarui alokasi permodalan dan relasi tiket ritase.',
                editProjectTarget.name,
                async () => {
                  const inv = investors.find(i => i.id === editProjectTarget.investorId);
                  const cl = clients.find(c => c.id === editProjectTarget.clientId);
                  await saveProject(
                    {
                      name: editProjectTarget.name,
                      location: editProjectTarget.location,
                      investorId: editProjectTarget.investorId,
                      investorName: inv?.name || editProjectTarget.investorName,
                      clientId: editProjectTarget.clientId,
                      clientName: cl?.name || editProjectTarget.clientName,
                      initialDeposit: editProjectTarget.initialDeposit,
                      status: editProjectTarget.status,
                      notes: editProjectTarget.notes
                    },
                    editProjectTarget.id
                  );
                  setEditProjectTarget(null);
                },
                false,
                'Simpan Perubahan'
              );
            }}
            className="space-y-3 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Proyek</label>
              <input
                type="text"
                value={editProjectTarget.name}
                onChange={e => setEditProjectTarget({ ...editProjectTarget, name: e.target.value })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Lokasi Proyek</label>
              <input
                type="text"
                value={editProjectTarget.location || ''}
                onChange={e => setEditProjectTarget({ ...editProjectTarget, location: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Investor Pendana</label>
              <select
                value={editProjectTarget.investorId}
                onChange={e => {
                  const inv = investors.find(i => i.id === e.target.value);
                  setEditProjectTarget({
                    ...editProjectTarget,
                    investorId: e.target.value,
                    investorName: inv?.name || ''
                  });
                }}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              >
                {investors.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Klien Pemilik Proyek</label>
              <select
                value={editProjectTarget.clientId}
                onChange={e => {
                  const cl = clients.find(c => c.id === e.target.value);
                  setEditProjectTarget({
                    ...editProjectTarget,
                    clientId: e.target.value,
                    clientName: cl?.name || ''
                  });
                }}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Modal Awal Disetor (Rp)</label>
              <input
                type="number"
                value={editProjectTarget.initialDeposit || 0}
                onChange={e => setEditProjectTarget({ ...editProjectTarget, initialDeposit: Number(e.target.value) || 0 })}
                min="0"
                step="500000"
                className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Status Proyek</label>
              <select
                value={editProjectTarget.status || 'ACTIVE'}
                onChange={e => setEditProjectTarget({ ...editProjectTarget, status: e.target.value as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              >
                <option value="ACTIVE">AKTIF</option>
                <option value="ON_HOLD">HOLD</option>
                <option value="COMPLETED">SELESAI</option>
              </select>
            </div>
            <div>
              <label className="block text-[#666666] font-medium mb-1">Catatan</label>
              <input
                type="text"
                value={editProjectTarget.notes || ''}
                onChange={e => setEditProjectTarget({ ...editProjectTarget, notes: e.target.value })}
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditProjectTarget(null)}
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
              onChange={e => setInputPlateDriver(e.target.value)}
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
              onChange={e => setInputDriverName(e.target.value)}
              placeholder="Contoh: Herman Suherman"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <input
              type="tel"
              value={inputDriverPhone}
              onChange={e => setInputDriverPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
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

      {/* Modal Tambah Kuari Baru */}
      <CustomDialog
        isOpen={isQuarryModalOpen}
        onClose={() => setIsQuarryModalOpen(false)}
        title="Tambah Kuari Baru"
        description="Daftarkan lokasi kuari / tambang sumber material tambang."
      >
        <form onSubmit={handleSaveQuarry} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Kuari / Tambang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputQuarryName}
              onChange={e => setInputQuarryName(e.target.value)}
              placeholder="Contoh: Kuari Cilegon Jaya"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Lokasi / Kota
            </label>
            <input
              type="text"
              value={inputQuarryLocation}
              onChange={e => setInputQuarryLocation(e.target.value)}
              placeholder="Contoh: Cilegon Barat"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              PIC Lapangan
            </label>
            <input
              type="text"
              value={inputQuarryPIC}
              onChange={e => setInputQuarryPIC(e.target.value)}
              placeholder="Contoh: Pak Ridwan"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nomor Telepon Kuari
            </label>
            <input
              type="tel"
              value={inputQuarryPhone}
              onChange={e => setInputQuarryPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsQuarryModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
            >
              Simpan Kuari
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* Modal Tambah Investor Baru */}
      <CustomDialog
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        title="Tambah Investor Baru"
        description="Daftarkan investor / pemilik modal untuk pencatatan permodalan logistik."
      >
        <form onSubmit={handleSaveInvestor} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Investor / Perusahaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputInvestorName}
              onChange={e => setInputInvestorName(e.target.value)}
              placeholder="Contoh: Bpk. H. Sukardi / PT Mandiri Investama"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <input
              type="tel"
              value={inputInvestorPhone}
              onChange={e => setInputInvestorPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Informasi Rekening / Bank
            </label>
            <input
              type="text"
              value={inputInvestorBank}
              onChange={e => setInputInvestorBank(e.target.value)}
              placeholder="Contoh: BCA 8891234567 a.n Sukardi"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Modal / Investasi Awal (Rp)
            </label>
            <input
              type="number"
              value={inputInvestorCapital || ''}
              onChange={e => setInputInvestorCapital(Number(e.target.value) || 0)}
              placeholder="Contoh: 100000000"
              min="0"
              step="500000"
              className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Catatan
            </label>
            <input
              type="text"
              value={inputInvestorNotes}
              onChange={e => setInputInvestorNotes(e.target.value)}
              placeholder="Contoh: Modal pengadaan unit armada 01 & 02"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsInvestorModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
            >
              Simpan Investor
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* Modal Tambah Proyek Baru */}
      <CustomDialog
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Tambah Proyek Baru"
        description="Daftarkan proyek baru beserta pautan investor pendana dan klien penagihan."
      >
        <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Proyek <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputProjectName}
              onChange={e => setInputProjectName(e.target.value)}
              placeholder="Contoh: Proyek Situ Cikedal"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Lokasi Proyek
            </label>
            <input
              type="text"
              value={inputProjectLocation}
              onChange={e => setInputProjectLocation(e.target.value)}
              placeholder="Contoh: Cikedal, Pandeglang"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Investor Pendana <span className="text-red-500">*</span>
            </label>
            <select
              value={inputProjectInvestorId}
              onChange={e => setInputProjectInvestorId(e.target.value)}
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            >
              <option value="">-- Pilih Investor --</option>
              {investors.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Klien Pemilik Proyek <span className="text-red-500">*</span>
            </label>
            <select
              value={inputProjectClientId}
              onChange={e => setInputProjectClientId(e.target.value)}
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            >
              <option value="">-- Pilih Klien / Pemilik --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Modal Awal Disetor (Rp)
            </label>
            <input
              type="number"
              value={inputProjectInitialDeposit || ''}
              onChange={e => setInputProjectInitialDeposit(Number(e.target.value) || 0)}
              placeholder="Contoh: 100000000"
              min="0"
              step="500000"
              className="w-full font-mono bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Catatan Proyek
            </label>
            <input
              type="text"
              value={inputProjectNotes}
              onChange={e => setInputProjectNotes(e.target.value)}
              placeholder="Contoh: Proyek pengurukan dan perkerasan jalan"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-medium"
            >
              Simpan Proyek
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* Modal Tambah Klien Menggunakan NewClientModal yang Sudah Terstandarisasi */}
      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onCreated={() => {
          setIsClientModalOpen(false);
        }}
      />

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
