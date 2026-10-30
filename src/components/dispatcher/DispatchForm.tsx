import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MaterialItem, UnitType, DispatchTransaction, Client, MasterQuarry, Project, QuarryMaterialRate, RouteOperatingTariff } from '@/types/database';
import { createDispatchTransaction, CreateDispatchPayload, subscribeKnownTrucks, KnownTruck, subscribeKnownDrivers, KnownDriver } from '@/lib/dispatcherService';
import { subscribeClients } from '@/lib/clientService';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { subscribeQuarryRates, subscribeRouteTariffs } from '@/lib/materialMasterService';
import { subscribeCashLedger } from '@/lib/cashLedgerService';
import { useDialog } from '@/context/DialogContext';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { MaterialPickerModal } from '@/components/ui/MaterialPickerModal';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { TruckPlateInput, extractRegionCode, isValidRegionCode, isCompleteValidTruckPlate } from '@/components/ui/TruckPlateInput';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { QuarryCombobox } from '@/components/ui/QuarryCombobox';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';
import { FlexibleTextarea } from '@/components/ui/FlexibleTextarea';
import { NegativeProfitConfirmModal } from '@/components/ui/NegativeProfitConfirmModal';
import { getMaterialIconSrc } from '@/lib/materialIcons';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { formatPersonNameLive } from '@/lib/nameUtils';

interface DispatchFormProps {
  materials: MaterialItem[];
  userEmail: string;
  transactions?: DispatchTransaction[];
  onSuccess?: () => void;
}

