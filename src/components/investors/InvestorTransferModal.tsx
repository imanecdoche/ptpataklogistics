import React, { useState, useMemo } from 'react';
import { Investor, Project, InvestorTransferCategory } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ReceiptUpload } from '@/components/ui/ReceiptUpload';
import { X } from 'lucide-react';

interface InvestorTransferModalProps {
  investors: Investor[];
  projects: Project[];
  onClose: () => void;
  onSubmitTransfer: (payload: {
    date: string;
    fromInvestorId: string;
    fromInvestorName: string;
    fromProjectId?: string;
    fromProjectName?: string;
    toInvestorId: string;
    toInvestorName: string;
    toProjectId?: string;
    toProjectName?: string;
    amount: number;
    category: InvestorTransferCategory;
    note: string;
    receiptUrl?: string;
  }) => void;
}

export function InvestorTransferModal({
  investors,
  projects,
  onClose,
  onSubmitTransfer
}: InvestorTransferModalProps): React.JSX.Element {
  const getTodayString = () => new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(getTodayString());
  const [fromInvestorId, setFromInvestorId] = useState(investors[0]?.id || '');
  const [fromProjectId, setFromProjectId] = useState('');
  const [toInvestorId, setToInvestorId] = useState(investors[1]?.id || investors[0]?.id || '');
  const [toProjectId, setToProjectId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<InvestorTransferCategory>('TALANGAN_OPERASIONAL');
  const [note, setNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  // Proyek yang didanai oleh investor pengirim
  const fromProjects = useMemo(() => {
    return projects.filter(p => p.investorId === fromInvestorId);
  }, [projects, fromInvestorId]);

  // Proyek yang didanai oleh investor penerima
  const toProjects = useMemo(() => {
    return projects.filter(p => p.investorId === toInvestorId);
  }, [projects, toInvestorId]);

  // Set default proyek saat investor pengirim berubah
  const handleFromInvestorChange = (invId: string) => {
    setFromInvestorId(invId);
    const related = projects.filter(p => p.investorId === invId);
    setFromProjectId(related[0]?.id || '');
  };

  // Set default proyek saat investor penerima berubah
  const handleToInvestorChange = (invId: string) => {
    setToInvestorId(invId);
    const related = projects.filter(p => p.investorId === invId);
    setToProjectId(related[0]?.id || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const fromInv = investors.find(i => i.id === fromInvestorId);
    const toInv = investors.find(i => i.id === toInvestorId);
    const fromProj = projects.find(p => p.id === fromProjectId);
    const toProj = projects.find(p => p.id === toProjectId);

    if (!fromInv || !toInv) return;

    if (fromInvestorId === toInvestorId && fromProjectId === toProjectId) {
      alert('Sumber dan tujuan transfer tidak boleh sama persis.');
      return;
    }

    onSubmitTransfer({
      date,
      fromInvestorId,
      fromInvestorName: fromInv.name,
      fromProjectId: fromProj?.id || '',
      fromProjectName: fromProj?.name || '',
      toInvestorId,
      toInvestorName: toInv.name,
      toProjectId: toProj?.id || '',
      toProjectName: toProj?.name || '',
      amount,
      category,
      note: note.trim(),
      receiptUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full md:max-w-xl bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
          <div className="w-full text-center md:text-left">
            <h3 className="text-sm font-bold text-[#111111]">
              Transfer & Realokasi Dana Antar-Investor
            </h3>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Pencatatan subsidi silang, talangan operasional, atau realokasi modal antar mitra
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#333333] font-semibold mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[#333333] font-semibold mb-1">Jenis / Kategori Transfer</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as InvestorTransferCategory)}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
              >
                <option value="TALANGAN_OPERASIONAL">Talangan Operasional (Belum Lunas)</option>
                <option value="PENGEMBALIAN_TALANGAN">Pengembalian Talangan / Bayar Hutang</option>
                <option value="MIGRASI_MODAL">Migrasi Modal / Realokasi Dana Bersama</option>
                <option value="BAGI_HASIL_PROYEK">Bagi Hasil / Dividen Profit Share</option>
                <option value="LAINNYA">Lainnya (Mutasi Khusus)</option>
              </select>
            </div>
          </div>

          {/* Section Pengirim (Sumber Dana) */}
          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-2">
            <span className="font-semibold text-xs text-[#111111] block">
              1. Sumber Dana (Pihak Pengirim)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Investor Pengirim</label>
                <select
                  value={fromInvestorId}
                  onChange={e => handleFromInvestorChange(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                >
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Proyek Asal (Opsional)</label>
                <select
                  value={fromProjectId}
                  onChange={e => setFromProjectId(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                >
                  <option value="">-- Murni Akun Investor (Tanpa Proyek) --</option>
                  {fromProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section Penerima (Tujuan Dana) */}
          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-2">
            <span className="font-semibold text-xs text-[#111111] block">
              2. Tujuan Dana (Pihak Penerima)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Investor Penerima</label>
                <select
                  value={toInvestorId}
                  onChange={e => handleToInvestorChange(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                >
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#666666] mb-1">Proyek Tujuan (Opsional)</label>
                <select
                  value={toProjectId}
                  onChange={e => setToProjectId(e.target.value)}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111111] outline-none focus:border-[#111111]"
                >
                  <option value="">-- Murni Akun Investor (Tanpa Proyek) --</option>
                  {toProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nominal Transfer */}
          <div>
            <label className="block text-[#333333] font-semibold mb-1">
              Nominal Transfer / Talangan (Rp) <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              variant="solid-white"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[#333333] font-semibold mb-1">Catatan Transaksi</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Talangan solar kuari rute proyek..."
              className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
            />
          </div>

          {/* Upload Bukti Kwitansi / Transfer */}
          <ReceiptUpload
            value={receiptUrl}
            onChange={setReceiptUrl}
            label="Unggah Bukti Transfer / Kwitansi"
            folder="receipts/talangan"
          />

          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none px-4 py-2.5 md:py-2 rounded-[8px] text-xs font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] border-none cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!amount || amount <= 0}
              className="flex-1 md:flex-none px-5 py-2.5 md:py-2 bg-[#111111] hover:bg-[#2b2b2b] text-white rounded-[8px] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border-none shadow-sm"
            >
              Lanjut Verifikasi PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
