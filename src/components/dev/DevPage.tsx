import React, { useState, useEffect, useMemo } from 'react';
import { SystemUser, UserRole, UserStatus } from '@/types/database';
import {
  subscribeSystemUsers,
  approveUserAccount,
  createAccountDirectly,
  updateAccountData,
  deleteAccountPermanently,
  isDeveloperEmail
} from '@/lib/userManagementService';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { RunningText } from '@/components/ui/RunningText';
import { TableActionMenu } from '@/components/ui/TableActionMenu';
import { EyeToggleIcon } from '@/components/auth/EyeToggleIcon';
import { formatPersonNameLive } from '@/lib/nameUtils';
import { CustomSelectCombobox, SelectOption } from '@/components/ui/CustomSelectCombobox';

const CREATE_ROLE_OPTIONS: SelectOption[] = [
  { id: 'dispatcher', label: 'Dispatcher (Operator Ritase)' },
  { id: 'admin', label: 'Administrator Logistik' },
  { id: 'founder', label: 'Founder / CEO' },
  { id: 'viewer', label: 'Viewer (Hanya Lihat)' }
];

const EDIT_ROLE_OPTIONS: SelectOption[] = [
  { id: 'dispatcher', label: 'Dispatcher (Operator Ritase)' },
  { id: 'admin', label: 'Administrator Logistik' },
  { id: 'founder', label: 'Founder / CEO' },
  { id: 'developer', label: 'Developer' },
  { id: 'viewer', label: 'Viewer' }
];

const EDIT_STATUS_OPTIONS: SelectOption[] = [
  { id: 'ACTIVE', label: 'ACTIVE (Aktif)' },
  { id: 'PENDING', label: 'PENDING (Menunggu Review)' },
  { id: 'INACTIVE', label: 'INACTIVE (Nonaktif)' }
];

interface DevPageProps {
  userEmail: string;
}

type DevFilterTab = 'all' | 'pending' | 'active' | 'inactive';

