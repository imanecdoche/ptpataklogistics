# Handoff Report: RBAC Privacy Isolation & Design Compliance Survey

**Investigator**: Explorer Survey 3  
**Working Directory**: `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_3`  
**Milestone**: survey_3_rbac_and_design_compliance  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

1. **Role Definitions & Provider**:
   - `src/types/database.ts:156`: `export type UserRole = 'developer' | 'founder' | 'admin' | 'dispatcher' | 'investor' | 'viewer';`
   - `src/context/ProjectFilterContext.tsx:103-105`:
     ```typescript
     const isInvestorUser = userRole === 'investor';
     const isDispatcherUser = userRole === 'dispatcher';
     const isManagementUser = userRole === 'developer' || userRole === 'founder' || userRole === 'admin';
     ```
2. **Navigation & Tab Gating**:
   - `src/components/layout/Sidebar.tsx:308-310`:
     ```typescript
     if (isDispatcherUser && !['dispatcher', 'projects', 'quarries', 'clients', 'materials', 'database'].includes(item.id)) {
       return null;
     }
     ```
   - `src/App.tsx:27`: `const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');` (defaults to `'dashboard'`, which is excluded from the dispatcher menu list).
   - `src/App.tsx:33-40`: `handleSelectTab` only enforces `dev` tab protection (`!isDeveloperEmail(user?.email)`). No checks exist for `investors`, `cash_ledger`, or `recap`.
3. **Data Leakage in `DatabasePage.tsx`**:
   - `src/components/database/DatabasePage.tsx:55`: Does not import or check `isDispatcherUser`.
   - `src/components/database/DatabasePage.tsx:240-241`: Calculates `totalBelanjaKuari` and `totalLabaBersih`.
   - `src/components/database/DatabasePage.tsx:627-649`: Renders `Total Belanja Kuari` and `Estimasi Laba Bersih` metric cards for tab `ritase`.
   - `src/components/database/DatabasePage.tsx:672-675`: Table headers `Belanja Kuari`, `Beban Ops`, `Laba Bersih`.
   - `src/components/database/DatabasePage.tsx:726-731`: Renders `tx.netProfit` and `tx.totalBuyCost` on all transaction rows.
4. **Data Leakage in `ProjectsPage.tsx`**:
   - `src/components/projects/ProjectsPage.tsx:25`: Only checks `isInvestorUser`. No check for `isDispatcherUser`.
   - `src/components/projects/ProjectsPage.tsx:211-227`: Renders `Total Modal Disetor` (`totalDeposit`) and `Total Saldo Kas Berjalan` (`totalCurrentBalance`).
   - `src/components/projects/ProjectsPage.tsx:318-321`: Table headers `Investor Pendana`, `Modal Awal Disetor`, `Saldo Kas Berjalan`.
   - `src/components/projects/ProjectsPage.tsx:351-366`: Renders `proj.investorName`, `proj.initialDeposit`, and `proj.currentBalance`.
5. **Form Field Buy Price Leakage in `DispatchForm.tsx`**:
   - `src/components/dispatcher/DispatchForm.tsx:719-734`:
     ```typescript
     <label className="block text-[#666666] font-medium mb-1 whitespace-nowrap">
       Beli Kuari / {unit} (Cash)
     </label>
     <CurrencyInput
       required
       value={buyPricePerUnit}
       onChange={setBuyPricePerUnit}
       variant="solid-white"
     />
     ```
     Rendered with zero `!isDispatcherUser` check, allowing dispatchers to view and edit cash procurement prices.
   - `src/components/dispatcher/DispatchForm.tsx:618-634`: Section 2 displays `Investor: {selectedProject?.investorName}`.
6. **Missing Transaction Journal & Recap View (R2)**:
   - No view exists offering 2-week and 2-month operational cycle aggregation for dispatchers.
   - `src/App.tsx:206-225`: `cash_ledger` and `recap` tabs render empty placeholder fallback `<div>` elements.
7. **Design & Formatting Compliance**:
   - `grep_search` for `lucide-react`: 0 matches in `package.json` and `src/`.
   - `src/components/ui/PhoneInput.tsx` and `src/lib/phoneUtils.ts`: Used and enforced across all phone fields.
   - `src/components/ui/CurrencyInput.tsx`: Universal currency input with `id-ID` dot dividers.
   - `src/components/ui/MetricCardCurrency.tsx`: Bold sans-serif typography (`font-bold tracking-tight`), no `font-mono`.
   - `src/components/ui/ClientCombobox.tsx:117`, `src/components/ui/ProjectCombobox.tsx:99`, `src/components/ui/QuarryCombobox.tsx:89`: Missing `/icons/search.png` (violates Rule 98).
   - `src/components/layout/AppShell.tsx:137`: Contains `backdrop-blur-md` (violates Rule 5 & 6).
   - `src/components/dispatcher/EditDispatchModal.tsx:182, 257`: Contains `backdrop-blur-sm` and native `<select>` tags (violates Rule 6 & 87).
8. **Build & Type Checking**:
   - `npx tsc -b`: Exited with code 0 (0 compilation errors).
   - `npm run build`: Exited with code 0 (Vite v6.4.5 built production bundle in 13.23s).

---

## 2. Logic Chain

