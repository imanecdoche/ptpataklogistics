import React, { useState, useEffect } from 'react';
import { DispatchTransaction, MaterialItem, Client, MasterQuarry } from '@/types/database';
import { UpdateDispatchPayload } from '@/lib/dispatcherService';
import { subscribeMasterQuarries } from '@/lib/databaseMasterService';
import { TruckPlateInput, isCompleteValidTruckPlate } from '@/components/ui/TruckPlateInput';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { FlexibleTextarea } from '@/components/ui/FlexibleTextarea';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { QuarryCombobox } from '@/components/ui/QuarryCombobox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useProjectFilter } from '@/context/ProjectFilterContext';

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

  const [deliveryDate, setDeliveryDate] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [quarryId, setQuarryId] = useState('');
  const [quarryName, setQuarryName] = useState('');
  const [quarries, setQuarries] = useState<MasterQuarry[]>(propQuarries || []);
  const [materialId, setMaterialId] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [unit, setUnit] = useState<'DT' | 'Ton'>('DT');
  const [quantity, setQuantity] = useState(1);
  const [buyPricePerUnit, setBuyPricePerUnit] = useState(0);
  const [sellPricePerUnit, setSellPricePerUnit] = useState(0);
  const [operationalCost, setOperationalCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'TEMPO' | 'LUNAS'>('TEMPO');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    if (!propQuarries) {
      const unsub = subscribeMasterQuarries(loaded => setQuarries(loaded));
      return () => unsub();
    }
  }, [propQuarries]);

  // Inisialisasi formulir dari transaksi yang dipilih
  useEffect(() => {
    if (transaction) {
      setDeliveryDate(transaction.deliveryDate || transaction.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selId = e.target.value;
    setProjectId(selId);
    const found = projects.find(p => p.id === selId);
    if (found) {
      setProjectName(found.name);
      if (found.clientId) {
        setClientId(found.clientId);
        setClientName(found.clientName || '');
      }
    } else {
      setProjectName('');
    }
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selId = e.target.value;
    setMaterialId(selId);
    const found = materials.find(m => m.id === selId);
    if (found) {
      setMaterialName(found.name);
      setUnit(found.unit);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selId = e.target.value;
    setClientId(selId);
    const found = clients.find(c => c.id === selId);
    if (found) {
      setClientName(found.name);
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
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none overflow-y-auto">
        <div 
          className="w-full max-w-2xl bg-white rounded-[12px] border border-[#eaeaea] shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Modal */}
          <div className="p-4 sm:p-5 border-b border-[#eaeaea] flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2">
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
              className="text-[#888888] hover:text-[#111111] p-1.5 rounded transition-colors"
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
                  Tanggal Ritase / Jalan:
                </label>
                <CustomDatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
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

            {/* Grid 2: Nama Sopir & Status Pembayaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Nama Sopir (Opsional):
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Nama sopir armada..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Status Pembayaran:
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'TEMPO' | 'LUNAS')}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111] font-mono"
                >
                  <option value="TEMPO">TEMPO (Belum Lunas)</option>
                  <option value="LUNAS">LUNAS</option>
                </select>
              </div>
            </div>

            {/* Grid 3: Proyek Tujuan & Kuari Asal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Proyek Tujuan (Alokasi Kas/Investor):
                </label>
                <select
                  value={projectId}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111] font-medium"
                >
                  <option value="">-- Proyek Umum / Tanpa Proyek --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Kuari Asal / Tambang:
                </label>
                <QuarryCombobox
                  quarries={quarries}
                  selectedQuarryId={quarryId}
                  selectedQuarryName={quarryName}
                  onSelect={q => {
                    if (q) {
                      setQuarryId(q.id);
                      setQuarryName(q.name);
                    } else {
                      setQuarryId('');
                      setQuarryName('');
                    }
                  }}
                  placeholder="Pilih atau ketik kuari..."
                />
              </div>
            </div>

            {/* Grid 3.1: Klien / Pemilik Proyek */}
            <div>
              <label className="block text-xs font-semibold text-[#444444] mb-1">
                Klien / Pemilik Proyek (Penagihan):
              </label>
              <select
                value={clientId}
                onChange={handleClientChange}
                className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
              >
                <option value="">-- Pilih Klien / Pemilik Proyek --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid 3.5: Jenis Material */}
            <div>
              <label className="block text-xs font-semibold text-[#444444] mb-1">
                Jenis Material:
              </label>
              <select
                value={materialId}
                onChange={handleMaterialChange}
                className="w-full px-3 py-2 text-xs bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
              >
                <option value="">-- Pilih Jenis Material --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Grid 4: Volume & Satuan */}
            <div className={`grid grid-cols-2 ${hideMargin ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-3`}>
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Volume / Muatan:
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Satuan Muat:
                </label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value as 'DT' | 'Ton')}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#111111]"
                >
                  <option value="DT">DT (Dump Truck)</option>
                  <option value="Ton">Ton</option>
                </select>
              </div>

              {!hideMargin && (
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">
                    Harga Beli Kuari:
                  </label>
                  <CurrencyInput
                    value={buyPricePerUnit}
                    onChange={setBuyPricePerUnit}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Harga Jual Tempo:
                </label>
                <CurrencyInput
                  value={sellPricePerUnit}
                  onChange={setSellPricePerUnit}
                />
              </div>
            </div>

            {/* Operasional & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Beban Operasional (Solar/Supir/Retribusi):
                </label>
                <CurrencyInput
                  value={operationalCost}
                  onChange={setOperationalCost}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Catatan Ritase:
                </label>
                <FlexibleTextarea
                  value={notes}
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
                  <span className="font-bold font-mono text-[#111111]">
                    {formatRupiah(totalBuyCost)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[#666666] block text-[11px]">Total Omset Penjualan:</span>
                <span className="font-bold font-mono text-[#111111]">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
              {!hideMargin && (
                <div>
                  <span className="text-[#666666] block text-[11px]">Estimasi Laba Bersih:</span>
                  <span className={`font-bold font-mono ${netProfit < 0 ? 'text-[#cf1124]' : 'text-[#008060]'}`}>
                    {formatRupiah(netProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Modal */}
          <div className="p-4 px-5 border-t border-[#eaeaea] bg-white flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#555555] bg-white border border-[#dddddd] rounded-[6px] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleInitiateSave}
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Pin Authorization Dialog */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Edit Tiket Ritase"
        description="Pengubahan data tiket akan menyinkronkan kembali mutasi kas masuk/keluar di Buku Kas."
        targetLabel={`${transaction.ticketNumber} • ${truckPlate}`}
        confirmText="Otorisasi & Simpan"
        onSuccess={handlePinSuccess}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
}
