import { NavigationTab } from '@/components/layout/Sidebar';

export interface RouteMatch {
  tab: NavigationTab;
  subTab?: string;
  params: Record<string, string>;
  isNotFound?: boolean;
}

// Pemetaan Tab utama ke URL slug resmi
export const TAB_TO_SLUG: Record<NavigationTab, string> = {
  dashboard: 'dashboard',
  cash_ledger: 'buku-kas',
  dispatcher: 'catat-ritase',
  ritase: 'riwayat-ritase',
  projects: 'proyek',
  investors: 'investor',
  quarries: 'kuari',
  clients: 'klien',
  materials: 'material',
  hok_labor: 'mandor-borongan',
  recap: 'rekapitulasi',
  database: 'database',
  dev: 'dev'
};

// Pemetaan terbalik URL slug ke NavigationTab (termasuk alias)
export const SLUG_TO_TAB: Record<string, NavigationTab> = {
  // Slug Resmi Bahasa Indonesia
  'dashboard': 'dashboard',
  'buku-kas': 'cash_ledger',
  'catat-ritase': 'dispatcher',
  'riwayat-ritase': 'ritase',
  'proyek': 'projects',
  'investor': 'investors',
  'kuari': 'quarries',
  'klien': 'clients',
  'material': 'materials',
  'mandor-borongan': 'hok_labor',
  'rekapitulasi': 'recap',
  'database': 'database',
  'dev': 'dev',

  // Alias & backward compatibility
  'hok-tukang': 'hok_labor',
  'cash-ledger': 'cash_ledger',
  'cash_ledger': 'cash_ledger',
  'dispatcher': 'dispatcher',
  'projects': 'projects',
  'investors': 'investors',
  'quarries': 'quarries',
  'clients': 'clients',
  'materials': 'materials',
  'hok_labor': 'hok_labor',
  'recap': 'recap'
};

// Pemetaan Sub-Tab ke URL segment
export const SUBTAB_TO_SLUG: Record<NavigationTab, Record<string, string>> = {
  dashboard: {
    overview: 'ringkasan',
    activity: 'aktivitas'
  },
  cash_ledger: {
    cash_flow: 'arus-kas',
    receivables: 'piutang'
  },
  dispatcher: {
    new_ticket: 'tiket-baru',
    history: 'riwayat'
  },
  ritase: {},
  projects: {},
  investors: {},
  quarries: {},
  clients: {},
  materials: {
    catalog: 'katalog',
    pricing: 'harga'
  },
  hok_labor: {
    payments: 'pembayaran',
    job_types: 'tipe-pekerjaan'
  },
  recap: {
    volume: 'volume',
    financial: 'finansial'
  },
  database: {
    ritase: 'ritase',
    vehicles: 'armada',
    drivers: 'supir',
    clients: 'klien'
  },
  dev: {
    all: 'semua',
    pending: 'menunggu',
    active: 'aktif',
    inactive: 'nonaktif'
  }
};

// Pemetaan terbalik Sub-Tab slug ke Sub-Tab ID
export const SLUG_TO_SUBTAB: Record<NavigationTab, Record<string, string>> = {
  dashboard: {
    'ringkasan': 'overview',
    'overview': 'overview',
    'aktivitas': 'activity',
    'activity': 'activity'
  },
  cash_ledger: {
    'arus-kas': 'cash_flow',
    'cash_flow': 'cash_flow',
    'piutang': 'receivables',
    'receivables': 'receivables'
  },
  dispatcher: {
    'tiket-baru': 'new_ticket',
    'new_ticket': 'new_ticket',
    'riwayat': 'history',
    'history': 'history'
  },
  ritase: {},
  projects: {},
  investors: {},
  quarries: {},
  clients: {},
  materials: {
    'katalog': 'catalog',
    'catalog': 'catalog',
    'harga': 'pricing',
    'pricing': 'pricing'
  },
  hok_labor: {
    'pembayaran': 'payments',
    'payments': 'payments',
    'tipe-pekerjaan': 'job_types',
    'job_types': 'job_types'
  },
  recap: {
    'volume': 'volume',
    'finansial': 'financial',
    'financial': 'financial'
  },
  database: {
    'ritase': 'ritase',
    'armada': 'vehicles',
    'vehicles': 'vehicles',
    'supir': 'drivers',
    'drivers': 'drivers',
    'klien': 'clients',
    'clients': 'clients'
  },
  dev: {
    'semua': 'all',
    'all': 'all',
    'menunggu': 'pending',
    'pending': 'pending',
    'aktif': 'active',
    'active': 'active',
    'nonaktif': 'inactive',
    'inactive': 'inactive'
  }
};

