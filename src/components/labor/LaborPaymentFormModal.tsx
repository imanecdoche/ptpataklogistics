import React, { useState, useEffect } from 'react';
import { Project, LaborJobType, HOKCalculationType } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { recordLaborPayment } from '@/lib/laborService';

interface LaborPaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  jobTypes: LaborJobType[];
  userEmail: string;
  onSuccess: () => void;
}

export function LaborPaymentFormModal({
  isOpen,
  onClose,
  projects,
  jobTypes,
  userEmail,
  onSuccess
}: LaborPaymentFormModalProps): React.JSX.Element | null {
  const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  const [paymentDate, setPaymentDate] = useState<string>(getTodayString());
  const [projectId, setProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [workerName, setWorkerName] = useState<string>('');
  const [workerPhone, setWorkerPhone] = useState<string>('');
  const [jobTypeId, setJobTypeId] = useState<string>(jobTypes[0]?.id || '');
  const [calculationType, setCalculationType] = useState<HOKCalculationType>('PER_M2');
  const [areaSquareMeter, setAreaSquareMeter] = useState<number>(0);
  const [areaInput, setAreaInput] = useState<string>('');
  const [ratePerUnit, setRatePerUnit] = useState<number>(0);
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0);
  const [status, setStatus] = useState<'LUNAS' | 'PANJAR'>('LUNAS');
  const [notes, setNotes] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill default rate saat tipe pekerjaan berubah
  useEffect(() => {
    const selectedJob = jobTypes.find(j => j.id === jobTypeId);
    if (selectedJob) {
      if (selectedJob.unit === 'Borongan') {
        setCalculationType('BORONGAN');
        setLumpSumAmount(selectedJob.defaultRate);
      } else {
        setCalculationType('PER_M2');
        setRatePerUnit(selectedJob.defaultRate);
      }
    }
  }, [jobTypeId, jobTypes]);

  // Set default project jika belum terpilih
  useEffect(() => {
    if (!projectId && activeProjects.length > 0) {
      setProjectId(activeProjects[0]!.id);
    }
  }, [activeProjects, projectId]);

  if (!isOpen) return null;

  // Hitung total rupiah
  const totalAmount = calculationType === 'PER_M2'
    ? (Number(areaSquareMeter) || 0) * (Number(ratePerUnit) || 0)
    : lumpSumAmount;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!workerName.trim()) {
      setErrorMsg('Nama tukang / mandor wajib diisi.');
      return;
    }

    if (!projectId) {
      setErrorMsg('Pilih proyek yang dibebankan.');
      return;
    }

    if (!jobTypeId) {
      setErrorMsg('Pilih tipe pekerjaan.');
      return;
    }

    if (totalAmount <= 0) {
      setErrorMsg('Total nominal pembayaran HOK harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedPrj = projects.find(p => p.id === projectId);
      const selectedJob = jobTypes.find(j => j.id === jobTypeId);

      await recordLaborPayment(
        {
          paymentDate,
          projectId,
          projectName: selectedPrj?.name || 'Proyek Lapangan',
          workerName: workerName.trim(),
          workerPhone: workerPhone.trim(),
          jobTypeId,
          jobTypeName: selectedJob?.name || 'Pekerjaan Lapangan',
          calculationType,
          areaSquareMeter: calculationType === 'PER_M2' ? areaSquareMeter : undefined,
          ratePerUnit: calculationType === 'PER_M2' ? ratePerUnit : lumpSumAmount,
          totalAmount,
          notes: notes.trim(),
          status,
          referenceId: referenceId.trim()
        },
        userEmail
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal mencatat pembayaran HOK:', err);
      setErrorMsg('Terjadi kesalahan sistem saat menyimpan pembayaran HOK.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={isSubmitting ? undefined : onClose} 
      />
      
      <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
        <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
          <div className="w-full text-center md:text-left">
            <h3 className="text-sm font-bold text-[#111111]">
              Catat Pembayaran HOK Tukang Lapangan
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Pembayaran upah tukang (MCK, Drainase, Paving Block) terintegrasi ke kas proyek
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex text-[#888888] hover:text-[#111111] text-base p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[6px] font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Row 1: Tanggal & Proyek */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Tanggal Pembayaran <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                required
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Beban Proyek <span className="text-red-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                required
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-medium outline-none transition-colors cursor-pointer"
              >
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Nama Tukang & No HP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                Nama Mandor / Kepala Tukang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pak Kasim / Tukang Asep"
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
                required
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] font-medium outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                No. WhatsApp / HP (Opsional)
              </label>
              <input
                type="text"
                placeholder="08xx-xxxx-xxxx"
                value={workerPhone}
                onChange={e => setWorkerPhone(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Tipe Pekerjaan & Model Perhitungan */}
          <div className="p-3 bg-[#fafafa] border border-[#eaeaea] rounded-[8px] space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#111111] mb-1">
                Tipe Pekerjaan Lapangan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {jobTypes.map(j => {
                  const isSelected = j.id === jobTypeId;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setJobTypeId(j.id)}
                      className={`px-2.5 py-2 rounded-[6px] text-xs font-semibold text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                          : 'bg-white text-[#444444] border-[#e0e0e0] hover:bg-[#f0f0f0]'
                      }`}
                    >
                      <div className="truncate">{j.name}</div>
                      <div className={`text-[10px] font-normal truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-[#888888]'}`}>
                        {j.unit === 'Borongan' ? 'Borongan' : `m² (@${j.defaultRate.toLocaleString('id-ID')})`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Metode Perhitungan: Per m2 vs Borongan */}
            <div>
              <label className="block text-[11px] font-semibold text-[#555555] mb-1.5">
                Metode Perhitungan Upah HOK
              </label>
              <div className="flex items-center gap-4 text-xs font-medium text-[#222222]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="calcType"
                    checked={calculationType === 'PER_M2'}
                    onChange={() => setCalculationType('PER_M2')}
                    className="accent-[#111111] cursor-pointer"
                  />
                  <span>Per Meter Persegi (m²)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="calcType"
                    checked={calculationType === 'BORONGAN'}
                    onChange={() => setCalculationType('BORONGAN')}
                    className="accent-[#111111] cursor-pointer"
                  />
                  <span>Per Borongan (Lump Sum)</span>
                </label>
              </div>
            </div>

            {/* Input Dinamis berdasarkan Model Perhitungan */}
            {calculationType === 'PER_M2' ? (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#eaeaea]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                    Volume / Luas (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Contoh: 45.5"
                    value={areaInput}
                    onChange={e => {
                      setAreaInput(e.target.value);
                      setAreaSquareMeter(parseFloat(e.target.value) || 0);
                    }}
                    required
                    className="w-full bg-white border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs font-bold text-[#111111] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                    Tarif per m² (Rp) <span className="text-red-500">*</span>
                  </label>
                  <CurrencyInput
                    value={ratePerUnit}
                    onChange={setRatePerUnit}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-[#eaeaea]">
                <label className="block text-[11px] font-semibold text-[#555555] mb-1">
                  Nominal Kesepakatan Borongan (Rp) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={lumpSumAmount}
                  onChange={setLumpSumAmount}
                  placeholder="0"
                  required
                />
              </div>
            )}
          </div>

          {/* Rangkuman Total Upah & Status Bayar */}
          <div className="p-3 bg-[#111111] text-white rounded-[8px] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium uppercase tracking-wider">
                Total Upah HOK yang Dibayarkan:
              </span>
              <span className="text-base font-bold tracking-tight text-white">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-300 font-medium">Status:</span>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'LUNAS' | 'PANJAR')}
                className="bg-[#222222] border border-gray-700 text-white rounded-[4px] px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="LUNAS">LUNAS</option>
                <option value="PANJAR">PANJAR / KASBON</option>
              </select>
            </div>
          </div>

          {/* Titik Lokasi / Catatan Progres */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              Titik Pengerjaan / Catatan Progres Lapangan
            </label>
            <input
              type="text"
              placeholder="Contoh: Pemasangan paving block 45 m2 segmen utara Situ Cikedal"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none transition-colors"
            />
          </div>

          {/* No. Kwitansi / Referensi */}
          <div>
            <label className="block text-[11px] font-semibold text-[#555555] mb-1">
              No. Bukti / Kwitansi / Kasbon (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: KWT-HOK-001"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              className="w-full bg-[#f9f9f9] border border-[#e0e0e0] focus:border-[#111111] rounded-[6px] px-3 py-2 text-xs font-mono text-[#111111] outline-none transition-colors"
            />
          </div>

          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#666666] hover:bg-[#f5f5f5] rounded-[8px] transition-colors border border-[#eaeaea] bg-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="flex-1 md:flex-none px-5 py-2.5 md:py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[8px] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran HOK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
