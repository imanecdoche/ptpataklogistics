# Comprehensive Analysis: RBAC Privacy Isolation & Design Compliance

**Date**: 2026-10-30  
**Investigator**: Explorer Survey 3  
**Working Directory**: `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_3`  
**Reference Directives**: `ORIGINAL_REQUEST.md`, `RULES.md` (Rules 10b, 49, 80, 85, 95, 98, 99, 100, 101, 102, 103, 104)

---

## Executive Summary

This investigation analyzed the Role-Based Access Control (RBAC) privacy isolation, management oversight, data leak vulnerabilities, and workspace design compliance across the Patak Logistics System codebase.

Key findings:
1. **Compilation & Stability**: `npx tsc -b` and `npm run build` execute with **0 compilation errors**. `lucide-react` is strictly absent from `package.json` and all source files.
2. **Critical RBAC Data Leak Points**:
   - **`DatabasePage.tsx` (`ritase` subtab)**: Accessible to dispatchers via sidebar; has **zero role masking**. Renders Total Belanja Kuari, Estimasi Laba Bersih, buy prices, omset, and exact transaction net profits (`netProfit`).
   - **`ProjectsPage.tsx`**: Accessible to dispatchers; exposes `Total Modal Disetor`, `Total Saldo Kas Berjalan`, `Investor Pendana`, and individual project initial capital and cash balances without any dispatcher restriction.
   - **`MasterMaterialPage.tsx`**: Accessible to dispatchers; exposes all quarry buy prices (`buyPriceCash`) and commodity reference prices.
   - **`DispatchForm.tsx`**: Renders `Beli Kuari (Cash)` as an editable input field without checking `!isDispatcherUser`, and reveals `Investor` profile name under Section 2.
   - **Default Landing Tab in `App.tsx`**: Dispatcher login defaults to `'dashboard'` tab (which exposes Posisi Kas Riil, Modal Disetor, and Piutang Tempo) before user navigation.
