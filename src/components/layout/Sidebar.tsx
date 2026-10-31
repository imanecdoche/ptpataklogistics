import React, { useState, useEffect } from 'react';
import { signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { isDeveloperEmail } from '@/lib/userManagementService';
import { useProjectFilter } from '@/context/ProjectFilterContext';

export type NavigationTab =
  | 'dashboard'
  | 'dispatcher'
  | 'ritase'
  | 'projects'
  | 'investors'
  | 'quarries'
  | 'clients'
  | 'materials'
  | 'cash_ledger'
  | 'hok_labor'
  | 'recap'
  | 'database'
  | 'dev';

export interface SubTabItem {
  id: string;
  label: string;
}

interface SidebarItem {
  id: NavigationTab;
  label: string;
  iconSrc: string;
}

const MENU_ITEMS: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconSrc: '/icons/dashboard.png'
  },
  {
    id: 'cash_ledger',
    label: 'Kas & Piutang Tempo',
    iconSrc: '/icons/wallet.png'
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    iconSrc: '/icons/truck.png'
  },
  {
    id: 'ritase',
    label: 'Riwayat Ritase',
    iconSrc: '/icons/ritase.png'
  },
  {
    id: 'projects',
    label: 'Proyek',
    iconSrc: '/icons/project.png'
  },
  {
    id: 'investors',
    label: 'Investor',
    iconSrc: '/icons/investor.png'
  },
  {
    id: 'quarries',
    label: 'Kuari / Suplier',
    iconSrc: '/icons/quarry.png'
  },
  {
    id: 'clients',
    label: 'Klien',
    iconSrc: '/icons/client.png'
  },
  {
    id: 'materials',
    label: 'Master Material',
    iconSrc: '/icons/layers.png'
  },
  {
    id: 'hok_labor',
    label: 'HOK Tukang Lapangan',
    iconSrc: '/icons/layers.png'
  },
  {
    id: 'recap',
    label: 'Rekapitulasi Periode',
    iconSrc: '/icons/chart.png'
  },
  {
    id: 'database',
    label: 'Database',
    iconSrc: '/icons/database.png'
  },
  {
    id: 'dev',
    label: 'Dev Console',
    iconSrc: '/icons/dev-terminal.png'
  }
];

export const SUB_MENU_ITEMS: Record<NavigationTab, SubTabItem[]> = {
  dashboard: [
    { id: 'overview', label: 'Ringkasan Utama' },
    { id: 'activity', label: 'Aktivitas Terkini' }
  ],
  dispatcher: [],
  ritase: [],
  projects: [],
  investors: [],
  quarries: [],
  clients: [],
  materials: [
    { id: 'catalog', label: 'Katalog Komoditas' },
    { id: 'pricing', label: 'Harga & Mutu Kuari' }
  ],
  cash_ledger: [
    { id: 'cash_flow', label: 'Arus Kas Riil' },
    { id: 'receivables', label: 'Piutang Tempo' }
  ],
  hok_labor: [
    { id: 'payments', label: 'Pembayaran HOK' },
    { id: 'job_types', label: 'Tipe Pekerjaan' }
  ],
  recap: [
    { id: 'volume', label: 'Volume Muatan' },
    { id: 'financial', label: 'Laba & Finansial' }
  ],
  database: [
    { id: 'ritase', label: 'Riwayat Ritase' },
    { id: 'vehicles', label: 'Armada & Plat Nomor' },
    { id: 'drivers', label: 'Daftar Supir' },
    { id: 'clients', label: 'Klien / Pelanggan' }
  ],
  dev: [
    { id: 'all', label: 'Semua Akun' },
    { id: 'pending', label: 'Menunggu Review' },
    { id: 'active', label: 'Akun Aktif' },
    { id: 'inactive', label: 'Nonaktif' }
  ]
};

