import React, { useState, useEffect, useMemo } from 'react';
import { MaterialItem, UnitType, MasterQuarry, Project } from '@/types/database';
import { QuarryMaterialRate, RouteOperatingTariff } from '@/types/materialMaster';
import {
  subscribeQuarryRates,
  subscribeRouteTariffs,
  subscribeCommodities,
  saveQuarryRate,
  deleteQuarryRate,
  saveRouteTariff,
  deleteRouteTariff,
  saveCommodity,
  deleteCommodity,
  seedInitialMaterialData
} from '@/lib/materialMasterService';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { subscribeProjects } from '@/lib/projectService';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { QuarryCombobox } from '@/components/ui/QuarryCombobox';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';
import { CustomSelectCombobox } from '@/components/ui/CustomSelectCombobox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useDialog } from '@/context/DialogContext';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { formatEntityNameLive } from '@/lib/nameUtils';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';

export type MaterialSubTab = 'catalog' | 'pricing' | 'routes';

interface MasterMaterialPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: 'materials', subTabId: string) => void;
}

export function MasterMaterialPage({
  userEmail: _userEmail,
  activeSubTab = 'catalog',
  onNavigateSubTab
}: MasterMaterialPageProps): React.JSX.Element {
  const dialog = useDialog();
  const { isDispatcherUser } = useProjectFilter();

  // Active Sub-Tab State
  const [currentSubTab, setCurrentSubTab] = useState<MaterialSubTab>(() => {
    if (isDispatcherUser) {
      return activeSubTab === 'routes' ? 'routes' : 'catalog';
    }
    if (activeSubTab === 'pricing' || activeSubTab === 'routes' || activeSubTab === 'catalog') {
      return activeSubTab;
    }
    return 'catalog';
  });

  useEffect(() => {
    if (isDispatcherUser) {
      if (activeSubTab === 'routes') {
        setCurrentSubTab('routes');
      } else {
        setCurrentSubTab('catalog');
      }
      return;
    }
    if (activeSubTab === 'pricing' || activeSubTab === 'routes' || activeSubTab === 'catalog') {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab, isDispatcherUser]);

  const handleSubTabChange = (tab: MaterialSubTab) => {
    if (isDispatcherUser && tab === 'pricing') {
      tab = 'catalog';
    }
    setCurrentSubTab(tab);
    if (onNavigateSubTab) {
      onNavigateSubTab('materials', tab);
    }
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Collections State
  const [quarryRates, setQuarryRates] = useState<QuarryMaterialRate[]>([]);
  const [routeTariffs, setRouteTariffs] = useState<RouteOperatingTariff[]>([]);
  const [commodities, setCommodities] = useState<MaterialItem[]>([]);
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals Tambah Baru State
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isCommodityModalOpen, setIsCommodityModalOpen] = useState(false);

  // Edit Target State
  const [editRateTarget, setEditRateTarget] = useState<QuarryMaterialRate | null>(null);
  const [editRouteTarget, setEditRouteTarget] = useState<RouteOperatingTariff | null>(null);
  const [editCommodityTarget, setEditCommodityTarget] = useState<MaterialItem | null>(null);

  // Rate Form Inputs
  const [rateMaterialId, setRateMaterialId] = useState('');
  const [rateMaterialName, setRateMaterialName] = useState('');
  const [rateQuarryId, setRateQuarryId] = useState('');
  const [rateQuarryName, setRateQuarryName] = useState('');
  const [rateQualityGrade, setRateQualityGrade] = useState('');
  const [rateUnit, setRateUnit] = useState<UnitType>('DT');
  const [rateBuyPrice, setRateBuyPrice] = useState<number>(600000);
  const [rateSellPrice, setRateSellPrice] = useState<number>(850000);
  const [rateNotes, setRateNotes] = useState('');

  // Route Form Inputs
  const [routeQuarryId, setRouteQuarryId] = useState('');
  const [routeQuarryName, setRouteQuarryName] = useState('');
  const [routeProjectId, setRouteProjectId] = useState('');
  const [routeProjectName, setRouteProjectName] = useState('');
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(18);
  const [routeDurationHours, setRouteDurationHours] = useState<number>(1);
  const [routeStandardCost, setRouteStandardCost] = useState<number>(150000);

  // Commodity Form Inputs
  const [commName, setCommName] = useState('');
  const [commUnit, setCommUnit] = useState<UnitType>('DT');
  const [commDefaultBuyPrice, setCommDefaultBuyPrice] = useState<number>(600000);
  const [commDefaultSellPrice, setCommDefaultSellPrice] = useState<number>(850000);

  // PIN Authorization Modal State
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

  // Initial Fetch, Subscriptions, and Auto-Seeding
  useEffect(() => {
    setIsLoading(true);
    // Seed initial data if empty
    seedInitialMaterialData().catch(console.error);

    const unsubRates = subscribeQuarryRates(list => {
      setQuarryRates(list);
      setIsLoading(false);
    });

    const unsubRoutes = subscribeRouteTariffs(list => {
      setRouteTariffs(list);
    });

    const unsubCommodities = subscribeCommodities(list => {
      setCommodities(list);
    });

    const unsubQuarries = subscribeMasterQuarries(list => {
      setQuarries(list);
    });

    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });

    return () => {
      unsubRates();
      unsubRoutes();
      unsubCommodities();
      unsubQuarries();
      unsubProjects();
    };
  }, []);

  // Format Rupiah
  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // Filtered Quarry Rates
  const filteredRates = useMemo(() => {
    if (!searchQuery.trim()) return quarryRates;
    const q = searchQuery.toLowerCase().trim();
    return quarryRates.filter(
      r =>
        r.materialName.toLowerCase().includes(q) ||
        r.quarryName.toLowerCase().includes(q) ||
        r.qualityGrade.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [quarryRates, searchQuery]);

  // Filtered Route Tariffs
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routeTariffs;
    const q = searchQuery.toLowerCase().trim();
    return routeTariffs.filter(
      r =>
        r.quarryName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q)
    );
  }, [routeTariffs, searchQuery]);

  // Filtered Commodities
  const filteredCommodities = useMemo(() => {
    if (!searchQuery.trim()) return commodities;
    const q = searchQuery.toLowerCase().trim();
    return commodities.filter(c => c.name.toLowerCase().includes(q));
  }, [commodities, searchQuery]);

  // Helper Reset Rate Form
  const resetRateForm = () => {
    const firstComm = commodities[0];
    setRateMaterialId(firstComm?.id || '');
    setRateMaterialName(firstComm?.name || '');
    setRateQuarryId(quarries[0]?.id || '');
    setRateQuarryName(quarries[0]?.name || '');
    setRateQualityGrade('');
    setRateUnit(firstComm?.unit || 'DT');
    setRateBuyPrice(firstComm?.defaultBuyPrice || 600000);
    setRateSellPrice(firstComm?.defaultSellPrice || 850000);
    setRateNotes('');
    setEditRateTarget(null);
  };

  // Helper Reset Route Form
  const resetRouteForm = () => {
    setRouteQuarryId(quarries[0]?.id || '');
    setRouteQuarryName(quarries[0]?.name || '');
    setRouteProjectId(projects[0]?.id || '');
    setRouteProjectName(projects[0]?.name || '');
    setRouteDistanceKm(18);
    setRouteDurationHours(1);
    setRouteStandardCost(150000);
    setEditRouteTarget(null);
  };

  // Helper Reset Commodity Form
  const resetCommodityForm = () => {
    setCommName('');
    setCommUnit('DT');
    setCommDefaultBuyPrice(600000);
    setCommDefaultSellPrice(850000);
    setEditCommodityTarget(null);
  };

  // --- HANDLER HARGA KUARI ---
  const handleOpenAddRate = () => {
    resetRateForm();
    setIsRateModalOpen(true);
  };

  const handleOpenEditRate = (rate: QuarryMaterialRate) => {
    setEditRateTarget(rate);
    setRateMaterialId(rate.materialId);
    setRateMaterialName(rate.materialName);
    setRateQuarryId(rate.quarryId);
    setRateQuarryName(rate.quarryName);
    setRateQualityGrade(rate.qualityGrade);
    setRateUnit(rate.unit);
    setRateBuyPrice(rate.buyPriceCash);
    const comm = commodities.find(c => c.id === rate.materialId);
    setRateSellPrice(rate.sellPrice || comm?.defaultSellPrice || 850000);
    setRateNotes(rate.notes || '');
    setIsRateModalOpen(true);
  };

  const handleSaveRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateQuarryName.trim() || !rateMaterialName.trim() || !rateQualityGrade.trim()) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Mohon lengkapi material, kuari asal, dan spesifikasi mutu.',
        confirmText: 'Mengerti'
      });
      return;
    }

    if (editRateTarget) {
      // Edit action requires PIN 2008005
      setPinModalConfig({
        isOpen: true,
        title: 'Konfirmasi Perubahan Harga Kuari',
        description: 'Perubahan harga tebus tambang dan harga jual akan mempengaruhi acuan ritase berikutnya. Masukkan PIN otorisasi:',
        targetLabel: `${rateMaterialName} — ${rateQuarryName} (${rateQualityGrade})`,
        isDestructive: false,
        confirmText: 'Simpan Perubahan',
        onExecute: async () => {
          await saveQuarryRate({
            id: editRateTarget.id,
            materialId: rateMaterialId,
            materialName: rateMaterialName,
            quarryId: rateQuarryId,
            quarryName: rateQuarryName,
            qualityGrade: rateQualityGrade,
            unit: rateUnit,
            buyPriceCash: rateBuyPrice,
            sellPrice: rateSellPrice,
            notes: rateNotes
          });
          setIsRateModalOpen(false);
          resetRateForm();
          dialog.showAlert({
            title: 'Berhasil Disimpan',
            message: 'Harga tebus & jual kuari berhasil diperbarui.',
            confirmText: 'Tutup'
          });
        }
      });
    } else {
      // Create action
      try {
        await saveQuarryRate({
          materialId: rateMaterialId,
          materialName: rateMaterialName,
          quarryId: rateQuarryId,
          quarryName: rateQuarryName,
          qualityGrade: rateQualityGrade,
          unit: rateUnit,
          buyPriceCash: rateBuyPrice,
          sellPrice: rateSellPrice,
          notes: rateNotes
        });
        setIsRateModalOpen(false);
        resetRateForm();
        dialog.showAlert({
          title: 'Berhasil Ditambahkan',
          message: 'Data harga & mutu kuari baru berhasil disimpan ke database.',
          confirmText: 'Tutup'
        });
      } catch (err) {
        console.error(err);
        dialog.showAlert({
          title: 'Gagal Menyimpan',
          message: 'Terjadi kesalahan sistem saat menyimpan tarif kuari.',
          confirmText: 'Tutup'
        });
      }
    }
  };

  const handleDeleteRate = (rate: QuarryMaterialRate) => {
    setPinModalConfig({
      isOpen: true,
      title: 'Hapus Tarif Kuari',
      description: 'Apakah kamu yakin ingin menghapus data harga tebus kuari ini? Tindakan ini tidak dapat dibatalkan.',
      targetLabel: `${rate.materialName} — ${rate.quarryName} (${formatRupiah(rate.buyPriceCash)})`,
      isDestructive: true,
      confirmText: 'Hapus Permanen',
      onExecute: async () => {
        await deleteQuarryRate(rate.id);
        dialog.showAlert({
          title: 'Berhasil Dihapus',
          message: 'Data tarif tebus kuari telah dihapus dari sistem.',
          confirmText: 'Tutup'
        });
      }
    });
  };

  // --- HANDLER RUTE OPERASIONAL ---
  const handleOpenAddRoute = () => {
    resetRouteForm();
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route: RouteOperatingTariff) => {
    setEditRouteTarget(route);
    setRouteQuarryId(route.quarryId);
    setRouteQuarryName(route.quarryName);
    setRouteProjectId(route.projectId);
    setRouteProjectName(route.projectName);
    setRouteDistanceKm(route.distanceKm);
    setRouteDurationHours(route.standardTripDurationHours || 1);
    setRouteStandardCost(route.standardOperationalCost);
    setIsRouteModalOpen(true);
  };

  const handleSaveRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeQuarryName.trim() || !routeProjectName.trim()) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Mohon pilih kuari asal dan proyek tujuan.',
        confirmText: 'Mengerti'
      });
      return;
    }

    if (editRouteTarget) {
      setPinModalConfig({
        isOpen: true,
        title: 'Konfirmasi Penyesuaian Tarif Rute',
        description: 'Penyesuaian acuan biaya jalan akan mempengaruhi estimasi pengiriman ritase. Masukkan PIN otorisasi:',
        targetLabel: `${routeQuarryName} → ${routeProjectName} (${routeDistanceKm} km)`,
        isDestructive: false,
        confirmText: 'Simpan Penyesuaian',
        onExecute: async () => {
          await saveRouteTariff({
            id: editRouteTarget.id,
            quarryId: routeQuarryId,
            quarryName: routeQuarryName,
            projectId: routeProjectId,
            projectName: routeProjectName,
            distanceKm: routeDistanceKm,
            standardTripDurationHours: routeDurationHours,
            standardOperationalCost: routeStandardCost
          });
          setIsRouteModalOpen(false);
          resetRouteForm();
          dialog.showAlert({
            title: 'Berhasil Disesuaikan',
            message: 'Standar biaya jalan rute berhasil diperbarui.',
            confirmText: 'Tutup'
          });
        }
      });
    } else {
      try {
        await saveRouteTariff({
          quarryId: routeQuarryId,
          quarryName: routeQuarryName,
          projectId: routeProjectId,
          projectName: routeProjectName,
          distanceKm: routeDistanceKm,
          standardTripDurationHours: routeDurationHours,
          standardOperationalCost: routeStandardCost
        });
        setIsRouteModalOpen(false);
        resetRouteForm();
        dialog.showAlert({
          title: 'Berhasil Ditambahkan',
          message: 'Rute operasional baru berhasil disimpan ke database.',
          confirmText: 'Tutup'
        });
      } catch (err) {
        console.error(err);
        dialog.showAlert({
          title: 'Gagal Menyimpan',
          message: 'Terjadi kesalahan sistem saat menyimpan rute operasional.',
          confirmText: 'Tutup'
        });
      }
    }
  };

  const handleDeleteRoute = (route: RouteOperatingTariff) => {
    setPinModalConfig({
      isOpen: true,
      title: 'Hapus Rute Acuan',
      description: 'Apakah kamu yakin ingin menghapus data acuan rute ini? Tindakan ini tidak dapat dibatalkan.',
      targetLabel: `${route.quarryName} → ${route.projectName} (${route.distanceKm} km)`,
      isDestructive: true,
      confirmText: 'Hapus Rute',
      onExecute: async () => {
        await deleteRouteTariff(route.id);
        dialog.showAlert({
          title: 'Berhasil Dihapus',
          message: 'Rute acuan operasional telah dihapus.',
          confirmText: 'Tutup'
        });
      }
    });
  };

  // --- HANDLER KOMODITAS ---
  const handleOpenAddCommodity = () => {
    resetCommodityForm();
    setIsCommodityModalOpen(true);
  };

  const handleOpenEditCommodity = (item: MaterialItem) => {
    setEditCommodityTarget(item);
    setCommName(item.name);
    setCommUnit(item.unit);
    setCommDefaultBuyPrice(item.defaultBuyPrice);
    setCommDefaultSellPrice(item.defaultSellPrice);
    setIsCommodityModalOpen(true);
  };

  const handleSaveCommoditySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Nama komoditas material wajib diisi.',
        confirmText: 'Mengerti'
      });
      return;
    }

    if (editCommodityTarget) {
      setPinModalConfig({
        isOpen: true,
        title: 'Konfirmasi Edit Komoditas Material',
        description: 'Perubahan harga acuan dasar komoditas memerlukan verifikasi PIN otorisasi:',
        targetLabel: `${commName} (${commUnit})`,
        isDestructive: false,
        confirmText: 'Simpan Perubahan',
        onExecute: async () => {
          await saveCommodity({
            id: editCommodityTarget.id,
            name: commName,
            unit: commUnit,
            defaultBuyPrice: commDefaultBuyPrice,
            defaultSellPrice: commDefaultSellPrice
          });
          setIsCommodityModalOpen(false);
          resetCommodityForm();
          dialog.showAlert({
            title: 'Berhasil Disimpan',
            message: 'Data komoditas material berhasil diperbarui.',
            confirmText: 'Tutup'
          });
        }
      });
    } else {
      try {
        await saveCommodity({
          name: commName,
          unit: commUnit,
          defaultBuyPrice: commDefaultBuyPrice,
          defaultSellPrice: commDefaultSellPrice
        });
        setIsCommodityModalOpen(false);
        resetCommodityForm();
        dialog.showAlert({
          title: 'Berhasil Ditambahkan',
          message: 'Komoditas material baru berhasil didaftarkan.',
          confirmText: 'Tutup'
        });
      } catch (err) {
        console.error(err);
        dialog.showAlert({
          title: 'Gagal Menyimpan',
          message: 'Terjadi kesalahan sistem saat mendaftarkan komoditas.',
          confirmText: 'Tutup'
        });
      }
    }
  };

  const handleDeleteCommodity = (item: MaterialItem) => {
    setPinModalConfig({
      isOpen: true,
      title: 'Hapus Komoditas Material',
      description: 'Apakah kamu yakin ingin menghapus komoditas material ini dari katalog dasar? Tindakan ini tidak dapat dibatalkan.',
      targetLabel: `${item.name} (${item.unit})`,
      isDestructive: true,
      confirmText: 'Hapus Komoditas',
      onExecute: async () => {
        await deleteCommodity(item.id);
        dialog.showAlert({
          title: 'Berhasil Dihapus',
          message: 'Komoditas material telah dihapus dari katalog.',
          confirmText: 'Tutup'
        });
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile Titlebar Action Button (Rule 108: Dynamic per Sub-Tab) */}
      <MobileTitlebarAction>
        {currentSubTab === 'catalog' && (
          <button
            type="button"
            onClick={handleOpenAddCommodity}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Komoditas Baru
          </button>
        )}
        {currentSubTab === 'pricing' && !isDispatcherUser && (
          <button
            type="button"
            onClick={handleOpenAddRate}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Atur Harga
          </button>
        )}
        {currentSubTab === 'routes' && (
          <button
            type="button"
            onClick={handleOpenAddRoute}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Tambah Rute
          </button>
        )}
      </MobileTitlebarAction>

      {/* Sub-Tab Navigation Bar (Monochromatic clean per Rule 66) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeaea] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#f5f5f5] rounded-[8px]">
          <button
            type="button"
            onClick={() => handleSubTabChange('catalog')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              currentSubTab === 'catalog'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#ebebeb]'
            }`}
          >
            Katalog Komoditas
          </button>
          {!isDispatcherUser && (
            <button
              type="button"
              onClick={() => handleSubTabChange('pricing')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
                currentSubTab === 'pricing'
                  ? 'bg-[#111111] text-white'
                  : 'text-[#666666] hover:text-[#111111] hover:bg-[#ebebeb]'
              }`}
            >
              Harga & Mutu Kuari
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubTabChange('routes')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
              currentSubTab === 'routes'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#ebebeb]'
            }`}
          >
            Biaya Jalan Rute
          </button>
        </div>

        {/* Global Search Bar per sub-tab (Rule 98: Universal Search Icon) */}
        <div className="relative w-full sm:w-64">
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
              currentSubTab === 'catalog'
                ? 'Cari komoditas...'
                : currentSubTab === 'pricing'
                ? 'Cari kuari, mutu, material...'
                : 'Cari rute kuari atau proyek...'
            }
            className="w-full bg-[#f9f9f9] border border-[#dcdcdc] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#888888] outline-none focus:border-[#111111] transition-colors"
          />
        </div>
      </div>

      {/* SUB-TAB 2: HARGA & MUTU KUARI */}
      {currentSubTab === 'pricing' && !isDispatcherUser && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
              Katalog Tebus Tambang & Harga Jual ({filteredRates.length} Konfigurasi)
            </span>
            <button
              type="button"
              onClick={handleOpenAddRate}
              className="hidden md:flex px-3 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-semibold transition-colors items-center gap-1.5"
            >
              <span>+</span>
              <span>Atur Harga Kuari</span>
            </button>
          </div>

          <div className="border border-[#eaeaea] rounded-[10px] bg-white overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed text-left text-xs border-collapse min-w-[860px]">
                <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#eaeaea] text-[11px] font-semibold text-[#555555] uppercase tracking-wider select-none z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-[18%]">Jenis Material</th>
                    <th className="py-2.5 px-3 w-[18%]">PT Tambang (Titik Muat)</th>
                    <th className="py-2.5 px-3 w-[16%]">Mutu / Kualitas</th>
                    <th className="py-2.5 px-3 w-[8%]">Satuan</th>
                    <th className="py-2.5 px-3 w-[13%] text-right">Tebus Cash</th>
                    <th className="py-2.5 px-3 w-[13%] text-right">Jual Standar</th>
                    <th className="py-2.5 px-3 w-[14%] text-right">Margin Kotor</th>
                    <th className="py-2.5 px-3 w-[60px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Memuat data harga kuari...
                      </td>
                    </tr>
                  ) : filteredRates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Belum ada konfigurasi harga kuari. Klik "+ Atur Harga Kuari" untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    filteredRates.map(rate => {
                      const comm = commodities.find(c => c.id === rate.materialId);
                      const sell = rate.sellPrice ?? comm?.defaultSellPrice ?? 0;
                      const margin = sell - rate.buyPriceCash;
                      return (
                        <tr key={rate.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#111111] truncate">
                            {rate.materialName}
                          </td>
                          <td className="py-2.5 px-3 text-[#333333] truncate">
                            {rate.quarryName}
                          </td>
                          <td className="py-2.5 px-3 text-[#555555] truncate">
                            {rate.qualityGrade}
                            {rate.notes && (
                              <span className="block text-[10px] text-[#888888] truncate">{rate.notes}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#555555] whitespace-nowrap">
                            {rate.unit === 'DT' ? 'DT (6 m³)' : 'Ton'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#111111] whitespace-nowrap">
                            {formatRupiah(rate.buyPriceCash)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#111111] whitespace-nowrap">
                            {formatRupiah(sell)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold tracking-tight whitespace-nowrap ${
                            margin > 0 ? 'text-emerald-700' : margin < 0 ? 'text-red-600' : 'text-[#888888]'
                          }`}>
                            {margin > 0
                              ? `+${formatRupiah(margin)}`
                              : margin < 0
                              ? `-${formatRupiah(Math.abs(margin))}`
                              : formatRupiah(0)}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px]">
                            <div className="flex items-center justify-end">
                              <TableActionMenu
                                items={[
                                  {
                                    label: 'Ubah Data Harga',
                                    onClick: () => handleOpenEditRate(rate)
                                  },
                                  {
                                    label: 'Hapus Harga',
                                    variant: 'danger',
                                    onClick: () => handleDeleteRate(rate)
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
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BIAYA JALAN RUTE */}
      {currentSubTab === 'routes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
              Standar Operasional Armada Berdasarkan Jarak Tempuh ({filteredRoutes.length} Rute)
            </span>
            <button
              type="button"
              onClick={handleOpenAddRoute}
              className="hidden md:flex px-3 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-semibold transition-colors items-center gap-1.5"
            >
              <span>+</span>
              <span>Tambah Rute Acuan</span>
            </button>
          </div>

          <div className="border border-[#eaeaea] rounded-[10px] bg-white overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed text-left text-xs border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#eaeaea] text-[11px] font-semibold text-[#555555] uppercase tracking-wider select-none z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-[28%]">Titik Muat (Kuari Asal)</th>
                    <th className="py-2.5 px-3 w-[28%]">Titik Bongkar (Proyek Tujuan)</th>
                    <th className="py-2.5 px-3 w-[14%] text-right">Jarak Tempuh</th>
                    <th className="py-2.5 px-3 w-[18%] text-right">Biaya Jalan Acuan</th>
                    <th className="py-2.5 px-3 w-[60px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Memuat data rute operasional...
                      </td>
                    </tr>
                  ) : filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Belum ada data rute acuan. Klik "+ Tambah Rute Acuan" untuk membuat baru.
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map(route => (
                      <tr key={route.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#111111] truncate">
                          {route.quarryName}
                        </td>
                        <td className="py-2.5 px-3 text-[#333333] truncate">
                          {route.projectName}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#555555] whitespace-nowrap">
                          <span className="font-bold tracking-tight text-[#111111]">{route.distanceKm}</span> km
                          {route.standardTripDurationHours && (
                            <span className="text-[10px] text-[#888888] ml-1 font-sans">
                              (~{route.standardTripDurationHours} jam)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#111111] whitespace-nowrap">
                          {formatRupiah(route.standardOperationalCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px]">
                          <div className="flex items-center justify-end">
                            <TableActionMenu
                              items={[
                                {
                                  label: 'Sesuaikan Rute',
                                  onClick: () => handleOpenEditRoute(route)
                                },
                                {
                                  label: 'Hapus Rute',
                                  variant: 'danger',
                                  onClick: () => handleDeleteRoute(route)
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
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KATALOG KOMODITAS DASAR */}
      {currentSubTab === 'catalog' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
              Daftar Komoditas Material Terdaftar ({filteredCommodities.length} Jenis)
            </span>
            <button
              type="button"
              onClick={handleOpenAddCommodity}
              className="hidden md:flex px-3 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-[6px] text-xs font-semibold transition-colors items-center gap-1.5"
            >
              <span>+</span>
              <span>Komoditas Baru</span>
            </button>
          </div>

          <div className="border border-[#eaeaea] rounded-[10px] bg-white overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed text-left text-xs border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-[#f9f9f9] border-b border-[#eaeaea] text-[11px] font-semibold text-[#555555] uppercase tracking-wider select-none z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-[18%]">Kode Unik</th>
                    <th className="py-2.5 px-3 w-[32%]">Nama Komoditas</th>
                    <th className="py-2.5 px-3 w-[14%]">Satuan Acuan</th>
                    {!isDispatcherUser && (
                      <th className="py-2.5 px-3 w-[18%] text-right">Harga Beli Dasar</th>
                    )}
                    <th className={`py-2.5 px-3 ${isDispatcherUser ? 'w-[28%]' : 'w-[18%]'} text-right`}>Harga Jual Dasar</th>
                    <th className="py-2.5 px-3 w-[60px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={isDispatcherUser ? 5 : 6} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Memuat data komoditas material...
                      </td>
                    </tr>
                  ) : filteredCommodities.length === 0 ? (
                    <tr>
                      <td colSpan={isDispatcherUser ? 5 : 6} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                        Belum ada komoditas material. Klik "+ Komoditas Baru" untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    filteredCommodities.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#555555] whitespace-nowrap">
                          {item.id.startsWith('mat-') ? item.id.toUpperCase() : `MAT-${String(idx + 1).padStart(2, '0')}`}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#111111] truncate">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#555555] whitespace-nowrap">
                          {item.unit === 'DT' ? 'DT (6 m³)' : 'Ton'}
                        </td>
                        {!isDispatcherUser && (
                          <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#333333] whitespace-nowrap">
                            {formatRupiah(item.defaultBuyPrice)}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#111111] whitespace-nowrap">
                          {formatRupiah(item.defaultSellPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px]">
                          <div className="flex items-center justify-end">
                            <TableActionMenu
                              items={[
                                {
                                  label: 'Edit Komoditas',
                                  onClick: () => handleOpenEditCommodity(item)
                                },
                                {
                                  label: 'Hapus Komoditas',
                                  variant: 'danger',
                                  onClick: () => handleDeleteCommodity(item)
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
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH / EDIT HARGA & MUTU KUARI (CUSTOM UI ONLY PER RULE 87) */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white rounded-[12px] p-5 shadow-2xl border border-[#eaeaea] space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
              <h3 className="text-sm font-bold text-[#111111]">
                {editRateTarget ? 'Ubah Harga Tebus Kuari' : 'Atur Harga & Mutu Kuari Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="text-[#888888] hover:text-[#111111] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRateSubmit} className="space-y-3 text-xs">
              {/* Komoditas Picker (Custom UI) */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Komoditas Material <span className="text-red-500">*</span>
                </label>
                <CustomSelectCombobox
                  options={commodities.map(c => ({ id: c.id, label: c.name, subLabel: c.unit }))}
                  value={rateMaterialId}
                  onChange={id => {
                    setRateMaterialId(id);
                    const found = commodities.find(c => c.id === id);
                    if (found) {
                      setRateMaterialName(found.name);
                      setRateUnit(found.unit);
                      if (!editRateTarget) {
                        setRateBuyPrice(found.defaultBuyPrice || 600000);
                        setRateSellPrice(found.defaultSellPrice || 850000);
                      }
                    }
                  }}
                  placeholder="Pilih material..."
                />
              </div>

              {/* Kuari Asal Picker (Custom UI) */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  PT Tambang / Kuari (Titik Muat) <span className="text-red-500">*</span>
                </label>
                <QuarryCombobox
                  quarries={quarries}
                  selectedQuarryId={rateQuarryId}
                  selectedQuarryName={rateQuarryName}
                  onSelect={q => {
                    if (q) {
                      setRateQuarryId(q.id);
                      setRateQuarryName(q.name);
                    } else {
                      setRateQuarryId('');
                      setRateQuarryName('');
                    }
                  }}
                  placeholder="Pilih atau daftarkan kuari asal..."
                  required
                />
              </div>

              {/* Spesifikasi Mutu / Grade */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Spesifikasi Mutu / Grade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rateQualityGrade}
                  onChange={e => setRateQualityGrade(e.target.value)}
                  placeholder="contoh: Grade A — Hitam Padat Keras"
                  className="w-full bg-[#f5f5f5] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none focus:bg-[#ebebeb] transition-colors"
                />
              </div>

              {/* Satuan Segmented Control (Custom UI) */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">Satuan Ukur</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRateUnit('DT')}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                      rateUnit === 'DT' ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-[#555555]'
                    }`}
                  >
                    DT (Dump Truck 6 m³)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateUnit('Ton')}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                      rateUnit === 'Ton' ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-[#555555]'
                    }`}
                  >
                    Tonase (Timbangan)
                  </button>
                </div>
              </div>

              {/* Harga Beli Cash */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Harga Tebus Cash Kuari / {rateUnit} <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  required
                  value={rateBuyPrice}
                  onChange={setRateBuyPrice}
                />
              </div>

              {/* Harga Jual Standar Proyek */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Harga Jual Standar Proyek / {rateUnit} <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  required
                  value={rateSellPrice}
                  onChange={setRateSellPrice}
                />
              </div>

              {/* Kalkulasi Margin Kotor (Est.) */}
              <div className="p-3 bg-[#f9f9f9] rounded-[8px] border border-[#eaeaea] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-[#666666] block">Estimasi Margin Kotor</span>
                  <span className="text-[10px] text-[#888888]">Selisih Jual Standar − Tebus Kuari</span>
                </div>
                <span className="text-xs font-bold tracking-tight text-[#111111]">
                  {formatRupiah(rateSellPrice - rateBuyPrice)} / {rateUnit}
                </span>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={rateNotes}
                  onChange={e => setRateNotes(e.target.value)}
                  placeholder="contoh: Standar timbangan basah..."
                  className="w-full bg-[#f5f5f5] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeaea]">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#dcdcdc] text-xs font-medium text-[#666666] hover:bg-[#f5f5f5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold transition-colors"
                >
                  {editRateTarget ? 'Verifikasi PIN & Simpan' : 'Simpan Konfigurasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH / EDIT RUTE OPERASIONAL (CUSTOM UI ONLY PER RULE 87) */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white rounded-[12px] p-5 shadow-2xl border border-[#eaeaea] space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
              <h3 className="text-sm font-bold text-[#111111]">
                {editRouteTarget ? 'Sesuaikan Biaya Jalan Rute' : 'Tambah Rute Operasional Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRouteModalOpen(false)}
                className="text-[#888888] hover:text-[#111111] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRouteSubmit} className="space-y-3 text-xs">
              {/* Titik Muat (Kuari Combobox) */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Titik Muat (PT Tambang / Kuari) <span className="text-red-500">*</span>
                </label>
                <QuarryCombobox
                  quarries={quarries}
                  selectedQuarryId={routeQuarryId}
                  selectedQuarryName={routeQuarryName}
                  onSelect={q => {
                    if (q) {
                      setRouteQuarryId(q.id);
                      setRouteQuarryName(q.name);
                    } else {
                      setRouteQuarryId('');
                      setRouteQuarryName('');
                    }
                  }}
                  placeholder="Pilih kuari asal muatan..."
                  required
                />
              </div>

              {/* Titik Bongkar (Project Combobox) */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Titik Bongkar (Proyek Tujuan) <span className="text-red-500">*</span>
                </label>
                <ProjectCombobox
                  projects={projects}
                  selectedProjectId={routeProjectId}
                  selectedProjectName={routeProjectName}
                  onSelect={p => {
                    if (p) {
                      setRouteProjectId(p.id);
                      setRouteProjectName(p.name);
                    } else {
                      setRouteProjectId('');
                      setRouteProjectName('');
                    }
                  }}
                  placeholder="Pilih proyek tujuan bongkar..."
                  required
                />
              </div>

              {/* Jarak Tempuh & Durasi */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#666666] font-medium mb-1">
                    Jarak Tempuh (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={routeDistanceKm}
                    onChange={e => setRouteDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#f5f5f5] rounded-[6px] px-3 py-2 text-xs font-mono font-bold text-[#111111] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#666666] font-medium mb-1">
                    Durasi Trip (Jam)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={routeDurationHours}
                    onChange={e => setRouteDurationHours(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#f5f5f5] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] outline-none"
                  />
                </div>
              </div>

              {/* Biaya Jalan Standar */}
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Biaya Jalan Acuan (Solar/Supir/Portal) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  required
                  value={routeStandardCost}
                  onChange={setRouteStandardCost}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeaea]">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#dcdcdc] text-xs font-medium text-[#666666] hover:bg-[#f5f5f5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold transition-colors"
                >
                  {editRouteTarget ? 'Verifikasi PIN & Sesuaikan' : 'Simpan Rute Acuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH / EDIT KOMODITAS DASAR (CUSTOM UI ONLY PER RULE 87) */}
      {isCommodityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white rounded-[12px] p-5 shadow-2xl border border-[#eaeaea] space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
              <h3 className="text-sm font-bold text-[#111111]">
                {editCommodityTarget ? 'Edit Komoditas Material' : 'Daftarkan Komoditas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCommodityModalOpen(false)}
                className="text-[#888888] hover:text-[#111111] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCommoditySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Nama Komoditas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={commName}
                  onChange={e => setCommName(formatEntityNameLive(e.target.value))}
                  placeholder="contoh: Batu Belah (Pondasi)"
                  className="w-full bg-[#f5f5f5] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Satuan Dasar</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCommUnit('DT')}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                      commUnit === 'DT' ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-[#555555]'
                    }`}
                  >
                    DT (Dump Truck 6 m³)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommUnit('Ton')}
                    className={`flex-1 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                      commUnit === 'Ton' ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-[#555555]'
                    }`}
                  >
                    Tonase (Timbangan)
                  </button>
                </div>
              </div>

              {!isDispatcherUser && (
                <div>
                  <label className="block text-[#666666] font-medium mb-1">
                    Harga Beli Acuan Dasar / {commUnit}
                  </label>
                  <CurrencyInput
                    required
                    value={commDefaultBuyPrice}
                    onChange={setCommDefaultBuyPrice}
                  />
                </div>
              )}

              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Harga Jual Acuan Dasar / {commUnit}
                </label>
                <CurrencyInput
                  required
                  value={commDefaultSellPrice}
                  onChange={setCommDefaultSellPrice}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeaea]">
                <button
                  type="button"
                  onClick={() => setIsCommodityModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#dcdcdc] text-xs font-medium text-[#666666] hover:bg-[#f5f5f5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold transition-colors"
                >
                  {editCommodityTarget ? 'Verifikasi PIN & Simpan' : 'Daftarkan Komoditas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG OTORISASI PIN 2008005 (RULE 76 & 86) */}
      <PinAuthModal
        isOpen={pinModalConfig.isOpen}
        title={pinModalConfig.title}
        description={pinModalConfig.description}
        targetLabel={pinModalConfig.targetLabel}
        isDestructive={pinModalConfig.isDestructive}
        confirmText={pinModalConfig.confirmText}
        onSuccess={() => {
          setPinModalConfig(prev => ({ ...prev, isOpen: false }));
          pinModalConfig.onExecute();
        }}
        onClose={() => setPinModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
