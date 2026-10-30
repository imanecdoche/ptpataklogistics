import React, { useState } from 'react';
import { LaborJobType } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { saveLaborJobType } from '@/lib/laborService';

interface LaborJobTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobType?: LaborJobType | null;
  onSuccess: () => void;
}

export function LaborJobTypeModal({
  isOpen,
  onClose,
  jobType,
  onSuccess
}: LaborJobTypeModalProps): React.JSX.Element | null {
  const [name, setName] = useState<string>(jobType?.name || '');
  const [unit, setUnit] = useState<'m²' | 'Borongan'>(jobType?.unit || 'm²');
  const [defaultRate, setDefaultRate] = useState<number>(jobType?.defaultRate || 0);
  const [description, setDescription] = useState<string>(jobType?.description || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama tipe pekerjaan wajib diisi.');
      return;
    }
    if (defaultRate <= 0) {
      setErrorMsg('Tarif acuan upah wajib lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await saveLaborJobType(
        {
          name: name.trim(),
          unit,
          defaultRate,
          description: description.trim()
        },
        jobType?.id
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal menyimpan tipe pekerjaan tukang:', err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data tipe pekerjaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-[12px] border border-[#e5e5e5] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111111]">
              {jobType ? 'Edit Tipe Pekerjaan Tukang' : 'Tambah Tipe Pekerjaan Tukang'}
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Entitas klasifikasi upah lapangan (MCK, Drainase, Paving Block, dsb)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] text-base p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[6px] font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Nama Tipe Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Drainase, Paving Block, MCK..."
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Sistem Satuan Perhitungan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnit('m²')}
                className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer text-center ${
                  unit === 'm²'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#555555] border-[#e5e5e5] hover:bg-[#f9f9f9]'
                }`}
              >
                Per Meter Persegi (m²)
              </button>
              <button
                type="button"
                onClick={() => setUnit('Borongan')}
                className={`py-2 px-3 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer text-center ${
                  unit === 'Borongan'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#555555] border-[#e5e5e5] hover:bg-[#f9f9f9]'
                }`}
              >
                Sistem Borongan
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Tarif Acuan Upah {unit === 'm²' ? 'per m²' : 'Estimasi per Titik/Unit'} (Rp)
            </label>
            <CurrencyInput
              value={defaultRate}
              onChange={setDefaultRate}
              placeholder="0"
              className="w-full text-sm font-bold tracking-tight text-[#111111]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#333333]">
              Keterangan / Ruang Lingkup Kerja <span className="text-[#888888] font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Pemasangan dan penataan jalan conblock per m2"
              className="w-full px-3 py-2 text-xs border border-[#e5e5e5] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#111111] placeholder:text-[#aaaaaa] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#666666] hover:text-[#111111] bg-white border border-[#e5e5e5] rounded-[6px] hover:bg-[#fafafa] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111111] rounded-[6px] hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tipe Pekerjaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
