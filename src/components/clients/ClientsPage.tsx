import React, { useState, useEffect, useMemo } from 'react';
import { Client, ClientType } from '@/types/database';
import { subscribeClients, deleteClient } from '@/lib/clientService';
import { isDeveloperEmail } from '@/lib/userManagementService';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { NewClientModal } from '@/components/ui/NewClientModal';
import { EditClientModal } from '@/components/clients/EditClientModal';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';

interface ClientsPageProps {
  userEmail: string;
}

export function ClientsPage({ userEmail }: ClientsPageProps): React.JSX.Element {
  const { isDispatcherUser } = useProjectFilter();
const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ClientType>('ALL');

  // Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editClientTarget, setEditClientTarget] = useState<Client | null>(null);

  // PIN Auth Modal State for Protected Deletions
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState<Client | null>(null);

  // Hak Akses Khusus: Opsi Hapus Klien HANYA untuk Founder & Developer (Rule 100)
  const canDeleteClient = isDeveloperEmail(userEmail);

  // Real-time Subscription Klien
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeClients(loadedClients => {
      setClients(loadedClients);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Data Klien
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filter Tipe Klien
    if (typeFilter !== 'ALL') {
      result = result.filter(c => (c.type || 'PERORANGAN') === typeFilter);
    }

    // Filter Pencarian Teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.picName && c.picName.toLowerCase().includes(q)) ||
          (c.phoneNumber && c.phoneNumber.includes(q))
      );
    }

    return result;
  }, [clients, typeFilter, searchQuery]);

  // Statistik Metrik Klien
  const metrics = useMemo(() => {
    const total = clients.length;
    const ptCount = clients.filter(c => c.type === 'PT').length;
    const cvCount = clients.filter(c => c.type === 'CV').length;
    const udCount = clients.filter(c => c.type === 'UD').length;
    const peroranganCount = clients.filter(c => !c.type || c.type === 'PERORANGAN').length;
    const corporateCount = ptCount + cvCount + udCount;
    return { total, corporateCount, peroranganCount };
  }, [clients]);

  // Eksekusi Hapus Klien setelah lolos PIN
  const handleConfirmDelete = async (): Promise<void> => {
    if (!pendingDeleteTarget) return;
    try {
      await deleteClient(pendingDeleteTarget.id);
    } catch (err) {
      console.error('Gagal menghapus klien:', err);
    } finally {
      setIsPinModalOpen(false);
      setPendingDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Titlebar Action Button (Rule 108) */}
      {!isDispatcherUser && (
        <MobileTitlebarAction>
          <button
            type="button"
            onClick={() => setIsNewClientModalOpen(true)}
          className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
        >
          + Tambah Klien
          </button>
        </MobileTitlebarAction>
      )}

      {/* 1. METRIC CARDS (Rule 99: Sans-serif tebal non-monospace) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Klien Terdaftar</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold tracking-tight text-[#111111]">{filteredClients.length}</span>
            <span className="text-xs text-[#666666]">Mitra Pelanggan</span>
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Perusahaan Kontraktor (PT/CV/UD)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold tracking-tight text-[#111111]">{metrics.corporateCount}</span>
            <span className="text-xs text-[#666666]">Entitas Badan Usaha</span>
          </div>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Mandor & Perorangan</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold tracking-tight text-[#008060]">{metrics.peroranganCount}</span>
            <span className="text-xs text-[#666666]">Proyek Mandiri</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT CARD */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          {/* Tipe Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Semua ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PT')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'PT'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('CV')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'CV'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              CV
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('UD')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'UD'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              UD
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PERORANGAN')}
              className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-colors cursor-pointer ${
                typeFilter === 'PERORANGAN'
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-[#eaeaea] text-[#666666] hover:bg-[#f0f0f0]'
              }`}
            >
              Perorangan
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input dengan Ikon Kaca Pembesar (Rule 98) */}
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
                placeholder="Cari klien, PIC, nomor WA..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isDispatcherUser && (
            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              className="hidden md:inline-flex px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
            >
              + Tambah Klien
            </button>
            )}
          </div>
        </div>

        {/* 3. TABEL DATA KLIEN (Rule 66: Table-fixed, nowrap, sticky) */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[780px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[240px] min-w-[240px] whitespace-nowrap">Nama Klien / Perusahaan</th>
                <th className="py-2.5 px-3 w-[120px] min-w-[120px] whitespace-nowrap">Klasifikasi</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">PIC Lapangan</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Nomor HP / WhatsApp</th>
                <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    {isLoading ? 'Memuat data klien...' : 'Belum ada data klien terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#111111] whitespace-nowrap w-[240px] align-middle">
                      <RunningText text={c.name} className="font-semibold text-[#111111]" />
                    </td>
                    <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap w-[120px] align-middle">
                      {c.type || 'PERORANGAN'}
                    </td>
                    <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[160px] align-middle">
                      <RunningText text={c.picName} placeholder="-" className="text-[#444444]" />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#444444] whitespace-nowrap w-[160px] align-middle">
                      {c.phoneNumber ? formatPhoneNumber(c.phoneNumber) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                      <div className="flex items-center justify-end">
                        <TableActionMenu
                          items={[
                            {
                              label: 'Ubah Data',
                              hidden: isDispatcherUser,
                              onClick: () => setEditClientTarget(c)
                            },
                            {
                              label: 'Hubungi via WhatsApp',
                              hidden: !c.phoneNumber,
                              onClick: () => {
                                if (c.phoneNumber) {
                                  const cleanNum = c.phoneNumber.replace(/[^0-9]/g, '');
                                  window.open(
                                    `https://wa.me/${cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum}`,
                                    '_blank'
                                  );
                                }
                              }
                            },
                            {
                              label: 'Salin Kontak',
                              hidden: !c.phoneNumber,
                              onClick: () => {
                                if (c.phoneNumber) navigator.clipboard.writeText(c.phoneNumber);
                              }
                            },
                            {
                              label: 'Hapus Klien',
                              // Restriksi Keamanan (Rule 100): HANYA untuk Founder & Developer
                              hidden: isDispatcherUser || !canDeleteClient,
                              variant: 'danger',
                              onClick: () => {
                                setPendingDeleteTarget(c);
                                setIsPinModalOpen(true);
                              }
                            }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Klien Baru */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onCreated={() => {
          setIsNewClientModalOpen(false);
        }}
      />

      {/* Modal Edit Klien */}
      {editClientTarget && (
        <EditClientModal
          client={editClientTarget}
          isOpen={true}
          onClose={() => setEditClientTarget(null)}
          onSuccess={() => setEditClientTarget(null)}
        />
      )}

      {/* Modal Autentikasi PIN untuk Hapus Klien (Hanya Founder & Developer) */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingDeleteTarget(null);
        }}
        onSuccess={handleConfirmDelete}
        title="Otorisasi Hapus Klien"
        description={`Masukkan PIN otorisasi untuk menghapus data mitra klien "${pendingDeleteTarget?.name}".`}
      />
    </div>
  );
}
