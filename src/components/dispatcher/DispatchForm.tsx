import React, { useState, useEffect, useRef } from 'react';
import { MaterialItem, UnitType, DispatchTransaction, Client, MasterQuarry, Project, QuarryMaterialRate, RouteOperatingTariff } from '@/types/database';
import { createDispatchTransaction, CreateDispatchPayload, subscribeKnownTrucks, KnownTruck, subscribeKnownDrivers, KnownDriver } from '@/lib/dispatcherService';
import { subscribeClients } from '@/lib/clientService';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { subscribeQuarryRates, subscribeRouteTariffs } from '@/lib/materialMasterService';
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
  const [truckPlate, setTruckPlate] = useState('');
  const [isPlateInvalid, setIsPlateInvalid] = useState(false);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const [driverName, setDriverName] = useState('');

  // Master Klien State
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [customerName, setCustomerName] = useState('');

  // Master Kuari Asal State
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [selectedQuarryId, setSelectedQuarryId] = useState<string>('');
  const [selectedQuarryName, setSelectedQuarryName] = useState<string>('');

  // Proyek Tujuan State (Multi-Proyek Architecture)
  const { projects, selectedProjectId: globalProjectId, isDispatcherUser } = useProjectFilter();
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formProjectName, setFormProjectName] = useState<string>('');

  // Master Material Rates & Route Tariffs State (Matriks 3 Titik)
  const [quarryRates, setQuarryRates] = useState<QuarryMaterialRate[]>([]);
  const [routeTariffs, setRouteTariffs] = useState<RouteOperatingTariff[]>([]);
  const [matchedRate, setMatchedRate] = useState<QuarryMaterialRate | null>(null);
  const [matchedRoute, setMatchedRoute] = useState<RouteOperatingTariff | null>(null);

  // Sinkronisasi dengan filter global proyek di header
  useEffect(() => {
    if (globalProjectId && globalProjectId !== 'ALL' && projects.length > 0) {
      const p = projects.find(item => item.id === globalProjectId);
      if (p) {
        setFormProjectId(p.id);
        setFormProjectName(p.name);
        setSelectedClientId(p.clientId);
        setSelectedClientName(p.clientName);
        setCustomerName(p.clientName);
      }
    }
  }, [globalProjectId, projects]);

  const handleSelectProject = (project: Project | null) => {
    if (project) {
      setFormProjectId(project.id);
      setFormProjectName(project.name);
      setSelectedClientId(project.clientId);
      setSelectedClientName(project.clientName);
      setCustomerName(project.clientName);
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

  // Subscribe daftar riwayat armada truk unik yang pernah tersimpan di transaksi
  useEffect(() => {
    const unsubTrucks = subscribeKnownTrucks(loaded => {
      setKnownTrucks(loaded);
    });
    return () => unsubTrucks();
  }, []);

  // Subscribe daftar supir gabungan dari master_drivers dan transaksi
  useEffect(() => {
    const unsubDrivers = subscribeKnownDrivers(loaded => {
      setKnownDrivers(loaded);
    });
    return () => unsubDrivers();
  }, []);

  // Subscribe daftar master kuari asal dari Firestore
  useEffect(() => {
    const unsubQuarries = subscribeMasterQuarries(loaded => {
      setQuarries(loaded);
    });
    return () => unsubQuarries();
  }, []);

  // Subscribe matriks harga kuari & biaya rute dari Firestore
  useEffect(() => {
    const unsubRates = subscribeQuarryRates(loaded => {
      setQuarryRates(loaded);
    });
    const unsubRoutes = subscribeRouteTariffs(loaded => {
      setRouteTariffs(loaded);
    });
    return () => {
      unsubRates();
      unsubRoutes();
    };
  }, []);

  // Material aktif yang dipilih
  const selectedMat = materials.find(m => m.id === selectedMaterialId);

  // Auto-fill rekomendasi Harga Tebus Cash Kuari ketika Kuari dan Material dipilih
  useEffect(() => {
    if (selectedQuarryId && selectedMaterialId) {
      const found = quarryRates.find(
        r =>
          r.quarryId === selectedQuarryId &&
          (r.materialId === selectedMaterialId ||
            (selectedMat && r.materialName.toLowerCase() === selectedMat.name.toLowerCase()))
      );
      if (found) {
        setMatchedRate(found);
        setBuyPricePerUnit(found.buyPriceCash);
      } else {
        setMatchedRate(null);
      }
    } else {
      setMatchedRate(null);
    }
  }, [selectedQuarryId, selectedMaterialId, quarryRates, selectedMat]);

  // Auto-fill rekomendasi Biaya Jalan Armada ketika Kuari Asal dan Proyek Tujuan dipilih
  useEffect(() => {
    if (selectedQuarryId && formProjectId) {
      const found = routeTariffs.find(
        r => r.quarryId === selectedQuarryId && r.projectId === formProjectId
      );
      if (found) {
        setMatchedRoute(found);
        setOperationalCost(found.standardOperationalCost);
      } else {
        setMatchedRoute(null);
      }
    } else {
      setMatchedRoute(null);
    }
  }, [selectedQuarryId, formProjectId, routeTariffs]);

  const handleSelectClient = (c: Client | null): void => {
    if (c) {
      setSelectedClientId(c.id);
      setSelectedClientName(c.name);
      setCustomerName(c.name);
    } else {
      setSelectedClientId('');
      setSelectedClientName('');
      setCustomerName('');
    }
  };

  const handleSelectQuarry = (q: MasterQuarry | null): void => {
    if (q) {
      setSelectedQuarryId(q.id);
      setSelectedQuarryName(q.name);
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

  // Format nama pembeli/sopir: Huruf besar di awal kata & standardisasi resmi PT/CV/UD/KM tanpa titik
  const formatTitleCaseAndEntity = (input: string): string => {
    if (!input) return '';

    return input
      .split(/(\s+)/)
      .map(token => {
        if (/^\s+$/.test(token)) return token;

        const lower = token.toLowerCase();

        // Standar Resmi PUEBI Indonesia & UU PT: 'PT', 'CV', 'UD', 'KM' (tanpa titik)
        if (lower === 'pt' || lower === 'pt.') return 'PT';
        if (lower === 'cv' || lower === 'cv.') return 'CV';
        if (lower === 'ud' || lower === 'ud.') return 'UD';
        if (lower === 'km' || lower === 'km.') return 'KM';
        if (lower === 'tbk' || lower === 'tbk.') return 'Tbk';

        // Huruf besar di awal kata (Title Case)
        return token.charAt(0).toUpperCase() + token.slice(1);
      })
      .join('');
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
    if (isFormValid && !isSubmitting && formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const executeSave = async (): Promise<void> => {
    const effectiveClientName = selectedClientName.trim() || customerName.trim();
    const selectedMat = materials.find(m => m.id === selectedMaterialId);
    const materialName = selectedMat ? selectedMat.name : 'Material Alam';

    setIsSubmitting(true);
    try {
      const payload: CreateDispatchPayload = {
        deliveryDate: deliveryDate || getTodayString(),
        truckPlate: truckPlate.trim().toUpperCase(),
        driverName: driverName.trim(),
        clientId: selectedClientId,
        clientName: effectiveClientName,
        customerName: effectiveClientName,
        quarryId: selectedQuarryId,
        quarryName: selectedQuarryName,
        projectId: formProjectId,
        projectName: formProjectName,
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

      // Reset form
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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

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

    await executeSave();
  };

  return (
    <div className="bg-transparent md:bg-white rounded-none md:rounded-[10px] p-0 md:p-6 select-none pb-20 md:pb-6">
      <div className="hidden md:block pb-4 border-b border-[#eaeaea]">
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

          {/* Row 0: Tanggal Ritase (Jalan) */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Tanggal Ritase (Jalan) <span className="text-red-500">*</span>
            </label>
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
                onFocus={() => setIsDriverDropdownOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsDriverDropdownOpen(false), 200);
                }}
                onChange={e => {
                  setDriverName(formatTitleCaseAndEntity(e.target.value));
                  setIsDriverDropdownOpen(true);
                }}
                className="w-full bg-white border-2 border-black rounded-[6px] px-3 py-2 text-xs text-black font-semibold placeholder:text-[#888888] outline-none transition-colors"
              />

              {/* Dropdown Autocomplete Suggestions Supir */}
              {isDriverDropdownOpen && (
                (() => {
                  const q = driverName.trim().toLowerCase();
                  const filtered = knownDrivers
                    .filter(d => !q || d.name.toLowerCase().includes(q))
                    .slice(0, 5);

                  if (filtered.length === 0) return null;

                  return (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#eaeaea] rounded-[6px] shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-[#f5f5f5]">
                      {filtered.map((driver, idx) => (
                        <button
                          key={`${driver.name}-${idx}`}
                          type="button"
                          onMouseDown={() => {
                            setDriverName(driver.name);
                            // Auto-fill plat armada jika masih kosong dan supir punya defaultPlate
                            if (!truckPlate && driver.defaultPlate) {
                              setTruckPlate(driver.defaultPlate);
                            }
                            setIsDriverDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[#f9f9f9] flex items-center justify-between cursor-pointer transition-colors"
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
                  );
                })()
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Lokasi & Mitra */}
        <div className="border-t border-[#eaeaea] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Lokasi & Mitra
          </div>

          {/* Row 1.5: Proyek Tujuan (Custom UI per Rule 87 & 89) */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Proyek Tujuan <span className="text-[#888888] font-normal">(Otomatis Kunci Klien)</span>
            </label>
            <ProjectCombobox
              projects={projects}
              selectedProjectId={formProjectId}
              selectedProjectName={formProjectName}
              onSelect={handleSelectProject}
              placeholder="Pilih proyek tujuan (atau pilih klien manual di bawah)..."
              variant="solid-white"
            />
          </div>

          {/* Row 2: Master Klien & Kuari Asal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Nama PT / Pembeli Proyek <span className="text-red-500">*</span>
              </label>
              <ClientCombobox
                clients={clients}
                selectedClientId={selectedClientId}
                selectedClientName={selectedClientName || customerName}
                onSelect={handleSelectClient}
                required
                variant="solid-white"
              />
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Kuari Asal / Tambang
              </label>
              <QuarryCombobox
                quarries={quarries}
                selectedQuarryId={selectedQuarryId}
                selectedQuarryName={selectedQuarryName}
                onSelect={handleSelectQuarry}
                placeholder="Pilih atau ketik kuari asal..."
                variant="solid-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Komoditas & Volume */}
        <div className="border-t border-[#eaeaea] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Komoditas & Volume
          </div>

          {/* Row 3: Material & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[#666666] font-medium mb-1">
                Jenis Material <span className="text-red-500">*</span>
              </label>
              {/* Custom Trigger Button Modal Picker */}
              <button
                type="button"
                onClick={() => setIsMaterialPickerOpen(true)}
                className="w-full bg-white border-2 border-black rounded-[6px] px-3 py-2 text-xs text-black font-semibold hover:bg-[#fafafa] transition-colors flex items-center justify-between cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {selectedMat && (
                    <img
                      src={getMaterialIconSrc(selectedMat.name)}
                      alt=""
                      className="w-6 h-6 rounded-[4px] object-cover flex-shrink-0 bg-[#ebebeb]"
                    />
                  )}
                  <span className="font-semibold truncate">
                    {selectedMat ? selectedMat.name : 'Pilih Jenis Material'}
                  </span>
                  {selectedMat && (
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-black text-white font-mono text-[10px] font-semibold select-none">
                      {selectedMat.unit}
                    </span>
                  )}
                </div>

                {/* Chevron Down Icon */}
                <svg
                  className="w-3.5 h-3.5 text-black flex-shrink-0 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Volume <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center bg-white border-2 border-black rounded-[6px]">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  placeholder="0"
                  value={quantityInput}
                  onChange={handleQuantityChange}
                  onFocus={handleQuantityFocus}
                  onBlur={handleQuantityBlur}
                  className="w-full bg-transparent outline-none border-none py-2 pl-3 pr-2 text-xs font-mono font-semibold text-black"
                />
                <span className="pr-3 pl-1 text-xs font-mono font-semibold text-black select-none pointer-events-none">
                  {unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Finansial & Operasional */}
        <div className="border-t border-[#eaeaea] pt-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
            Finansial & Operasional
          </div>

          {/* Row 4: Harga Beli (Cash Kuari) & Harga Jual (Tempo Proyek) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#666666] font-medium mb-1 whitespace-nowrap">
                Beli Kuari / {unit} (Cash)
              </label>
              <CurrencyInput
                required
                value={buyPricePerUnit}
                onChange={setBuyPricePerUnit}
                variant="solid-white"
              />
              {matchedRate && (
                <div className="text-[10px] text-[#666666] mt-1 font-mono truncate">
                  Acuan Kuari: <span className="font-semibold text-[#111111]">{matchedRate.qualityGrade}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1 whitespace-nowrap">
                Jual Proyek / {unit} (Tempo)
              </label>
              <CurrencyInput
                required
                value={sellPricePerUnit}
                onChange={setSellPricePerUnit}
                variant="solid-white"
              />
            </div>
          </div>

          {/* Row 5: Operasional Lapangan (Solar, Uang Jalan, Portal) */}
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Beban Operasional Armada (Solar/Supir/Portal)
            </label>
            <CurrencyInput
              required
              value={operationalCost}
              onChange={setOperationalCost}
              variant="solid-white"
            />
            {matchedRoute && (
              <div className="text-[10px] text-[#666666] mt-1 font-mono truncate">
                Acuan Rute ({matchedRoute.distanceKm} km): <span className="font-semibold text-[#111111]">{matchedRoute.quarryName} → {matchedRoute.projectName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Catatan & Otorisasi */}
        <div className="border-t border-[#eaeaea] pt-3.5 space-y-3.5">
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

        {/* Live Calculation Box (Sesuai Formula PRD & Proteksi RBAC Margin) */}
        <div className="bg-[#fafafa] rounded-[8px] p-3.5 space-y-1.5 mt-2">
          {!isDispatcherUser && (
            <div className="flex justify-between items-center text-[11px] text-[#666666]">
              <span>Belanja Tunai Kuari:</span>
              <span className="font-mono text-[#111111]">{formatRupiah(totalBuyCost)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-[#666666]">
            <span>Beban Operasional:</span>
            <span className="font-mono text-[#111111]">{formatRupiah(totalOperational)}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#666666]">
            <span>Piutang Penjualan (Tempo):</span>
            <span className="font-mono font-medium text-[#111111]">{formatRupiah(totalRevenue)}</span>
          </div>

          {!isDispatcherUser && (
            <div
              className={`flex justify-between items-center text-xs pt-1.5 border-t border-[#eaeaea] transition-colors ${
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

        {/* Tombol Simpan (Disabled by Default sampai seluruh form 100% Valid) */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[6px] font-medium text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#171717] disabled:active:scale-100 mt-2 border-none cursor-pointer"
        >
          {isSubmitting ? 'Menyimpan Tiket Ritase...' : 'Simpan Tiket Ritase'}
        </button>
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
        onConfirm={executeSave}
        totalBuyCost={totalBuyCost}
        totalOperational={totalOperational}
        totalRevenue={totalRevenue}
        netProfit={netProfit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