// Nilai default sub-tab per tab
export const DEFAULT_SUBTAB: Record<NavigationTab, string | undefined> = {
  dashboard: 'overview',
  cash_ledger: 'cash_flow',
  dispatcher: 'new_ticket',
  ritase: undefined,
  projects: undefined,
  investors: undefined,
  quarries: undefined,
  clients: undefined,
  materials: 'catalog',
  hok_labor: 'payments',
  recap: 'volume',
  database: 'ritase',
  dev: 'all'
};

/**
 * Mengubah URL path string menjadi objek RouteMatch
 */
export function parsePath(pathname: string): RouteMatch {
  // Bersihkan slash awal dan akhir
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) {
    return {
      tab: 'dashboard',
      subTab: 'overview',
      params: {}
    };
  }

  const segments = clean.split('/').map(decodeURIComponent);
  const primarySlug = segments[0] ? segments[0].toLowerCase() : '';

  const tab: NavigationTab | undefined = primarySlug ? SLUG_TO_TAB[primarySlug] : undefined;
  if (!tab) {
    return {
      tab: 'dashboard',
      params: {},
      isNotFound: true
    };
  }

  const params: Record<string, string> = {};
  let subTab: string | undefined = DEFAULT_SUBTAB[tab];

  // Penanganan khusus deep routing per tab
  if (tab === 'projects') {
    // /proyek/:id atau /proyek/:id/finansial
    if (segments[1]) {
      params.projectId = segments[1];
      params.modal = 'financial';
    }
    return { tab, subTab: undefined, params };
  }

  if (tab === 'investors') {
    // /investor/:id
    if (segments[1]) {
      params.investorId = segments[1];
      params.modal = 'ledger';
    }
    return { tab, subTab: undefined, params };
  }

  if (tab === 'ritase') {
    // /riwayat-ritase/:id
    if (segments[1]) {
      params.ticketId = segments[1];
      params.modal = 'detail';
    }
    return { tab, subTab: undefined, params };
  }

  if (tab === 'cash_ledger') {
    // /buku-kas/arus-kas, /buku-kas/piutang, /buku-kas/piutang/:clientId
    if (segments[1]) {
      const mappedSub = SLUG_TO_SUBTAB.cash_ledger[segments[1].toLowerCase()];
      if (mappedSub) {
        subTab = mappedSub;
        if (segments[2]) {
          params.clientId = segments[2];
        }
      } else {
        // Jika segment kedua bukan subtab tapi langsung ID
        params.id = segments[1];
      }
    }
    return { tab, subTab, params };
  }

  // Untuk tab dengan sub-tab terdaftar
  if (segments[1]) {
    const tabSubMap = SLUG_TO_SUBTAB[tab];
    if (tabSubMap) {
      const mappedSub = tabSubMap[segments[1].toLowerCase()];
      if (mappedSub) {
        subTab = mappedSub;
      } else {
        // Parameter tambahan jika ada
        params.subId = segments[1];
      }
    } else {
      params.id = segments[1];
    }
  }

  return { tab, subTab, params };
}

/**
 * Menghasilkan URL path string dari tab, subTab, dan params
 */
export function buildPath(tab: NavigationTab, subTab?: string, params?: Record<string, string>): string {
  const primarySlug = TAB_TO_SLUG[tab] || 'dashboard';

  if (tab === 'projects') {
    if (params?.projectId) {
      return `/proyek/${encodeURIComponent(params.projectId)}/finansial`;
    }
    return '/proyek';
  }

  if (tab === 'investors') {
    if (params?.investorId) {
      return `/investor/${encodeURIComponent(params.investorId)}`;
    }
    return '/investor';
  }

  if (tab === 'ritase') {
    if (params?.ticketId) {
      return `/riwayat-ritase/${encodeURIComponent(params.ticketId)}`;
    }
    return '/riwayat-ritase';
  }

  if (tab === 'cash_ledger') {
    const subSlug = subTab && SUBTAB_TO_SLUG.cash_ledger[subTab] ? SUBTAB_TO_SLUG.cash_ledger[subTab] : 'arus-kas';
    if (subTab === 'receivables' && params?.clientId) {
      return `/buku-kas/${subSlug}/${encodeURIComponent(params.clientId)}`;
    }
    return `/buku-kas/${subSlug}`;
  }

  const subSlugMap: Record<string, string> | undefined = SUBTAB_TO_SLUG[tab];
  if (subTab && subSlugMap && subSlugMap[subTab]) {
    const subSlug = subSlugMap[subTab];
    return `/${primarySlug}/${subSlug}`;
  }

  return `/${primarySlug}`;
}