interface SidebarProps {
  user?: User | null;
  activeTab: NavigationTab;
  activeSubTab?: string;
  onSelectTab: (tab: NavigationTab) => void;
  onSelectSubTab?: (tab: NavigationTab, subTabId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  user,
  activeTab,
  activeSubTab,
  onSelectTab,
  onSelectSubTab,
  isMobileOpen = false,
  onCloseMobile,
  onOpenSettings,
  onLogout
}: SidebarProps): React.JSX.Element {
  const { isInvestorUser, isDispatcherUser, isWatcherUser } = useProjectFilter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State untuk melacak tab mana saja yang sedang di-expand sub-tab nya
  // Khusus mobile (< 768px): seluruh tab collapsed (tertutup) by default
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>(() => {
    const defaultState: Record<string, boolean> = {};
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      defaultState.dashboard = true;
      defaultState.dispatcher = true;
      defaultState.database = true;
    }
    return defaultState;
  });

  // Saat sidepanel mobile dibuka, pastikan seluruh sub-tab dalam kondisi collapsed
  useEffect(() => {
    if (isMobileOpen) {
      setExpandedTabs({});
    }
  }, [isMobileOpen]);

  const toggleExpand = (tabId: NavigationTab): void => {
    setExpandedTabs(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const handleLogoutClick = (): void => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async (): Promise<void> => {
    setIsLogoutConfirmOpen(false);
    if (onCloseMobile) {
      onCloseMobile();
    }
    if (onLogout) {
      onLogout();
    } else {
      try {
        setIsLoggingOut(true);
        await signOut(auth);
      } catch (error) {
        console.error('Gagal keluar sistem:', error);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handleItemClick = (tab: NavigationTab): void => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleSubItemClick = (tab: NavigationTab, subTabId: string): void => {
    onSelectTab(tab);
    if (onSelectSubTab) {
      onSelectSubTab(tab, subTabId);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleSettingsClick = (): void => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setIsSettingsOpen(true);
    }
  };

  // Kunci scroll halaman (body scroll-lock) saat sidepanel mobile terbuka
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Tombol Escape menutup sidepanel di mobile
  useEffect(() => {
    if (!isMobileOpen || !onCloseMobile) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const sidebarContent = (
    <div className="w-full h-full bg-white flex flex-col select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 md:h-20 md:px-5 flex items-center justify-between border-b border-[#eaeaea]">
        <div className="flex items-center space-x-2.5 md:space-x-3.5 min-w-0">
          <img
            src="/icons/pt-logo.png"
            alt="PT Patak Abadi Jaya"
            className="w-5 h-5 md:w-7 md:h-7 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="block text-xs md:text-sm font-bold tracking-tight text-[#111111] leading-tight truncate">
              PT Patak Abadi Jaya
            </span>
            <span className="block text-[10px] md:text-xs text-[#666666] leading-tight truncate mt-0.5">
              Logistics System
            </span>
          </div>
        </div>

        {/* Mobile Close Button (Selalu menggunakan /icons/close.png) */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu navigasi"
            className="md:hidden text-[#666666] hover:text-[#171717] p-1 rounded transition-colors"
          >
            <img
              src="/icons/close.png"
              alt="Tutup"
              className="w-5 h-5 object-contain"
            />
          </button>
        )}
      </div>

      {/* Navigation Menu dengan Sub-Tab Accordion */}
      <nav aria-label="Menu Utama" className="flex-1 py-3 px-3 md:py-4 md:px-3.5 space-y-1 md:space-y-1.5 overflow-y-auto">
        {MENU_ITEMS.map(item => {
          // Khusus menu 'dev': 100% tersembunyi jika akun bukan developer fatih@patak.dev
          if (item.id === 'dev' && !isDeveloperEmail(user?.email)) {
            return null;
          }

          // RBAC Sidepanel Policy per Rule 95
          if (isInvestorUser && !['dashboard', 'projects', 'investors'].includes(item.id)) {
            return null;
          }
          if (isDispatcherUser && !['dispatcher', 'ritase', 'projects', 'quarries', 'clients', 'materials', 'database', 'recap'].includes(item.id)) {
            return null;
          }
          if (isWatcherUser && item.id === 'dispatcher') {
            return null;
          }

          const isActive = activeTab === item.id;
          const rawSubItems = SUB_MENU_ITEMS[item.id] || [];
          const subItems = isDispatcherUser && item.id === 'recap'
            ? rawSubItems.filter(s => s.id !== 'financial')
            : rawSubItems;
          const isExpanded = Boolean(expandedTabs[item.id]);

          return (
            <div key={item.id} className="space-y-0.5">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm rounded-[6px] transition-colors font-medium select-none ${
                  isActive
                    ? 'bg-[#f5f5f5] text-[#111111] font-semibold'
                    : 'text-[#666666] hover:bg-[#fafafa] hover:text-[#111111]'
                }`}
              >
                {/* Tombol Utama: Berpindah Modul (Tanpa Mengubah Status Accordion) */}
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className="flex items-center space-x-3 md:space-x-3.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <img
                    src={item.iconSrc}
                    alt={item.label}
                    className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
                  />
                  <span className="truncate">{item.label}</span>
                </button>

                {/* Tombol Khusus Arrow Down: Toggle Expand / Collapse Sub-Tab */}
                {subItems.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
                    }}
                    aria-label={`Toggle sub-menu ${item.label}`}
                    className="p-1 -mr-1 text-[#888888] hover:text-[#111111] hover:bg-[#ebebeb] rounded transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sub-Menu List Accordion dengan Animasi Halus */}
              {subItems.length > 0 && (
                <div
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-60 opacity-100 py-1' : 'max-h-0 opacity-0 py-0'
                  }`}
                >
                  <div className="pl-8 md:pl-9 pr-2 space-y-0.5">
                    {subItems.map(sub => {
                      const isSubActive = isActive && activeSubTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSubItemClick(item.id, sub.id)}
                          className={`w-full flex items-center px-2.5 py-1.5 text-[11px] md:text-xs rounded-[5px] transition-colors text-left cursor-pointer ${
                            isSubActive
                              ? 'bg-[#111111] text-white font-medium'
                              : 'text-[#666666] hover:bg-[#f0f0f0] hover:text-[#111111]'
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer (Info Profil Akun & Tombol Keluar) */}
      <div className="p-3 md:p-4 border-t border-[#eaeaea] space-y-2 md:space-y-3">
        {/* Account Profile Card */}
        <div className="flex items-center justify-between p-2 md:p-2.5 rounded-[6px] hover:bg-[#fafafa] transition-colors">
          <div className="flex items-center space-x-2.5 md:space-x-3 min-w-0 flex-1 mr-1.5">
            <img
              src="/icons/avatar.png"
              alt="Profil Akun"
              className="w-7 h-7 md:w-9 md:h-9 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-xs md:text-sm font-semibold text-[#111111] truncate leading-tight">
                {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Administrator')}
              </span>
              <span className="block text-[10px] md:text-xs text-[#666666] truncate leading-tight mt-0.5">
                {user?.email || 'admin@patak.id'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSettingsClick}
            title="Pengaturan Akun"
            aria-label="Pengaturan Akun"
            className="p-1 md:p-1.5 text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[4px] transition-colors flex-shrink-0 cursor-pointer"
          >
            <img
              src="/icons/settings.png"
              alt="Pengaturan"
              className="w-4 h-4 md:w-5 md:h-5 object-contain"
            />
          </button>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center space-x-2.5 md:space-x-3 px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm font-medium text-[#666666] hover:text-[#cf1124] hover:bg-[#fff5f5] rounded-[6px] transition-colors text-left"
        >
          <img
            src="/icons/logout.png"
            alt="Keluar"
            className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
          />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Skala Lega 280px) */}
      <aside className="hidden md:flex flex-col w-[280px] flex-shrink-0 h-screen sticky top-0 bg-white border-r border-[#eaeaea] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay dengan Animasi 300ms Smooth Slide & Fade */}
      <div
        className={`fixed inset-0 z-50 md:hidden flex transition-all duration-300 ease-out ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        aria-hidden={!isMobileOpen}
      >
        {/* Dimmed Solid Backdrop (Fade In & Fade Out 300ms, Tanpa Blur) */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
          aria-hidden="true"
        />

        {/* Drawer Body (GPU Hardware-Accelerated Slide 300ms, Borderless dengan Shadow-2xl) */}
        <div
          className={`relative w-[240px] max-w-[80vw] h-full bg-white shadow-2xl z-10 flex flex-col transform transition-transform duration-300 ease-out will-change-transform ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Custom UI Dialog: Pengaturan Akun */}
      <CustomDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Pengaturan Akun"
        iconSrc="/icons/settings.png"
        confirmText="Tutup"
        onConfirm={() => setIsSettingsOpen(false)}
      >
        <div className="space-y-4 py-1">
          <div className="flex items-center space-x-3 p-3 bg-[#f5f5f5] rounded-[6px]">
            <img
              src="/icons/avatar.png"
              alt="Profil Pengguna"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-[#111111] truncate">
                {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Administrator')}
              </span>
              <span className="block text-[11px] text-[#666666] truncate mt-0.5">
                {user?.email || 'admin@patak.id'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#eaeaea]">
              <span className="text-[#666666]">Perusahaan</span>
              <span className="font-medium text-[#111111]">PT Patak Abadi Jaya</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#eaeaea]">
              <span className="text-[#666666]">Peran</span>
              <span className="font-medium text-[#111111]">Dispatcher & Keuangan</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#666666]">Database</span>
              <span className="font-medium text-[#111111]">pataklogisticdb (aktif)</span>
            </div>
          </div>
        </div>
      </CustomDialog>

      {/* Custom UI Dialog: Konfirmasi Keluar */}
      <CustomDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => {
          if (!isLoggingOut) setIsLogoutConfirmOpen(false);
        }}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari sistem logistik PT Patak Abadi Jaya?"
        iconSrc="/icons/logout.png"
        confirmText="Keluar"
        cancelText="Batal"
        isDestructive={true}
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
