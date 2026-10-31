import React, { useState, useEffect } from 'react';
import { DispatchTransaction, MaterialItem, Client, MasterQuarry } from '@/types/database';
import { UpdateDispatchPayload } from '@/lib/dispatcherService';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { TruckPlateInput, isCompleteValidTruckPlate } from '@/components/ui/TruckPlateInput';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { FlexibleTextarea } from '@/components/ui/FlexibleTextarea';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { QuarryCombobox } from '@/components/ui/QuarryCombobox';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';
import { ClientCombobox } from '@/components/ui/ClientCombobox';
import { MaterialCombobox } from '@/components/ui/MaterialCombobox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CustomSelectCombobox } from '@/components/ui/CustomSelectCombobox';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { formatPersonNameLive } from '@/lib/nameUtils';

interface EditDispatchModalProps {
  isOpen: boolean;
  transaction: DispatchTransaction | null;
  materials: MaterialItem[];
  clients: Client[];
  quarries?: MasterQuarry[];
  onSave: (payload: UpdateDispatchPayload) => Promise<void>;
  onClose: () => void;
}

export function EditDispatchModal({
  isOpen,
  transaction,
  materials,
  clients,
  quarries: propQuarries,
  onSave,
  onClose
}: EditDispatchModalProps): React.JSX.Element | null {
  const { projects, isDispatcherUser, isInvestorUser } = useProjectFilter();
  const hideMargin = isDispatcherUser || isInvestorUser;

  // Ekstrak tanggal ritase asli dari transaksi
  const getInitialDate = (tx: DispatchTransaction | null): string => {
    if (!tx) return new Date().toISOString().slice(0, 10);
    if (tx.deliveryDate && tx.deliveryDate.trim()) return tx.deliveryDate.trim();
    if (tx.date && !tx.date.includes('T')) return tx.date.trim();
    if (tx.date) return tx.date.slice(0, 10);
    if (tx.createdAt) return tx.createdAt.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  };

  const [deliveryDate, setDeliveryDate] = useState<string>(getInitialDate(transaction));
  const [suratJalan, setSuratJalan] = useState<string>(transaction?.suratJalan || '');
  const [truckPlate, setTruckPlate] = useState<string>(transaction?.truckPlate || '');
  const [driverName, setDriverName] = useState<string>(transaction?.driverName || '');
  const [projectId, setProjectId] = useState<string>(transaction?.projectId || '');
  const [projectName, setProjectName] = useState<string>(transaction?.projectName || '');
  const [clientId, setClientId] = useState<string>(transaction?.clientId || '');
  const [clientName, setClientName] = useState<string>(transaction?.clientName || transaction?.customerName || '');
  const [quarryId, setQuarryId] = useState<string>(transaction?.quarryId || '');
  const [quarryName, setQuarryName] = useState<string>(transaction?.quarryName || '');
  const [quarries, setQuarries] = useState<MasterQuarry[]>(propQuarries || []);
  const [materialId, setMaterialId] = useState<string>(transaction?.materialId || '');
  const [materialName, setMaterialName] = useState<string>(transaction?.materialName || '');
  const [unit, setUnit] = useState<'DT' | 'Ton'>(transaction?.unit || 'DT');
  const [quantity, setQuantity] = useState<number>(transaction?.quantity || 1);
  const [buyPricePerUnit, setBuyPricePerUnit] = useState<number>(transaction?.buyPricePerUnit || 0);
  const [sellPricePerUnit, setSellPricePerUnit] = useState<number>(transaction?.sellPricePerUnit || 0);
  const [operationalCost, setOperationalCost] = useState<number>(transaction?.operationalCost || 0);
  const [approvalReason, setApprovalReason] = useState<string>("");
  const [approvalError, setApprovalError] = useState<string>("");
  const [notes, setNotes] = useState<string>(transaction?.notes || '');
  const [status, setStatus] = useState<'TEMPO' | 'LUNAS'>(transaction?.status || 'TEMPO');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    if (!propQuarries) {
      const unsub = subscribeMasterQuarries(loaded => setQuarries(loaded));
      return () => unsub();
    }
  }, [propQuarries]);

  // Sinkronisasi data saat transaksi yang dipilih berubah
  useEffect(() => {
    if (transaction) {
      setDeliveryDate(getInitialDate(transaction));
      setSuratJalan(transaction.suratJalan || '');
      setTruckPlate(transaction.truckPlate || '');
      setDriverName(transaction.driverName || '');
      setProjectId(transaction.projectId || '');
      setProjectName(transaction.projectName || '');
      setClientId(transaction.clientId || '');
      setClientName(transaction.clientName || transaction.customerName || '');
      setQuarryId(transaction.quarryId || '');
      setQuarryName(transaction.quarryName || '');
      setMaterialId(transaction.materialId || '');
      setMaterialName(transaction.materialName || '');
      setUnit(transaction.unit || 'DT');
      setQuantity(transaction.quantity || 1);
      setBuyPricePerUnit(transaction.buyPricePerUnit || 0);
      setSellPricePerUnit(transaction.sellPricePerUnit || 0);
      setOperationalCost(transaction.operationalCost || 0);
      setNotes(transaction.notes || '');
      setStatus(transaction.status || 'TEMPO');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  // Kalkulasi Finansial Real-time
  const totalBuyCost = (quantity || 0) * (buyPricePerUnit || 0);
  const totalRevenue = (quantity || 0) * (sellPricePerUnit || 0);
  const netProfit = totalRevenue - (totalBuyCost + (operationalCost || 0));

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const isFormValid =
    Boolean(deliveryDate) &&
    isCompleteValidTruckPlate(truckPlate) &&
    Boolean(materialName.trim()) &&
    quantity > 0 &&
    sellPricePerUnit > 0;

  const handleProjectSelect = (p: { id: string; name: string; clientId?: string; clientName?: string } | null) => {
    if (p) {
      setProjectId(p.id);
      setProjectName(p.name);
      if (p.clientId) {
        setClientId(p.clientId);
        setClientName(p.clientName || '');
      }
    } else {
      setProjectId('');
      setProjectName('');
    }
  };

  const handleMaterialSelect = (m: MaterialItem | null) => {
    if (m) {
      setMaterialId(m.id);
      setMaterialName(m.name);
      setUnit(m.unit);
      if (!buyPricePerUnit) setBuyPricePerUnit(m.defaultBuyPrice);
      if (!sellPricePerUnit) setSellPricePerUnit(m.defaultSellPrice);
    } else {
      setMaterialId('');
      setMaterialName('');
    }
  };

  const handleClientSelect = (c: Client | null) => {
    if (c) {
      setClientId(c.id);
      setClientName(c.name);
    } else {
      setClientId('');
      setClientName('');
    }
  };

  const handleQuarrySelect = (q: MasterQuarry | null) => {
    if (q) {
      setQuarryId(q.id);
      setQuarryName(q.name);
    } else {
      setQuarryId('');
      setQuarryName('');
    }
  };

  const handleInitiateSave = () => {
    if (!isFormValid) return;
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    setIsSubmitting(true);
    try {
      const payload: UpdateDispatchPayload = {
        deliveryDate,
        suratJalan: suratJalan.trim(),
        truckPlate,
        driverName,
        projectId,
        projectName,
        clientId,
        clientName: clientName || transaction.customerName,
        customerName: clientName || transaction.customerName,
        quarryId,
        quarryName,
        materialId,
        materialName: materialName || transaction.materialName,
        unit,
        quantity,
        buyPricePerUnit,
        sellPricePerUnit,
        operationalCost,
        notes,
        status
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan perubahan tiket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Surface: Mobile Bottom Sheet Drawer */}
        <div 
          className="relative w-full max-w-2xl bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Modal Bersih: Judul di tengah pada mobile */}
          <div className="p-4 sm:p-5 border-b border-[#eaeaea] flex items-center justify-between bg-white flex-shrink-0">
            <div className="w-full text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                  Edit Tiket Ritase
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#f0f0f0] text-[#444444]">
                  {transaction.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                Koreksi data operasional ritase dan sinkronisasi pembukuan kas.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup form edit"
              className="hidden md:flex text-[#888888] hover:text-[#111111] p-1.5 rounded transition-colors cursor-pointer"
            >
              <img src="/icons/close.png" alt="Tutup" className="w-4 h-4 object-contain" />
            </button>
          </div>

          {/* Form Body Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Grid 1: Tanggal & Plat Nomor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Tanggal Jalan:
                </label>
                <CustomDatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  fullWidth
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Nomor Plat Truk:
                </label>
                <TruckPlateInput
                  value={truckPlate}
                  onChange={setTruckPlate}
                  required
                />
              </div>
            </div>

            {/* Grid 2: No. Surat Jalan & Nama Sopir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  No. Surat Jalan (Opsional):
                </label>
                <input
                  type="text"
                  value={suratJalan}
                  onFocus={e => e.target.select()}
                  onChange={e => setSuratJalan(e.target.value)}
                  placeholder="Contoh: SJ-00123"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111] font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Nama Sopir (Opsional):
                </label>
                <input
                  type="text"
                  value={driverName}
                  onFocus={e => e.target.select()}
                  onChange={e => setDriverName(formatPersonNameLive(e.target.value))}
                  placeholder="Nama sopir armada..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111] font-semibold"
                />
              </div>
            </div>

            {/* Grid 2.5: Status Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-[#444444] mb-1">
                Status Pembayaran:
              </label>
              <CustomSelectCombobox
                options={[
                  { id: 'TEMPO', label: 'TEMPO (Belum Lunas)' },
                  { id: 'LUNAS', label: 'LUNAS' }
                ]}
                value={status}
                onChange={val => setStatus(val as 'TEMPO' | 'LUNAS')}
                variant="white"
                searchable={false}
              />
            </div>

            {/* Grid 3: Proyek Tujuan & Klien */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Proyek Tujuan (Alokasi Kas/Investor):
                </label>
                <ProjectCombobox
                  projects={projects}
                  selectedProjectId={projectId}
                  selectedProjectName={projectName}
                  onSelect={handleProjectSelect}
                  placeholder="Pilih proyek tujuan..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Klien / Pemilik Proyek (Penagihan):
                </label>
                <ClientCombobox
                  clients={clients}
                  selectedClientId={clientId}
                  selectedClientName={clientName}
                  onSelect={handleClientSelect}
                  placeholder="Pilih klien / pemilik..."
                />
              </div>
            </div>

            {/* Grid 3.5: Jenis Material & Kuari Asal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Jenis Material:
                </label>
                <MaterialCombobox
                  materials={materials}
                  selectedMaterialId={materialId}
                  selectedMaterialName={materialName}
                  onSelect={handleMaterialSelect}
                  placeholder="Pilih atau cari jenis material..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Kuari Asal / Tambang:
                </label>
                <QuarryCombobox
                  quarries={quarries}
                  selectedQuarryId={quarryId}
                  selectedQuarryName={quarryName}
                  onSelect={handleQuarrySelect}
                  placeholder="Pilih atau ketik kuari..."
                />
              </div>
            </div>

            {/* Grid 4: Volume & Satuan & Harga */}
            <div className={`grid grid-cols-2 ${hideMargin ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-3`}>
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Volume / Muatan:
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onFocus={e => e.target.select()}
                  onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Satuan Muat:
                </label>
                <CustomSelectCombobox
                  options={[
                    { id: 'DT', label: 'DT (Dump Truck)' },
                    { id: 'Ton', label: 'Ton' }
                  ]}
                  value={unit}
                  onChange={val => setUnit(val as 'DT' | 'Ton')}
                  variant="white"
                  searchable={false}
                />
              </div>

              {!hideMargin && (
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">
                    Harga Beli ({unit}):
                  </label>
                  <CurrencyInput
                    value={buyPricePerUnit}
                    onChange={setBuyPricePerUnit}
                    variant="solid-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Harga Jual ({unit}):
                </label>
                <CurrencyInput
                  value={sellPricePerUnit}
                  onChange={setSellPricePerUnit}
                  variant="solid-white"
                />
              </div>
            </div>

            {/* Operasional & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Beban Operasional & HOK:
                </label>
                <CurrencyInput
                  value={operationalCost}
                  onChange={setOperationalCost}
                  variant="solid-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Catatan Ritase:
                </label>
                <FlexibleTextarea
                  value={notes}
                  onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => e.target.select()}
                  onChange={setNotes}
                  placeholder="Catatan kendala, supir cadangan, lokasi..."
                />
              </div>
            </div>

            {/* Ringkasan Finansial Real-time */}
            <div className="p-3.5 bg-[#f9f9f9] rounded-[8px] border border-[#eeeeee] flex flex-wrap items-center justify-between gap-3 text-xs">
              {!hideMargin && (
                <div>
                  <span className="text-[#666666] block text-[11px]">Total Belanja Kuari:</span>
                  <span className="font-bold tracking-tight text-[#111111]">
                    {formatRupiah(totalBuyCost)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[#666666] block text-[11px]">Total Omset Penjualan:</span>
                <span className="font-bold tracking-tight text-[#111111]">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
              {!hideMargin && (
                <div>
                  <span className="text-[#666666] block text-[11px]">Estimasi Laba Bersih:</span>
                  <span className={`font-bold tracking-tight ${netProfit < 0 ? 'text-[#cf1124]' : 'text-[#008060]'}`}>
                    {formatRupiah(netProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Field Alasan Khusus Pengajuan Koreksi Dispatcher */}
          {isDispatcherUser && (
            <div className="p-4 sm:p-5 bg-amber-50/50 border-t border-amber-200 space-y-2">
              <label className="text-xs font-bold text-amber-900 block">
                Alasan Pengajuan Koreksi Tiket <span className="text-red-500">*</span>
              </label>
              <textarea
                value={approvalReason}
                onChange={e => {
                  setApprovalReason(e.target.value);
                  if (approvalError) setApprovalError("");
                }}
                rows={2}
                placeholder="Jelaskan alasan perubahan, contoh: salah pilih kuari asal, revisi volume muatan sesuai struk..."
                className="w-full text-xs p-2.5 rounded-[8px] border border-amber-300 bg-white focus:border-amber-600 outline-none text-[#111111] resize-none"
              />
              {approvalError && (
                <p className="text-[11px] font-medium text-red-600">{approvalError}</p>
              )}
            </div>
          )}

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 px-5 border-t border-[#eaeaea] bg-white sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#555555] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[8px] md:rounded-[6px] border-none transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleInitiateSave}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-black rounded-[8px] md:rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Memproses...' : isDispatcherUser ? 'Kirim Pengajuan Koreksi' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Pin Authorization Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Edit Tiket Ritase"
        description="Masukkan PIN otorisasi default (2008005) untuk memverifikasi perubahan data tiket ritase."
        targetLabel={`Tiket: ${transaction.ticketNumber} (${truckPlate})`}
        confirmText="Otorisasi Simpan"
        onSuccess={handlePinSuccess}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
}
