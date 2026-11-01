import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NavigationTab } from '@/components/layout/Sidebar';
import { parsePath, buildPath, RouteMatch } from '@/lib/routeDefinitions';

interface RouterContextType {
  pathname: string;
  tab: NavigationTab;
  subTab?: string;
  params: Record<string, string>;
  isNotFound: boolean;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  navigateTab: (
    tab: NavigationTab,
    subTab?: string,
    params?: Record<string, string>,
    options?: { replace?: boolean }
  ) => void;
  updateParams: (params: Record<string, string>, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

interface RouterProviderProps {
  children: ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps): React.JSX.Element {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [route, setRoute] = useState<RouteMatch>(() => parsePath(pathname));

  // Fungsi internal untuk sinkronisasi state rute dari path
  const syncRouteFromPath = useCallback((newPath: string) => {
    setPathname(newPath);
    const parsed = parsePath(newPath);
    setRoute(parsed);
  }, []);

  // Listener event popstate untuk tombol Back & Forward browser
  useEffect(() => {
    const handlePopState = () => {
      const current = window.location.pathname || '/';
      syncRouteFromPath(current);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [syncRouteFromPath]);

  // Navigasi manual ke path tertentu
  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (options?.replace) {
      window.history.replaceState({}, '', normalizedPath);
    } else {
      window.history.pushState({}, '', normalizedPath);
    }
    syncRouteFromPath(normalizedPath);
  }, [syncRouteFromPath]);

  // Navigasi menggunakan tab, subTab, dan params
  const navigateTab = useCallback(
    (
      targetTab: NavigationTab,
      targetSubTab?: string,
      targetParams?: Record<string, string>,
      options?: { replace?: boolean }
    ) => {
      const nextPath = buildPath(targetTab, targetSubTab, targetParams);
      navigate(nextPath, options);
    },
    [navigate]
  );

  // Perbarui parameter rute pada path aktif saat ini
  const updateParams = useCallback(
    (newParams: Record<string, string>, options?: { replace?: boolean }) => {
      const mergedParams = { ...route.params, ...newParams };
      // Hapus kunci yang bernilai undefined atau kosong
      Object.keys(mergedParams).forEach(k => {
        if (!mergedParams[k]) {
          delete mergedParams[k];
        }
      });
      navigateTab(route.tab, route.subTab, mergedParams, options);
    },
    [route.tab, route.subTab, route.params, navigateTab]
  );

  return (
    <RouterContext.Provider
      value={{
        pathname,
        tab: route.tab,
        subTab: route.subTab,
        params: route.params,
        isNotFound: Boolean(route.isNotFound),
        navigate,
        navigateTab,
        updateParams
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}
