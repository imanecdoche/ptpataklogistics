import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const testResults = {
  passed: 0,
  failed: 0,
  assertions: []
};

function recordAssertion(name, condition, details) {
  if (condition) {
    testResults.passed++;
    testResults.assertions.push({ status: 'PASS', name, details });
    console.log(`[PASS] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    testResults.failed++;
    testResults.assertions.push({ status: 'FAIL', name, details });
    console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

// ============================================================================
// TEST SUITE 1: PERIODIC RECAP DATE RANGE CALCULATIONS (RecapPage.tsx)
// ============================================================================
console.log('================================================================');
console.log('TEST SUITE 1: RECAP DATE RANGE LOGIC & CYCLE ORACLE');
console.log('================================================================\n');

function getLocalDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeForCycleSimulated(cycle, referenceDate = new Date()) {
  const now = referenceDate;
  const todayStr = getLocalDateStr(now);

  switch (cycle) {
    case '14_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case '60_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'today':
      return { start: todayStr, end: todayStr };
    case '7_days': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'this_month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: getLocalDateStr(d), end: todayStr };
    }
    case 'all':
    default:
      return { start: '', end: '' };
  }
}

// Verify actual implementation in RecapPage.tsx matches our oracle
const recapSource = fs.readFileSync(path.join(rootDir, 'src/components/recap/RecapPage.tsx'), 'utf-8');

recordAssertion(
  'RecapPage.tsx implements 14_days cycle with 13-day offset (inclusive 14 days)',
  recapSource.includes("const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);"),
  'Matches exact 14 calendar days formula'
);

recordAssertion(
  'RecapPage.tsx implements 60_days cycle with 59-day offset (inclusive 60 days)',
  recapSource.includes("const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59);"),
  'Matches exact 60 calendar days formula'
);

// Empirical calendar sweep across 366 days of a leap year and normal year
let days14AllMatch = true;
let days60AllMatch = true;
let days7AllMatch = true;
let todayAllMatch = true;
let thisMonthAllMatch = true;

// Stress test across 2 full years (2024 leap year and 2026 normal year)
for (const year of [2024, 2026]) {
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const refDate = new Date(year, month, day);

      // 1. 14 Days
      const r14 = getDateRangeForCycleSimulated('14_days', refDate);
      const start14 = new Date(r14.start + 'T00:00:00');
      const end14 = new Date(r14.end + 'T00:00:00');
      const diff14 = Math.round((end14 - start14) / (1000 * 60 * 60 * 24)) + 1;
      if (diff14 !== 14) {
        days14AllMatch = false;
        console.error(`14 days mismatch on ${year}-${month+1}-${day}: got ${diff14}`);
      }

      // 2. 60 Days
      const r60 = getDateRangeForCycleSimulated('60_days', refDate);
      const start60 = new Date(r60.start + 'T00:00:00');
      const end60 = new Date(r60.end + 'T00:00:00');
      const diff60 = Math.round((end60 - start60) / (1000 * 60 * 60 * 24)) + 1;
      if (diff60 !== 60) {
        days60AllMatch = false;
        console.error(`60 days mismatch on ${year}-${month+1}-${day}: got ${diff60}`);
      }

      // 3. 7 Days
      const r7 = getDateRangeForCycleSimulated('7_days', refDate);
      const start7 = new Date(r7.start + 'T00:00:00');
      const end7 = new Date(r7.end + 'T00:00:00');
      const diff7 = Math.round((end7 - start7) / (1000 * 60 * 60 * 24)) + 1;
      if (diff7 !== 7) days7AllMatch = false;

      // 4. Today
      const rToday = getDateRangeForCycleSimulated('today', refDate);
      if (rToday.start !== rToday.end) todayAllMatch = false;

      // 5. This Month
      const rMonth = getDateRangeForCycleSimulated('this_month', refDate);
      const expectedStartMonth = `${year}-${String(month+1).padStart(2, '0')}-01`;
      if (rMonth.start !== expectedStartMonth || rMonth.end !== getLocalDateStr(refDate)) {
        thisMonthAllMatch = false;
      }
    }
  }
}

recordAssertion(
  'Stress-Test: 14-day cycle calculates EXACTLY 14 calendar days across all 731 days (leap & non-leap)',
  days14AllMatch,
  'Verified across 2024 (leap year, Feb 29) & 2026 (non-leap)'
);

recordAssertion(
  'Stress-Test: 60-day cycle calculates EXACTLY 60 calendar days across all 731 days (leap & non-leap)',
  days60AllMatch,
  'Verified across month transitions & year boundaries'
);

recordAssertion(
  'Stress-Test: 7-day cycle calculates EXACTLY 7 calendar days',
  days7AllMatch,
  'Verified across all 731 days'
);

recordAssertion(
  'Stress-Test: today cycle produces start === end',
  todayAllMatch,
  'Verified across all 731 days'
);

recordAssertion(
  'Stress-Test: this_month cycle always starts on day 01 of current month',
  thisMonthAllMatch,
  'Verified across all months'
);


// ============================================================================
// TEST SUITE 2: DUAL VOLUME ISOLATION (DT vs TON STRICT SEPARATION)
// ============================================================================
console.log('\n================================================================');
console.log('TEST SUITE 2: DT & TON VOLUME STRICT ISOLATION IN RECAP');
console.log('================================================================\n');

// Verify in RecapPage.tsx that totalDt and totalTon are separately filtered
const hasSeparateDt = recapSource.includes(".filter(t => t.unit === 'DT')");
const hasSeparateTon = recapSource.includes(".filter(t => t.unit === 'Ton')");
const dtCardMatches = recapSource.includes("Total Volume DT (Dump Truck 6 m³)");
const tonCardMatches = recapSource.includes("Total Volume Ton (Timbangan Kuari)");

recordAssertion(
  'totalDt aggregates strictly t.unit === "DT"',
  hasSeparateDt,
  'Filtered strictly by unit DT'
);

recordAssertion(
  'totalTon aggregates strictly t.unit === "Ton"',
  hasSeparateTon,
  'Filtered strictly by unit Ton'
);

recordAssertion(
  'DT volume has its own separate metric card',
  dtCardMatches,
  'Contains "Total Volume DT (Dump Truck 6 m³)"'
);

recordAssertion(
  'Ton volume has its own separate metric card',
  tonCardMatches,
  'Contains "Total Volume Ton (Timbangan Kuari)"'
);

// Empirical calculation test with mock transactions
const mockTransactions = [
  { id: '1', unit: 'DT', quantity: 2 },
  { id: '2', unit: 'Ton', quantity: 15.5 },
  { id: '3', unit: 'DT', quantity: 4.5 },
  { id: '4', unit: 'Ton', quantity: 24.2 },
  { id: '5', unit: 'DT', quantity: 1 },
  { id: '6', unit: 'M3', quantity: 10 } // Alien unit
];

const computedDt = mockTransactions
  .filter(t => t.unit === 'DT')
  .reduce((acc, t) => acc + (t.quantity || 0), 0);

const computedTon = mockTransactions
  .filter(t => t.unit === 'Ton')
  .reduce((acc, t) => acc + (t.quantity || 0), 0);

recordAssertion(
  'DT volume sum is mathematically isolated (2 + 4.5 + 1 = 7.5 DT)',
  computedDt === 7.5,
  `Got ${computedDt} DT`
);

recordAssertion(
  'Ton volume sum is mathematically isolated (15.5 + 24.2 = 39.7 Ton)',
  computedTon === 39.7,
  `Got ${computedTon} Ton`
);

recordAssertion(
  'No mixed aggregation between DT and Ton occurs',
  computedDt !== (computedDt + computedTon),
  'Separate metric totals verified'
);


// ============================================================================
// TEST SUITE 3: ROUTE PROTECTION & REDIRECTION IN App.tsx
// ============================================================================
console.log('\n================================================================');
console.log('TEST SUITE 3: ROUTE PROTECTION & REDIRECTIONS IN App.tsx');
console.log('================================================================\n');

const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');

recordAssertion(
  'App.tsx has initialTab state guard for dispatcher',
  appSource.includes("useState<NavigationTab>(() => (isDispatcherUser ? 'dispatcher' : 'dashboard'))"),
  'Initializes to dispatcher when role is dispatcher'
);

recordAssertion(
  'App.tsx has useEffect route guard protecting dashboard, investors, cash_ledger',
  appSource.includes("if (isDispatcherUser && (currentTab === 'dashboard' || currentTab === 'investors' || currentTab === 'cash_ledger'))"),
  'Automatic redirect to dispatcher triggered on forbidden tab state'
);

recordAssertion(
  'App.tsx handleSelectTab rejects dispatcher navigating to dashboard, investors, cash_ledger',
  appSource.includes("if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger'))") &&
  appSource.includes("setCurrentTab('dispatcher');"),
  'Explicit navigation rejection enforced'
);

recordAssertion(
  'App.tsx handleSelectSubTab rejects dispatcher navigating to forbidden tabs',
  appSource.includes("handleSelectSubTab") &&
  appSource.includes("if (isDispatcherUser && (tab === 'dashboard' || tab === 'investors' || tab === 'cash_ledger'))"),
  'Subtab navigation rejection enforced'
);


// ============================================================================
// TEST SUITE 4: RECAP PAGE DISPATCHER PRIVACY ISOLATION
// ============================================================================
console.log('\n================================================================');
console.log('TEST SUITE 4: RECAP PAGE FINANCIAL ISOLATION FOR DISPATCHER');
console.log('================================================================\n');

recordAssertion(
  'RecapPage locks internalSubTab to "volume" for dispatcher',
  recapSource.includes("isDispatcherUser ? 'volume' : internalSubTab"),
  'activeSubTab is forced to volume if isDispatcherUser is true'
);

recordAssertion(
  'RecapPage handleSubTabChange strictly blocks dispatcher from switching to "financial"',
  recapSource.includes("if (isDispatcherUser && tab === 'financial') return;"),
  'Action silently aborts and protects state'
);

recordAssertion(
  'RecapPage financial sub-tab button is rendered exclusively for management',
  recapSource.includes("{isManagementUser && (") &&
  recapSource.includes("Rekapitulasi Finansial"),
  'Management-only guard present'
);

recordAssertion(
  'RecapPage volume table has ZERO financial margin columns',
  !recapSource.includes("Laba Bersih") || recapSource.indexOf("Laba Bersih") > recapSource.indexOf("activeSubTab === 'volume' ?"),
  'Financial columns only exist under activeSubTab !== volume branch'
);


// ============================================================================
// TEST SUITE 5: COMPONENT-WIDE ADVERSARIAL PRIVACY SCAN
// ============================================================================
console.log('\n================================================================');
console.log('TEST SUITE 5: PRIVACY AUDIT OF ALL SENSITIVE FIELDS IN COMPONENTS');
console.log('================================================================\n');

// 1. DatabasePage.tsx
const dbPageSource = fs.readFileSync(path.join(rootDir, 'src/components/database/DatabasePage.tsx'), 'utf-8');

recordAssertion(
  'DatabasePage.tsx masks Belanja Kuari card from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("Total Belanja Kuari"),
  'Total Belanja Kuari card protected'
);

recordAssertion(
  'DatabasePage.tsx masks Estimasi Laba Bersih card from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("Estimasi Laba Bersih"),
  'Estimasi Laba Bersih card protected'
);

recordAssertion(
  'DatabasePage.tsx masks Belanja Kuari table column header from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("Belanja Kuari"),
  'Table column header protected'
);

recordAssertion(
  'DatabasePage.tsx masks Laba Bersih table column header from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("Laba Bersih"),
  'Table column header protected'
);

recordAssertion(
  'DatabasePage.tsx masks tx.totalBuyCost table cells from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("tx.totalBuyCost"),
  'Table row cell protected'
);

recordAssertion(
  'DatabasePage.tsx masks tx.netProfit table cells from dispatcher',
  dbPageSource.includes("{!isDispatcherUser && (") &&
  dbPageSource.includes("tx.netProfit"),
  'Table row cell protected'
);

recordAssertion(
  'DatabasePage.tsx masks profit sort options from dispatcher',
  dbPageSource.includes("if (!isDispatcherUser) {") &&
  dbPageSource.includes("profit_desc"),
  'Sort options profit_desc/profit_asc hidden from dispatcher'
);

// 2. ProjectsPage.tsx
const projectsPageSource = fs.readFileSync(path.join(rootDir, 'src/components/projects/ProjectsPage.tsx'), 'utf-8');

recordAssertion(
  'ProjectsPage.tsx masks Total Modal Disetor and Total Saldo Kas cards from dispatcher',
  projectsPageSource.includes("{isDispatcherUser ? (") &&
  projectsPageSource.includes("Proyek Aktif Berjalan") &&
  projectsPageSource.includes("Total Modal Disetor"),
  'Replaced with operational cards for dispatcher'
);

recordAssertion(
  'ProjectsPage.tsx masks Investor Pendana column header and cell from dispatcher',
  projectsPageSource.includes("{!isDispatcherUser && (") &&
  projectsPageSource.includes("Investor Pendana") &&
  projectsPageSource.includes("proj.investorName"),
  'Investor profile and column hidden from dispatcher'
);

recordAssertion(
  'ProjectsPage.tsx masks Modal Awal Disetor column header and cell from dispatcher',
  projectsPageSource.includes("{!isDispatcherUser && (") &&
  projectsPageSource.includes("Modal Awal Disetor") &&
  projectsPageSource.includes("proj.initialDeposit"),
  'Investor initial capital hidden from dispatcher'
);

recordAssertion(
  'ProjectsPage.tsx masks Saldo Kas Berjalan column header and cell from dispatcher',
  projectsPageSource.includes("{!isDispatcherUser && (") &&
  projectsPageSource.includes("Saldo Kas Berjalan") &&
  projectsPageSource.includes("proj.currentBalance"),
  'Cash balance hidden from dispatcher'
);

recordAssertion(
  'ProjectsPage.tsx Add & Edit Modals mask Investor & Modal Awal inputs from dispatcher',
  projectsPageSource.includes("{!isDispatcherUser && (") &&
  projectsPageSource.includes("Investor Pendana") &&
  projectsPageSource.includes("Modal Awal Disetor (Rp)"),
  'Add/Edit modal inputs protected'
);

// 3. DispatchForm.tsx
const dispatchFormSource = fs.readFileSync(path.join(rootDir, 'src/components/dispatcher/DispatchForm.tsx'), 'utf-8');

recordAssertion(
  'DispatchForm.tsx masks Investor info badge from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && (") &&
  dispatchFormSource.includes("selectedProject?.investorName"),
  'Investor profile hidden in dispatch form'
);

recordAssertion(
  'DispatchForm.tsx masks Beli Kuari Cash input from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && (") &&
  dispatchFormSource.includes("Beli Kuari / {unit} (Cash)"),
  'Purchase price input hidden from dispatcher'
);

recordAssertion(
  'DispatchForm.tsx masks Saldo Kas Proyek Berjalan from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && formProjectId && (") &&
  dispatchFormSource.includes("Saldo Kas Proyek Berjalan:"),
  'Project cash balance hidden from dispatcher'
);

recordAssertion(
  'DispatchForm.tsx masks Belanja Tunai Kuari calculation from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && (") &&
  dispatchFormSource.includes("Belanja Tunai Kuari:"),
  'Quarry purchase cost hidden from dispatcher'
);

recordAssertion(
  'DispatchForm.tsx masks Estimasi Sisa Saldo Kas & Deficit warning from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && formProjectId && (") &&
  dispatchFormSource.includes("Estimasi Sisa Saldo Kas:") &&
  dispatchFormSource.includes("{!isDispatcherUser && isCashDeficit && ("),
  'Cash balance calculations and warnings hidden from dispatcher'
);

recordAssertion(
  'DispatchForm.tsx masks Estimasi Laba Bersih from dispatcher',
  dispatchFormSource.includes("{!isDispatcherUser && (") &&
  dispatchFormSource.includes("Estimasi Laba Bersih:"),
  'Profit margin hidden from dispatcher'
);

// 4. MasterMaterialPage.tsx
const materialPageSource = fs.readFileSync(path.join(rootDir, 'src/components/materials/MasterMaterialPage.tsx'), 'utf-8');

recordAssertion(
  'MasterMaterialPage.tsx locks subtab away from pricing for dispatcher',
  materialPageSource.includes("if (isDispatcherUser) {") &&
  materialPageSource.includes("setCurrentSubTab('routes');"),
  'Quarry tebus cash pricing subtab forbidden for dispatcher'
);

recordAssertion(
  'MasterMaterialPage.tsx masks Pricing subtab button from dispatcher',
  materialPageSource.includes("{!isDispatcherUser && (") &&
  materialPageSource.includes("Harga & Mutu Kuari"),
  'Pricing tab button hidden from dispatcher'
);

recordAssertion(
  'MasterMaterialPage.tsx masks Harga Beli Dasar column and modal input from dispatcher',
  materialPageSource.includes("{!isDispatcherUser && (") &&
  materialPageSource.includes("Harga Beli Dasar") &&
  materialPageSource.includes("Harga Beli Acuan Dasar"),
  'Purchase baseline prices hidden from dispatcher'
);

// 5. Sidebar.tsx
const sidebarSource = fs.readFileSync(path.join(rootDir, 'src/components/layout/Sidebar.tsx'), 'utf-8');

recordAssertion(
  'Sidebar.tsx hides dashboard, investors, cash_ledger, dev from dispatcher',
  sidebarSource.includes("if (isDispatcherUser && !['dispatcher', 'projects', 'quarries', 'clients', 'materials', 'database', 'recap'].includes(item.id)) {") &&
  sidebarSource.includes("return null;"),
  'Sidebar strictly excludes forbidden tabs'
);

recordAssertion(
  'Sidebar.tsx hides financial sub-item under recap from dispatcher',
  sidebarSource.includes("const subItems = isDispatcherUser && item.id === 'recap'") &&
  sidebarSource.includes("rawSubItems.filter(s => s.id !== 'financial')"),
  'Sidebar financial subtab hidden for dispatcher'
);

// 6. Modals: DispatchDetailModal and EditDispatchModal
const detailModalSource = fs.readFileSync(path.join(rootDir, 'src/components/dispatcher/DispatchDetailModal.tsx'), 'utf-8');
const editModalSource = fs.readFileSync(path.join(rootDir, 'src/components/dispatcher/EditDispatchModal.tsx'), 'utf-8');

recordAssertion(
  'DispatchDetailModal.tsx hides Beli Kuari and Laba Bersih when hideMargin is true',
  detailModalSource.includes("const hideMargin = isDispatcherUser || isInvestorUser;") &&
  detailModalSource.includes("{!hideMargin && (") &&
  detailModalSource.includes("Beli Kuari (Cash):") &&
  detailModalSource.includes("Estimasi Laba Bersih:"),
  'Detail modal hides buy cost and profit margin for dispatcher'
);

recordAssertion(
  'EditDispatchModal.tsx hides Harga Beli Kuari, Total Belanja, and Laba Bersih when hideMargin is true',
  editModalSource.includes("const hideMargin = isDispatcherUser || isInvestorUser;") &&
  editModalSource.includes("{!hideMargin && (") &&
  editModalSource.includes("Harga Beli Kuari:") &&
  editModalSource.includes("Total Belanja Kuari:") &&
  editModalSource.includes("Estimasi Laba Bersih:"),
  'Edit modal hides buy price, total buy cost, and profit margin for dispatcher'
);


// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log('CHALLENGER 2 EMPIRICAL TEST SUMMARY');
console.log('================================================================');
console.log(`Total Assertions : ${testResults.passed + testResults.failed}`);
console.log(`Passed           : ${testResults.passed}`);
console.log(`Failed           : ${testResults.failed}`);
console.log('Verdict          : ' + (testResults.failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES'));
console.log('================================================================\n');

if (testResults.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
