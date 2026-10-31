import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Project, ProjectSubJob, ProjectSubJobType, ProjectSubJobUnit } from '@/types/database';
import { saveProjectSubJob, SaveSubJobPayload } from '@/lib/projectFinanceService';
import { formatRupiah } from '@/lib/currencyUtils';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface RecordSubJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: string;
  editSubJob?: ProjectSubJob | null;
  onSuccess?: () => void;
}

export function RecordSubJobModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  editSubJob,
  onSuccess
}: RecordSubJobModalProps): React.JSX.Element | null {
  const [projectId, setProjectId] = useState<string>('');
  const [jobType, setJobType] = useState<ProjectSubJobType>('MCK');
  const [jobName, setJobName] = useState<string>('');
  const [unit, setUnit] = useState<ProjectSubJobUnit>('PAKET');
  const [volume, setVolume] = useState<number>(1);
  const [clientRate, setClientRate] = useState<number>(0);
  const [workerRate, setWorkerRate] = useState<number>(0);
  const [workerLeaderName, setWorkerLeaderName] = useState<string>('');
  const [workerLeaderPhone, setWorkerLeaderPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editSubJob) {
      setProjectId(editSubJob.projectId);
      setJobType(editSubJob.jobType);
      setJobName(editSubJob.jobName);
      setUnit(editSubJob.unit);
      setVolume(editSubJob.volume || 1);
      setClientRate(editSubJob.clientRatePerUnit || 0);
      setWorkerRate(editSubJob.workerRatePerUnit || 0);
      setWorkerLeaderName(editSubJob.workerLeaderName || '');
      setWorkerLeaderPhone(editSubJob.workerLeaderPhone || '');
      setNotes(editSubJob.notes || '');
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setJobType('MCK');
      setJobName('Pembangunan MCK');
      setUnit('PAKET');
      setVolume(1);
      setClientRate(15000000);
      setWorkerRate(12000000);
      setWorkerLeaderName('');
      setWorkerLeaderPhone('');
      setNotes('');
    }
  }, [editSubJob, defaultProjectId, projects, isOpen]);

  if (!isOpen) return null;

  const selectedProj = projects.find(p => p.id === projectId);

  // Auto preset berdasarkan jobType
  const handleSelectJobType = (t: ProjectSubJobType) => {
    setJobType(t);
    if (t === 'MCK') {
      setUnit('PAKET');
      setVolume(1);
      if (!editSubJob) {
        setJobName('Pembangunan MCK');
        setClientRate(15000000);
        setWorkerRate(12000000);
      }
    } else if (t === 'PAVING_BLOCK') {
      setUnit('M2');
      if (!editSubJob) {
        setJobName('Pemasangan Paving Block');
        setVolume(200);
        setClientRate(75000);
        setWorkerRate(50000);
      }
    } else if (t === 'DRAINASE') {
      setUnit('M3');
      if (!editSubJob) {
        setJobName('Pekerjaan Drainase Saluran');
        setVolume(100);
        setClientRate(120000);
        setWorkerRate(85000);
      }
    } else {
      setUnit('PAKET');
      if (!editSubJob) {
        setJobName('Pekerjaan Fisik Lainnya');
      }
    }
  };

  const totalClient = (volume || 0) * (clientRate || 0);
  const totalWorker = (volume || 0) * (workerRate || 0);
  const margin = totalClient - totalWorker;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('Pilih proyek terlebih dahulu.');
      return;
    }
    if (!jobName.trim()) {
      alert('Nama pekerjaan wajib diisi.');
      return;
    }
    if (!workerLeaderName.trim()) {
      alert('Nama mandor / kepala tukang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SaveSubJobPayload = {
        id: editSubJob ? editSubJob.id : undefined,
        projectId,
        projectName: selectedProj?.name || 'Proyek Lapangan',
        clientId: selectedProj?.clientId || '',
        clientName: selectedProj?.clientName || '',
        jobType,
        jobName: jobName.trim(),
        unit,
        volume: Number(volume) || 1,
        clientRatePerUnit: Number(clientRate) || 0,
        workerRatePerUnit: Number(workerRate) || 0,
        workerLeaderName: workerLeaderName.trim(),
        workerLeaderPhone: workerLeaderPhone.trim(),
        status: editSubJob?.status || 'BERJALAN',
        notes: notes.trim()
      };

      await saveProjectSubJob(payload);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Gagal menyimpan sub-pekerjaan:', err);
      alert('Gagal menyimpan sub-pekerjaan fisik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div 
        className="relative w-full max-w-xl bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col max-h-[92vh] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#111111]">
              {editSubJob ? 'Edit Sub-Pekerjaan Fisik' : 'Tambah Sub-Pekerjaan Fisik (MCK / Paving / Drainase)'}
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Kelola kontrak kerja borongan lapangan, kalkulasi satuan, dan plafon upah tukang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
           aria-label="Tutup"><X className="w-4 h-4" /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white text-xs">
          {/* Pilihan Proyek Induk */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Proyek Induk <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.clientName ? `(Klien: ${p.clientName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tipe Sub-Pekerjaan (Tombol Cepat) */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#111111] block">
              Jenis Pekerjaan Lapangan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'MCK' as const, label: 'MCK (Paket)' },
                { type: 'PAVING_BLOCK' as const, label: 'Paving Block (m²)' },
                { type: 'DRAINASE' as const, label: 'Drainase (m³)' },
                { type: 'LAINNYA' as const, label: 'Lainnya' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelectJobType(item.type)}
                  className={`py-2 px-2.5 rounded-[8px] font-semibold text-center border transition-all cursor-pointer ${
                    jobType === item.type
                      ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                      : 'bg-[#fafafa] text-[#555555] border-[#eaeaea] hover:bg-[#f0f0f0]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Pekerjaan & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-[#111111] block">
                Nama Sub-Pekerjaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobName}
                onChange={e => setJobName(e.target.value)}
                placeholder="Contoh: Pembuatan MCK 2 Pintu / Paving Area Parkir"
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">Satuan Ukur</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as ProjectSubJobUnit)}
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
              >
                <option value="PAKET">Paket / Borongan</option>
                <option value="M2">Per Meter Persegi (m²)</option>
                <option value="M3">Per Kubikasi (m³)</option>
              </select>
            </div>
          </div>

          {/* Volume & Tarif Perhitungan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#fbfbfb] border border-[#ebebeb] rounded-[10px]">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Volume ({unit === 'PAKET' ? 'Paket' : unit === 'M2' ? 'm²' : 'm³'})
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#dcdcdc] rounded-[6px] text-xs font-mono font-bold text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Tarif Klien / {unit} (Rp)
              </label>
              <CurrencyInput
                value={clientRate}
                onChange={setClientRate}
                placeholder="0"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Tarif Borongan Tukang (Rp)
              </label>
              <CurrencyInput
                value={workerRate}
                onChange={setWorkerRate}
                placeholder="0"
                className="w-full"
              />
            </div>
          </div>

          {/* Mandor / Kepala Tukang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Nama Mandor / Kepala Tukang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workerLeaderName}
                onChange={e => setWorkerLeaderName(e.target.value)}
                placeholder="Contoh: Kang Asep / Mandor Solihin"
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                No. WhatsApp Mandor (Opsional)
              </label>
              <input
                type="tel"
                value={workerLeaderPhone}
                onChange={e => setWorkerLeaderPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">Catatan / Spesifikasi Pekerjaan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Keterangan spesifikasi teknis atau kesepakatan lapangan..."
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111] resize-none"
            />
          </div>

          {/* Live Financial Breakdown Card */}
          <div className="p-3.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-[10px] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
              Kalkulasi Kontrak Otomatis
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-sky-700 block">Tagihan ke Klien</span>
                <span className="font-bold text-[#111111] font-mono">{formatRupiah(totalClient)}</span>
              </div>
              <div>
                <span className="text-[10px] text-sky-700 block">Plafon Borongan Tukang</span>
                <span className="font-bold text-amber-800 font-mono">{formatRupiah(totalWorker)}</span>
              </div>
              <div>
                <span className="text-[10px] text-sky-700 block">Estimasi Margin Bersih</span>
                <span className="font-bold text-emerald-700 font-mono">{formatRupiah(margin)}</span>
              </div>
            </div>
          </div>

          {/* Sticky Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#666666] hover:bg-[#f0f0f0] rounded-[8px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !jobName.trim() || !workerLeaderName.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#111111] hover:bg-black rounded-[8px] transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : editSubJob ? 'Simpan Perubahan' : 'Simpan Sub-Pekerjaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
