import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { Project } from '@/types/database';
import { recordEmployeeKasbon } from '@/lib/projectFinanceService';
import { formatRupiah } from '@/lib/currencyUtils';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface RecordEmployeeKasbonModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  userEmail: string;
  onSuccess?: () => void;
}

export function RecordEmployeeKasbonModal({
  isOpen,
  onClose,
  project,
  userEmail,
  onSuccess
}: RecordEmployeeKasbonModalProps): React.JSX.Element | null {
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmployeeName('');
      setRole('');
      setDate(new Date().toISOString().slice(0, 10));
      setAmount(0);
      setNote('');
      setReceiptUrl('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler upload file bukti kasbon ke Base64 / Local Storage
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto bukti maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      setReceiptUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      alert('Nama karyawan wajib diisi.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Nominal kasbon harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordEmployeeKasbon({
        projectId: project.id,
        projectName: project.name,
        employeeName: employeeName.trim(),
        role: role.trim(),
        date,
        amount: Number(amount),
        note: note.trim(),
        receiptUrl: receiptUrl || undefined,
        userEmail
      });

      alert(`Kasbon karyawan ${employeeName.trim()} sebesar ${formatRupiah(amount)} berhasil dicatat ke Buku Kas & memotong laba kas riil proyek.`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Gagal mencatat kasbon karyawan:', err);
      alert('Terjadi kesalahan saat mencatat kasbon karyawan.');
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

      {/* Surface Dialog */}
      <div 
        className="relative w-full max-w-md bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#111111]">
              Catat Kasbon Karyawan / Tim
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Input kasbon tim proyek, otomatis memotong uang kas riil & sisa laba bersih.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors border-none cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-white text-xs overflow-y-auto max-h-[80vh]">
          {/* Badge Proyek */}
          <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb] flex items-center justify-between">
            <span className="text-[#666666] text-[11px]">Proyek Tujuan:</span>
            <span className="font-bold text-[#111111] text-xs">{project.name}</span>
          </div>

          {/* Nama Karyawan & Jabatan */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Nama Karyawan / Anggota Tim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              placeholder="Contoh: Budi (Admin Lapangan) / Agus"
              required
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Jabatan / Peran di Lapangan (Opsional)
            </label>
            <input
              type="text"
              list="roleSuggestions"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Pilih atau ketik jabatan (misal: Pengawas, Admin, Operator)"
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
            />
            <datalist id="roleSuggestions">
              <option value="Pengawas Proyek" />
              <option value="Admin Lapangan" />
              <option value="Logistik Proyek" />
              <option value="Operator Alat Berat" />
              <option value="Mekanik" />
              <option value="Supir Operasional" />
              <option value="Keamanan / Security" />
            </datalist>
          </div>

          {/* Tanggal & Nominal Kasbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Tanggal Penarikan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono font-semibold text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Nominal Kasbon (Rp) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Keterangan / Keperluan */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Catatan / Keperluan Kasbon (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Uang makan darurat / Kebutuhan keluarga"
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>

          {/* Bukti Transfer / Kwitansi Kasbon */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#111111] block">
              Bukti Kwitansi / Transfer (Opsional)
            </label>
            {receiptUrl ? (
              <div className="relative p-2 bg-[#fafafa] rounded-[8px] border border-[#e5e5e5] flex items-center justify-between">
                <img src={receiptUrl} alt="Bukti Kasbon" className="w-12 h-12 object-cover rounded-[6px]" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="px-2.5 py-1 text-[11px] bg-[#fee2e2] hover:bg-[#fecaca] text-[#cf1124] rounded-[6px] border-none font-semibold cursor-pointer"
                >
                  Hapus Foto
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-[#dcdcdc] rounded-[8px] bg-[#fafafa] hover:bg-[#f0f0f0] cursor-pointer transition-colors text-xs text-[#666666]">
                <Upload className="w-4 h-4 text-[#888888]" />
                <span>Unggah Foto Kwitansi / Bukti TF</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Ringkasan Potongan */}
          {amount > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-rose-800 block font-medium">Buku Kas & Saldo Proyek</span>
                <span className="font-bold text-rose-950 text-xs">
                  Otomatis terpotong kas keluar
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                - {formatRupiah(amount)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#555555] text-xs font-bold rounded-[8px] border-none cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !employeeName.trim() || amount <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[8px] border-none cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Kasbon Karyawan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
