# Handoff Report — Reviewer 2: Design Rules & RBAC Policy Compliance Review

## 1. Observation

### 1.1 Build & Type Checking Verification
- Executed `npx tsc -b` in working directory `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System`.
- Result: Exited with code 0 (zero TypeScript errors).

### 1.2 UI/UX and Design Rule Verifications

#### Rule 10b & 49: Strictly NO `lucide-react`
- Ran search for `lucide-react` across `src/` and `package.json`.
- Output: Zero matches found. No imports or dependencies on `lucide-react`. (**PASS**)

#### Rule 98: Universal Search Icon (`/icons/search.png`)
- Verified all 14 searchbar fields across the application:
  1. `src/components/clients/ClientsPage.tsx:187`: `src="/icons/search.png"`
  2. `src/components/database/DatabasePage.tsx:502`: `src="/icons/search.png"`
  3. `src/components/dev/DevPage.tsx:310`: `src="/icons/search.png"`
  4. `src/components/dispatcher/DispatchTable.tsx:118`: `src="/icons/search.png"`
  5. `src/components/investors/InvestorsPage.tsx:231`: `src="/icons/search.png"`
  6. `src/components/materials/MasterMaterialPage.tsx:602`: `src="/icons/search.png"`
  7. `src/components/projects/ProjectsPage.tsx:309`: `src="/icons/search.png"`
  8. `src/components/quarries/QuarriesPage.tsx:182`: `src="/icons/search.png"`
  9. `src/components/recap/RecapPage.tsx:422`: `src="/icons/search.png"`
  10. `src/components/ui/ClientCombobox.tsx:118`: `src="/icons/search.png"`
  11. `src/components/ui/CustomSelectCombobox.tsx:114`: `src="/icons/search.png"`
  12. `src/components/ui/MaterialPickerModal.tsx:100`: `src="/icons/search.png"`
  13. `src/components/ui/ProjectCombobox.tsx:104`: `src="/icons/search.png"`
  14. `src/components/ui/QuarryCombobox.tsx:108`: `src="/icons/search.png"`
- Output: All search fields properly render `/icons/search.png` with left padding and proper positioning. (**PASS**)

#### Rule 99: Metric Cards Typography (Sans-Serif Bold, Strictly NO `font-mono`)
- Verified `MetricCardCurrency.tsx`:
  - Line 41: `className="inline-flex items-baseline gap-0.5 font-bold tracking-tight select-text..."`
  - Line 46: `<span className={`${rpSizeClass} font-semibold opacity-50 select-none`}>Rp</span>`
- Verified count metric cards across `ClientsPage.tsx`, `ProjectsPage.tsx`, `InvestorsPage.tsx`, `QuarriesPage.tsx`, `RecapPage.tsx`, and `DispatchTable.tsx`: All use sans-serif bold tracking-tight typography (`text-xl font-bold tracking-tight`). (**PASS**)

#### Rule 101: Universal Phone Input (`<PhoneInput />` with `+62 8xx-xxxx-xxxx`)
- Verified `<PhoneInput />` in `src/components/ui/PhoneInput.tsx` and `phoneUtils.ts`:
  - Static prefix `+62 ` rendered as plain typography without badge.
  - Live auto-formatting inserts hyphen delimiters (`8xx-xxxx-xxxx`).
  - Used in all phone inputs: `EditClientModal.tsx:87`, `DatabasePage.tsx:1144, 1302`, `InvestorsPage.tsx:390, 476`, `QuarriesPage.tsx:342, 419`, `NewClientModal.tsx:149`.
  - Zero raw `<input type="tel">` outside of `PhoneInput.tsx`. (**PASS**)

#### Rule 102: Entity & Person Name Auto-Formatting (PUEBI Title Case)
- Verified `src/lib/nameUtils.ts`:
  - Legal abbreviations `PT`, `CV`, `UD`, `KM`, `Tbk` properly capitalized in `formatNameWord`.
  - Live trailing-space preservation in `formatEntityNameLive` and `formatPersonNameLive`.
  - Applied on all entity/person name inputs and backend sanitizers before write to Firestore. (**PASS**)

#### Rule 103: Monetary Formatting (`<CurrencyInput />` & `<MetricCardCurrency />`)
- Verified all monetary fields use `<CurrencyInput />`.
- Verified `<input type="number">` is strictly restricted to non-monetary quantities (DT/Ton volume in `DispatchForm.tsx:720`, `EditDispatchModal.tsx:371`, distance km in `MasterMaterialPage.tsx:1116`, and duration hours in `MasterMaterialPage.tsx:1130`). Zero monetary fields use raw number input. (**PASS**)

