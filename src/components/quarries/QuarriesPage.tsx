import { X } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { MasterQuarry } from '@/types/database';
import {
  subscribeMasterQuarries,
  saveMasterQuarry,
  deleteMasterQuarry
} from '@/lib/databaseMasterService';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityNameLive, formatPersonNameLive } from '@/lib/nameUtils';
import { MobileTitlebarAction } from '@/components/ui/MobileTitlebarAction';

interface QuarriesPageProps {
  userEmail: string;
}

export function QuarriesPage({ userEmail: _userEmail }: QuarriesPageProps): React.JSX.Element {
  const { isInvestorUser, isDispatcherUser } = useProjectFilter();
  const [quarries, setQuarries] = useState<MasterQuarry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State Tambah Kuari
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Modal State Edit Kuari
  const [editTarget, setEditTarget] = useState<MasterQuarry | null>(null);

  // Pin Auth Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [pinTargetLabel, setPinTargetLabel] = useState('');

  useEffect(() => {
    const unsub = subscribeMasterQuarries(list => {
      setQuarries(list);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter Kuari
  const filteredQuarries = useMemo(() => {
    let result = [...quarries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.contactPerson && item.contactPerson.toLowerCase().includes(q)) ||
          (item.phoneNumber && item.phoneNumber.includes(q)) ||
          item.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [quarries, searchQuery]);

  // Statistik Ringkasan
  const uniqueLocationsCount = useMemo(() => {
    const setLoc = new Set(quarries.map(q => q.location?.trim()).filter(Boolean));
    return setLoc.size;
  }, [quarries]);

  // Otorisasi Aksi Tambah Kuari
  const handleOpenAdd = () => {
    setName('');
    setLocation('');
    setContactPerson('');
    setPhoneNumber('');
    setIsAddOpen(true);
  };

  const handleInitiateAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setPinTargetLabel(`Tambah Kuari: ${name}`);
    setPendingAction(() => async () => {
      await saveMasterQuarry(
        name.trim(),
        location.trim(),
        contactPerson.trim(),
        phoneNumber.trim()
      );

      setIsAddOpen(false);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Edit Kuari
  const handleInitiateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setPinTargetLabel(`Ubah Kuari: ${editTarget.name}`);
    setPendingAction(() => async () => {
      await saveMasterQuarry(
        editTarget.name.trim(),
        editTarget.location?.trim(),
        editTarget.contactPerson?.trim(),
        editTarget.phoneNumber?.trim(),
        editTarget.notes?.trim(),
        editTarget.id
      );

      setEditTarget(null);
    });
    setIsPinModalOpen(true);
  };

  // Otorisasi Aksi Hapus Kuari
  const handleDeleteQuarry = (q: MasterQuarry) => {
    setPinTargetLabel(`Hapus Kuari: ${q.name}`);
    setPendingAction(() => async () => {
      await deleteMasterQuarry(q.id);
    });
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;
    try {
      await pendingAction();
    } catch (err) {
      console.error('Gagal menjalankan aksi kuari:', err);
    } finally {
      setIsPinModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile Titlebar Action Button (Rule 108) */}
      {!isInvestorUser && !isDispatcherUser && (
        <MobileTitlebarAction>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-2.5 py-1 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
          >
            + Tambah Kuari
          </button>
        </MobileTitlebarAction>
      )}

      {/* 1. Metric Cards (Rule 99: Sans-serif bold tracking-tight, no monospace) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Total Mitra Tambang</span>
          <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
            {filteredQuarries.length} Kuari Terdaftar
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Lokasi Titik Muat Tersebar</span>
          <span className="text-xl font-bold tracking-tight text-[#111111] block mt-1">
            {uniqueLocationsCount} Wilayah / Titik
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">Status Operasional Mitra</span>
          <span className="text-xl font-bold tracking-tight text-[#008060] block mt-1">
            100% Siap Suplai
          </span>
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          <div className="text-xs text-[#666666]">
            Daftar PT Tambang & Kuari resmi sebagai titik muat armada material alam.
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input (Rule 98: Universal Search Icon) */}
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
                placeholder="Cari kuari, lokasi, kontak..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {!isInvestorUser && !isDispatcherUser && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="hidden md:inline-flex px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
              >
                + Tambah Kuari
              </button>
            )}
          </div>
        </div>

        {/* Tabel Master Kuari (Rule 66) */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[240px] min-w-[240px] whitespace-nowrap">Nama PT Tambang / Kuari</th>
                <th className="py-2.5 px-3 w-[200px] min-w-[200px] whitespace-nowrap">Lokasi Tambang (Titik Muat)</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Kontak Person (PIC)</th>
                <th className="py-2.5 px-3 w-[150px] min-w-[150px] whitespace-nowrap">Nomor Telepon</th>
                <th className="py-2.5 px-3 w-[120px] min-w-[120px] whitespace-nowrap">Status Mitra</th>
                {!isInvestorUser && !isDispatcherUser && (
                  <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {isLoading ? (
                <tr>
                  <td colSpan={(isInvestorUser || isDispatcherUser) ? 5 : 6} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Memuat data kuari tambang...
                  </td>
                </tr>
              ) : filteredQuarries.length === 0 ? (
                <tr>
                  <td colSpan={(isInvestorUser || isDispatcherUser) ? 5 : 6} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    Tidak ada data kuari yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredQuarries.map(q => (
                  <tr key={q.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap w-[240px] align-middle">
                      <span className="font-bold text-[#111111] block truncate">{q.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#444444] whitespace-nowrap w-[200px] align-middle">
                      <RunningText text={q.location} placeholder="-" className="text-[#444444]" />
                    </td>
                    <td className="py-2.5 px-3 text-[#111111] whitespace-nowrap w-[160px] align-middle font-medium">
                      <RunningText text={q.contactPerson} placeholder="-" className="text-[#111111]" />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#444444] whitespace-nowrap w-[150px] align-middle">
                      {q.phoneNumber ? formatPhoneNumber(q.phoneNumber) : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap w-[120px] align-middle">
                      <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
                        AKTIF
                      </span>
                    </td>
                    {!isInvestorUser && !isDispatcherUser && (
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Edit Data Kuari',
                                onClick: () => setEditTarget(q)
                              },
                              {
                                label: 'Salin ID Kuari',
                                onClick: () => navigator.clipboard.writeText(q.id)
                              },
                              {
                                label: 'Hapus Kuari',
                                variant: 'danger',
                                onClick: () => handleDeleteQuarry(q)
                              }
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

      {/* Modal Tambah Kuari Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsAddOpen(false)} 
          />
          
          <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Tambah Kuari / Suplier Baru</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Daftarkan entitas sumber tambang dan titik muat material
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] text-base p-1 cursor-pointer border-none bg-transparent"
               aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleInitiateAdd} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-[#666666] font-medium mb-1">
                  Nama PT / Kuari Tambang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(formatEntityNameLive(e.target.value))}
                  placeholder="Contoh: PT Tambang Batu Mandiri"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Lokasi Tambang (Titik Muat)</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Rangkasbitung / Bojonegara"
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#666666] font-medium mb-1">Kontak Person (PIC)</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(formatPersonNameLive(e.target.value))}
                    placeholder="Contoh: Bpk. Dani"
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

      {/* Modal Edit Kuari */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setEditTarget(null)} 
          />
          
          <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
            <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 bg-white">
              <div className="w-full text-center md:text-left">
                <h3 className="text-sm font-bold text-[#111111]">Edit Kuari: {editTarget.name}</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">
                  Perbarui identitas tambang, lokasi muat, dan narahubung
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="hidden md:flex text-[#888888] hover:text-[#111111] text-base p-1 cursor-pointer border-none bg-transparent"
               aria-label="Tutup"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleInitiateEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-[#666666] font-medium mb-1">Nama PT / Kuari Tambang</label>
                <input
                  type="text"
                  required
                  value={editTarget.name}
                  onChange={e => setEditTarget({ ...editTarget, name: formatEntityNameLive(e.target.value) })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1">Lokasi Tambang</label>
                <input
                  type="text"
                  value={editTarget.location || ''}
                  onChange={e => setEditTarget({ ...editTarget, location: e.target.value })}
                  className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#666666] font-medium mb-1">Kontak Person (PIC)</label>
                  <input
                    type="text"
                    value={editTarget.contactPerson || ''}
                    onChange={e => setEditTarget({ ...editTarget, contactPerson: formatPersonNameLive(e.target.value) })}
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

      {/* Pin Authorization Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        title="Otorisasi Manajemen Kuari"
        description="Masukkan PIN otorisasi default (2008005) untuk memverifikasi tindakan pada data kuari tambang."
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
