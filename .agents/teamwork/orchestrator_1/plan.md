# Orchestration Plan: Patak Logistics System Production Migration & Enhancement

## Objective
Migrate and seed clean production master data in Firestore `pataklogisticdb` (Bpk. Yadi as sole active investor with Rp 30.000.000, two active projects Situ Cikedal and Irigasi Cipeucang, Menes deactivated/excluded from dropdowns, and Bpk. Pei's Rp 18.000.000 liability strictly recorded under general ledger `cash_ledger` as company debt); implement field operator transaction journal with 2-week and 2-month periodic recaps; enforce strict RBAC privacy masking; comply with all workspace design and formatting rules (Rules 98-103, no Lucide, Icons8); and verify system stability with `npx tsc -b` and `npm run build`.

## Phases

### Phase 0: Exploratory Codebase Survey (3 Parallel Explorers)
- **Explorer 1 (Master Data & Seeding)**:
  - Investigate `src/services/` (investorService, projectService, cashLedgerService, etc.), seed scripts (`scripts/` or similar), Firestore setup, and current data structures for investors, projects, and cash_ledger.
  - Identify where Proyek Menes is loaded in dropdowns and how to ensure only active projects appear.
- **Explorer 2 (Field Operator Journal & Periodic Recap)**:
  - Investigate existing Dispatcher page, DispatchTable, recap page (`RecapPage.tsx` or similar), transaction services, and how operational cycles (2-week and 2-month) are currently structured or need to be added.
  - Check fields displayed in waybill/ticket views: dispatch tickets, waybills, license plates, driver names, commodity types, quarry origin, destination project, cubic/tonnage volumes.
- **Explorer 3 (RBAC Privacy & Design Compliance)**:
  - Investigate auth/role models (`src/types/`, `src/context/`, `src/services/userManagementService.ts`), role permissions (`founder`, `developer`, `admin`, `dispatcher`, `investor`).
  - Check where investor capital, profit margins, internal cash balances, and shareholder dividence are rendered to ensure field operators and dispatchers have zero visibility.
  - Check compliance with Rules 98-103 (CurrencyInput, PhoneInput, formatEntityName/Title Case, /icons/search.png, MetricCardCurrency, Icons8).

### Phase 1: Synthesis & PROJECT.md
- Consolidate explorer findings into `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/PROJECT.md`.
- Detail file boundaries, interface contracts, and concrete milestone tasks.

### Phase 2: Execution & Iteration (Workers)
- **M1**: Master data seeding & migration script / service update (Bpk. Yadi Rp 30M, active projects Situ Cikedal & Irigasi Cipeucang, Menes deactivated, Bpk. Pei Rp 18M debt in `cash_ledger`).
- **M2**: Field operator transaction journal view & 2-week / 2-month periodic recap filter/aggregation.
- **M3**: RBAC enforcement & privacy masking for field operators/dispatchers.
- **M4**: Workspace rules compliance & design hygiene audit.

### Phase 3: Multi-Agent Gate Verification
- **Reviewers**: 2 independent reviewers checking code quality, rules compliance, and requirements.
- **Challengers**: 2 adversarial verifiers checking edge cases, role boundary bypass, and recap period calculations.
- **Forensic Auditor**: Verification of genuine data migration and zero hardcoded test facades.
- **TypeScript & Build Verification**: `npx tsc -b` passes with 0 errors; `npm run build` succeeds.

### Phase 4: Sentinel Completion Reporting
- Report structured results and verification evidence to Sentinel.