#### Rule 88: Clean Page Headers (Only Title, No Subtitle/Description)
- Verified `AppShell.tsx`:
  - Lines 20-76: `TAB_TITLES` has `subtitle: ''` across all 11 tabs.
  - Lines 162-166: Header renders only `h1` title; no subtitle or description markup exists. (**PASS**)

#### Rule 87: Custom UI Select Comboboxes, Strictly NO Native `<select>`
- Grep search for `<select` in `src/` revealed **12 occurrences of native browser `<select>` tags**:
  1. `src/components/recap/RecapPage.tsx:350`: `<select value={selectedProjectId} onChange={...}>` (Filter Proyek Tujuan)
  2. `src/components/recap/RecapPage.tsx:369`: `<select value={selectedQuarry} onChange={...}>` (Filter Kuari Asal)
  3. `src/components/recap/RecapPage.tsx:388`: `<select value={selectedMaterial} onChange={...}>` (Filter Jenis Material)
  4. `src/components/recap/RecapPage.tsx:407`: `<select value={selectedStatus} onChange={...}>` (Filter Status Pembayaran)
  5. `src/components/projects/ProjectsPage.tsx:491`: `<select value={investorId} onChange={...}>` (Investor Pendana in Tambah Proyek modal)
  6. `src/components/projects/ProjectsPage.tsx:507`: `<select value={clientId} onChange={...}>` (Klien / Pemilik in Tambah Proyek modal)
  7. `src/components/projects/ProjectsPage.tsx:604`: `<select value={editTarget.investorId} onChange={...}>` (Investor Pendana in Edit Proyek modal)
  8. `src/components/projects/ProjectsPage.tsx:620`: `<select value={editTarget.clientId} onChange={...}>` (Klien / Pemilik in Edit Proyek modal)
  9. `src/components/projects/ProjectsPage.tsx:646`: `<select value={editTarget.status} onChange={...}>` (Status Proyek in Edit Proyek modal)
  10. `src/components/dev/DevPage.tsx:502`: `<select value={newRole} onChange={...}>` (Peran Hak Akses in Buat Akun modal)
  11. `src/components/dev/DevPage.tsx:582`: `<select value={editingUser.role} onChange={...}>` (Peran Hak Akses in Edit Akun modal)
  12. `src/components/dev/DevPage.tsx:598`: `<select value={editingUser.status} onChange={...}>` (Status Akun in Edit Akun modal)
- Output: **VIOLATION of Rule 87**. Custom UI pickers (`CustomSelectCombobox`, `ProjectCombobox`, etc.) must be used instead.

#### Rule 5 & 6: Flat Solid Surfaces, Strictly NO `backdrop-blur-*`
- Grep search for `backdrop-blur` in `src/` revealed **5 occurrences**:
  1. `src/components/auth/RequestAccessModal.tsx:66`: `className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none..."`
  2. `src/components/dashboard/FundTransferSection.tsx:241`: `className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none..."`
  3. `src/components/ui/PinAuthModal.tsx:131`: `className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in..."`
  4. `src/components/dispatcher/DispatcherPage.tsx:96`: `className="... bg-white/80 backdrop-blur-md rounded-t-[16px] ..."`
  5. `src/components/dispatcher/DispatcherPage.tsx:120`: `className="... bg-white/80 backdrop-blur-md border-b border-[#eaeaea] ..."`
- Output: **VIOLATION of Rule 5 & 6**. Rule 6 explicitly states: "Backdrop modal wajib menggunakan dim warna datar tanpa efek blur (`bg-black/40` atau `bg-slate-900/50`, TANPA kelas `backdrop-blur-*`)."

#### Rule 4 & 24: Anti-Cliché Visual Rules (No Badge/Pill/Chip Status Dots, Pure Text Typography)
- Grep and inspection of status rendering revealed:
  1. `src/components/projects/ProjectsPage.tsx:404-413`: Project status is styled as a colored rounded badge:
     ```tsx
     <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
       proj.status === 'COMPLETED' ? 'bg-[#f0fdf4] text-[#166534]' :
       proj.status === 'ON_HOLD' ? 'bg-[#fefce8] text-[#854d0e]' :
       'bg-[#eff6ff] text-[#1e40af]'
     }`}>
       {proj.status === 'COMPLETED' ? 'SELESAI' : proj.status === 'ON_HOLD' ? 'HOLD' : 'AKTIF'}
     </span>
     ```
     This violates Rule 4 & 24 which requires clean pure typography without badge containers or background fills (as done correctly in `DispatchTable.tsx:305-312` and `RecapPage.tsx:704-714`).
  2. `src/components/dev/DevPage.tsx:364, 370, 376`: Status column renders colored status dot circles:
     - Line 364: `<span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />`
     - Line 370: `<span className="w-1.5 h-1.5 rounded-full bg-[#ca8a04]" />`
     - Line 376: `<span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />`
     This directly violates Rule 4 & 24 forbidding status dots.
  3. `src/components/layout/Sidebar.tsx:390`: Sub-items render dot bullets:
     - Line 390: `<span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSubActive ? 'bg-white' : 'bg-[#cccccc]'}`} />`