export function DispatchForm({ materials, userEmail, transactions = [], onSuccess }: DispatchFormProps): React.JSX.Element {
  const dialog = useDialog();

  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [deliveryDate, setDeliveryDate] = useState<string>(getTodayString());
  const [suratJalan, setSuratJalan] = useState('');
  const suratJalanInputRef = useRef<HTMLInputElement>(null);
  const [truckPlate, setTruckPlate] = useState('');
  const [isPlateInvalid, setIsPlateInvalid] = useState(false);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const [driverName, setDriverName] = useState('');
  const [isTruckLocked, setIsTruckLocked] = useState<boolean>(true);

  // Success Toast State (Non-blocking untuk Fast Flow)
  const [successToast, setSuccessToast] = useState<{ show: boolean; message: string } | null>(null);

  // Master Klien State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [customerName, setCustomerName] = useState('');

  // Master Kuari Asal State
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [selectedQuarryId, setSelectedQuarryId] = useState<string>('');
  const [selectedQuarryName, setSelectedQuarryName] = useState<string>('');

  // Proyek Tujuan State (Multi-Proyek Architecture - Filter Proyek Aktif Saja)
  const { projects, selectedProjectId: globalProjectId, isDispatcherUser } = useProjectFilter();
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'ACTIVE'), [projects]);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formProjectName, setFormProjectName] = useState<string>('');
  const selectedProject = activeProjects.find(p => p.id === formProjectId) || projects.find(p => p.id === formProjectId);

  // Master Material Rates & Route Tariffs State (Matriks 3 Titik)
  const [quarryRates, setQuarryRates] = useState<QuarryMaterialRate[]>([]);
  const [routeTariffs, setRouteTariffs] = useState<RouteOperatingTariff[]>([]);
  const [matchedRate, setMatchedRate] = useState<QuarryMaterialRate | null>(null);
  const [matchedRoute, setMatchedRoute] = useState<RouteOperatingTariff | null>(null);

  // Hitung jumlah ritase pada tanggal terpilih
  const todayRitaseCount = useMemo(() => {
    return transactions.filter(t => t.deliveryDate === deliveryDate).length;
  }, [transactions, deliveryDate]);

  // Sinkronisasi dengan filter global proyek di header (hanya jika aktif)
  useEffect(() => {
    if (globalProjectId && globalProjectId !== 'ALL' && activeProjects.length > 0) {
      const p = activeProjects.find(item => item.id === globalProjectId);
      if (p) {
        setFormProjectId(p.id);
        setFormProjectName(p.name);
        const isSapta = p.name.toLowerCase().includes('cikedal') || p.name.toLowerCase().includes('cipeucang');
        const sapta = clients.find(c => c.id === 'cli-p-sapta') || clients.find(c => c.name.toLowerCase().includes('sapta'));
        if (isSapta && sapta) {
          setSelectedClientId(sapta.id);
          setSelectedClientName(sapta.name);
          setCustomerName(sapta.name);
        } else {
          setSelectedClientId(p.clientId || '');
          setSelectedClientName(p.clientName || '');
          setCustomerName(p.clientName || '');
        }
      }
    }
  }, [globalProjectId, activeProjects, clients]);

  const handleSelectProject = (project: Project | null) => {
    if (project) {
      setFormProjectId(project.id);
      setFormProjectName(project.name);
      // Auto-set client ke P. Sapta jika proyek Cikedal atau Cipeucang
      const isSapta = project.name.toLowerCase().includes('cikedal') || project.name.toLowerCase().includes('cipeucang');
      const sapta = clients.find(c => c.id === 'cli-p-sapta') || clients.find(c => c.name.toLowerCase().includes('sapta'));
      if (isSapta && sapta) {
        setSelectedClientId(sapta.id);
        setSelectedClientName(sapta.name);
        setCustomerName(sapta.name);
      } else {
        setSelectedClientId(project.clientId || '');
        setSelectedClientName(project.clientName || '');
        setCustomerName(project.clientName || '');
      }
    } else {
      setFormProjectId('');
      setFormProjectName('');
    }
  };

  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [isMaterialPickerOpen, setIsMaterialPickerOpen] = useState(false);
  const [unit, setUnit] = useState<UnitType>('DT');
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [buyPricePerUnit, setBuyPricePerUnit] = useState<number>(0);
  const [sellPricePerUnit, setSellPricePerUnit] = useState<number>(0);
  const [operationalCost, setOperationalCost] = useState<number>(150000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knownTrucks, setKnownTrucks] = useState<KnownTruck[]>([]);
  const [knownDrivers, setKnownDrivers] = useState<KnownDriver[]>([]);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [driverHighlightedIndex, setDriverHighlightedIndex] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [isNegativeConfirmOpen, setIsNegativeConfirmOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const prevProfitRef = useRef(0);

  // Subscribe daftar master klien dari Firestore
  useEffect(() => {
    const unsubscribe = subscribeClients(loaded => {
      setClients(loaded);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe daftar master kuari asal dari Firestore
  useEffect(() => {
    const unsubscribe = subscribeMasterQuarries(loaded => {
      setQuarries(loaded);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe matriks harga kuari & tarif rute jalan
  useEffect(() => {
    const unsubRates = subscribeQuarryRates(setQuarryRates);
    const unsubRoutes = subscribeRouteTariffs(setRouteTariffs);
    return () => {
      unsubRates();
      unsubRoutes();
    };
  }, []);

  // Subscribe daftar armada truk & sopir yang pernah beroperasi
  useEffect(() => {
    const unsubTrucks = subscribeKnownTrucks(setKnownTrucks);
    const unsubDrivers = subscribeKnownDrivers(setKnownDrivers);
    return () => {
      unsubTrucks();
      unsubDrivers();
    };
  }, []);

  // Subscribe Saldo Kas Utama PT Patak
  const [centralCashBalance, setCentralCashBalance] = useState<number>(0);
  useEffect(() => {
    const unsubLedger = subscribeCashLedger(entries => {
      if (entries.length > 0 && typeof entries[0]?.runningBalance === 'number') {
        setCentralCashBalance(entries[0].runningBalance);
      }
    }, 1);
    return () => unsubLedger();
  }, []);

  // Matriks Harga Otomatis: Saat materialId atau quarryId berubah
  useEffect(() => {
    if (!selectedMaterialId || !selectedQuarryId) {
      setMatchedRate(null);
      return;
    }
    const found = quarryRates.find(
      r => r.materialId === selectedMaterialId && r.quarryId === selectedQuarryId
    );
    setMatchedRate(found || null);

    if (found) {
      setBuyPricePerUnit(found.buyPriceCash);
      setSellPricePerUnit(found.sellPrice);
    }
  }, [selectedMaterialId, selectedQuarryId, quarryRates]);

  // Matriks Biaya Jalan Otomatis: Saat quarryId atau formProjectId berubah
  useEffect(() => {
    if (!selectedQuarryId || !formProjectId) {
      setMatchedRoute(null);
      return;
    }
    const found = routeTariffs.find(
      r => r.quarryId === selectedQuarryId && r.projectId === formProjectId
    );
    setMatchedRoute(found || null);

    if (found) {
      setOperationalCost(found.standardOperationalCost);
    }
  }, [selectedQuarryId, formProjectId, routeTariffs]);

  const handleSelectClient = (client: Client | null) => {
    if (client) {
      setSelectedClientId(client.id);
      setSelectedClientName(client.name);
      setCustomerName(client.name);
    } else {
      setSelectedClientId('');
      setSelectedClientName('');
      setCustomerName('');
    }
  };

  const handleSelectQuarry = (quarry: MasterQuarry | null) => {
    if (quarry) {
      setSelectedQuarryId(quarry.id);
      setSelectedQuarryName(quarry.name);
    } else {
      setSelectedQuarryId('');
      setSelectedQuarryName('');
    }
  };

  // Set default material saat data materials pertama kali dimuat
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterialId) {
      const first = materials[0];
      if (first) {
        setSelectedMaterialId(first.id);
        setUnit(first.unit);
        setBuyPricePerUnit(first.defaultBuyPrice);
        setSellPricePerUnit(first.defaultSellPrice);
      }
    }
  }, [materials, selectedMaterialId]);

  const handleSelectMaterial = (m: MaterialItem): void => {
    setSelectedMaterialId(m.id);
    setUnit(m.unit);
    setBuyPricePerUnit(m.defaultBuyPrice);
    setSellPricePerUnit(m.defaultSellPrice);
  };

  // Handler Volume: Mengizinkan field kosong saat diedit/dihapus, dan baru mengisi '0' saat unfocused
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setQuantityInput(val);
    const parsed = parseFloat(val);
    setQuantity(isNaN(parsed) ? 0 : parsed);
  };

  const handleQuantityFocus = (): void => {
    if (quantityInput === '0') {
      setQuantityInput('');
    }
  };

  const handleQuantityBlur = (): void => {
    if (!quantityInput || quantityInput.trim() === '') {
      setQuantityInput('0');
      setQuantity(0);
    }
  };

  // Kalkulasi Live Otomatis
  const totalBuyCost = (Number(quantity) || 0) * (Number(buyPricePerUnit) || 0);
  const totalRevenue = (Number(quantity) || 0) * (Number(sellPricePerUnit) || 0);
  const totalOperational = Number(operationalCost) || 0;
  const netProfit = totalRevenue - (totalBuyCost + totalOperational);

  // Kontrol Kecukupan Dana Kas Utama (Khusus Akun Manajemen)
  const totalCashOutlay = totalBuyCost + totalOperational;
  const remainingCentralBalance = centralCashBalance - totalCashOutlay;
  const isCashDeficit = Boolean(centralCashBalance < totalCashOutlay);

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // Efek getar horizontal saat laba bersih pertama kali bernilai minus (<0)
  useEffect(() => {
    if (netProfit < 0 && prevProfitRef.current >= 0) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 600);
      return () => clearTimeout(timer);
    }
    prevProfitRef.current = netProfit;
  }, [netProfit]);

  // Validasi Form 100%: Tombol Simpan disabled by default sampai seluruh input valid
  const isPlateValid = isCompleteValidTruckPlate(truckPlate);
  const isClientValid = Boolean((selectedClientId || selectedClientName || customerName).trim());
  const isMaterialValid = Boolean(selectedMaterialId);
  const isQuantityValid = Number(quantity) > 0;
  const isSellPriceValid = Number(sellPricePerUnit) > 0;
  const isBuyPriceValid = Number(buyPricePerUnit) >= 0;
  const isOperationalCostValid = Number(operationalCost) >= 0;
  const isDateValid = Boolean(deliveryDate && deliveryDate.trim());

  const isFormValid =
    isPlateValid &&
    isClientValid &&
    isMaterialValid &&
    isQuantityValid &&
    isSellPriceValid &&
    isBuyPriceValid &&
    isOperationalCostValid &&
    isDateValid;

  const handleNotesSubmitShortcut = (): void => {
    if (isFormValid && !isSubmitting) {
      handleActionSubmit(true);
    }
  };

  // Global Keyboard Shortcut: Ctrl + Enter / Cmd + Enter untuk simpan cepat & lanjut rit berikutnya
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isFormValid && !isSubmitting) {
          e.preventDefault();
          handleActionSubmit(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFormValid, isSubmitting]);

  const executeSave = async (continueNextRit: boolean = false): Promise<void> => {
    const effectiveClientName = selectedClientName.trim() || customerName.trim();
    const selectedMat = materials.find(m => m.id === selectedMaterialId);
    const materialName = selectedMat ? selectedMat.name : 'Material Alam';

    setIsSubmitting(true);
    try {
      const payload: CreateDispatchPayload = {
        deliveryDate: deliveryDate || getTodayString(),
        suratJalan: suratJalan.trim(),
        truckPlate: truckPlate.trim().toUpperCase(),
        driverName: driverName.trim(),
        clientId: selectedClientId,
        clientName: effectiveClientName,
        customerName: effectiveClientName,
        quarryId: selectedQuarryId,
        quarryName: selectedQuarryName,
        projectId: formProjectId,
        projectName: formProjectName,
        investorId: selectedProject?.investorId || '',
        investorName: selectedProject?.investorName || '',
        materialId: selectedMaterialId,
        materialName,
        unit,
        quantity: Number(quantity) || 1,
        buyPricePerUnit: Number(buyPricePerUnit) || 0,
        sellPricePerUnit: Number(sellPricePerUnit) || 0,
        operationalCost: Number(operationalCost) || 0,
        notes: notes.trim()
      };

      await createDispatchTransaction(payload, userEmail);

      if (continueNextRit) {
        // Mode Fast Flow: Tetap simpan proyek, kuari, material, dan harga.
        // Bersihkan surat jalan & catatan.
        setSuratJalan('');
        setNotes('');
        setIsNegativeConfirmOpen(false);

        // Jika armada tidak dikunci, bersihkan plat & sopir
        if (!isTruckLocked) {
          setTruckPlate('');
          setDriverName('');
          setTimeout(() => plateInputRef.current?.focus(), 50);
        } else {
          setTimeout(() => suratJalanInputRef.current?.focus(), 50);
        }

        // Tampilkan Non-blocking green toast
        setSuccessToast({
          show: true,
          message: `Ritase armada ${payload.truckPlate} berhasil disimpan!`
        });
        setTimeout(() => {
          setSuccessToast(null);
        }, 3000);
      } else {
        // Mode Selesai: Bersihkan seluruh form & tampilkan modal alert selesai
        setSuratJalan('');
        setTruckPlate('');
        setDriverName('');
        setSelectedClientId('');
        setSelectedClientName('');
        setCustomerName('');
        setSelectedQuarryId('');
        setSelectedQuarryName('');
        if (globalProjectId === 'ALL') {
          setFormProjectId('');
          setFormProjectName('');
        }
        setNotes('');
        setQuantity(1);
        setQuantityInput('1');
        setIsNegativeConfirmOpen(false);

        dialog.showAlert({
          title: 'Ritase Berhasil Dicatat',
          message: `Tiket ritase untuk armada ${payload.truckPlate} berhasil disimpan. Mutasi pengeluaran kas telah otomatis dibukukan.`,
          confirmText: 'Selesai'
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Gagal mencatat ritase:', err);
      dialog.showAlert({
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan sistem saat menyimpan tiket ritase. Silakan periksa koneksi data.',
        confirmText: 'Tutup'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = async (continueNextRit: boolean): Promise<void> => {
    const region = extractRegionCode(truckPlate);
    if (!truckPlate.trim()) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Nomor plat truk wajib diisi.',
        confirmText: 'Mengerti'
      });
      setIsPlateInvalid(true);
      plateInputRef.current?.focus();
      return;
    }

    if (!isValidRegionCode(region)) {
      setIsPlateInvalid(true);
      plateInputRef.current?.focus();
      return;
    }

    const effectiveClientName = selectedClientName.trim() || customerName.trim();
    if (!effectiveClientName) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Pilih atau daftarkan nama PT pembeli / kontraktor terlebih dahulu.',
        confirmText: 'Mengerti'
      });
      return;
    }

    if (!selectedMaterialId) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Pilih jenis material terlebih dahulu.',
        confirmText: 'Mengerti'
      });
      return;
    }

    if (!quantity || quantity <= 0) {
      dialog.showAlert({
        title: 'Form Belum Lengkap',
        message: 'Volume ritase wajib diisi dan harus lebih dari 0.',
        confirmText: 'Mengerti'
      });
      return;
    }

    // Jika laba bersih minus dan bukan role dispatcher, picu getar dan tampilkan dialog konfirmasi khusus dengan tombol 5 detik
    if (!isDispatcherUser && netProfit < 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setIsNegativeConfirmOpen(true);
      return;
    }

    await executeSave(continueNextRit);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await handleActionSubmit(false);
  };

  // Filter list supir untuk smart dropdown & tab autocomplete
  const driverFiltered = useMemo(() => {
    const q = driverName.trim().toLowerCase();
    return knownDrivers
      .filter(d => !q || d.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [knownDrivers, driverName]);

  return (
    <div className="bg-[#f5f5f5] rounded-[10px] p-4 md:p-6 select-none pb-20 md:pb-6 relative">
      {/* Floating Success Toast (Non-blocking) */}
      {successToast?.show && (
        <div className="fixed top-5 right-5 z-50 bg-[#111111] text-white px-4 py-3 rounded-[8px] shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-4 duration-200">
          <span className="text-emerald-400 font-bold text-sm">✓</span>
          <span className="font-semibold">{successToast.message}</span>
        </div>
      )}

      <div className="hidden md:block pb-4 border-b border-[#e5e5e5]">
        <h2 className="text-sm font-semibold text-[#111111]">
          Catat Ritase Baru
        </h2>
        <p className="text-xs text-[#666666] mt-0.5">
          Input armada keluar-masuk kuari dan penetapan harga tempo.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="pt-0 md:pt-4 space-y-4 text-xs">
        {/* Section 1: Waktu & Armada Truk */}
        <div className="space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Waktu & Armada Truk
          </div>

          {/* Row 0: Tanggal Ritase (Jalan) & Counter Hari Ini */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#666666] font-medium">
                Tanggal Ritase (Jalan) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#e5e5e5]">
                Tercatat {todayRitaseCount} ritase pada tanggal ini
              </span>
            </div>
            <CustomDatePicker
              value={deliveryDate}
              onChange={setDeliveryDate}
              fullWidth
              variant="solid-white"
            />
            <span className="text-[10px] text-[#888888] mt-1 block">
              Tanggal armada beroperasi/jalan. Waktu pencatatan tiket otomatis terdata hari ini.
            </span>
          </div>

          {/* Row 1: No Plat Truk & Sopir */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                No. Plat Truk <span className="text-red-500">*</span>
              </label>
              <TruckPlateInput
                value={truckPlate}
                onChange={setTruckPlate}
                required
                isInvalidExternal={isPlateInvalid}
                onValidationChange={valid => {
                  if (valid) setIsPlateInvalid(false);
                }}
                inputRef={plateInputRef}
                knownTrucks={knownTrucks}
                onSelectTruck={t => {
                  if (t.lastDriverName) {
                    setDriverName(t.lastDriverName);
                  }
                }}
                variant="solid-white"
              />
            </div>

            <div className="relative">
              <label className="block text-[#666666] font-medium mb-1">
                Nama Sopir (Opsional)
              </label>
              <input
                type="text"
                placeholder="Pak Joko"
                value={driverName}
                onFocus={() => {
                  setIsDriverDropdownOpen(true);
                  setDriverHighlightedIndex(0);
                }}
                onBlur={() => {
                  setTimeout(() => setIsDriverDropdownOpen(false), 200);
                }}
                onChange={e => {
                  setDriverName(formatPersonNameLive(e.target.value));
                  setIsDriverDropdownOpen(true);
                  setDriverHighlightedIndex(0);
                }}
                onKeyDown={e => {
                  if (driverFiltered.length === 0) return;
                  if (e.key === 'Tab') {
                    const top = driverFiltered[driverHighlightedIndex] || driverFiltered[0];
                    if (top) {
                      setDriverName(top.name);
                      if (!truckPlate && top.defaultPlate) {
                        setTruckPlate(top.defaultPlate);
                      }
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setDriverHighlightedIndex(prev => (prev + 1) % driverFiltered.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setDriverHighlightedIndex(prev => (prev - 1 + driverFiltered.length) % driverFiltered.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const top = driverFiltered[driverHighlightedIndex] || driverFiltered[0];
                    if (top) {
                      setDriverName(top.name);
                      if (!truckPlate && top.defaultPlate) {
                        setTruckPlate(top.defaultPlate);
                      }
                      setIsDriverDropdownOpen(false);
                    }
                  }
                }}
                className="w-full bg-white border-none outline-none focus:outline-none focus:ring-0 rounded-[6px] px-3 py-2 text-xs text-black font-semibold placeholder:text-[#888888] transition-colors"
              />

              {/* Dropdown Autocomplete Suggestions Supir */}
              {isDriverDropdownOpen && driverFiltered.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#eaeaea] rounded-[6px] shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-[#f5f5f5]">
                  {driverFiltered.map((driver, idx) => (
                    <button
                      key={`${driver.name}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setDriverName(driver.name);
                        if (!truckPlate && driver.defaultPlate) {
                          setTruckPlate(driver.defaultPlate);
                        }
                        setIsDriverDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        idx === driverHighlightedIndex ? 'bg-[#f0f0f0]' : 'hover:bg-[#f9f9f9]'
                      }`}
                    >
                      <span className="font-medium text-[#111111]">{driver.name}</span>
                      {driver.defaultPlate && (
                        <span className="font-mono text-[10px] text-[#666666] bg-[#f0f0f0] px-1.5 py-0.5 rounded-[4px]">
                          {driver.defaultPlate}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox Kunci Armada & Sopir untuk multi-ritase cepat */}
            <label className="col-span-2 flex items-center gap-2 text-xs text-[#444444] cursor-pointer mt-0.5 select-none">
              <input
                type="checkbox"
                checked={isTruckLocked}
                onChange={e => setIsTruckLocked(e.target.checked)}
                className="rounded border-[#d1d5db] text-[#111111] focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-[#111111]">
                Kunci Armada & Sopir untuk input rit berikutnya
              </span>
            </label>
          </div>

          {/* Row 2: No. Surat Jalan Fisik */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              No. Surat Jalan (Opsional)
            </label>
            <input
              ref={suratJalanInputRef}
              type="text"
              placeholder="Contoh: SJ-00123"
              value={suratJalan}
              onChange={e => setSuratJalan(e.target.value)}
              className="w-full bg-white border-none outline-none focus:outline-none focus:ring-0 rounded-[6px] px-3 py-2 text-xs text-black font-semibold font-mono placeholder:text-[#888888] placeholder:font-sans transition-colors"
            />
            <span className="text-[10px] text-[#888888] mt-1 block">
              Nomor surat jalan fisik dari kuari tambang atau bukti kirim armada.
            </span>
          </div>
        </div>

        {/* Section 2: Lokasi & Mitra */}
        <div className="border-t border-[#e5e5e5] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Lokasi & Mitra
          </div>

          {/* Row 1.5: Proyek Tujuan (Custom UI per Rule 87 & 89) */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Proyek Tujuan <span className="text-[#888888] font-normal">(Otomatis Kunci Klien)</span>
            </label>
            <ProjectCombobox
              projects={activeProjects}
              selectedProjectId={formProjectId}
              selectedProjectName={formProjectName}
              onSelect={handleSelectProject}
              placeholder="Pilih proyek tujuan (atau pilih klien manual di bawah)..."
              variant="solid-white"
            />
          </div>

          {/* Row 2: Klien / Perusahaan Kontraktor */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Klien / Perusahaan Pembeli <span className="text-red-500">*</span>
            </label>
            <ClientCombobox
              clients={clients}
              selectedClientId={selectedClientId}
              selectedClientName={selectedClientName || customerName}
              onSelect={handleSelectClient}
              placeholder="Cari atau ketik nama klien..."
              variant="solid-white"
            />
          </div>

          {/* Row 3: Kuari Asal Material */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Kuari Asal / Tambang
            </label>
            <QuarryCombobox
              quarries={quarries}
              selectedQuarryId={selectedQuarryId}
              selectedQuarryName={selectedQuarryName}
              onSelect={handleSelectQuarry}
              placeholder="Pilih kuari asal..."
              variant="solid-white"
            />
          </div>
        </div>

        {/* Section 3: Material & Volume */}
        <div className="border-t border-[#e5e5e5] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Material & Volume
          </div>

          {/* Row 1: Pilih Material */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Jenis Material <span className="text-red-500">*</span>
            </label>
            {(() => {
              const selectedMat = materials.find(m => m.id === selectedMaterialId);
              return (
                <button
                  type="button"
                  onClick={() => setIsMaterialPickerOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 bg-white rounded-[6px] hover:bg-[#fafafa] transition-colors border-none text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={getMaterialIconSrc(selectedMat?.name || 'Material')}
                      alt={selectedMat?.name || 'Material'}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block font-semibold text-xs text-[#111111] truncate">
                        {selectedMat?.name || 'Pilih Jenis Material'}
                      </span>
                      {selectedMat && (
                        <span className="block text-[10px] text-[#888888] font-mono mt-0.5">
                          Acuan: Beli {formatRupiah(selectedMat.defaultBuyPrice)} • Jual {formatRupiah(selectedMat.defaultSellPrice)} / {selectedMat.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#111111] flex-shrink-0 ml-2">
                    Ubah
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Row 2: Satuan & Volume */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#666666] font-medium mb-1">Satuan</label>
              <div className="w-full bg-[#f0f0f0] rounded-[6px] px-3 py-2 text-xs font-semibold text-[#111111]">
                {unit === 'DT' ? 'Dump Truck (DT)' : 'Tonase (Ton)'}
              </div>
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Volume Ritase <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="1"
                value={quantityInput}
                onChange={handleQuantityChange}
                onFocus={handleQuantityFocus}
                onBlur={handleQuantityBlur}
                className="w-full bg-white border-none outline-none focus:outline-none focus:ring-0 rounded-[6px] px-3 py-2 text-xs font-bold text-black text-right transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Penetapan Harga & Biaya Operasional */}
        <div className="border-t border-[#e5e5e5] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Penetapan Harga & HOK
          </div>

          {/* Row 1: Harga Beli & Harga Jual */}
          <div className="grid grid-cols-2 gap-3">
            {!isDispatcherUser && (
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Harga Beli Kuari / {unit} (Cash)
                </label>
                <CurrencyInput
                  value={buyPricePerUnit}
                  onChange={setBuyPricePerUnit}
                  placeholder="0"
                  variant="solid-white"
                />
              </div>
            )}

            <div className={isDispatcherUser ? 'col-span-2' : ''}>
              <label className="block text-[#666666] font-medium mb-1">
                Harga Jual Konsumen / {unit} (Tempo) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={sellPricePerUnit}
                onChange={setSellPricePerUnit}
                placeholder="0"
                variant="solid-white"
              />
            </div>
          </div>

          {/* Row 2: Biaya Operasional & HOK */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Beban Operasional & HOK (Uang Jalan / Supir / Solar)
            </label>
            <CurrencyInput
              value={operationalCost}
              onChange={setOperationalCost}
              placeholder="0"
              variant="solid-white"
            />
            {matchedRate && (
              <div className="col-span-2 text-[10px] text-[#666666] pt-1">
                Acuan Matriks Kuari: <span className="font-semibold text-[#111111]">{matchedRate.quarryName}</span> ({matchedRate.qualityGrade})
              </div>
            )}
            {matchedRoute && (
              <div className="space-y-0.5 mt-1">
                <div className="text-[10px] text-[#666666] truncate">
                  Acuan Rute ({matchedRoute.distanceKm} km): <span className="font-semibold text-[#111111]">{matchedRoute.quarryName} → {matchedRoute.projectName} ({formatRupiah(matchedRoute.standardOperationalCost)})</span>
                </div>
                {operationalCost > matchedRoute.standardOperationalCost && (
                  <div className="text-[11px] font-medium text-amber-700">
                    ⚠️ Melebihi acuan rute standar: +{formatRupiah(operationalCost - matchedRoute.standardOperationalCost)} (Standar HOK: {formatRupiah(matchedRoute.standardOperationalCost)})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Catatan & Otorisasi */}
        <div className="border-t border-[#e5e5e5] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Catatan & Otorisasi
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <FlexibleTextarea
              value={notes}
              onChange={setNotes}
              placeholder="Titik bongkar sisi utara proyek..."
              onSubmitShortcut={handleNotesSubmitShortcut}
              variant="solid-white"
            />
          </div>
        </div>

        {/* Live Calculation Box */}
        <div className="bg-[#ebebeb] rounded-[8px] p-3.5 space-y-1.5 mt-2">
          {!isDispatcherUser && (
            <div className="flex justify-between items-center text-[11px] text-[#666666]">
              <span>Saldo Kas Utama PT Patak:</span>
              <span className={`font-mono font-medium ${centralCashBalance < 0 ? 'text-[#cf1124]' : 'text-[#111111]'}`}>
                {formatRupiah(centralCashBalance)}
              </span>
            </div>
          )}

          {!isDispatcherUser && (
            <div className="flex justify-between items-center text-[11px] text-[#666666]">
              <span>Belanja Tunai Kuari:</span>
              <span className="font-mono text-[#111111]">{formatRupiah(totalBuyCost)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-[#666666]">
            <span>Beban Operasional & HOK:</span>
            <span className="font-mono text-[#111111]">{formatRupiah(totalOperational)}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#666666]">
            <span>Piutang Penjualan (Tempo):</span>
            <span className="font-mono font-medium text-[#111111]">{formatRupiah(totalRevenue)}</span>
          </div>

          {!isDispatcherUser && (
            <div className={`flex justify-between items-center text-[11px] pt-1.5 border-t border-[#dddddd] transition-colors ${
              isCashDeficit ? 'text-[#cf1124]' : 'text-[#666666]'
            }`}>
              <span className="font-medium">Estimasi Sisa Kas Utama:</span>
              <span className="font-mono font-semibold">
                {formatRupiah(remainingCentralBalance)}
              </span>
            </div>
          )}

          {!isDispatcherUser && isCashDeficit && (
            <div className="text-[10px] text-[#cf1124] font-medium pt-0.5 leading-snug">
              ⚠️ Peringatan: Saldo Kas Utama menipis di bawah biaya tunai tiket ini. Tiket tetap dapat disimpan (Defisit Kas Lapangan).
            </div>
          )}

          {!isDispatcherUser && (
            <div
              className={`flex justify-between items-center text-xs pt-1.5 border-t border-[#dddddd] transition-colors ${
                netProfit < 0 ? 'text-[#cf1124]' : 'text-[#111111]'
              } ${isShaking ? 'animate-horizontal-shake' : ''}`}
            >
              <span className="font-medium">Estimasi Laba Bersih:</span>
              <span className="font-mono font-bold">
                {formatRupiah(netProfit)}
              </span>
            </div>
          )}
        </div>

        {/* Dual Tombol Simpan (Cepat Lanjut Ritase vs Selesai) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleActionSubmit(true)}
            disabled={!isFormValid || isSubmitting}
            className="py-2.5 px-4 bg-[#111111] hover:bg-black active:scale-[0.99] text-white rounded-[6px] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>⚡ Simpan & Input Rit Berikutnya</span>
            <span className="text-[10px] text-[#888888] font-normal">(Ctrl+Enter)</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionSubmit(false)}
            disabled={!isFormValid || isSubmitting}
            className="py-2.5 px-4 bg-white hover:bg-[#fafafa] border border-[#d1d5db] text-[#111111] rounded-[6px] font-medium text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan & Selesai'}
          </button>
        </div>
      </form>

      {/* Custom Material Picker Modal */}
      <MaterialPickerModal
        isOpen={isMaterialPickerOpen}
        onClose={() => setIsMaterialPickerOpen(false)}
        materials={materials}
        selectedMaterialId={selectedMaterialId}
        onSelect={handleSelectMaterial}
        transactions={transactions}
      />

      {/* Modal Konfirmasi Laba Bersih Minus dengan Depleting Button 5 Detik */}
      <NegativeProfitConfirmModal
        isOpen={isNegativeConfirmOpen}
        onClose={() => setIsNegativeConfirmOpen(false)}
        onConfirm={() => executeSave(false)}
        totalBuyCost={totalBuyCost}
        totalOperational={totalOperational}
        totalRevenue={totalRevenue}
        netProfit={netProfit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
