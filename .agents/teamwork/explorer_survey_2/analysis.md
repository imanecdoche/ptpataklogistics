# Comprehensive Survey & Architectural Analysis: Field Operator Transaction Journal & Periodic Recap

**Project**: Patak Logistics System  
**Author**: Explorer Survey Agent 2  
**Date**: 2026-10-30  
**Scope**: Read-only Investigation of Dispatcher/Ritase view, Database page, Recap architecture, Data fields, and Operational Cycles (Papah's Mandate)

---

## 1. Executive Summary

This investigation explores the current implementation of transaction handling in the Patak Logistics System, evaluates how field operators and dispatchers access transaction history, audits all operational logistics data fields against Papah's audio guidance and Rule 104, and designs the architecture for a dedicated **Operational Transaction Journal (Jurnal Transaksi Operasional)** with flexible **2-week (14-day / bi-weekly)** and **2-month (60-day / bi-monthly)** periodic recap cycles.

### Core Discoveries
1. **Missing Operational Journal**: Currently, `DispatcherPage.tsx` and `DispatchTable.tsx` only allow viewing transactions for a **single day** (`selectedDate`, defaults to today). Field operators have no view to review multi-day delivery operations or monitor cycles.
2. **Severe RBAC Data Leak in `DatabasePage.tsx`**: While `DatabasePage.tsx` has a historical `ritase` sub-tab, it **does not enforce Role-Based Access Control (RBAC)**. Dispatchers can navigate to the Database page via the sidebar (enabled in `Sidebar.tsx:308`) and view internal company financials, including quarry buy costs (`totalBuyCost`), company net profit margins (`netProfit`), and management financial metric cards, directly violating **Rule 104** and **Requirement R3**.
3. **Missing `suratJalan` Field**: The data model (`DispatchTransaction` in `src/types/database.ts`) contains `ticketNumber` (`PTK-YYYYMMDD-XXXX`) but lacks a dedicated `suratJalan` (physical waybill / quarry delivery slip) field. In Banten bulk hauling, drivers carry physical waybills that require tracking alongside the internal ticket.
4. **Unimplemented Recap Module**: In `src/App.tsx:206-225`, the `recap` tab renders a static placeholder `<div>`. There is no `RecapPage.tsx`, and the sidebar hides `recap` from dispatchers entirely.
5. **Missing Cycle Filtering**: No filters exist in the codebase for **2-week (14-day)** or **2-month (60-day)** cycles. The existing filters in `DatabasePage.tsx` are limited to `today`, `this_month`, `last_30_days`, and `all`.
6. **Missing Project Column in Database Table**: In `DatabasePage.tsx:670-678`, the table headers omit `Proyek Tujuan` entirely, displaying only `Konsumen` and `Kuari Asal`.

---

## 2. Component-by-Component Investigation

### 2.1 Dispatcher Page (`src/components/dispatcher/DispatcherPage.tsx`, 169 lines)
- **Component Tree**:
  - `DispatcherPage`
    - `<DispatchForm />` (lines 70-80) — New ticket input form.
    - `<DispatchTable />` (lines 83-91) — Desktop table rendered below the form.
    - Mobile Docked Bar (lines 94-108) — Drawer handle displaying transaction count.
    - Fullscreen Mobile Drawer (lines 111-165) — Slide-up drawer hosting `<DispatchTable />`.
- **Query & Data Flow**:
  - Lines 58-65:
    ```tsx
    const unsubscribe = subscribeTransactionsByDate(selectedDate, list => {
      setTransactions(list);
      setIsLoadingTx(false);
    });
    ```
  - Query in `src/lib/dispatcherService.ts:275`:
    `query(txCol, where('deliveryDate', '==', dateStr))`
  - **Limitation**: The subscription is strictly limited to an exact string match for a single date (`YYYY-MM-DD`). There is no provision for date ranges, multi-day rollups, or periodic cycle selection.

### 2.2 Dispatch Table (`src/components/dispatcher/DispatchTable.tsx`, 358 lines)
- **Component Tree**:
  - `DispatchTable`
    - Header controls: `<CustomDatePicker />` (single date) + Instant Searchbar with `/icons/search.png` (Rule 98).
    - Daily Metric Cards (lines 133-161):
      - Total Ritase (Trips count)
      - Total Tagihan (Tempo) via `<MetricCardCurrency />`
      - Total Laba Bersih (Conditionally rendered: hidden if `hideMargin = isDispatcherUser || isInvestorUser`).
    - Data Table (lines 179-344):
      - Table layout: `table-fixed min-w-[1295px]`.
      - 10 columns: Waktu & No. Tiket (155px), Armada / Sopir (130px), Proyek Tujuan (130px), Konsumen (140px), Kuari Asal (130px), Material & Muatan (130px), Catatan Ritase (190px), Nilai Tagihan / Penjualan & Laba (140px), Status (90px), Aksi (60px).
    - `<DispatchDetailModal />` (lines 350-354):
      - When `hideMargin` is true, quarry purchase costs (`totalBuyCost`) and net profit (`netProfit`) are hidden, while field operational costs and total billing remain visible.
- **Deficiencies**:
  - Only displays transactions for one single day.
  - Lacks a column for physical waybills (`suratJalan`).
  - Cannot aggregate volume across operational cycles.

### 2.3 Dispatch Form (`src/components/dispatcher/DispatchForm.tsx`, 881 lines)
- **Fields Captured**:
  - `deliveryDate` (`CustomDatePicker`, defaults to today).
  - `truckPlate` (`TruckPlateInput` with Indonesian regional prefix validation).
  - `driverName` (Text input formatted with `formatPersonNameLive`).
  - `projectId` / `projectName` (`ProjectCombobox`).
  - `clientId` / `clientName` (`ClientCombobox`).
  - `quarryId` / `quarryName` (`QuarryCombobox`).
  - `materialId` / `materialName` (`MaterialPickerModal`).
  - `quantity` and `unit` ('DT' | 'Ton').
  - `buyPricePerUnit`, `sellPricePerUnit`, `operationalCost` (`CurrencyInput`).
  - `notes` (`FlexibleTextarea`).
- **RBAC Enforcement**:
  - Lines 788-845: When `isDispatcherUser` is true, the Live Calculation Box hides "Saldo Kas Proyek Berjalan", "Belanja Tunai Kuari", "Estimasi Sisa Saldo Kas", and "Estimasi Laba Bersih". Only "Beban Operasional" and "Piutang Penjualan (Tempo)" are displayed.
- **Deficiencies**:
  - No input field for physical waybill (`suratJalan`).
  - Does not filter out inactive projects (`status !== 'ACTIVE'`). Currently, "Proyek Menes" would appear unless filtered.

### 2.4 Database Page (`src/components/database/DatabasePage.tsx`, 1348 lines)
- **Sub-Tabs**:
  - `ritase` (Riwayat Ritase)
  - `vehicles` (Armada & Plat Nomor)
  - `drivers` (Daftar Supir)
- **Transaction History (`ritase`) Implementation**:
  - Lines 132-135: Subscribes to `subscribeAllTransactions()`, loading all transactions across all time.
  - Filter Bar (lines 536-600):
    - `timeRangeFilter`: Options are `'all'`, `'today'`, `'this_month'`, `'last_30_days'`.
    - `statusFilter`: Options are `'all'`, `'TEMPO'`, `'LUNAS'`.
    - `materialFilter`, `clientFilter`, `sortOption`.
  - Metric Cards (lines 604-649):
    - "Total Ritase Terfilter"
    - "Total Omset (Piutang)"
    - "Total Belanja Kuari"
    - "Estimasi Laba Bersih"
  - Table Columns (lines 670-678):
    - Columns: `No. Tiket`, `Tgl Jalan`, `Plat Nomor`, `Supir`, `Konsumen`, `Kuari Asal`, `Material`, `Muatan`, `Harga Jual`, `Total Omset`, `Belanja Kuari`, `Beban Ops`, `Laba Bersih`, `Status`, `Catatan Ritase`, `Aksi`.
  - **CRITICAL FLAWS**:
    1. **Zero Privacy for Dispatchers**: `DatabasePage.tsx` has NO check for `isDispatcherUser` or `hideMargin`. A field operator can view internal quarry purchase prices and company net profit margins.
    2. **Accessible by Dispatcher**: In `Sidebar.tsx:308`, `database` is explicitly in the whitelist of tabs accessible to `isDispatcherUser`.
    3. **Missing Project Column**: `Proyek Tujuan` (`projectName`) is omitted from the table columns!
    4. **Rule 4 Violation**: Lines 734 and 739 render status dots (`<span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />` and `bg-[#d97706]`), violating Rule 4 (anti-cliché visual rules: no pulsing/status dots).

### 2.5 Recap Page (`src/App.tsx:206-225`, `Sidebar.tsx:74-77`)
- **Current State**:
  - In `App.tsx:206-225`, `currentTab === 'recap'` renders a placeholder `<div>`.
  - In `Sidebar.tsx:112-115`, `recap` defines sub-menus:
    - `volume`: "Volume Muatan"
    - `financial`: "Laba & Finansial"
  - In `Sidebar.tsx:308`, `isDispatcherUser` is blocked from accessing `recap`.
  - **Verdict**: The periodic recap feature has not yet been built.

---

## 3. Operational Logistics Data Fields Audit

Based on Papah's audio guidance, Rule 104, and R2 of the original request, the operational logistics data fields must be captured and presented cleanly:

| Field Name | Variable / Field | Data Type | Current Schema Presence | DispatchTable Presence | DatabasePage Presence | Missing / Required Actions |
|---|---|---|---|---|---|---|
| **Dispatch Ticket** | `ticketNumber` | `string` | Yes (`PTK-YYYYMMDD-XXXX`) | Yes (Column 1) | Yes (Column 1) | Formatted in JetBrains Mono bold. Complies with Rule 31. |
| **Waybill / Surat Jalan** | `suratJalan` | `string` (optional) | **NO (MISSING)** | **NO** | **NO** | **Must Add**: Add `suratJalan?: string` to `DispatchTransaction` interface in `src/types/database.ts`, payload in `dispatcherService.ts`, and inputs in `DispatchForm.tsx` & `EditDispatchModal.tsx`. |
| **License Plate** | `truckPlate` | `string` | Yes | Yes (Column 2) | Yes (Column 3) | Formatted in JetBrains Mono bold with Indonesian regional validation. |
| **Driver Name** | `driverName` | `string` (optional) | Yes | Yes (Column 2) | Yes (Column 4) | Formatted in PUEBI Title Case via `formatPersonNameLive`. |
| **Commodity Type** | `materialName` | `string` | Yes | Yes (Column 6) | Yes (Column 7) | Denormalized snapshot from `materials`. |
| **Quarry Origin** | `quarryName` | `string` (optional) | Yes | Yes (Column 5) | Yes (Column 6) | Denormalized snapshot from `master_quarries`. |
| **Destination Project** | `projectName` | `string` (optional) | Yes | Yes (Column 3) | **NO (OMITTED)** | Present in `DispatchTable`, but **missing from `DatabasePage` columns**. Must be added. |
| **Volume & Unit** | `quantity`, `unit` | `number`, `'DT' \| 'Ton'` | Yes | Yes (Column 6) | Yes (Column 8) | 'DT' (Dump Truck ~6 m³) and 'Ton' (Tonnage). Must aggregate DT and Ton separately in recaps. |

---

## 4. Requirements for Periodic Recap (Papah's Mandate: 2-Week & 2-Month Cycles)

### 4.1 Industry Context in Banten Civil Contracting
In bulk material hauling for civil infrastructure (such as "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang" in Pandeglang):
1. **2-Week (14-Day / Bi-Weekly) Cycle**:
   - Subcontractors and haulers submit "Berita Acara Pengiriman" (BAP) or delivery billing claims every 2 weeks (Fortnight 1: 1st–14th; Fortnight 2: 15th–end of month; or rolling 14 days).
   - Field supervisors audit physical waybills (`suratJalan`) against quarry tickets bi-weekly to approve driver compensation and reconcile accounts.
2. **2-Month (60-Day / Bi-Monthly) Cycle**:
   - Government and main contractor progress milestones (Termin Proyek / SPK) operate on 60-day cycles.
   - Cumulative stone and sand volume must be tracked against the overall project material allocation every 2 months.

### 4.2 Required Cycle Options
The period selector in the Operational Transaction Journal and Periodic Recap must support:
1. `today`: "Hari Ini"
2. `two_weeks`: "2 Minggu Terakhir (14 Hari)" / "Siklus 2 Mingguan"
3. `this_month`: "Bulan Ini"
4. `two_months`: "2 Bulan Terakhir (60 Hari)" / "Siklus 2 Bulanan"
5. `all`: "Semua Waktu"
6. `custom`: "Rentang Tanggal Kustom" (`startDate` s/d `endDate`)

### 4.3 Calculating Date Ranges
To prevent timezone offset bugs (e.g. UTC vs WIB UTC+7), date boundaries must be calculated using local date formatting (`YYYY-MM-DD`):
- **14-Day Cycle (Rolling)**:
  `startDateStr = new Date(Date.now() - 14 * 86400000).toLocaleDateString('en-CA')` (or `YYYY-MM-DD` manual slice).
  Filter condition: `tx.deliveryDate >= startDateStr && tx.deliveryDate <= todayStr`.
- **60-Day Cycle (Rolling)**:
  `startDateStr = new Date(Date.now() - 60 * 86400000).toLocaleDateString('en-CA')`.
  Filter condition: `tx.deliveryDate >= startDateStr && tx.deliveryDate <= todayStr`.
- **Fortnightly Cycles**:
  - Cycle 1: `${year}-${month}-01` to `${year}-${month}-14`.
  - Cycle 2: `${year}-${month}-15` to `${year}-${month}-${lastDayOfMonth}`.

### 4.4 Role-Specific Aggregation Rules
- **For Field Operators & Dispatchers (`isDispatcherUser = true`)**:
  - Total Ritase (Total trip count).
  - Total Volume Kubikasi (Total `quantity` where `unit === 'DT'`).
  - Total Volume Tonase (Total `quantity` where `unit === 'Ton'`).
  - Breakdown Volume per Komoditas (e.g. Batu Belah: X DT, Pasir Extra: Y DT, Makadam: Z Ton).
  - Breakdown Ritase per Armada (Plat Nomor) & Supir.
  - Breakdown Ritase per Kuari Asal.
  - Breakdown Ritase per Proyek Tujuan.
  - **ZERO Financial Exposure**: Total Omset, Belanja Kuari, Operasional Jalan, and Net Profit must NEVER be shown.
- **For Management (`founder`, `developer`, `admin`)**:
  - All operational volume metrics above.
  - Total Omset (Gross Revenue).
  - Total Belanja Kuari (Material Purchase Cost).
  - Total Beban Operasional Lapangan (Route/Trip operational costs).
  - Total Estimasi Laba Bersih (Net profit).
  - Payment status breakdown (Tempo vs Lunas).

---

## 5. Architectural Recommendations & Implementation Plan

### 5.1 Architecture Plan
1. **Model & Service Updates**:
   - Update `DispatchTransaction` in `src/types/database.ts`:
     ```typescript
     export interface DispatchTransaction {
       id: string;
       ticketNumber: string;      // PTK-YYYYMMDD-XXXX
       suratJalan?: string;       // No. Surat Jalan Fisik (Quarry / Delivery Waybill)
       deliveryDate: string;      // YYYY-MM-DD
       // ... other existing fields
     }
     ```
   - Update `CreateDispatchPayload` and `UpdateDispatchPayload` in `src/lib/dispatcherService.ts` to include `suratJalan`.
   - In `DispatchForm.tsx` and `EditDispatchModal.tsx`, add an optional input field for "No. Surat Jalan".
   - In `DispatchForm.tsx` and `ProjectCombobox.tsx`, filter `projects.filter(p => p.status === 'ACTIVE')` so that inactive projects like "Proyek Menes" are excluded from selection.

2. **Implement `RecapPage.tsx` (`src/components/recap/RecapPage.tsx`)**:
   - Build a full-featured page for `currentTab === 'recap'`.
   - Enable `recap` access for `isDispatcherUser` in `Sidebar.tsx:308`:
     `if (isDispatcherUser && !['dispatcher', 'projects', 'quarries', 'clients', 'materials', 'recap', 'database'].includes(item.id)) return null;`
   - Sub-Tabs:
     - `volume`: "Volume & Jurnal Transaksi Operasional" (Accessible to both Dispatcher and Management).
       - Features the 2-week and 2-month cycle filters, global project filter, material filter, and search.
       - Operational metric cards: Total Ritase, Total Kubikasi (DT), Total Tonase (Ton), and Active Armada count.
       - Operational table displaying: No. Tiket, No. Surat Jalan, Tgl Jalan, Plat Truk, Supir, Proyek Tujuan, Kuari Asal, Material & Volume, Status, Catatan.
       - ZERO financial data when `isDispatcherUser` is true.
     - `financial`: "Laba & Finansial Perseroan" (Restricted to Management: `developer`, `founder`, `admin`).
       - Hidden or blocked if `isDispatcherUser` is true.
       - Displays Omset, Belanja Kuari, Biaya Operasional, Laba Bersih, and Cash Flow reconciliation.

3. **Sanitize `DatabasePage.tsx`**:
   - In `DatabasePage.tsx`, import `useProjectFilter()`.
   - Wrap financial metric cards ("Total Belanja Kuari", "Estimasi Laba Bersih") with `{!isDispatcherUser && ...}`.
   - Wrap table columns ("Belanja Kuari", "Laba Bersih") with `{!isDispatcherUser && ...}`.
   - Add the missing `Proyek Tujuan` column (`tx.projectName`).
   - Fix Rule 4 violation by removing status dots on lines 734 & 739, rendering clean typography ("LUNAS" / "TEMPO").

4. **Enhance `DispatcherPage.tsx` Sub-Menu**:
   - `Sidebar.tsx` currently defines `new_ticket` and `history` under `dispatcher`.
   - Make clicking `history` on desktop scroll to or focus the transaction table, or provide a toggle between "Catat Ritase" and "Jurnal Ritase".

---

## 6. Potential Pitfalls & Mitigations

1. **Volume Unit Incompatibility**:
   - *Pitfall*: Summing `quantity` across different materials where units are mixed ('DT' vs 'Ton').
   - *Mitigation*: Separate aggregations strictly: `totalCubicDT` (filter `unit === 'DT'`) and `totalTonnage` (filter `unit === 'Ton'`).
2. **Timezone Offset Bugs (Rule 44)**:
   - *Pitfall*: Converting `deliveryDate` using `new Date().toISOString()` which shifts -7 hours into yesterday on WIB timezone.
   - *Mitigation*: Perform date comparisons on raw `YYYY-MM-DD` strings.
3. **Information Leak in Modals**:
   - *Pitfall*: While hiding columns in the table, `DispatchDetailModal` or edit modals might inadvertently expose quarry purchase rates to dispatchers.
   - *Mitigation*: Verify `hideMargin` in `DispatchDetailModal.tsx` and `EditDispatchModal.tsx`.
4. **Inactive Project Misallocation**:
   - *Pitfall*: "Proyek Menes" appearing in dropdowns leading to transactions attributed to a completed project.
   - *Mitigation*: Strictly filter projects by `p.status === 'ACTIVE'` across all comboboxes.
5. **Anti-Pattern Compliance**:
   - Adhere to `rules/ai-anti-patterns.md`: No badges/pills without explicit mandate, solid filled surfaces, naked monochromatic icons, sans-serif bold for metrics (Rule 99), and searchbar with `/icons/search.png` (Rule 98).