- Output: **VIOLATION of Rule 4 & 24**.

#### Rule 30: Flat Tonal Surface, Strictly NO Drop Shadow on Cards
- Grep search for `shadow-sm` on cards/containers revealed:
  1. `src/components/database/DatabasePage.tsx:616, 628, 638, 649`: Metric cards have `shadow-sm`.
  2. `src/components/dashboard/DashboardPage.tsx:145, 161, 185, 203`: Metric cards have `shadow-sm`.
  3. `src/components/dev/DevPage.tsx:215, 225, 237, 247`: Metric cards have `shadow-sm`.
  4. `src/components/materials/MasterMaterialPage.tsx:732, 823`: Table containers have `shadow-sm`.
- Output: **VIOLATION of Rule 30**. Rule 30 mandates pure flat filled surfaces (`bg-white` on canvas `#fafafa`) without drop shadows.

### 1.3 RBAC Policy Enforcement Verification
- **Dispatcher Access Isolation**:
  - `src/components/layout/Sidebar.tsx:308-316`: Tabs `dashboard`, `investors`, `cash_ledger`, and `dev` are filtered out for `isDispatcherUser`.
  - `src/App.tsx:33-39, 50-54, 73-77`: Initial landing and navigation guards force `isDispatcherUser` to `'dispatcher'` tab and block attempts to access `dashboard`, `investors`, or `cash_ledger`.
  - `src/components/recap/RecapPage.tsx:77-89, 288-300, 533-620`: Sub-tab `financial` (Rekapitulasi Finansial) is completely hidden from dispatchers. If `isDispatcherUser` is true, `activeSubTab` is hard-locked to `'volume'` (Jurnal Logistik Operasional), showing strictly operational data: tickets, waybills, plates, drivers, quarries, projects, materials, volumes.
  - `src/components/projects/ProjectsPage.tsx:211-250, 380-401`: `totalDeposit`, `totalCurrentBalance`, `investorName`, `initialDeposit`, and `currentBalance` are masked with `{!isDispatcherUser && ...}`.
  - `src/components/database/DatabasePage.tsx:637-662, 686-692, 741-755`: `Belanja Kuari` and `Laba Bersih` columns and KPI cards are masked with `{!isDispatcherUser && ...}`.
  - `src/components/dispatcher/DispatchForm.tsx:747-764, 821-875`: Cash buy price (`Beli Kuari Cash`), `Saldo Kas Proyek Berjalan`, `Estimasi Sisa Saldo Kas`, and `Estimasi Laba Bersih` are hidden from dispatchers.
  - `src/components/dispatcher/DispatchDetailModal.tsx:11-13, 112-119, 135-142`: `Beli Kuari (Cash)` and `Estimasi Laba Bersih` are masked when `hideMargin = isDispatcherUser || isInvestorUser`.
  - `src/components/dispatcher/EditDispatchModal.tsx:35, 396-406, 445-466`: Buy price input and profit calculation are masked for dispatchers.
- **Management Full Oversight**:
  - `userRole === 'developer' | 'founder' | 'admin'` have unrestricted visibility into all tabs, cash ledgers, company liabilities (Bpk. Pei Rp 18M debt), investor capital (Bpk. Yadi Rp 30M), profit margins, and project balances.
- Output: **PASS** on RBAC Policy Enforcement.

---

## 2. Logic Chain

