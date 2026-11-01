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
import { DispatchHistoryPage } from '@/components/dispatcher/DispatchHistoryPage';
import { DatabasePage } from '@/components/database/DatabasePage';
import { MasterMaterialPage } from '@/components/materials/MasterMaterialPage';
import { ProjectsPage } from '@/components/projects/ProjectsPage';
import { InvestorsPage } from '@/components/investors/InvestorsPage';
import { QuarriesPage } from '@/components/quarries/QuarriesPage';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { RecapPage } from '@/components/recap/RecapPage';
import { CashLedgerPage } from '@/components/cash_ledger/CashLedgerPage';
import { LaborPage } from '@/components/labor/LaborPage';
import { DevPage } from '@/components/dev/DevPage';
import { OfflineOverlay } from '@/components/ui/OfflineOverlay';
import { isDeveloperEmail } from '@/lib/userManagementService';
import { ProjectFilterProvider, useProjectFilter } from '@/context/ProjectFilterContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { DEFAULT_SUBTAB } from '@/lib/routeDefinitions';
import { NotFoundPage } from '@/components/ui/NotFoundPage';

interface AuthenticatedAppProps {
  user: User | null;
  onLogout: () => void;
}

function AuthenticatedApp({ user, onLogout }: AuthenticatedAppProps): React.JSX.Element {
  const { isDispatcherUser, isInvestorUser, isWatcherUser } = useProjectFilter();
  const {
    pathname,
    tab: currentTab,
    subTab: currentSubTab,
    params: routeParams,
    isNotFound,
    navigate,
    navigateTab
  } = useRouter();

  // Inisialisasi awal saat pertama login jika rute masih di root '/'
  useEffect(() => {
    if (pathname === '/' || pathname === '') {
      if (isDispatcherUser) {
        navigateTab('dispatcher', 'new_ticket', undefined, { replace: true });
      } else {
        navigateTab('dashboard', 'overview', undefined, { replace: true });
      }
    }
  }, [pathname, isDispatcherUser, navigateTab]);

  // Keamanan Route Protection RBAC
  useEffect(() => {
    // Keamanan: tab dev hanya untuk akun developer
    if (currentTab === 'dev' && !isDeveloperEmail(user?.email)) {
      navigateTab(isDispatcherUser ? 'dispatcher' : 'dashboard', undefined, undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: dispatcher tidak boleh mengakses dashboard, investors, cash_ledger, atau hok_labor
    if (isDispatcherUser && (currentTab === 'dashboard' || currentTab === 'investors' || currentTab === 'cash_ledger' || currentTab === 'hok_labor')) {
      navigateTab('dispatcher', 'new_ticket', undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: watcher tidak boleh mengakses tab dispatcher (input tiket)
    if (isWatcherUser && currentTab === 'dispatcher') {
      navigateTab('dashboard', 'overview', undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: investor hanya boleh mengakses dashboard, projects, atau investors
    if (isInvestorUser && !['dashboard', 'projects', 'investors'].includes(currentTab)) {
      navigateTab('dashboard', 'overview', undefined, { replace: true });
      return;
    }
  }, [isDispatcherUser, isInvestorUser, isWatcherUser, currentTab, user?.email, navigateTab]);

  const handleSelectTab = (tab: NavigationTab): void => {
    // Keamanan: tab dev hanya untuk akun developer
    if (tab === 'dev' && !isDeveloperEmail(user?.email)) {
      navigateTab(isDispatcherUser ? 'dispatcher' : 'dashboard', undefined, undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: dispatcher tidak boleh mengakses dashboard, investors, cash_ledger, atau hok_labor
    if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger' || tab === 'hok_labor')) {
      navigateTab('dispatcher', 'new_ticket', undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: watcher tidak boleh mengakses tab dispatcher (input tiket)
    if (isWatcherUser && tab === 'dispatcher') {
      navigateTab('dashboard', 'overview', undefined, { replace: true });
      return;
    }

    // Keamanan RBAC: investor hanya boleh mengakses dashboard, projects, atau investors
    if (isInvestorUser && !['dashboard', 'projects', 'investors'].includes(tab)) {
      navigateTab('dashboard', 'overview', undefined, { replace: true });
      return;
    }

    if (tab === 'dispatcher') {
      window.dispatchEvent(new CustomEvent('patak:close-dispatch-drawer'));
    }

    navigateTab(tab, DEFAULT_SUBTAB[tab]);
  };

  const handleSelectSubTab = (tab: NavigationTab, subTabId?: string): void => {
    // Keamanan RBAC
    if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger' || tab === 'hok_labor')) {
      navigateTab('dispatcher', 'new_ticket', undefined, { replace: true });
      return;
    }
    if (isInvestorUser && !['dashboard', 'projects', 'investors'].includes(tab)) {
      navigateTab('dashboard', 'overview', undefined, { replace: true });
      return;
    }

    if (tab === 'dispatcher') {
      if (subTabId === 'history') {
        window.dispatchEvent(new CustomEvent('patak:open-dispatch-drawer'));
      } else if (subTabId === 'new_ticket') {
        window.dispatchEvent(new CustomEvent('patak:close-dispatch-drawer'));
      }
    }

    navigateTab(tab, subTabId);
  };

  if (isNotFound) {
    return (
      <NotFoundPage
        currentPath={pathname}
        onNavigateHome={() => {
          if (user) {
            navigateTab('dashboard', 'overview', undefined, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }}
      />
    );
  }

  return (
    <AppShell
      user={user}
      activeTab={currentTab}
      activeSubTab={currentSubTab}
      onSelectTab={handleSelectTab}
      onSelectSubTab={handleSelectSubTab}
      onLogout={onLogout}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'dispatcher' && (
        <DispatcherPage userEmail={user?.email || 'operator@patak.id'} initialView="form" />
      )}

      {currentTab === 'ritase' && (
        <DispatchHistoryPage
          userEmail={user?.email || 'operator@patak.id'}
          initialTicketId={routeParams.ticketId}
          onDetailModalChange={tx => {
            if (tx) {
              navigateTab('ritase', undefined, { ticketId: tx.id });
            } else {
              navigateTab('ritase');
            }
          }}
        />
      )}

      {currentTab === 'database' && (
        <DatabasePage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'dev' && (
        <DevPage
          userEmail={user?.email || 'fatih@patak.dev'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'materials' && (
        <MasterMaterialPage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'projects' && (
        <ProjectsPage
          userEmail={user?.email || 'admin@patak.id'}
          initialProjectId={routeParams.projectId}
          onFinanceModalChange={proj => {
            if (proj) {
              navigateTab('projects', undefined, { projectId: proj.id });
            } else {
              navigateTab('projects');
            }
          }}
        />
      )}

      {currentTab === 'investors' && (
        <InvestorsPage
          userEmail={user?.email || 'admin@patak.id'}
          initialInvestorId={routeParams.investorId}
          onLedgerModalChange={inv => {
            if (inv) {
              navigateTab('investors', undefined, { investorId: inv.id });
            } else {
              navigateTab('investors');
            }
          }}
        />
      )}

      {currentTab === 'quarries' && (
        <QuarriesPage userEmail={user?.email || 'admin@patak.id'} />
      )}

      {currentTab === 'clients' && (
        <ClientsPage userEmail={user?.email || 'admin@patak.id'} />
      )}

      {currentTab === 'cash_ledger' && (
        <CashLedgerPage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'hok_labor' && (
        <LaborPage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}

      {currentTab === 'recap' && (
        <RecapPage
          userEmail={user?.email || 'admin@patak.id'}
          activeSubTab={currentSubTab}
          onNavigateSubTab={handleSelectSubTab}
        />
      )}
    </AppShell>
  );
}

export default function App(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isTerminatingSession, setIsTerminatingSession] = useState(false);
  const [isTerminatingFadingOut, setIsTerminatingFadingOut] = useState(false);
  const prevUserRef = useRef<User | null>(null);

  const handleLogout = (): void => {
    setIsTerminatingSession(true);
    setIsTerminatingFadingOut(false);

    // 2.0 detik tampil penuh, 300ms fade-out
    setTimeout(() => {
      setIsTerminatingFadingOut(true);
    }, 2000);

    setTimeout(async () => {
      try {
        localStorage.removeItem('patak_active_tab');
        localStorage.removeItem('patak_active_subtab');
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
        <RouterProvider>
          <AuthenticatedApp user={user} onLogout={handleLogout} />
        </RouterProvider>
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
