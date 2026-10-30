import React, { useState, useEffect, useMemo } from 'react';
import { Investor, Project } from '@/types/database';
import {
  subscribeInvestors,
  saveInvestor,
  deleteInvestor
} from '@/lib/investorService';
import { subscribeProjects } from '@/lib/projectService';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityNameLive } from '@/lib/nameUtils';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

interface InvestorsPageProps {
  userEmail: string;
}

export function InvestorsPage({ userEmail: _userEmail }: InvestorsPageProps): React.JSX.Element {
  const { isInvestorUser, selectedProjectId, projects: allProjects } = useProjectFilter();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State Tambah Investor
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Modal State Edit Investor
  const [editTarget, setEditTarget] = useState<Investor | null>(null);

  // Pin Auth Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [pinTargetLabel, setPinTargetLabel] = useState('');

  useEffect(() => {
    const unsubInvestors = subscribeInvestors(list => {
      setInvestors(list);
      setIsLoading(false);
    });
    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });

    return () => {
      unsubInvestors();
      unsubProjects();
    };
  }, []);

  // Filter investor berdasarkan RBAC & search
  const filteredInvestors = useMemo(() => {
    let result = [...investors];

    // Jika role investor, cari investor terkait dari selectedProject
    if (isInvestorUser && selectedProjectId && selectedProjectId !== 'ALL') {
      const currentProj = allProjects.find(p => p.id === selectedProjectId);
      if (currentProj && currentProj.investorId) {
        result = result.filter(i => i.id === currentProj.investorId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.phoneNumber && i.phoneNumber.includes(q)) ||
          (i.bankAccount && i.bankAccount.toLowerCase().includes(q)) ||
          i.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [investors, isInvestorUser, selectedProjectId, allProjects, searchQuery]);

  // Statistik Ringkasan
  const totalCapital = useMemo(() => {
    return filteredInvestors.reduce((acc, i) => acc + (i.initialCapital || 0), 0);
  }, [filteredInvestors]);

  // Hitung proyek dan saldo kas berjalan per investor
  const investorProjectsMap = useMemo(() => {
    const map = new Map<string, { projects: Project[]; balance: number }>();
    projects.forEach(p => {
      const invId = p.investorId;
      if (!invId) return;
      const current = map.get(invId) || { projects: [], balance: 0 };
      current.projects.push(p);
      current.balance += p.currentBalance || 0;
      map.set(invId, current);
    });
    return map;
  }, [projects]);

  const totalProjectsBalance = useMemo(() => {
    return filteredInvestors.reduce((acc, inv) => {
      const stats = investorProjectsMap.get(inv.id);
      return acc + (stats?.balance || 0);
    }, 0);
  }, [filteredInvestors, investorProjectsMap]);

  // Otorisasi Aksi Tambah Investor
  const handleOpenAdd = () => {
    setName('');
    setPhoneNumber('');
    setBankAccount('');
    setInitialCapital(0);
    setNotes('');
    setIsAddOpen(true);
  };

  const handleInitiateAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setPinTargetLabel(`Tambah Investor: ${name}`);
    setPendingAction(() => async () => {
      await saveInvestor({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        bankAccount: bankAccount.trim(),
        initialCapital,
        notes: notes.trim()
      });

      setIsAddOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Edit Investor
  const handleInitiateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setPinTargetLabel(`Ubah Investor: ${editTarget.name}`);
    setPendingAction(() => async () => {
      await saveInvestor(
        {
          name: editTarget.name.trim(),
          phoneNumber: editTarget.phoneNumber?.trim(),
          bankAccount: editTarget.bankAccount?.trim(),
          initialCapital: editTarget.initialCapital || 0,
          notes: editTarget.notes?.trim()
        },
        editTarget.id
      );

      setEditTarget(null);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Hapus Investor
  const handleDeleteInvestor = (inv: Investor) => {
    setPinTargetLabel(`Hapus Investor: ${inv.name}`);
    setPendingAction(() => async () => {
      await deleteInvestor(inv.id);
    });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;
    try {
      await pendingAction();
    } catch (err) {
      console.error('Gagal menjalankan aksi investor:', err);
    } finally {
      setIsPinModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Titlebar Action Button (Rule 108) */}
      {!isInvestorUser && (
        <MobileTitlebarAction>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Tambah Investor
          </button>
        </MobileTitlebarAction>
      )}

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Investor Terdaftar</span>
          <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
            {filteredInvestors.length} Mitra Pendana
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Modal Disetor</span>
          <div className="mt-1">
            <MetricCardCurrency amount={totalCapital} size="lg" />
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Saldo Kas Berjalan Proyek</span>
          <div className="mt-1">
            <MetricCardCurrency
              amount={totalProjectsBalance}
              size="lg"
              colorClassName={totalProjectsBalance < 0 ? 'text-[#cf1124]' : 'text-[#008060]'}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          <div className="text-xs text-[#666666]">
            Daftar profil pemodal dan ringkasan perputaran dana per proyek operasional.
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <img
                src="/icons/search.png"
                alt="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari investor, kontak, bank..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isInvestorUser && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="hidden md:inline-flex px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
              >
                + Tambah Investor
              </button>
            )}
          </div>
        </div>

        {/* Tabel Master Investor (Rule 66) */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[1050px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[200px] min-w-[200px] whitespace-nowrap">Nama Investor</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">No. WhatsApp / HP</th>
                <th className="py-2.5 px-3 w-[180px] min-w-[180px] whitespace-nowrap">Rekening Bank</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Proyek Terkait</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Modal Disetor</th>
                <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Kas Berjalan</th>
                {!isInvestorUser && (
                  <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {isLoading ? (
                <tr>
                  <td colSpan={isInvestorUser ? 6 : 7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Memuat data master investor...
                  </td>
                </tr>
              ) : filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={isInvestorUser ? 6 : 7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Tidak ada data investor yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(inv => {
                  const invStats = investorProjectsMap.get(inv.id);
                  const linkedProjects = invStats?.projects || [];
                  const currentBalance = invStats?.balance || 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap w-[200px] align-middle">
                        <span className="font-bold text-[#111111] block truncate">{inv.name}</span>
                        <span className="text-[10px] font-mono text-[#888888] block">{inv.id}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#444444] whitespace-nowrap w-[160px] align-middle">
                        {inv.phoneNumber ? formatPhoneNumber(inv.phoneNumber) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={inv.bankAccount} placeholder="-" className="text-[#444444]" />
                      </td>
                      <td className="py-2.5 px-3 text-[#111111] whitespace-nowrap w-[160px] align-middle">
                        {linkedProjects.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {linkedProjects.map(p => (
                              <span key={p.id} className="text-xs font-medium truncate block">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#888888]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold tracking-tight text-[#111111] text-right whitespace-nowrap w-[140px] align-middle">
                        {formatRupiah(inv.initialCapital || 0)}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap w-[140px] align-middle ${
                          currentBalance < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(currentBalance)}
                      </td>
                      {!isInvestorUser && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                          <div className="flex items-center justify-end">
                            <TableActionMenu
                              items={[
                                {
                                  label: 'Edit Data Investor',
                                  onClick: () => setEditTarget(inv)
                                },
                                {
                                  label: 'Salin ID Investor',
                                  onClick: () => navigator.clipboard.writeText(inv.id)
                                },
                                {
                                  label: 'Hapus Investor',
                                  variant: 'danger',
                                  onClick: () => handleDeleteInvestor(inv)
                                }
                              ]}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Investor Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <h3 className="text-sm font-bold text-[#111111]">Tambah Investor Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#888888] hover:text-[#111111] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Nama Investor / Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(formatEntityNameLive(e.target.value))}
                  placeholder="Contoh: Investor A / PT Investama Mandiri"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Nomor Telepon / WhatsApp</label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Informasi Rekening Bank</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  placeholder="Contoh: BCA 1234567890 a.n PT Investama"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Modal / Investasi Awal (Rp)</label>
                <CurrencyInput
                  value={initialCapital}
                  onChange={setInitialCapital}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Pemodal pengadaan unit armada atau proyek tertentu"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#666666] bg-white border border-[#eaeaea] rounded-[6px] hover:bg-[#f5f5f5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px]"
                >
                  Lanjut Otorisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Investor */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea]">
              <h3 className="text-sm font-bold text-[#111111]">Edit Investor ({editTarget.id})</h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-[#888888] hover:text-[#111111] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#666666] font-medium mb-1">Nama Investor / Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editTarget.name}
                  onChange={e => setEditTarget({ ...editTarget, name: formatEntityNameLive(e.target.value) })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Nomor Telepon / WhatsApp</label>
                <PhoneInput
                  value={editTarget.phoneNumber || ''}
                  onChange={val => setEditTarget({ ...editTarget, phoneNumber: val })}
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Informasi Rekening Bank</label>
                <input
                  type="text"
                  value={editTarget.bankAccount || ''}
                  onChange={e => setEditTarget({ ...editTarget, bankAccount: e.target.value })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Modal / Investasi Awal (Rp)</label>
                <CurrencyInput
                  value={editTarget.initialCapital || 0}
                  onChange={val => setEditTarget({ ...editTarget, initialCapital: val })}
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editTarget.notes || ''}
                  onChange={e => setEditTarget({ ...editTarget, notes: e.target.value })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3 py-1.5 text-xs text-[#666666] bg-white border border-[#eaeaea] rounded-[6px] hover:bg-[#f5f5f5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[6px]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pin Authorization Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Data Investor"
        description="Masukkan PIN otorisasi default (2008005) untuk memverifikasi tindakan pada data investor."
        targetLabel={pinTargetLabel}
        confirmText="Otorisasi Tindakan"
        onSuccess={handlePinSuccess}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
