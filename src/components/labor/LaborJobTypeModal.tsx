import React, { useState } from 'react';
import { LaborJobType } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { saveLaborJobType } from '@/lib/laborService';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Surface: Mobile Bottom Sheet Drawer */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10 border-none">
        {/* Header Modal Bersih: Judul di tengah pada mobile */}
        <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0">
          <div className="w-full text-center md:text-left">
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
            className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            {errorMsg && (
              <div className="p-2.5 bg-[#fce8e6] text-[#cf1124] text-xs rounded-[6px] font-medium border-none">
                {errorMsg}
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
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 md:flex-none py-2.5 px-5 bg-[#111111] hover:bg-[#333333] active:scale-[0.99] text-white rounded-[8px] font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer border-none"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tipe Pekerjaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
