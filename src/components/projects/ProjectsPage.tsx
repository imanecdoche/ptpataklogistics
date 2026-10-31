import React, { useState, useEffect, useMemo } from 'react';
import { Project, Investor, Client } from '@/types/database';
import {
  subscribeProjects,
  saveProject,
  deleteProject
} from '@/lib/projectService';
import { subscribeInvestors } from '@/lib/investorService';
import { subscribeClients } from '@/lib/clientService';
const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { MetricCardCurrency } from '@/components/ui/MetricCardCurrency';
import { formatEntityNameLive } from '@/lib/nameUtils';
import { CustomSelectCombobox, SelectOption } from '@/components/ui/CustomSelectCombobox';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';
import { ProjectFinancialsModal } from './ProjectFinancialsModal';
import { X } from 'lucide-react';

const PROJECT_STATUS_OPTIONS: SelectOption[] = [
  { id: 'ACTIVE', label: 'AKTIF' },
  { id: 'ON_HOLD', label: 'HOLD' },
  { id: 'COMPLETED', label: 'SELESAI' }
];

interface ProjectsPageProps {
  userEmail: string;
}

export function ProjectsPage({ userEmail: _userEmail }: ProjectsPageProps): React.JSX.Element {
  const { isInvestorUser, isDispatcherUser, lockedInvestorId, selectedProjectId, isWatcherUser } = useProjectFilter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'>('ALL');

  // Modal State Tambah Proyek
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [clientId, setClientId] = useState('');
  const [initialDeposit, setInitialDeposit] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Modal State Edit Proyek
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [selectedFinanceProject, setSelectedFinanceProject] = useState<Project | null>(null);

  // Pin Auth Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [pinTargetLabel, setPinTargetLabel] = useState('');

  useEffect(() => {
    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
      setIsLoading(false);
    });
    const unsubInvestors = subscribeInvestors(list => {
      setInvestors(list);
    });
    const unsubClients = subscribeClients(list => {
      setClients(list);
    });

    return () => {
      unsubProjects();
      unsubInvestors();
      unsubClients();
    };
  }, []);

  const investorOptions: SelectOption[] = useMemo(() => {
    return investors.map(inv => ({ id: inv.id, label: inv.name }));
  }, [investors]);

  const clientOptions: SelectOption[] = useMemo(() => {
    return clients.map(cli => ({ id: cli.id, label: cli.name }));
  }, [clients]);

  useEffect(() => {
    if (!investorId && investors.length > 0 && investors[0]) {
      setInvestorId(investors[0].id);
    }
  }, [investors, investorId]);

  useEffect(() => {
    if (!clientId && clients.length > 0 && clients[0]) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId]);

  // Filter projects berdasarkan RBAC investor & search & status
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Jika role investor, batasi hanya pada proyek miliknya
    if (isInvestorUser && lockedInvestorId) {
      result = result.filter(p => p.investorId === lockedInvestorId);
    } else if (isInvestorUser && selectedProjectId && selectedProjectId !== 'ALL') {
      result = result.filter(p => p.id === selectedProjectId);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.investorName.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projects, isInvestorUser, lockedInvestorId, selectedProjectId, statusFilter, searchQuery]);

  // Statistik Ringkasan
  const totalDeposit = useMemo(() => {
    return filteredProjects.reduce((acc, p) => acc + (p.initialDeposit || 0), 0);
  }, [filteredProjects]);

  const totalCurrentBalance = useMemo(() => {
    return filteredProjects.reduce((acc, p) => acc + (p.currentBalance || 0), 0);
  }, [filteredProjects]);

  const activeProjectsCount = useMemo(() => {
    return filteredProjects.filter(p => p.status === 'ACTIVE').length;
  }, [filteredProjects]);

  // Otorisasi Aksi Simpan Proyek Baru
  const handleOpenAdd = () => {
    setName('');
    setLocation('');
    setInvestorId(investors[0]?.id || '');
    setClientId(clients[0]?.id || '');
    setInitialDeposit(0);
    setNotes('');
    setIsAddOpen(true);
  };

  const handleInitiateAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setPinTargetLabel(`Tambah Proyek: ${name}`);
    setPendingAction(() => async () => {
      const inv = investors.find(i => i.id === investorId);
      const cli = clients.find(c => c.id === clientId);
      await saveProject({
        name: name.trim(),
        location: location.trim(),
        investorId: investorId || 'INV-UMUM',
        investorName: inv?.name || 'Investor Umum',
        clientId: clientId || 'CLI-UMUM',
        clientName: cli?.name || 'Klien Umum',
        initialDeposit,
        currentBalance: initialDeposit,
        status: 'ACTIVE',
        notes: notes.trim()
      });

      setIsAddOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Edit Proyek
  const handleInitiateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setPinTargetLabel(`Ubah Proyek: ${editTarget.name}`);
    setPendingAction(() => async () => {
      const inv = investors.find(i => i.id === editTarget.investorId);
      const cli = clients.find(c => c.id === editTarget.clientId);

      await saveProject(
        {
          name: editTarget.name.trim(),
          location: editTarget.location.trim(),
          investorId: editTarget.investorId,
          investorName: inv?.name || editTarget.investorName,
          clientId: editTarget.clientId,
          clientName: cli?.name || editTarget.clientName,
          initialDeposit: editTarget.initialDeposit,
          currentBalance: editTarget.currentBalance,
          status: editTarget.status,
          notes: editTarget.notes?.trim()
        },
        editTarget.id
      );

      setEditTarget(null);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Hapus Proyek
  const handleDeleteProject = (proj: Project) => {
    setPinTargetLabel(`Hapus Proyek: ${proj.name}`);
    setPendingAction(() => async () => {
      await deleteProject(proj.id);
    });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;
    try {
      await pendingAction();
    } catch (err) {
      console.error('Gagal menjalankan aksi proyek:', err);
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
            + Tambah Proyek
          </button>
        </MobileTitlebarAction>
      )}

      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Proyek Terdaftar</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold tracking-tight text-[#111111]">{filteredProjects.length}</span>
            <span className="text-xs text-[#666666]">({activeProjectsCount} Aktif)</span>
          </div>
        </div>

        {isDispatcherUser ? (
          <>
            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">Proyek Aktif Berjalan</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold tracking-tight text-[#008060]">{activeProjectsCount}</span>
                <span className="text-xs text-[#666666]">proyek operasional</span>
              </div>
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">Proyek Selesai / Hold</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold tracking-tight text-[#666666]">
                  {filteredProjects.length - activeProjectsCount}
                </span>
                <span className="text-xs text-[#666666]">proyek</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">Total Modal Disetor</span>
              <div className="mt-1">
                <MetricCardCurrency amount={totalDeposit} size="lg" />
              </div>
            </div>

            <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
              <span className="text-[11px] text-[#888888] font-medium block">Total Saldo Kas Berjalan</span>
              <div className="mt-1">
                <MetricCardCurrency
                  amount={totalCurrentBalance}
                  size="lg"
                  colorClassName={totalCurrentBalance < 0 ? 'text-[#cf1124]' : 'text-[#008060]'}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Main Content Card */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Semua ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ON_HOLD')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'ON_HOLD'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Hold
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'COMPLETED'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Selesai
            </button>
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
                placeholder={isDispatcherUser ? "Cari proyek, lokasi, klien..." : "Cari proyek, lokasi, investor..."}
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isInvestorUser && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="hidden md:inline-flex px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
              >
                + Tambah Proyek
              </button>
            )}
          </div>
        </div>

        {/* Tabel Master Proyek (Rule 66: Table-fixed, zero-wrap, sticky header) */}
        <div className="overflow-x-auto select-text">
          <table className={`w-full ${isDispatcherUser ? 'min-w-[540px]' : 'min-w-[910px]'} table-fixed text-left text-xs border-collapse`}>
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[240px] min-w-[240px] whitespace-nowrap">Nama Proyek</th>
                {!isDispatcherUser && !isWatcherUser && (
                  <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Investor Pendana</th>
                )}
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Klien / Pemilik</th>
                {!isDispatcherUser && (
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Modal Awal Disetor</th>
                )}
                {!isDispatcherUser && (
                  <th className="py-2.5 px-3 w-[140px] min-w-[140px] text-right whitespace-nowrap">Saldo Kas Berjalan</th>
                )}
                <th className="py-2.5 px-3 w-[90px] min-w-[90px] text-center whitespace-nowrap">Status</th>
                {!isInvestorUser && (
                  <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {isLoading ? (
                <tr>
                  <td colSpan={isDispatcherUser ? 4 : isInvestorUser ? 6 : 7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Memuat data master proyek...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={isDispatcherUser ? 4 : isInvestorUser ? 6 : 7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Tidak ada data proyek yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap w-[240px] align-middle">
                      <button
                        type="button"
                        onClick={() => setSelectedFinanceProject(proj)}
                        className="font-bold text-[#111111] hover:text-[#008060] hover:underline text-left transition-colors cursor-pointer block truncate"
                        title="Klik untuk membuka rincian sub-pekerjaan fisik, ritase, kasbon & pembayaran proyek"
                      >
                        {proj.name}
                      </button>
                      {proj.location && (
                        <span className="text-[11px] text-[#666666] block truncate mt-0.5">
                          {proj.location}
                        </span>
                      )}
                    </td>
                    {!isDispatcherUser && (
                      <td className="py-2.5 px-3 text-[#111111] whitespace-nowrap w-[160px] align-middle font-medium">
                        <RunningText text={proj.investorName} placeholder="Umum" className="text-[#111111]" />
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[160px] align-middle">
                      <RunningText text={proj.clientName} placeholder="Umum" className="text-[#444444]" />
                    </td>
                    {!isDispatcherUser && (
                      <td className="py-2.5 px-3 font-bold tracking-tight text-[#111111] text-right whitespace-nowrap w-[140px] align-middle">
                        {formatRupiah(proj.initialDeposit || 0)}
                      </td>
                    )}
                    {!isDispatcherUser && (
                      <td
                        className={`py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap w-[140px] align-middle ${
                          (proj.currentBalance || 0) < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(proj.currentBalance || 0)}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap w-[90px] align-middle">
                      <span
                        className={`text-[11px] font-bold tracking-wide ${
                          proj.status === 'COMPLETED'
                            ? 'text-[#888888]'
                            : proj.status === 'ON_HOLD'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {proj.status === 'COMPLETED' ? 'SELESAI' : proj.status === 'ON_HOLD' ? 'HOLD' : 'AKTIF'}
                      </span>
                    </td>
                    {!isInvestorUser && (
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Rincian Finansial & Kasbon',
                                onClick: () => setSelectedFinanceProject(proj)
                              },
                              {
                                label: 'Edit Data Proyek',
                                onClick: () => setEditTarget(proj)
                              },
                              {
                                label: 'Salin ID Proyek',
                                onClick: () => navigator.clipboard.writeText(proj.id)
                              },
                              ...(!isDispatcherUser ? [{
                                label: 'Hapus Proyek',
                                variant: 'danger' as const,
                                onClick: () => handleDeleteProject(proj)
                              }] : [])
                            ]}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Proyek Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsAddOpen(false)} 
          />
          
          <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Tambah Proyek Baru</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Daftarkan lokasi proyek konstruksi dan tentukan alokasi modal awal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateAdd} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Nama Proyek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(formatEntityNameLive(e.target.value))}
                  placeholder="Contoh: Proyek Situ Cikedal"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Lokasi Proyek</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Cikedal, Pandeglang"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className={`grid grid-cols-1 ${isDispatcherUser ? '' : 'sm:grid-cols-2'} gap-3`}>
                {!isDispatcherUser && (
                  <div>
                    <label className="block text-[#666666] font-medium mb-1">Investor Pendana</label>
                    <CustomSelectCombobox
                      options={investorOptions}
                      value={investorId}
                      onChange={setInvestorId}
                      placeholder="Pilih Investor..."
                      variant="white"
                      searchable={false}
                      triggerClassName="py-2 rounded-[6px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[#666666] font-medium mb-1">Klien / Pemilik Proyek</label>
                  <CustomSelectCombobox
                    options={clientOptions}
                    value={clientId}
                    onChange={setClientId}
                    placeholder="Pilih Klien..."
                    variant="white"
                    searchable={false}
                    triggerClassName="py-2 rounded-[6px]"
                  />
                </div>
              </div>

              {!isDispatcherUser && (
                <div>
                  <label className="block text-[#666666] font-medium mb-1">Modal Awal Disetor (Rp)</label>
                  <CurrencyInput
                    value={initialDeposit}
                    onChange={setInitialDeposit}
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#666666] font-medium mb-1">Catatan Proyek</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Catatan penagihan atau termin..."
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#666666] bg-white border border-[#eaeaea] rounded-[8px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[8px] cursor-pointer border-none shadow-sm"
                >
                  Lanjut Otorisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Proyek */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setEditTarget(null)} 
          />
          
          <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Edit Proyek: {editTarget.name}</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Perbarui informasi lokasi, investor pendana, dan status operasional
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] p-1 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-[#666666] font-medium mb-1">Nama Proyek</label>
                <input
                  type="text"
                  required
                  value={editTarget.name}
                  onChange={e => setEditTarget({ ...editTarget, name: formatEntityNameLive(e.target.value) })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Lokasi Proyek</label>
                <input
                  type="text"
                  value={editTarget.location}
                  onChange={e => setEditTarget({ ...editTarget, location: e.target.value })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className={`grid grid-cols-1 ${isDispatcherUser ? '' : 'sm:grid-cols-2'} gap-3`}>
                {!isDispatcherUser && (
                  <div>
                    <label className="block text-[#666666] font-medium mb-1">Investor Pendana</label>
                    <CustomSelectCombobox
                      options={investorOptions}
                      value={editTarget.investorId}
                      onChange={val => setEditTarget({ ...editTarget, investorId: val })}
                      placeholder="Pilih Investor..."
                      variant="white"
                      searchable={false}
                      triggerClassName="py-2 rounded-[6px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[#666666] font-medium mb-1">Klien / Pemilik Proyek</label>
                  <CustomSelectCombobox
                    options={clientOptions}
                    value={editTarget.clientId}
                    onChange={val => setEditTarget({ ...editTarget, clientId: val })}
                    placeholder="Pilih Klien..."
                    variant="white"
                    searchable={false}
                    triggerClassName="py-2 rounded-[6px]"
                  />
                </div>
              </div>

              {!isDispatcherUser && (
                <div>
                  <label className="block text-[#666666] font-medium mb-1">Modal Awal Disetor (Rp)</label>
                  <CurrencyInput
                    value={editTarget.initialDeposit || 0}
                    onChange={val => setEditTarget({ ...editTarget, initialDeposit: val })}
                  />
                </div>
              )}

              <div>
                <label className="block text-[#666666] font-medium mb-1">Status Proyek</label>
                <CustomSelectCombobox
                  options={PROJECT_STATUS_OPTIONS}
                  value={editTarget.status}
                  onChange={val =>
                    setEditTarget({
                      ...editTarget,
                      status: val as 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
                    })
                  }
                  placeholder="Pilih Status..."
                  variant="white"
                  searchable={false}
                  triggerClassName="py-2 rounded-[6px]"
                />
              </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-xs font-semibold text-[#666666] bg-white border border-[#eaeaea] rounded-[8px] hover:bg-[#f5f5f5] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-5 py-2.5 md:py-2 text-xs font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[8px] cursor-pointer border-none shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Finansial & Sub-Pekerjaan Terpadu */}
      <ProjectFinancialsModal
        isOpen={Boolean(selectedFinanceProject)}
        onClose={() => setSelectedFinanceProject(null)}
        project={selectedFinanceProject}
        projects={projects}
        userEmail={_userEmail}
      />

      {/* Pin Authorization Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Manajemen Proyek"
        description="Masukkan PIN otorisasi default (2008005) untuk memverifikasi tindakan pada data proyek."
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
