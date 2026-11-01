import React, { useState, useEffect } from 'react';
import { Project, Client } from '@/types/database';
import { recordClientPayment } from '@/lib/projectFinanceService';
import { formatRupiah } from '@/lib/currencyUtils';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { X, Info } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import { useDrawerTransition } from '@/hooks/useDrawerTransition';

interface RecordClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  clients: Client[];
  defaultProjectId?: string;
  defaultClientId?: string;
  userEmail: string;
  currentReceivableBalance?: number;
  onSuccess?: () => void;
}

export function RecordClientPaymentModal({
  isOpen,
  onClose,
  projects,
  clients,
  defaultProjectId,
  defaultClientId,
  userEmail,
  currentReceivableBalance = 0,
  onSuccess
}: RecordClientPaymentModalProps): React.JSX.Element | null {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useDialog();
  const { isRendered, isVisible, handleClose } = useDrawerTransition(isOpen, onClose, { durationMs: 200 });

  useEffect(() => {
    if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
      const p = projects.find(item => item.id === defaultProjectId);
      if (p) setClientName(p.clientName || '');
    } else if (defaultClientId) {
      const c = clients.find(item => item.id === defaultClientId);
      if (c) setClientName(c.name);
    } else if (projects.length > 0 && projects[0]) {
      setSelectedProjectId(projects[0].id);
      setClientName(projects[0].clientName || '');
    }
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setReferenceNumber('');
    setNote('');
  }, [defaultProjectId, defaultClientId, projects, clients, isOpen]);

  if (!isRendered) return null;

  const targetProj = projects.find(p => p.id === selectedProjectId);

  const handleProjectChange = (pId: string) => {
    setSelectedProjectId(pId);
    const p = projects.find(item => item.id === pId);
    if (p && p.clientName) {
      setClientName(p.clientName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showAlert({
        title: 'Validasi Input',
        message: 'Nama klien / pembayar wajib diisi.'
      });
      return;
    }
    if (!amount || amount <= 0) {
      showAlert({
        title: 'Validasi Input',
        message: 'Nominal pembayaran masuk harus lebih besar dari 0.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await recordClientPayment({
        paymentDate,
        clientId: targetProj?.clientId || undefined,
        clientName: clientName.trim(),
        projectId: targetProj?.id || undefined,
        projectName: targetProj?.name || undefined,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        note: note.trim(),
        userEmail
      });

      showAlert({
        title: 'Pembayaran Tercatat',
        message: `Pembayaran masuk dari ${clientName} sebesar ${formatRupiah(amount)} berhasil dibukukan ke Kas Utama & memotong saldo tagihan.`
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Gagal mencatat pembayaran klien:', err);
      showAlert({
        title: 'Kesalahan',
        message: 'Terjadi kesalahan saat mencatat pembayaran masuk.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Surface Dialog */}
      <div 
        className={`relative w-full max-w-md bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col overflow-hidden shadow-2xl z-10 border-none transition-transform duration-200 ease-out transform ${
          isVisible ? 'translate-y-0' : 'translate-y-full md:translate-y-4'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#fafafa] flex items-center justify-between flex-shrink-0 border-none">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#111111]">
              Catat Pembayaran Masuk (Klien)
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Pelunasan lump-sum material & sub-proyek langsung memotong total piutang berjalan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-[6px] text-[#555555] hover:text-[#111111] bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center transition-colors border-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-white text-xs">
          {/* Pilihan Proyek Terkait */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Proyek Tujuan Pembayaran (Opsional / Global)
            </label>
            <select
              value={selectedProjectId}
              onChange={e => handleProjectChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
            >
              <option value="">Semua Proyek (Pembayaran Global Klien)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.clientName ? `(Klien: ${p.clientName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nama Klien / Pembayar */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Nama Klien / Pihak Pembayar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Contoh: Kak Angga / PT Citra Mandiri"
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
              required
            />
          </div>

          {/* Status Piutang Saat Ini */}
          {currentReceivableBalance > 0 && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-[8px] flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">Sisa Piutang Berjalan:</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                {formatRupiah(currentReceivableBalance)}
              </span>
            </div>
          )}

          {/* Tanggal & Nominal Pembayaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Tanggal Uang Masuk
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono font-semibold text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Nominal Bayar (Rp) <span className="text-red-500">*</span>
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

          {/* Metode & Bukti Transfer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-semibold text-[#111111] outline-none focus:border-[#111111]"
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                <option value="Transfer Bank Lain">Transfer Bank Lain</option>
                <option value="Setor Tunai / Cash">Setor Tunai / Cash</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#111111] block">
                No. Referensi / Bukti Transfer
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Contoh: TRF-BCA-98762"
                className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs font-mono text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111] block">
              Catatan / Peruntukan Pembayaran
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Pelunasan termin 1 (Material & MCK)"
              className="w-full p-2.5 bg-white border border-[#dcdcdc] rounded-[8px] text-xs text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-[#f0f4f8] rounded-[8px] flex items-start gap-2.5 border-none">
            <Info className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#1a73e8] leading-relaxed">
              Dana akan langsung menambah saldo di <span className="font-bold">Buku Kas Utama</span> dan memotong total saldo piutang berjalan secara otomatis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[8px] border-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || amount <= 0 || !clientName.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-[8px] transition-colors disabled:opacity-40 cursor-pointer shadow-xs border-none"
            >
              {isSubmitting ? 'Membukukan...' : 'Simpan Pembayaran Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