3. **Missing Modules (PRD R2 & Papah's Audio Mandate)**:
   - Dedicated Field Operator Transaction Journal with flexible 2-week and 2-month period filters does not exist yet.
   - `CashLedgerPage.tsx` and `RecapPage.tsx` are missing; currently stubbed as placeholder `<div>` elements in `App.tsx`.
4. **Design & Formatting Compliance**:
   - **Rules 101, 102, 103, 99, 10b, 49**: Highly compliant with standardized `<PhoneInput />`, canonical `formatPhoneNumber()`, PUEBI Title Case formatters (`formatEntityNameLive`, `formatPersonNameLive`), `<CurrencyInput />`, and sans-serif `<MetricCardCurrency />`.
   - **Rule 98**: Most main pages have `/icons/search.png`, but `ClientCombobox.tsx`, `ProjectCombobox.tsx`, and `QuarryCombobox.tsx` lack the search icon.
   - **Rule 5 & 6 (Anti-Glassmorphism)**: Identified residual `backdrop-blur-*` classes in `AppShell.tsx`, `EditDispatchModal.tsx`, and `FundTransferSection.tsx`, and native `<select>` usage in `EditDispatchModal.tsx`.

---

## 1. Role-Based Access Control (RBAC) Architecture

### 1.1 Role Definitions & Types
Roles are defined in `src/types/database.ts` (lines 156–157):
```typescript
// src/types/database.ts:156-157
export type UserRole = 'developer' | 'founder' | 'admin' | 'dispatcher' | 'investor' | 'viewer';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';
```

In `src/lib/userManagementService.ts` (lines 20–31, 47–97):
- `DEVELOPER_EMAIL = 'fatih@patak.dev'` (`role: 'developer'`)
- `FOUNDER_EMAIL = 'founder@patak.id'` (`role: 'founder'`)
- Initial administrative user: `administrator@patak.id` (`role: 'admin'`)
- `isDeveloperEmail(email)` returns `true` for both `fatih@patak.dev` and `founder@patak.id`.

### 1.2 Role Context & State Propagation
Role detection and classification is centralized in `src/context/ProjectFilterContext.tsx` (lines 46–86, 103–105):
```typescript
// src/context/ProjectFilterContext.tsx:103-105
const isInvestorUser = userRole === 'investor';
const isDispatcherUser = userRole === 'dispatcher';
const isManagementUser = userRole === 'developer' || userRole === 'founder' || userRole === 'admin';
```
The context determines `userRole` by checking:
1. Explicit matches for `fatih@patak.dev` -> `'developer'` and `founder@patak.id` -> `'founder'`.
2. Firestore collection `system_users` query by `email == currentUserEmail`.

### 1.3 Navigation & Sidebar Gating
Navigation menu items are specified in `src/components/layout/Sidebar.tsx` (lines 32–88, 298–311):
- Total tabs (11 items): `dashboard`, `dispatcher`, `projects`, `investors`, `quarries`, `clients`, `materials`, `cash_ledger`, `recap`, `database`, `dev`.
- **RBAC Policy in Sidebar** (lines 300–310):
  ```typescript
  // Khusus menu 'dev': 100% tersembunyi jika akun bukan developer / founder
  if (item.id === 'dev' && !isDeveloperEmail(user?.email)) {
    return null;
  }

  // RBAC Sidepanel Policy per Rule 95
  if (isInvestorUser && !['dashboard', 'projects', 'investors'].includes(item.id)) {
    return null;
  }
  if (isDispatcherUser && !['dispatcher', 'projects', 'quarries', 'clients', 'materials', 'database'].includes(item.id)) {
    return null;
  }
  ```

---

## 2. Field Operator / Dispatcher Restrictions & Data Leak Points

The table below catalogs all identified data leak points where sensitive company financial data, profit margins, investor profiles, or cash balances are visible to `dispatcher` accounts:

| ID | File Path & Line Numbers | Vulnerability Description | Severity | Impacted Rule / Requirement |
|---|---|---|---|---|
| **LK-01** | `src/components/database/DatabasePage.tsx`: lines 236–243, 627–649, 670–675, 726–731 | **Zero RBAC in Database Tab**: When `activeSubTab === 'ritase'`, the page calculates and renders `Total Belanja Kuari` and `Estimasi Laba Bersih` metric cards, and table columns `Belanja Kuari`, `Beban Ops`, and `Laba Bersih` (`tx.netProfit`) with no `isDispatcherUser` check. | **CRITICAL** | Rule 85, Rule 104, R3 |
| **LK-02** | `src/components/projects/ProjectsPage.tsx`: lines 97–105, 200–228, 313–326, 351–366 | **Investor Capital & Project Cash Leak**: `ProjectsPage` is accessible to dispatchers. It renders `Total Modal Disetor`, `Total Saldo Kas Berjalan`, and columns `Investor Pendana`, `Modal Awal Disetor`, and `Saldo Kas Berjalan` for all projects. | **CRITICAL** | Rule 85, Rule 104, R3 |
| **LK-03** | `src/components/dispatcher/DispatchForm.tsx`: lines 719–734 | **Exposed Buy Price Input**: `Beli Kuari / {unit} (Cash)` is displayed and editable by dispatchers on the dispatch form. | **HIGH** | Rule 85, Rule 104, R3 |
| **LK-04** | `src/components/dispatcher/DispatchForm.tsx`: lines 618–634 | **Investor Profile Name Exposed**: Section 2 renders `Investor: {selectedProject?.investorName}`. (Rule 96 allowed this as operational reference, but R3 demands zero visibility into investor profiles). | **MEDIUM** | Rule 104, R3 |
| **LK-05** | `src/App.tsx`: line 27 | **Default Tab Leak Upon Login**: `currentTab` defaults to `'dashboard'`. Dispatchers logging in see `DashboardPage` (Card 3: Posisi Kas Riil / Modal Disetor) prior to navigating. | **HIGH** | Rule 85, Rule 104, R3 |
| **LK-06** | `src/components/materials/MasterMaterialPage.tsx`: lines 243–245, 1100–1200 | **Quarry Buy Prices Exposed**: Dispatchers can open `Master Material` and view `buyPriceCash` (Beli Kuari Cash) and `defaultBuyPrice` with no restriction. | **HIGH** | Rule 85, Rule 104, R3 |
| **LK-07** | `src/App.tsx`: lines 33–52 | **Missing Direct Navigation Guard**: `handleSelectTab` only blocks `dev`. If `investors` or `cash_ledger` tab is requested programmatically or via URL, no guard redirects dispatchers. | **MEDIUM** | Rule 95, Rule 104, R3 |
| **LK-08** | Entire Codebase | **Missing Field Operator Journal (PRD R2)**: No operational journal view filtering by 2-week and 2-month operational cycles exists for dispatchers. | **HIGH** | R2, Rule 104 |

### Detailed Analysis of Leak Point 1 (`DatabasePage.tsx`)
In `src/components/database/DatabasePage.tsx`:
```typescript
// lines 236-243
const ritaseMetrics = useMemo(() => {
  const totalRitase = filteredTransactions.length;
  const totalOmset = filteredTransactions.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalBelanjaKuari = filteredTransactions.reduce((acc, curr) => acc + (curr.totalBuyCost || 0), 0);
  const totalLabaBersih = filteredTransactions.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
  return { totalRitase, totalOmset, totalBelanjaKuari, totalLabaBersih };
}, [filteredTransactions]);
```
In the table header and body (lines 670–675, 726–731):
```typescript
<th className="py-2.5 px-3.5 w-[125px] whitespace-nowrap">Belanja Kuari</th>
<th className="py-2.5 px-3.5 w-[110px] whitespace-nowrap">Beban Ops</th>
<th className="py-2.5 px-3.5 w-[125px] whitespace-nowrap">Laba Bersih</th>
```
Because dispatchers have access to `database` in `Sidebar.tsx`, and `DatabasePage.tsx` does not check user role, all internal profit margins, purchase prices, and company net margins are exposed.

### Detailed Analysis of Leak Point 2 (`ProjectsPage.tsx`)
In `src/components/projects/ProjectsPage.tsx`:
```typescript
// lines 211-227
<div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
  <span className="text-[11px] text-[#888888] font-medium block">Total Modal Disetor</span>
  <div className="mt-1">
    <MetricCardCurrency amount={totalDeposit} size="lg" />
  </div>
</div>
<div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
  <span className="text-[11px] text-[#888888] font-medium block">Total Saldo Kas Berjalan</span>
  <div className="mt-1">
    <MetricCardCurrency amount={totalCurrentBalance} size="lg" ... />
  </div>
</div>
```
And table columns (lines 318–321):
- `Investor Pendana` (`proj.investorName`)
- `Modal Awal Disetor` (`proj.initialDeposit`)
- `Saldo Kas Berjalan` (`proj.currentBalance`)
Dispatchers can view investor capital and project balances without restriction.

---

## 3. Management Roles Oversight Verification

Management roles (`founder`, `developer`, `admin`) require full unrestricted oversight over company financials:

### 3.1 Verification Checklist for Management Roles
- [x] **Full 10-Tab Navigation**: `Sidebar.tsx` permits `admin`, `founder`, and `developer` to view all 10 operational and financial modules.
- [x] **Dev Console Root Access**: `Sidebar.tsx:300` and `App.tsx:35` restrict `dev` tab to `isDeveloperEmail()` (`fatih@patak.dev` and `founder@patak.id`), fulfilling Rule 80.
- [x] **Internal Cross-Subsidy & Cash Loans (`FundTransferSection`)**: Rendered in `DashboardPage.tsx:277` strictly for `isManagementUser`. Protected by PIN `2008005`.
- [x] **Live Calculation & Cash Deficit Controls**: In `DispatchForm.tsx:790–844`, management users see:
  - Saldo Kas Proyek Berjalan
  - Belanja Tunai Kuari
  - Beban Operasional
  - Piutang Penjualan (Tempo)
  - Estimasi Sisa Saldo Kas (with red deficit warning)
  - Estimasi Laba Bersih
- [x] **Dispatch Margins Oversight**: In `DispatchTable.tsx` and `DispatchDetailModal.tsx`, management users see `Penjualan & Laba`, `Total Laba Bersih`, `Beli Kuari (Cash)`, and `Estimasi Laba Bersih`.
- [x] **Client Deletion Safeguard**: In `ClientsPage.tsx:31`, deleting client records is restricted to `founder` and `developer` via `isDeveloperEmail(userEmail)`, satisfying Rule 100.

---

## 4. Design & Formatting Compliance Audit

### 4.1 Rule 10b & 49: Strictly NO `lucide-react`, Icons8 Standard
- **Audit Result: 100% COMPLIANT**
- Ripgrep confirmed 0 references to `lucide-react` in `package.json` and `src/`.
- All icons use `/icons/*.png` and custom SVG glyphs in `src/components/icons/Icons8.tsx`.

### 4.2 Rule 101: Phone Numbers Standardized (`+62 8xx-xxxx-xxxx` & `<PhoneInput />`)
- **Audit Result: COMPLIANT**
- Canonical formatting implemented in `src/lib/phoneUtils.ts` (`formatPhoneNumber`, `formatPhoneBodyLive`).
- `<PhoneInput />` in `src/components/ui/PhoneInput.tsx` is used across all modal and page forms:
  - `EditClientModal.tsx` (line 87)
  - `DatabasePage.tsx` (Driver Add & Edit, lines 1121, 1279)
  - `InvestorsPage.tsx` (Investor Add & Edit, lines 390, 476)
  - `QuarriesPage.tsx` (Quarry Add & Edit, lines 342, 419)
  - `NewClientModal.tsx` (line 149)
- All Firestore write operations sanitize via `formatPhoneNumber()` in `clientService.ts`, `databaseMasterService.ts`, and `investorService.ts`.

### 4.3 Rule 102: Entity & Person Name Auto-Formatting (PUEBI Title Case, Legal Forms)
- **Audit Result: COMPLIANT**
- Implemented in `src/lib/nameUtils.ts`:
  - `formatEntityNameLive` / `formatEntityName`: Auto-formats to Title Case; preserves and capitalizes `PT`, `CV`, `UD`, `KM`, and `Tbk`; preserves typing cursor trailing spaces.
  - `formatPersonNameLive` / `formatPersonName`: Auto-formats personal names and honorifics.
- Active in all form inputs and database writes across `clients`, `database`, `dev`, `dispatcher`, `investors`, `materials`, `projects`, and `quarries`.

### 4.4 Rule 103 & Rule 99: Currency Inputs & Metric Card Typography
- **Audit Result: COMPLIANT**
- `<CurrencyInput />` (`src/components/ui/CurrencyInput.tsx`):
  - Fixed `Rp` prefix, automatic 3-digit dot separation (`id-ID`), allows empty backspacing without locking to 0, normalizes to 0 on blur.
  - Used in all currency fields (Ritase forms, Project modals, Investor modals, Material rate modals, Route tariff modals, Cash transfer modals).
- `<MetricCardCurrency />` (`src/components/ui/MetricCardCurrency.tsx`):
  - Uses `font-bold tracking-tight` (sans-serif), strictly **no `font-mono`**.
  - Displays smaller semi-transparent `Rp` prefix (`opacity-50`).
  - Prepends negative minus sign directly before `Rp` (`-Rp500.000`) with `#cf1124` text styling.

### 4.5 Rule 98: Universal Searchbar Magnifying Glass Icon (`/icons/search.png`)
- **Audit Result: PARTIAL (Action Required)**
- **Compliant Locations**: `ClientsPage.tsx`, `DatabasePage.tsx`, `DevPage.tsx`, `DispatchTable.tsx`, `InvestorsPage.tsx`, `MasterMaterialPage.tsx`, `ProjectsPage.tsx`, `QuarriesPage.tsx`, `CustomSelectCombobox.tsx`, `MaterialPickerModal.tsx`.
- **Non-Compliant Locations (Missing Icon)**:
  1. `src/components/ui/ClientCombobox.tsx` (line 117): search input has no `/icons/search.png`.
  2. `src/components/ui/ProjectCombobox.tsx` (line 99): search input has no `/icons/search.png`.
  3. `src/components/ui/QuarryCombobox.tsx` (line 89): search input has no `/icons/search.png`.

### 4.6 Additional UI Violations Detected
1. **Rule 5 & 6 (Anti-Glassmorphism / Solid Backdrop Requirement)**:
   - `src/components/layout/AppShell.tsx`: line 137 uses `backdrop-blur-md`.
   - `src/components/dispatcher/EditDispatchModal.tsx`: line 182 uses `backdrop-blur-sm`.
   - `src/components/dashboard/FundTransferSection.tsx`: line 241 uses `backdrop-blur-sm`.
2. **Rule 87 (Mandatory Custom UI Pickers, No Native Select)**:
   - `src/components/dispatcher/EditDispatchModal.tsx`: lines 257, 275, 315, 334, 368 use native browser `<select>` elements instead of `CustomSelectCombobox`.
3. **Rule 88 (Minimalist Tab Header Only Title Without Description)**:
   - `src/components/investors/InvestorsPage.tsx`: line 223 contains subtitle text below header.

---

## 5. Master Data Seeding & Project Deactivation Audit (R1 & Rule 104)

1. **Current Seeding in `src/lib/projectService.ts` (lines 149–192)**:
   - Contains outdated placeholder data:
     * `prj-situ-cikedal` (Investor A - Rp 50.000.000)
     * `prj-menes` (Investor B - Rp 50.000.000, `status: 'ACTIVE'`)
     * `prj-cipeucang` (Investor C - Rp 50.000.000)
   - Discrepancy with R1: Production master data requires:
     * Single active investor: "Bpk. Yadi" with Rp 30.000.000 initial capital.
     * Two active operational projects: "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang" funded by Bpk. Yadi.
     * "Proyek Menes" marked `status: 'COMPLETED'` and hidden from dispatch dropdowns.
2. **Project Dropdown Filter Audit**:
   - `src/components/ui/ProjectCombobox.tsx`: `filteredProjects` (lines 58–66) filters only by search text, not by `status === 'ACTIVE'`.
   - Result: Inactive / completed projects ("Proyek Menes") currently appear in dispatch dropdowns.
3. **Bpk. Pei Company Liability Separation (Rp 18.000.000)**:
   - Currently, Bpk. Pei is not seeded or referenced in `cash_ledger` or `investors`.
   - Per Rule 104, Bpk. Pei must be strictly recorded under `cash_ledger` as a corporate debt / liability, completely excluded from `investors` table and profit-sharing calculations.

---

## 6. Build & Compilation Verification

| Check Command | Result | Details |
|---|---|---|
| `npx tsc -b` | **PASS (0 errors)** | Clean exit code 0, 0 type errors. |
| `npm run build` | **PASS (0 errors)** | Vite v6.4.5 built production bundle in 13.23s. |
| `lucide-react` presence check | **PASS** | 0 occurrences in dependencies and source code. |

---

## 7. Recommended Concrete Action Plan for Implementers

1. **Fix Field Operator Data Leaks in `DatabasePage.tsx`**:
   - Import `useProjectFilter()` in `DatabasePage.tsx`.
   - Wrap `Total Belanja Kuari` and `Estimasi Laba Bersih` metric cards with `{!isDispatcherUser && ...}`.
   - Mask table columns `Belanja Kuari`, `Beban Ops`, and `Laba Bersih` when `isDispatcherUser` is true, displaying only operational details (`No. Tiket`, `Tanggal`, `No. Plat`, `Supir`, `Klien / Proyek`, `Kuari Asal`, `Material`, `Vol`, `Catatan Ritase`, `Status`).
2. **Fix Project Data Leaks in `ProjectsPage.tsx`**:
   - Check `isDispatcherUser`.
   - Hide or mask `Total Modal Disetor` and `Total Saldo Kas Berjalan` metric cards for dispatchers.
   - Hide columns `Investor Pendana`, `Modal Awal Disetor`, and `Saldo Kas Berjalan` in the project table when viewed by dispatchers.
3. **Fix Dispatcher Form Buy Price Exposure in `DispatchForm.tsx`**:
   - Wrap `Beli Kuari / {unit} (Cash)` with `{!isDispatcherUser && ...}`.
   - Ensure the dispatch creation payload uses the recommended rate from `QuarryMaterialRate` automatically when dispatcher submits.
4. **Implement Field Operator Transaction Journal & Periodic Recap (R2)**:
   - Create a dedicated operational recap component or journal view accessible to dispatchers.
   - Provide 2-week and 2-month cycle filters as mandated in Papah's audio guidance.
5. **Enforce Project Deactivation in `ProjectCombobox.tsx`**:
   - In `ProjectCombobox.tsx`, filter options to show only projects where `item.status === 'ACTIVE'` when used in dispatch input forms.
6. **Correct Initial Seeding in `projectService.ts` & Seed Bpk. Pei Debt**:
   - Update `seedDefaultProjects()` to seed single active investor "Bpk. Yadi" (Rp 30.000.000) funding "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang".
   - Seed Bpk. Pei's Rp 18.000.000 as a corporate debt entry in `cash_ledger`.
7. **Fix Searchbar Icon Rule 98**:
   - Add `/icons/search.png` to `ClientCombobox.tsx`, `ProjectCombobox.tsx`, and `QuarryCombobox.tsx`.
8. **Fix Residual Glassmorphism Blur & Native Selects**:
   - Remove `backdrop-blur-*` in `AppShell.tsx`, `EditDispatchModal.tsx`, and `FundTransferSection.tsx`.
   - Replace native `<select>` in `EditDispatchModal.tsx` with Custom UI.