1. **From Observation 1 & 2 to Routing Vulnerability**:
   `ProjectFilterContext` correctly identifies `isDispatcherUser`, but `App.tsx` sets initial state `currentTab = 'dashboard'`. When a dispatcher logs in, they are served `DashboardPage` which contains company cash balances and modal disetor. Furthermore, `Sidebar.tsx` hides `'dashboard'`, leaving the UI in an inconsistent state where the active tab does not match any sidebar navigation item.
2. **From Observation 3 to Critical Financial Exposure**:
   Dispatchers are granted access to `database` in `Sidebar.tsx` (to manage vehicles and drivers), but `DatabasePage.tsx` defaults to subtab `ritase` and displays `Total Belanja Kuari`, `Estimasi Laba Bersih`, and per-transaction `netProfit` and `totalBuyCost` because no role check exists in that component. Therefore, field operators have unrestricted visibility into company profit margins.
3. **From Observation 4 to Investor Equity Exposure**:
   Dispatchers are granted access to `projects` in `Sidebar.tsx`, but `ProjectsPage.tsx` does not check `isDispatcherUser`. As a result, total investor capital disetor, individual project balances, and investor profiles (`investorName`) are exposed to dispatchers, violating Requirement R3.
4. **From Observation 5 to Dispatch Form Leak**:
   `DispatchForm.tsx` lines 719–734 directly expose `buyPricePerUnit` (Beli Kuari Cash) to dispatchers, whereas `EditDispatchModal.tsx` already hides it behind `{!hideMargin && ...}`. To achieve consistency and fulfill Rule 85, `DispatchForm.tsx` must also hide `buyPricePerUnit` for dispatchers and auto-populate it from `QuarryMaterialRate`.
5. **From Observation 7 to Design Compliance Assessment**:
   The application complies with the core formatting rules (PhoneInput, Title Case PUEBI, CurrencyInput, MetricCardCurrency sans-serif, No Lucide). The non-compliance items are localized and actionable: adding `/icons/search.png` to the 3 comboboxes, removing `backdrop-blur-*` classes, and swapping native `<select>` in `EditDispatchModal.tsx` to custom comboboxes.

---

## 3. Caveats

- **Rule 96 vs Requirement R3 on Investor Reference in Form**:
  Rule 96 specifically dictates that Section 2 of `DispatchForm` shows `Investor: {selectedProject.investorName}` for operational reference. However, Requirement R3 states dispatchers must have zero visibility into investor profiles. The implementer should verify whether the investor name label should be hidden for dispatchers (`{!isDispatcherUser && ...}`) or retained strictly as a non-confidential project reference.
- **Master Data Seeding in Database**:
  Because this was a read-only investigation, live Firestore documents in `pataklogisticdb` were not modified. The observations reflect the code-level seeding in `src/lib/projectService.ts`.

---

## 4. Conclusion

The Patak Logistics System is technically sound and compiles cleanly with zero TypeScript errors and zero Lucide dependencies. However, strict RBAC isolation between field operators and company management currently fails due to unmasked financial views in `DatabasePage.tsx`, `ProjectsPage.tsx`, and `DispatchForm.tsx`.

### Recommended Action Items for Implementation:
1. **Mask `DatabasePage.tsx`**: When `isDispatcherUser` is true, hide financial metric cards and columns (`Belanja Kuari`, `Beban Ops`, `Laba Bersih`), showing only physical operational data.
2. **Mask `ProjectsPage.tsx`**: Hide investor capital, cash balance metrics, and investor name columns from dispatchers.
3. **Mask `DispatchForm.tsx`**: Hide `Beli Kuari (Cash)` input for dispatchers, automatically applying `QuarryMaterialRate.buyPriceCash`.
4. **Fix Initial Landing Tab**: In `App.tsx`, set initial tab to `'dispatcher'` if `isDispatcherUser`.
5. **Implement R2 Field Operator Journal**: Build dedicated transaction journal with 2-week and 2-month cycle filters.
6. **Correct Seeding & Debt Separation**: Update `seedDefaultProjects()` to seed Bpk. Yadi (Rp 30M) across Situ Cikedal & Cipeucang; record Bpk. Pei (Rp 18M) strictly in `cash_ledger` as corporate debt; exclude Menes from dispatch dropdowns.
7. **Fix Search Icons & Clean Blur**: Add `/icons/search.png` to `ClientCombobox`, `ProjectCombobox`, `QuarryCombobox`, and remove `backdrop-blur-*` classes.

---

## 5. Verification Method

To verify these findings independently:
1. **Compilation & Type Check**:
   ```bash
   cd "/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System"
   npx tsc -b
   npm run build
   ```
2. **Inspect RBAC Leak in `DatabasePage.tsx`**:
   Inspect `src/components/database/DatabasePage.tsx` lines 236–243, 627–649, and 726–731 to verify `tx.netProfit` and `ritaseMetrics.totalLabaBersih` are rendered unconditionally.
3. **Inspect RBAC Leak in `ProjectsPage.tsx`**:
   Inspect `src/components/projects/ProjectsPage.tsx` lines 211–227 and 351–366 to verify `proj.initialDeposit`, `proj.currentBalance`, and `proj.investorName` are rendered without checking `isDispatcherUser`.
4. **Inspect Form Buy Price Leak in `DispatchForm.tsx`**:
   Inspect `src/components/dispatcher/DispatchForm.tsx` lines 719–734 to verify `buyPricePerUnit` input is rendered without `!isDispatcherUser`.
5. **Verify No Lucide**:
   ```bash
   grep -rn "lucide-react" src/ package.json
   ```