export function DevPage({ userEmail }: DevPageProps): React.JSX.Element {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<DevFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [accTarget, setAccTarget] = useState<SystemUser | null>(null);

  // Form States untuk Buat Akun Baru
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('dispatcher');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time subscribe seluruh akun
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeSystemUsers(list => {
      setUsers(list);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter Status
    if (activeFilter === 'pending') {
      result = result.filter(u => u.status === 'PENDING');
    } else if (activeFilter === 'active') {
      result = result.filter(u => u.status === 'ACTIVE');
    } else if (activeFilter === 'inactive') {
      result = result.filter(u => u.status === 'INACTIVE');
    }

    // Filter Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, activeFilter, searchQuery]);

  // Metric Counts
  const counts = useMemo(() => {
    const total = users.length;
    const pending = users.filter(u => u.status === 'PENDING').length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const inactive = users.filter(u => u.status === 'INACTIVE').length;
    return { total, pending, active, inactive };
  }, [users]);

  // Format Helper: Relative Time
  const formatRelativeTime = (isoString?: string | null): string => {
    if (!isoString) return 'Belum pernah aktif';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} hari lalu`;
    return date.toISOString().slice(0, 10);
  };

  // Aksi Buat Akun Baru Langsung
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      setCreateError('Masukkan username email yang valid.');
      return;
    }

    const cleanEmail = `${cleanUsername}@patak.id`;
    if (newPassword.length < 8) {
      setCreateError('Kata sandi minimal 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccountDirectly({
        name: newName.trim(),
        email: cleanEmail,
        password: newPassword,
        role: newRole,
        createdBy: userEmail
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('dispatcher');
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aksi ACC Akun Pending
  const handleConfirmAcc = async () => {
    if (!accTarget) return;
    try {
      await approveUserAccount(accTarget, userEmail, accTarget.role || 'dispatcher');
    } catch (err) {
      console.error('Gagal ACC akun:', err);
    } finally {
      setAccTarget(null);
    }
  };

  // Aksi Hapus Akun
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccountPermanently(deleteTarget.id);
    } catch (err) {
      console.error('Gagal menghapus akun:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Aksi Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (user: SystemUser) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateAccountData(user.id, {
      status: nextStatus,
      inactiveReason: nextStatus === 'INACTIVE' ? 'Dinonaktifkan manual oleh developer' : null
    });
  };

  return (
    <div className="space-y-4 w-full select-none">
      {/* 1. BRAND HEADER KHUSUS TAB DEVELOPER */}
      <div className="bg-white rounded-[10px] p-4 md:p-5 border border-[#eaeaea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#111111] flex items-center justify-center p-2 flex-shrink-0">
            <img src="/icons/dev-terminal.png" alt="Terminal" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-[#111111]">
                Developer Console
              </h2>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#111111] text-white">
                ROOT PRIVILEGE
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Manajemen kredensial akun, review permohonan akses, dan pelacakan sesi pengguna.
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Akun</span>
          </button>
        </div>
      </div>

      {/* 2. METRIC CARDS RINGKASAN AKUN (Rule 99: Sans-serif bold tracking-tight, no monospace) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Akun */}
        <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#666666]">Total Akun Terdaftar</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#111111]">{counts.total}</span>
            <span className="text-xs text-[#777777]">user</span>
          </div>
          <span className="text-[11px] text-[#888888] mt-1">Termasuk developer & operator</span>
        </div>

        {/* Card 2: Menunggu Review (Pending) */}
        <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#ca8a04]">Menunggu ACC (Pending)</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight ${counts.pending > 0 ? 'text-[#ca8a04]' : 'text-[#111111]'}`}>
              {counts.pending}
            </span>
            <span className="text-xs text-[#777777]">pemohon</span>
          </div>
          <span className="text-[11px] text-[#888888] mt-1">Perlu review & persetujuan</span>
        </div>

        {/* Card 3: Akun Aktif */}
        <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#008060]">Akun Berstatus Aktif</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#008060]">{counts.active}</span>
            <span className="text-xs text-[#777777]">aktif</span>
          </div>
          <span className="text-[11px] text-[#888888] mt-1">Dapat login & beroperasi</span>
        </div>

        {/* Card 4: Akun Nonaktif (>30 Hari Inaktif) */}
        <div className="bg-white rounded-[10px] p-4 border border-[#eaeaea] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[#666666]">Akun Nonaktif</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#dc2626]">{counts.inactive}</span>
            <span className="text-xs text-[#777777]">nonaktif</span>
          </div>
          <span className="text-[11px] text-[#888888] mt-1">&gt; 30 hari tanpa aktivitas login</span>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#eaeaea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-Tabs Filter */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
            }`}
          >
            Menunggu Review ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'active'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
            }`}
          >
            Aktif ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('inactive')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'inactive'
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:bg-[#f5f5f5] hover:text-[#111111]'
            }`}
          >
            Nonaktif ({counts.inactive})
          </button>
        </div>

        {/* Search Bar (Rule 98: Universal Search Icon) */}
        <div className="relative w-full sm:w-64">
          <img
            src="/icons/search.png"
            alt="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, role..."
            className="w-full bg-[#fafafa] border border-[#eaeaea] rounded-[8px] pl-9 pr-3.5 py-1.5 text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 4. TABEL MANAJEMEN AKUN (Aturan 66: fixed-width, zero-wrap, sticky thead) */}
      <div className="bg-white rounded-[10px] border border-[#eaeaea] overflow-hidden">
        <div className="overflow-x-auto select-text max-h-[600px]">
          <table className="w-full min-w-[950px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[180px] min-w-[180px] whitespace-nowrap">Nama Pengguna</th>
                <th className="py-2.5 px-3 w-[210px] min-w-[210px] whitespace-nowrap">Email (@patak.id / @patak.dev)</th>
                <th className="py-2.5 px-3 w-[120px] min-w-[120px] whitespace-nowrap">Peran (Role)</th>
                <th className="py-2.5 px-3 w-[130px] min-w-[130px] whitespace-nowrap">Status Akun</th>
                <th className="py-2.5 px-3 w-[160px] min-w-[160px] whitespace-nowrap">Sesi Aktif Terakhir</th>
                <th className="py-2.5 px-3 w-[120px] min-w-[120px] whitespace-nowrap">Dibuat Tanggal</th>
                <th className="py-2.5 px-3 w-[60px] min-w-[60px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">
                    {isLoading ? 'Memuat data pengguna...' : 'Tidak ada akun yang sesuai kriteria.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isDev = isDeveloperEmail(u.email);

                  return (
                    <tr key={u.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#111111] whitespace-nowrap w-[180px] align-middle">
                        <RunningText text={u.name} className="font-semibold text-[#111111]" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#111111] whitespace-nowrap w-[210px] align-middle">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3 text-[#555555] whitespace-nowrap w-[120px] align-middle uppercase text-[11px] font-semibold">
                        {u.role}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap w-[130px] align-middle">
                        {u.status === 'ACTIVE' && (
                          <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
                            AKTIF
                          </span>
                        )}
                        {u.status === 'PENDING' && (
                          <span className="text-[11px] font-bold text-amber-700 tracking-wide">
                            MENUNGGU ACC
                          </span>
                        )}
                        {u.status === 'INACTIVE' && (
                          <span className="text-[11px] font-bold text-red-600 tracking-wide">
                            NONAKTIF
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#555555] whitespace-nowrap w-[160px] align-middle">
                        {formatRelativeTime(u.lastLoginAt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#666666] whitespace-nowrap w-[120px] align-middle">
                        {u.createdAt ? u.createdAt.slice(0, 10) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap w-[60px] align-middle">
                        <div className="flex items-center justify-end">
                          <TableActionMenu
                            items={[
                              {
                                label: 'ACC / Setujui Akun',
                                hidden: u.status !== 'PENDING',
                                onClick: () => setAccTarget(u)
                              },
                              {
                                label: u.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
                                hidden: u.status === 'PENDING' || isDev,
                                onClick: () => handleToggleStatus(u)
                              },
                              {
                                label: 'Edit Akun',
                                onClick: () => setEditingUser(u)
                              },
                              {
                                label: 'Salin Email',
                                onClick: () => navigator.clipboard.writeText(u.email)
                              },
                              {
                                label: 'Hapus Akun',
                                variant: 'danger',
                                hidden: isDev,
                                onClick: () => setDeleteTarget(u)
                              }
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL BUAT AKUN BARU LANGSUNG DARI DEV CONSOLE                 */}
      {/* ============================================================== */}
      <CustomDialog
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError('');
        }}
        title="Buat Akun Baru Langsung"
        description="Mendaftarkan kredensial akun baru langsung ke sistem dan Firebase Auth."
      >
        <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Lengkap Pengguna <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(formatPersonNameLive(e.target.value))}
              placeholder="Contoh: Ahmad Fauzi"
              required
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Email Pengguna (@patak.id) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center rounded-[8px] border border-[#eaeaea] bg-white focus-within:border-[#111111] overflow-hidden">
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="ahmad.fauzi"
                required
                className="flex-1 px-3.5 py-2 text-xs bg-transparent focus:outline-none font-mono"
              />
              <span className="px-3 py-2 bg-[#f5f5f5] text-[#555555] font-mono text-xs border-l border-[#eaeaea] select-none font-semibold">
                @patak.id
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Kata Sandi (Minimal 8 Karakter) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter..."
                required
                minLength={8}
                className="w-full px-3.5 py-2 pr-10 text-xs bg-white border border-[#eaeaea] rounded-[8px] focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 p-1 text-[#888888] hover:text-[#111111]"
              >
                <EyeToggleIcon isOpen={showNewPassword} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Peran Hak Akses (Role)
            </label>
            <CustomSelectCombobox
              options={CREATE_ROLE_OPTIONS}
              value={newRole}
              onChange={val => setNewRole(val as UserRole)}
              variant="white"
              searchable={false}
              triggerClassName="py-2 rounded-[8px]"
            />
          </div>

          {createError && (
            <p className="text-red-500 text-[11px]">{createError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName || !newUsername || newPassword.length < 8}
              className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-semibold disabled:opacity-40"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </CustomDialog>

      {/* ============================================================== */}
      {/* MODAL EDIT AKUN                                                */}
      {/* ============================================================== */}
      {editingUser && (
        <CustomDialog
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title="Edit Akun Pengguna"
          description={`Koreksi profil dan hak akses untuk akun ${editingUser.email}.`}
        >
          <form
            onSubmit={async e => {
              e.preventDefault();
              await updateAccountData(editingUser.id, {
                name: editingUser.name,
                role: editingUser.role,
                status: editingUser.status
              });
              setEditingUser(null);
            }}
            className="space-y-3.5 text-xs pt-2"
          >
            <div>
              <label className="block text-[#666666] font-medium mb-1">Email (Terkunci)</label>
              <input
                type="text"
                value={editingUser.email}
                disabled
                className="w-full font-mono font-bold bg-[#f5f5f5] border border-[#dddddd] rounded-[8px] px-3.5 py-2 text-xs text-[#555555]"
              />
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={e => setEditingUser({ ...editingUser, name: formatPersonNameLive(e.target.value) })}
                required
                className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">Peran Hak Akses (Role)</label>
              <CustomSelectCombobox
                options={EDIT_ROLE_OPTIONS}
                value={editingUser.role}
                onChange={val => setEditingUser({ ...editingUser, role: val as UserRole })}
                disabled={isDeveloperEmail(editingUser.email)}
                variant="white"
                searchable={false}
                triggerClassName="py-2 rounded-[8px]"
              />
            </div>

            <div>
              <label className="block text-[#666666] font-medium mb-1">Status Akun</label>
              <CustomSelectCombobox
                options={EDIT_STATUS_OPTIONS}
                value={editingUser.status}
                onChange={val => setEditingUser({ ...editingUser, status: val as UserStatus })}
                disabled={isDeveloperEmail(editingUser.email)}
                variant="white"
                searchable={false}
                triggerClassName="py-2 rounded-[8px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#111111] text-white hover:bg-black font-semibold"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </CustomDialog>
      )}

      {/* ============================================================== */}
      {/* DIALOG KONFIRMASI ACC PERMINTAAN AKUN                          */}
      {/* ============================================================== */}
      <CustomDialog
        isOpen={Boolean(accTarget)}
        onClose={() => setAccTarget(null)}
        title="Persetujuan (ACC) Akun Baru"
        description={`Setujui permohonan akses akun ${accTarget?.email} (${accTarget?.name})? Akun akan langsung dibuatkan ke Firebase Auth dan berstatus AKTIF.`}
        confirmText="Ya, Setujui (ACC)"
        cancelText="Batal"
        onConfirm={handleConfirmAcc}
      />

      {/* ============================================================== */}
      {/* DIALOG KONFIRMASI HAPUS AKUN                                   */}
      {/* ============================================================== */}
      <CustomDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Akun Pengguna?"
        description={`Apakah Anda yakin ingin menghapus akun ${deleteTarget?.email} (${deleteTarget?.name})? Pengguna ini tidak akan dapat login lagi ke sistem.`}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        isDestructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
