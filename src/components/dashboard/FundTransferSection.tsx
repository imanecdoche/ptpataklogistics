import React, { useState, useEffect } from 'react';
import { Project, FundTransferLog } from '@/types/database';
import {
  subscribeFundTransfers,
  createFundTransfer,
  settleFundTransfer
} from '@/lib/fundTransferService';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { FlexibleTextarea } from '@/components/ui/FlexibleTextarea';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';

interface FundTransferSectionProps {
  projects: Project[];
  userEmail: string;
}

export function FundTransferSection({ projects, userEmail }: FundTransferSectionProps): React.JSX.Element {
  const [transfers, setTransfers] = useState<FundTransferLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State Tambah Talangan
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fromProjectId, setFromProjectId] = useState('');
  const [toProjectId, setToProjectId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('Internal subsidi silang talangan solar/kuari');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Pelunasan Talangan
  const [settleTarget, setSettleTarget] = useState<FundTransferLog | null>(null);
  const [isSettlePinOpen, setIsSettlePinOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeFundTransfers(list => {
      setTransfers(list);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const activeTransfers = transfers.filter(t => t.status === 'PINJAM');
  const totalActiveLoan = activeTransfers.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const handleOpenCreate = () => {
    if (projects.length >= 2 && projects[0] && projects[1]) {
      setFromProjectId(projects[0].id);
      setToProjectId(projects[1].id);
    }
    setAmount(0);
    setNote('Internal subsidi silang talangan solar/kuari');
    setIsCreateOpen(true);
  };

  const handleInitiateCreate = () => {
    if (!amount || amount <= 0) {
      alert('Masukkan nominal kas talangan yang valid.');
      return;
    }
    if (fromProjectId === toProjectId) {
      alert('Proyek sumber talangan tidak boleh sama dengan proyek peminjam.');
      return;
    }
    setIsPinModalOpen(true);
  };

  const handleCreateSuccess = async () => {
    setIsSubmitting(true);
    try {
      const fromProj = projects.find(p => p.id === fromProjectId);
      const toProj = projects.find(p => p.id === toProjectId);

      await createFundTransfer({
        date,
        fromProjectId,
        fromProjectName: fromProj?.name || 'Proyek Sumber',
        toProjectId,
        toProjectName: toProj?.name || 'Proyek Penerima',
        amount,
        note,
        recordedBy: userEmail
      });

      setIsCreateOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      alert('Gagal mencatat talangan: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateSettle = (transfer: FundTransferLog) => {
    setSettleTarget(transfer);
    setIsSettlePinOpen(true);
  };

  const handleSettleSuccess = async () => {
    if (!settleTarget) return;
    setIsSubmitting(true);
    try {
      await settleFundTransfer(
        settleTarget.id,
        settleTarget.fromProjectId,
        settleTarget.toProjectId,
        settleTarget.amount
      );
      setSettleTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melunasi talangan.';
      alert('Gagal: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#eaeaea] overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs md:text-sm font-bold text-[#111111]">
              Subsidi Silang & Kas Talangan Antar-Proyek
            </h2>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#111111] text-white">
              Internal Manajemen
            </span>
          </div>
          <p className="text-[11px] text-[#666666] mt-0.5">
            Talangan darurat saat tagihan proyek macet. Data ini terisolasi dan tidak muncul di laporan investor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#888888] block">Talangan Aktif:</span>
            <span className="font-mono font-bold text-xs text-[#cf1124]">
              {formatRupiah(totalActiveLoan)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Catat Kas Talangan
          </button>
        </div>
      </div>

      {/* Table Log Talangan */}
      <div className="overflow-x-auto select-text">
        <table className="w-full min-w-[900px] table-fixed text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-medium text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-[110px] min-w-[110px] whitespace-nowrap">Tanggal</th>
              <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Dari Proyek (Sumber)</th>
              <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Ke Proyek (Peminjam)</th>
              <th className="py-2.5 px-3 w-[130px] min-w-[130px] text-right whitespace-nowrap">Nominal Talangan</th>
              <th className="py-2.5 px-3 w-[200px] min-w-[200px] whitespace-nowrap">Keperluan / Catatan</th>
              <th className="py-2.5 px-3 w-[100px] min-w-[100px] text-center whitespace-nowrap">Status</th>
              <th className="py-2.5 px-3 w-[120px] min-w-[120px] text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#888888] whitespace-nowrap">
                  {isLoading ? 'Memuat log talangan...' : 'Belum ada catatan subsidi silang / kas talangan.'}
                </td>
              </tr>
            ) : (
              transfers.map(t => {
                const isPinjam = t.status === 'PINJAM';
                return (
                  <tr key={t.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3 font-mono text-[#666666] whitespace-nowrap w-[110px] align-middle">
                      {t.date}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap w-[160px] align-middle">
                      <span className="font-semibold text-[#111111] block truncate">
                        {t.fromProjectName}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap w-[160px] align-middle">
                      <span className="font-semibold text-[#111111] block truncate">
                        {t.toProjectName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#111111] whitespace-nowrap w-[130px] align-middle">
                      {formatRupiah(t.amount)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap w-[200px] align-middle text-[#666666] text-[11px] truncate">
                      {t.note || '-'}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap w-[100px] align-middle">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          isPinjam
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : 'bg-[#dcfce7] text-[#166534]'
                        }`}
                      >
                        {isPinjam ? 'PINJAM' : 'LUNAS'}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-middle text-right whitespace-nowrap w-[120px]">
                      {isPinjam ? (
                        <button
                          type="button"
                          onClick={() => handleInitiateSettle(t)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#111111] bg-white border border-[#dddddd] hover:bg-[#f5f5f5] rounded-[4px] transition-colors cursor-pointer"
                        >
                          Kembalikan Dana
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-[#888888]">
                          {t.settledAt ? t.settledAt.slice(0, 10) : 'Selesai'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Input Talangan Baru */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 select-none overflow-y-auto">
          <div
            className="w-full max-w-md bg-white rounded-[12px] border border-[#eaeaea] shadow-2xl p-5 my-6 flex flex-col space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  Catat Kas Talangan Antar-Proyek
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  Pinjam sementara dana dari saldo proyek lain secara internal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[#888888] hover:text-[#111111] p-1 rounded transition-colors"
              >
                <img src="/icons/close.png" alt="Tutup" className="w-4 h-4 object-contain" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Tanggal Pencatatan:
                </label>
                <CustomDatePicker value={date} onChange={setDate} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Proyek Sumber (Pemberi Pinjaman):
                </label>
                <ProjectCombobox
                  projects={projects}
                  selectedProjectId={fromProjectId}
                  selectedProjectName={projects.find(p => p.id === fromProjectId)?.name || ''}
                  onSelect={p => setFromProjectId(p?.id || '')}
                  placeholder="Pilih proyek sumber..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Proyek Peminjam (Ditalangi):
                </label>
                <ProjectCombobox
                  projects={projects.filter(p => p.id !== fromProjectId)}
                  selectedProjectId={toProjectId}
                  selectedProjectName={projects.find(p => p.id === toProjectId)?.name || ''}
                  onSelect={p => setToProjectId(p?.id || '')}
                  placeholder="Pilih proyek peminjam..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Nominal Talangan (Rp):
                </label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1">
                  Keperluan / Catatan Internal:
                </label>
                <FlexibleTextarea
                  value={note}
                  onChange={setNote}
                  placeholder="Catatan alasan peminjaman modal proyek..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-[#666666] bg-white border border-[#dddddd] rounded-[6px] hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInitiateCreate}
                disabled={!amount || amount <= 0 || fromProjectId === toProjectId}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px] disabled:opacity-40"
              >
                Lanjutkan Otorisasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Authorization untuk Tambah Talangan */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Kas Talangan Internal"
        description="Pencatatan ini akan langsung memotong saldo kas proyek sumber dan menambahkan saldo ke kas proyek peminjam."
        targetLabel={`Talangan ${formatRupiah(amount)}`}
        confirmText="Otorisasi & Mutasikan"
        onSuccess={handleCreateSuccess}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Pin Authorization untuk Pelunasan Talangan */}
      {settleTarget && (
        <PinAuthModal
          isOpen={isSettlePinOpen}
          title="Otorisasi Pengembalian Kas Talangan"
          description={`Kembalikan dana sebesar ${formatRupiah(settleTarget.amount)} dari ${settleTarget.toProjectName} ke ${settleTarget.fromProjectName}?`}
          targetLabel={`Pelunasan ${settleTarget.id}`}
          confirmText="Otorisasi & Kembalikan"
          onSuccess={handleSettleSuccess}
          onClose={() => {
            setIsSettlePinOpen(false);
            setSettleTarget(null);
          }}
        />
      )}
    </div>
  );
}
