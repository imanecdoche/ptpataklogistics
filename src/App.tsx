import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginPage } from '@/components/auth/LoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationTab } from '@/components/layout/Sidebar';
import { VerifyingScreen } from '@/components/auth/VerifyingScreen';
import { SessionTerminatingScreen } from '@/components/auth/SessionTerminatingScreen';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { DispatcherPage } from '@/components/dispatcher/DispatcherPage';
import { DatabasePage } from '@/components/database/DatabasePage';
import { MasterMaterialPage } from '@/components/materials/MasterMaterialPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { InvestorsPage } from '@/components/investors/InvestorsPage';
import { QuarriesPage } from '@/components/quarries/QuarriesPage';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { DevPage } from '@/components/dev/DevPage';
import { OfflineOverlay } from '@/components/ui/OfflineOverlay';
import { isDeveloperEmail } from '@/lib/userManagementService';
import { ProjectFilterProvider } from '@/context/ProjectFilterContext';

export default function App(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [currentSubTab, setCurrentSubTab] = useState<string>('overview');
  const [isTerminatingSession, setIsTerminatingSession] = useState(false);
  const [isTerminatingFadingOut, setIsTerminatingFadingOut] = useState(false);
  const prevUserRef = useRef<User | null>(null);

  const handleSelectTab = (tab: NavigationTab): void => {
    // Keamanan: tab dev hanya untuk akun developer
    if (tab === 'dev' && !isDeveloperEmail(user?.email)) {
      setCurrentTab('dashboard');
      setCurrentSubTab('overview');
      return;
    }

    setCurrentTab(tab);
    if (tab === 'dashboard') {
      setCurrentSubTab('overview');
    } else if (tab === 'database') {
      setCurrentSubTab('ritase');
    } else if (tab === 'dev') {
      setCurrentSubTab('all');
    } else if (tab === 'dispatcher') {
      setCurrentSubTab('new_ticket');
      window.dispatchEvent(new CustomEvent('patak:close-dispatch-drawer'));
    }
  };

  const handleSelectSubTab = (tab: NavigationTab, subTabId?: string): void => {
    setCurrentTab(tab);
    if (subTabId) {
      setCurrentSubTab(subTabId);
    }
    if (tab === 'dispatcher') {
      if (subTabId === 'history') {
        window.dispatchEvent(new CustomEvent('patak:open-dispatch-drawer'));
      } else if (subTabId === 'new_ticket') {
        window.dispatchEvent(new CustomEvent('patak:close-dispatch-drawer'));
      }
    }
  };

  const handleLogout = (): void => {
    setIsTerminatingSession(true);
    setIsTerminatingFadingOut(false);

    // 2.0 detik tampil penuh, 300ms fade-out
    setTimeout(() => {
      setIsTerminatingFadingOut(true);
    }, 2000);

    setTimeout(async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        setIsTerminatingSession(false);
        setIsTerminatingFadingOut(false);
      }
    }, 2300);
  };

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    let finishTimer: ReturnType<typeof setTimeout>;

    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      const isLoggingIn = !prevUserRef.current && !!currentUser;
      prevUserRef.current = currentUser;
      setUser(currentUser);
      setIsInitializing(false);

      if (currentUser && isLoggingIn) {
        setIsVerifying(true);
        setIsFadingOut(false);

        fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
        }, 3000);

        finishTimer = setTimeout(() => {
          setIsVerifying(false);
          setIsFadingOut(false);
        }, 3300);
      } else if (!currentUser) {
        setIsVerifying(false);
        setIsFadingOut(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  if (isInitializing) {
    return (
      <>
        <VerifyingScreen />
        <OfflineOverlay />
      </>
    );
  }

  if (!user && !isTerminatingSession) {
    return (
      <>
        <LoginPage user={null} />
        <OfflineOverlay />
      </>
    );
  }

  return (
    <>
      <ProjectFilterProvider currentUserEmail={user?.email}>
        <AppShell
          user={user}
          activeTab={currentTab}
          activeSubTab={currentSubTab}
          onSelectTab={handleSelectTab}
          onSelectSubTab={handleSelectSubTab}
          onLogout={handleLogout}
        >
          {currentTab === 'dashboard' && (
            <DashboardPage
              userEmail={user?.email || 'admin@patak.id'}
              activeSubTab={currentSubTab}
              onNavigateTab={handleSelectSubTab}
            />
          )}

          {currentTab === 'dispatcher' && (
            <DispatcherPage userEmail={user?.email || 'operator@patak.id'} />
          )}

          {currentTab === 'database' && (
            <DatabasePage userEmail={user?.email || 'admin@patak.id'} />
          )}

          {currentTab === 'dev' && (
            <DevPage userEmail={user?.email || 'fatih@patak.dev'} />
          )}

          {currentTab === 'materials' && (
            <MasterMaterialPage
              userEmail={user?.email || 'admin@patak.id'}
              activeSubTab={currentSubTab}
              onNavigateSubTab={handleSelectSubTab}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsPage userEmail={user?.email || 'admin@patak.id'} />
          )}

          {currentTab === 'investors' && (
            <InvestorsPage userEmail={user?.email || 'admin@patak.id'} />
          )}

          {currentTab === 'quarries' && (
            <QuarriesPage userEmail={user?.email || 'admin@patak.id'} />
          )}

          {currentTab === 'clients' && (
            <ClientsPage userEmail={user?.email || 'admin@patak.id'} />
          )}

          {currentTab !== 'dashboard' &&
            currentTab !== 'dispatcher' &&
            currentTab !== 'database' &&
            currentTab !== 'dev' &&
            currentTab !== 'materials' &&
            currentTab !== 'projects' &&
            currentTab !== 'investors' &&
            currentTab !== 'quarries' &&
            currentTab !== 'clients' && (
            <div className="bg-white rounded-[10px] p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[#111111]">
                  {currentTab === 'cash_ledger' && 'Buku Kas & Piutang Tempo'}
                  {currentTab === 'recap' && 'Rekapitulasi Periode Transaksi'}
                </h2>
                <p className="text-xs text-[#666666]">
                  Sistem terhubung ke database <span className="font-mono text-[#111111]">pataklogisticdb</span> di zona <span className="font-mono text-[#111111]">asia-southeast2</span>.
                </p>
              </div>

              <div className="border-t border-[#eaeaea] pt-4 text-xs text-[#666666]">
                Menu aktif saat ini:{' '}
                <span className="font-medium text-[#111111]">
                  {currentTab === 'cash_ledger' && 'Kas & Piutang Tempo'}
                  {currentTab === 'recap' && 'Rekapitulasi Periode'}
                </span>
              </div>
            </div>
          )}
        </AppShell>
      </ProjectFilterProvider>

      {/* Layar Verifikasi Kredensial 3 Detik dengan Transisi Fade-Out */}
      {isVerifying && <VerifyingScreen isFadingOut={isFadingOut} />}

      {/* Layar Pemutusan Sesi (Logout) 2 Detik dengan Transisi Fade-Out */}
      {isTerminatingSession && <SessionTerminatingScreen isFadingOut={isTerminatingFadingOut} />}

      {/* Layar Penuh Deteksi Terputus & Reconnecting */}
      <OfflineOverlay />
    </>
  );
}
