# Project: Patak Logistics System — Production Master Data Migration & Field Operator Journal

## Architecture
The system is built with React 19, TypeScript, Vite, Tailwind CSS, and Firebase Firestore (`pataklogisticdb`).
It manages fleet dispatch, quarry procurement (cash-basis), project billing (tempo-basis), and general ledgers.

Key layers:
- **Presentation Layer**: `src/components/` (`dispatcher`, `database`, `projects`, `investors`, `quarries`, `clients`, `recap`, `cash_ledger`, `ui`, `layout`).
- **State & Context**: `src/context/ProjectFilterContext.tsx` providing `userRole`, `isDispatcherUser`, `isInvestorUser`, `isManagementUser`, active project filter, and project list.
- **Data Access & Services**: `src/lib/` (`firebase.ts`, `projectService.ts`, `investorService.ts`, `dispatcherService.ts`, `cashLedgerService.ts`, `materialMasterService.ts`, `clientService.ts`).
- **Database**: Firestore database `pataklogisticdb` (collections: `investors`, `projects`, `cash_ledger`, `transactions`, `clients`, `quarries`, `quarry_material_rates`, `route_tariffs`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Single Investor Bpk. Yadi | Seed `inv-bpk-yadi` with Rp 30.000.000 initial capital linked to fund both active projects | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Active Projects Setup | Upsert "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang" as the exactly 2 active operational projects | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Project Menes Deactivation | Mark `prj-menes` as completed/inactive and filter out from all dispatch inputs | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Bpk. Pei Corporate Debt Recording | Record Rp 18.000.000 liability to Bpk. Pei strictly under `cash_ledger` as company debt (`HUTANG_PIHAK_KETIGA`), excluded from `investors` and ritase profit sharing | M1 | ORIGINAL_REQUEST §R1, Rule 104 |
| 5 | Cash Ledger Service & Seeding | Formalize `cashLedgerService.ts` and ensure initial ledger entries for Bpk. Yadi capital and Bpk. Pei debt | M1 | Rule 19, Rule 104 |
| 6 | Surat Jalan Schema & Form Entry | Add `suratJalan?: string` to `DispatchTransaction`, `DispatchForm.tsx`, and `EditDispatchModal.tsx` | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Operational Transaction Journal | Dedicated journal view in `RecapPage.tsx` displaying tickets, waybills, plates, drivers, materials, quarries, projects, volumes | M2 | ORIGINAL_REQUEST §R2 |
| 8 | 2-Week & 2-Month Periodic Recaps | Flexible operational cycle filtering (14-day and 60-day cycles) with separate DT/Ton aggregations | M2 | ORIGINAL_REQUEST §R2, Rule 104 |
| 9 | Strict RBAC Privacy on Database & Projects | Mask profit margins, buy costs, investor capital, and cash balances from dispatchers in `DatabasePage.tsx` and `ProjectsPage.tsx` | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Dispatch Form Buy Price Masking | Hide `Beli Kuari Cash` input from dispatchers in `DispatchForm.tsx`, auto-filling from `QuarryMaterialRate` | M3 | ORIGINAL_REQUEST §R3, Rule 85 |
| 11 | Initial Tab Landing Protection | Direct dispatchers to `'dispatcher'` tab upon login in `App.tsx`, preventing default exposure to `'dashboard'` | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Design & Formatting Standard Compliance | Add `/icons/search.png` to comboboxes (Rule 98), clean `backdrop-blur-*` (Rule 5/6), enforce `<PhoneInput />`, `<CurrencyInput />`, `<MetricCardCurrency />` sans-serif | M4 | ORIGINAL_REQUEST §R4, Rules 98-103 |
| 13 | E2E & Forensic Verification | Run `npx tsc -b`, `npm run build`, forensic database audit script, and verify zero regressions | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Master Data Migration & Seeding | Types extension (`HUTANG_PIHAK_KETIGA`), Firestore seeding script & service (`projectService.ts`, `cashLedgerService.ts`, `investorService.ts`), Bpk. Yadi Rp 30M, Bpk. Pei Rp 18M debt, active projects setup, active status filtering in dropdowns | none | DONE |
| M2 | Field Operator Journal & Periodic Recap | Add `suratJalan` to types & forms, build `RecapPage.tsx` with operational journal sub-tab, implement 2-week (14-day) and 2-month (60-day) cycle calculations & dual volume aggregations (DT vs Ton) | M1 | DONE |
| M3 | Strict RBAC Privacy Isolation | Mask financial margins/buy costs on `DatabasePage.tsx`, mask investor capital/profiles on `ProjectsPage.tsx`, mask buy price input on `DispatchForm.tsx`, fix initial landing tab in `App.tsx`, grant full oversight to management | M1, M2 | DONE |
| M4 | Design & Formatting Compliance | Standardize search icons with `/icons/search.png`, eliminate blur classes, verify Title Case PUEBI and Currency/Phone inputs | M2, M3 | DONE |
| M5 | Multi-Agent Gate & Build Verification | Reviewers, Challengers, Forensic Auditor, `npx tsc -b`, `npm run build` | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `src/types/database.ts`
- `CashFlowType`: `'MODAL_AWAL' | 'TOPUP_MODAL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PELUNASAN_PIUTANG' | 'HUTANG_PIHAK_KETIGA' | 'CICILAN_HUTANG'`
- `DispatchTransaction`:
  ```typescript
  export interface DispatchTransaction {
    id?: string;
    ticketNumber: string;
    suratJalan?: string; // Physical waybill number
    deliveryDate: string;
    truckPlate: string;
    driverName?: string;
    projectId?: string;
    projectName?: string;
    clientId?: string;
    clientName?: string;
    quarryId?: string;
    quarryName?: string;
    materialId: string;
    materialName: string;
    quantity: number;
    unit: UnitType;
    buyPricePerUnit: number;
    sellPricePerUnit: number;
    operationalCost: number;
    totalBuyCost: number;
    totalRevenue: number;
    netProfit: number;
    paymentStatus: PaymentStatus;
    paidAt?: string | null;
    notes?: string;
    createdAt: string;
  }
  ```

### `src/lib/cashLedgerService.ts`
- `subscribeCashLedger(callback: (entries: CashLedgerEntry[]) => void): () => void`
- `recordCashMutation(entry: Omit<CashLedgerEntry, 'id' | 'createdAt'>): Promise<string>`
- `seedCorporateLiabilities(): Promise<void>`

### `src/lib/projectService.ts`
- `seedDefaultProjects(): Promise<void>`:
  - Seeds `prj-situ-cikedal` (ACTIVE, investor: Bpk. Yadi)
  - Seeds `prj-cipeucang` (ACTIVE, investor: Bpk. Yadi)
  - Sets `prj-menes` (COMPLETED, inactive for dispatch)

## Code Layout
- `src/types/database.ts`: TypeScript data interfaces and enums.
- `src/lib/`:
  - `firebase.ts`: Firestore instance with `pataklogisticdb`.
  - `projectService.ts`: Project queries, active project filters, and project seeding.
  - `investorService.ts`: Investor queries and seeding.
  - `cashLedgerService.ts`: General ledger mutations, running cash balance, and corporate debt tracking.
  - `dispatcherService.ts`: Dispatch tickets, waybill saving, and ritase queries.
- `src/components/`:
  - `dispatcher/`: `DispatchForm.tsx`, `DispatchTable.tsx`, `EditDispatchModal.tsx`.
  - `recap/`: `RecapPage.tsx` (Operational Journal & Financial Recap).
  - `database/`: `DatabasePage.tsx`.
  - `projects/`: `ProjectsPage.tsx`.
  - `ui/`: `ProjectCombobox.tsx`, `ClientCombobox.tsx`, `QuarryCombobox.tsx`, `CurrencyInput.tsx`, `PhoneInput.tsx`, `MetricCardCurrency.tsx`.
  - `layout/`: `Sidebar.tsx`, `AppShell.tsx`.
- `src/App.tsx`: Navigation routing, tab switching, and role-based initial view.
- `scripts/`: Production migration and verification scripts.
