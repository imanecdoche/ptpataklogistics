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
import { RecapPage } from '@/components/recap/RecapPage';
import { CashLedgerPage } from '@/components/cash_ledger/CashLedgerPage';
import { LaborPage } from '@/components/labor/LaborPage';
import { DevPage } from '@/components/dev/DevPage';
import { OfflineOverlay } from '@/components/ui/OfflineOverlay';
import { isDeveloperEmail } from '@/lib/userManagementService';
import { ProjectFilterProvider, useProjectFilter } from '@/context/ProjectFilterContext';

interface AuthenticatedAppProps {
  user: User | null;
  onLogout: () => void;
}

function AuthenticatedApp({ user, onLogout }: AuthenticatedAppProps): React.JSX.Element {
  const { isDispatcherUser } = useProjectFilter();
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => (isDispatcherUser ? 'dispatcher' : 'dashboard'));
  const [currentSubTab, setCurrentSubTab] = useState<string>(() => (isDispatcherUser ? 'new_ticket' : 'overview'));

  // Keamanan Route Protection: dispatcher otomatis diarahkan ke 'dispatcher' dan dicegah membuka dashboard, investors, atau cash_ledger
  useEffect(() => {
    if (isDispatcherUser && (currentTab === 'dashboard' || currentTab === 'investors' || currentTab === 'cash_ledger' || currentTab === 'hok_labor')) {
      setCurrentTab('dispatcher');
      setCurrentSubTab('new_ticket');
    }
  }, [isDispatcherUser, currentTab]);

  const handleSelectTab = (tab: NavigationTab): void => {
    // Keamanan: tab dev hanya untuk akun developer
    if (tab === 'dev' && !isDeveloperEmail(user?.email)) {
      setCurrentTab(isDispatcherUser ? 'dispatcher' : 'dashboard');
      setCurrentSubTab(isDispatcherUser ? 'new_ticket' : 'overview');
      return;
    }

    // Keamanan RBAC: dispatcher tidak boleh mengakses dashboard, investors, cash_ledger, atau hok_labor
    if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger' || tab === 'hok_labor')) {
      setCurrentTab('dispatcher');
      setCurrentSubTab('new_ticket');
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
    } else if (tab === 'recap') {
      setCurrentSubTab('volume');
    } else if (tab === 'cash_ledger') {
      setCurrentSubTab('cash_flow');
    } else if (tab === 'hok_labor') {
      setCurrentSubTab('payments');
    }
  };

  const handleSelectSubTab = (tab: NavigationTab, subTabId?: string): void => {
    // Keamanan RBAC
    if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger' || tab === 'hok_labor')) {
      setCurrentTab('dispatcher');
      setCurrentSubTab('new_ticket');
      return;
    }

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
        <AuthenticatedApp user={user} onLogout={handleLogout} />
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