1. **Premise 1**: The workspace operating rules (`.agents/RULES.md`) constitute the absolute and literal standard of correctness for UI components and design tokens.
2. **Premise 2**: Rule 87 explicitly forbids native `<select>` tags and mandates custom UI select components (`CustomSelectCombobox`, `ProjectCombobox`, etc.).
3. **Observation 1**: `RecapPage.tsx` lines 350, 369, 388, and 407 use `<select>` for multi-dimensional filters (Proyek, Kuari, Material, Status). `ProjectsPage.tsx` lines 491, 507, 604, 620, and 646 use `<select>` for Investor, Client, and Status. `DevPage.tsx` lines 502, 582, and 598 use `<select>` for Role and Status.
4. **Inference 1**: The implementation violates Rule 87 in 12 distinct locations.
5. **Premise 3**: Rules 5 and 6 prohibit `backdrop-blur-*` on dialogs and modal backdrops, requiring pure flat solid dim backdrops (`bg-black/40` without blur).
6. **Observation 2**: `RequestAccessModal.tsx:66`, `FundTransferSection.tsx:241`, and `PinAuthModal.tsx:131` contain `backdrop-blur-sm`. `DispatcherPage.tsx:96, 120` contain `backdrop-blur-md`.
7. **Inference 2**: The implementation violates Rules 5 & 6.
8. **Premise 4**: Rules 4 and 24 forbid badges, pills, chips, and status dots. Status indicators must be rendered as clean text typography.
9. **Observation 3**: `ProjectsPage.tsx:404-413` wraps status in a colored pill/badge (`px-2 py-0.5 rounded bg-[#f0fdf4] ...`). `DevPage.tsx:364, 370, 376` renders status dot circles (`w-1.5 h-1.5 rounded-full`). `Sidebar.tsx:390` renders sub-item dot bullets (`w-1.5 h-1.5 rounded-full`).
10. **Inference 3**: The implementation violates Rules 4 & 24.
11. **Premise 5**: Rule 30 forbids drop shadows (`shadow-sm`, `shadow-md`, etc.) on cards and page containers, requiring flat tonal surfaces.
12. **Observation 4**: Metric cards in `DatabasePage.tsx`, `DashboardPage.tsx`, and `DevPage.tsx`, and containers in `MasterMaterialPage.tsx` contain `shadow-sm`.
13. **Inference 4**: The implementation violates Rule 30.
14. **Conclusion**: While functional logic, RBAC enforcement, and TypeScript compilation pass cleanly, the design system violations are material and violate explicit project rules. Therefore, changes must be requested to bring the UI into full compliance.

---

## 3. Caveats

- **No Integrity Violation**: There is no evidence of hardcoded test results, facade implementations, bypassed business logic, or fabricated verification artifacts. The system implements real database operations, authentic role gating, and accurate financial calculations.
- **Scope of Review**: Reviewer 2 was scoped to design rules compliance and RBAC policy enforcement. Database seeding data in Firestore was audited via code inspection of seeding routines (`projectService.ts`, `cashLedgerService.ts`, `investorService.ts`), but live remote Firestore state mutation was not performed directly by Reviewer 2.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

### Required Modifications:
1. **Replace Native `<select>` Elements (Rule 87)**:
   - In `src/components/recap/RecapPage.tsx` (lines 350-417), replace the 4 native `<select>` dropdowns (Proyek Tujuan, Kuari Asal, Jenis Material, Status Pembayaran) with `<CustomSelectCombobox />`.
   - In `src/components/projects/ProjectsPage.tsx` (lines 491, 507, 604, 620, 646), replace native `<select>` with `<CustomSelectCombobox />`.
   - In `src/components/dev/DevPage.tsx` (lines 502, 582, 598), replace native `<select>` with `<CustomSelectCombobox />`.
2. **Remove `backdrop-blur-*` (Rules 5 & 6)**:
   - In `src/components/ui/PinAuthModal.tsx:131`, change `bg-black/50 backdrop-blur-sm` to flat `bg-black/40`.
   - In `src/components/dashboard/FundTransferSection.tsx:241`, remove `backdrop-blur-sm`.
   - In `src/components/auth/RequestAccessModal.tsx:66`, remove `backdrop-blur-sm`.
   - In `src/components/dispatcher/DispatcherPage.tsx:96, 120`, replace frosted glass / blur styling with solid surface tokens.
3. **Clean Status Typography (Rules 4 & 24)**:
   - In `src/components/projects/ProjectsPage.tsx:404-413`, replace the badge/pill container (`px-2 py-0.5 rounded bg-[#f0fdf4] ...`) with pure text typography (`text-[11px] font-semibold text-[#111111]`, identical to `DispatchTable.tsx` and `RecapPage.tsx`).
   - In `src/components/dev/DevPage.tsx:364, 370, 376`, remove the status dot circles (`<span className="w-1.5 h-1.5 rounded-full ... />`).
   - In `src/components/layout/Sidebar.tsx:390`, remove the bullet dots from sub-menu items.
4. **Remove Drop Shadows from Cards (Rule 30)**:
   - Remove `shadow-sm` from metric cards in `DatabasePage.tsx`, `DashboardPage.tsx`, `DevPage.tsx`, and containers in `MasterMaterialPage.tsx`.

---

## 5. Verification Method

To verify these findings independently:
1. Search for native `<select>`:
   ```bash
   rg "<select" src/
   ```
   *Expected after fix: 0 results.*
2. Search for `backdrop-blur`:
   ```bash
   rg "backdrop-blur" src/
   ```
   *Expected after fix: 0 results (or only allowed mobile replacement header in AppShell if specifically governed by Rule 47).*
3. Search for status dot bullets and badges:
   ```bash
   rg "rounded-full bg-\[" src/components/
   ```
4. Verify TypeScript build:
   ```bash
   npx tsc -b
   ```
   *Must exit with 0 errors.*
