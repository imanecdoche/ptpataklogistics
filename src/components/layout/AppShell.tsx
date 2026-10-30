import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Sidebar, NavigationTab } from '@/components/layout/Sidebar';
import { Icons8Menu } from '@/components/icons/Icons8';
import { MobileRubberBand } from '@/components/ui/MobileRubberBand';
import { useProjectFilter } from '@/context/ProjectFilterContext';
import { CustomSelectCombobox } from '@/components/ui/CustomSelectCombobox';

interface AppShellProps {
  user?: User | null;
  children?: React.ReactNode;
  activeTab: NavigationTab;
  activeSubTab?: string;
  onSelectTab: (tab: NavigationTab) => void;
  onSelectSubTab?: (tab: NavigationTab, subTabId: string) => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; mobileTitle?: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Operasional',
    mobileTitle: 'Dashboard Logistik',
    subtitle: 'Ringkasan metrik ritase harian, estimasi finansial, dan arus kas armada'
  },
  dispatcher: {
    title: 'Dispatcher & Ritase',
    mobileTitle: 'Catat Ritase Baru',
    subtitle: 'Pencatatan ritase keluar-masuk armada dan verifikasi tiket muatan'
  },
  cash_ledger: {
    title: 'Kas & Piutang Tempo',
    subtitle: 'Arus kas riil beli tunai vs jual tempo dan status pelunasan'
  },
  recap: {
    title: 'Rekapitulasi Periode',
    subtitle: 'Laporan volume muatan material dan akumulasi finansial'
  },
  materials: {
    title: 'Master Material',
    subtitle: 'Katalog komoditas alam, satuan acuan, dan standar harga'
  },
  database: {
    title: 'Master Database & Entitas',
    mobileTitle: 'Database & Entitas',
    subtitle: 'Kelola master armada plat nomor, supir, klien, dan kuari untuk menjaga kebersihan data'
  },
  dev: {
    title: 'Developer Console',
    mobileTitle: 'Dev Console',
    subtitle: 'Manajemen kredensial, hak akses akun, dan sesi pengguna sistem'
  }
};

export function AppShell({
  user,
  children,
  activeTab,
  activeSubTab,
  onSelectTab,
  onSelectSubTab,
  onOpenSettings,
  onLogout
}: AppShellProps): React.JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const currentTabInfo = TAB_TITLES[activeTab];

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    isInvestorUser
  } = useProjectFilter();

  // Reset scroll dan state saat ganti tab navigasi
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setIsScrolledPast(false);
  }, [activeTab]);

  // Pantau scroll container untuk memicu kemunculan header frosted glass
  const handleScroll = (e: React.UIEvent<HTMLElement>): void => {
    const top = e.currentTarget.scrollTop;
    if (top > 100) {
      if (!isScrolledPast) setIsScrolledPast(true);
    } else {
      if (isScrolledPast) setIsScrolledPast(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-[#fafafa] flex flex-col md:flex-row font-sans text-[#171717]">
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onSelectTab={onSelectTab}
        onSelectSubTab={onSelectSubTab}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Replacement Compact Header (Mobile Khusus: Frosted Glass, Rounded Bottom, Slide down tanpa fading) */}
        <div
          className={`fixed top-0 inset-x-0 z-30 md:hidden h-14 bg-white/80 backdrop-blur-md rounded-b-[16px] px-4 flex items-center justify-between border-none select-none transition-transform duration-200 ease-out transform ${
            isScrolledPast ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {/* Tombol Drawer di Sisi Kiri */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Buka menu navigasi"
            className="text-[#171717] p-1.5 -ml-1.5 rounded hover:bg-[#f5f5f5]/60 transition-colors"
          >
            <Icons8Menu size={20} />
          </button>

          {/* Title Halaman di Tengah */}
          <h2 className="text-xs font-bold text-[#111111] tracking-tight truncate max-w-[220px] text-center">
            {currentTabInfo.mobileTitle || currentTabInfo.title}
          </h2>

          {/* Spacer Simetris di Kanan */}
          <div className="w-8" aria-hidden="true" />
        </div>

        {/* Content Header Desktop (Hanya Title per Rule 88) */}
        <div className="hidden md:flex md:h-16 bg-white border-b border-[#eaeaea] px-6 items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#111111]">
              {currentTabInfo.title}
            </h1>
          </div>

          {/* Global Project Switcher Dropdown (Custom UI per Rule 87) */}
          <div className="flex items-center gap-2 w-72">
            <span className="text-xs text-[#666666] font-medium whitespace-nowrap">Proyek:</span>
            <div className="flex-1">
              <CustomSelectCombobox
                options={[
                  ...(!isInvestorUser ? [{ id: 'ALL', label: 'Semua Proyek (Global)' }] : []),
                  ...projects.map(p => ({ id: p.id, label: p.name, subLabel: p.location }))
                ]}
                value={selectedProjectId}
                onChange={val => setSelectedProjectId(val)}
                disabled={isInvestorUser}
                placeholder="Pilih Proyek..."
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Main Workspace Body & Mobile Natural Scrolling Flow */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col"
        >
          {/* Mobile App Header (Ikut ter-scroll ke atas saat halaman di-scroll) */}
          <header className="md:hidden h-14 bg-white border-b border-[#eaeaea] px-4 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="text-[#171717] p-1.5 -ml-1.5 rounded hover:bg-[#f5f5f5] transition-colors"
            >
              <Icons8Menu size={20} />
            </button>

            <div className="flex items-center space-x-2">
              <img
                src="/icons/logo-box.png"
                alt="PT Patak Abadi Jaya"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-bold text-[#111111] tracking-tight">
                PT Patak Abadi Jaya
              </span>
            </div>

            <div className="w-8" aria-hidden="true" />
          </header>

          {/* Mobile Page Title & Project Switcher (Hanya Title per Rule 88) */}
          <div className="md:hidden bg-white border-b border-[#eaeaea] px-4 py-2.5 flex flex-col gap-2 flex-shrink-0">
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#111111]">
                {currentTabInfo.mobileTitle || currentTabInfo.title}
              </h1>
            </div>

            {/* Mobile Project Switcher (Custom UI per Rule 87) */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#f0f0f0]">
              <span className="text-[11px] text-[#666666] font-medium whitespace-nowrap">Proyek:</span>
              <div className="flex-1">
                <CustomSelectCombobox
                  options={[
                    ...(!isInvestorUser ? [{ id: 'ALL', label: 'Semua Proyek (Global)' }] : []),
                    ...projects.map(p => ({ id: p.id, label: p.name, subLabel: p.location }))
                  ]}
                  value={selectedProjectId}
                  onChange={val => setSelectedProjectId(val)}
                  disabled={isInvestorUser}
                  placeholder="Pilih Proyek..."
                  searchable={false}
                />
              </div>
            </div>
          </div>

          {/* Children Content Body */}
          <div className="p-4 md:p-6 max-w-6xl w-full flex-1">
            {children ? (
              children
            ) : (
              <div className="bg-white rounded-[10px] p-8 text-center text-xs text-[#666666] space-y-2">
                <p className="font-medium text-[#111111]">Modul Siap Dikonfigurasi</p>
                <p>Halaman navigasi aktif: <span className="font-mono text-[#111111]">{activeTab}</span></p>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Stretch Overscroll / Rubber Banding Effect */}
        <MobileRubberBand
          containerRef={mainRef}
          isDispatcherTab={activeTab === 'dispatcher'}
        />
      </div>
    </div>
  );
}
