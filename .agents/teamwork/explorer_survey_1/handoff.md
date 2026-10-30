# Handoff Report: Master Data & Seeding Architecture Survey

**Agent**: Explorer 1  
**Target Milestone**: Survey & Plan for Master Data & Seeding  
**Working Directory**: `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_1`  
**Report Type**: Hard Handoff  

---

## 1. Observation

1. **Firestore Initialization (`src/lib/firebase.ts:22-28`)**:
   ```typescript
   const activeDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "pataklogisticdb";
   export const db = getFirestore(app, activeDatabaseId);
   export const currentEnv = import.meta.env.VITE_APP_ENV || "development";
   export const currentDbName = activeDatabaseId;
   ```
   Direct observation: Firestore is initialized specifically with `pataklogisticdb` as required by **Rule 19** and **Rule 104**.

2. **Service Architecture**:
   - Services are located in `src/lib/` (e.g. `src/lib/investorService.ts`, `src/lib/projectService.ts`, `src/lib/dispatcherService.ts`). There is no `src/services/` directory.
   - There is currently **no `cashLedgerService.ts`**. Operations on `cash_ledger` are performed inline inside `src/lib/dispatcherService.ts:79-92, 171-201, 254-260` and queried in `src/components/dashboard/DashboardPage.tsx:79-90`.
   - `App.tsx:206-225` renders a placeholder card for the `cash_ledger` tab.

3. **Live Database Inspection of `pataklogisticdb`**:
   Executing direct Firestore queries via `node .agents/teamwork/explorer_survey_1/inspect_firestore.mjs` returned:
   - `investors`: 0 documents.
   - `projects`: Exactly 3 documents:
     - `prj-cipeucang` (`"Proyek Cipeucang"`, `status: "ACTIVE"`, `investorId: "inv-cipeucang"`, `initialDeposit: 50000000`, `currentBalance: 50000000`)
     - `prj-menes` (`"Proyek Menes"`, `status: "ACTIVE"`, `investorId: "inv-menes"`, `initialDeposit: 50000000`, `currentBalance: 50000000`)
     - `prj-situ-cikedal` (`"Proyek Situ Cikedal"`, `status: "ACTIVE"`, `investorId: "inv-situ-cikedal"`, `initialDeposit: 50000000`, `currentBalance: 50000000`)
   - `cash_ledger`: 0 documents.
   - `transactions`: 0 documents.
   - `quarry_material_rates`: 10 documents.
   - `route_tariffs`: 11 documents (with duplicate route entries).
   - Neither **Bpk. Yadi** nor **Bpk. Pei** exists in the database or codebase.

4. **Dropdown Retrieval & Lack of Active Filtering**:
   - `src/context/ProjectFilterContext.tsx:38-41`: Subscribes to all documents in `projects` collection without status filtering.
   - `src/components/ui/ProjectCombobox.tsx:58-66`: Searches over `item.name` and `item.clientName` only. Does NOT check `item.status === 'ACTIVE'`.
   - `src/components/dispatcher/DispatchForm.tsx:57, 577-584`: Passes unfiltered `projects` from `useProjectFilter()` to `ProjectCombobox`.
   - `src/components/dispatcher/EditDispatchModal.tsx:280-288`: Directly iterates over `projects.map()` without status checks.

5. **`cash_ledger` Schema & Debt Separation**:
   - `src/types/database.ts:3`:
     ```typescript
     export type CashFlowType = 'MODAL_AWAL' | 'TOPUP_MODAL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PELUNASAN_PIUTANG';
     ```
   - Currently, `CashFlowType` has no enum for third-party loans or company debt liabilities.
   - **Rule 104** explicitly mandates: Bpk. Pei is canceled as an investor, must NOT appear in the `investors` table or ritase profit sharing, and his Rp 18.000.000 must be stored under general ledger `cash_ledger` as PT corporate debt.

6. **System Build & TypeScript Status**:
   - `npx tsc -b`: Exited with code 0 (zero errors).
   - `npm run build`: Exited with code 0 (`built in 10.62s`).

---

## 2. Logic Chain

1. **Observation 1 & 2** establish that the project uses `pataklogisticdb` with services in `src/lib/`. Any migration scripts or service updates must target `src/lib/` and import `db` from `@/lib/firebase`.
2. **Observation 3** reveals that `projects` already contains 3 legacy documents from an earlier run of `seedDefaultProjects()`, while `investors` and `cash_ledger` are empty. Because `seedDefaultProjects()` has the guard `if (!snap.empty) return;`, simply reloading the app will **not** fix the projects. A dedicated upsert migration is required.
3. **Observation 4** shows why "Proyek Menes" currently appears in dispatch dropdowns: none of `ProjectCombobox.tsx`, `DispatchForm.tsx`, or `EditDispatchModal.tsx` check `project.status`. Setting `status: 'COMPLETED'` on `prj-menes` in Firestore and adding `status === 'ACTIVE'` filtering in the UI components will guarantee Proyek Menes is excluded from dispatch inputs while maintaining historical data integrity.
4. **Observation 5** demonstrates that to record Bpk. Pei's Rp 18.000.000 corporate debt without violating TypeScript types or Rule 104, `CashFlowType` must be extended with `'HUTANG_PIHAK_KETIGA'`. Recording an entry in `cash_ledger` with `type: 'HUTANG_PIHAK_KETIGA'` and omitting `investorId` ensures it is recognized under PT Patak Abadi Jaya's general cash ledger while remaining 100% isolated from project equity and ritase calculations.

---

## 3. Caveats

- **Existing Route Tariffs Duplication**: The `route_tariffs` collection currently has 11 entries with random IDs (`RTE-*`) that link to `prj-situ-cikedal`, `prj-menes`, and `prj-cipeucang`. When updating the display names to "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang", route tariffs should be reconciled to avoid duplicate tariff lookups.
- **Cash Ledger Running Balance Sequence**: When seeding initial entries for Bpk. Yadi (Rp 30M) and Bpk. Pei (Rp 18M), their timestamps must be ordered so `orderBy('date', 'desc')` accurately reflects the cumulative cash balance.

---

## 4. Conclusion

The codebase is structurally sound and compiles cleanly with zero TypeScript errors. To satisfy Acceptance Criteria R1 & R4:
1. **Types**: Extend `CashFlowType` in `src/types/database.ts` with `'HUTANG_PIHAK_KETIGA'` and `'CICILAN_HUTANG'`.
2. **Master Data Seeding**:
   - Seed `inv-bpk-yadi` into `investors` with Rp 30.000.000 initial capital.
   - Upsert `prj-situ-cikedal` (`"Proyek Konservasi Situ Cikedal"`, `status: "ACTIVE"`, `investorId: "inv-bpk-yadi"`).
   - Upsert `prj-cipeucang` (`"Proyek Irigasi Cipeucang"`, `status: "ACTIVE"`, `investorId: "inv-bpk-yadi"`).
   - Update `prj-menes` to `status: "COMPLETED"`.
   - Seed Bpk. Yadi capital (`MODAL_AWAL`, Rp 30.000.000) and Bpk. Pei debt (`HUTANG_PIHAK_KETIGA`, Rp 18.000.000) into `cash_ledger`.
3. **Dropdown Filtering**:
   - Add `status === 'ACTIVE'` filtering in `ProjectCombobox.tsx`, `DispatchForm.tsx`, and `EditDispatchModal.tsx`.
4. **Service Consolidation**:
   - Rewrite `seedDefaultProjects()` in `src/lib/projectService.ts` to reflect the new production state.
   - Create `src/lib/cashLedgerService.ts` to manage general ledger mutations and corporate debt queries cleanly.

---

## 5. Verification Method

1. **TypeScript Compilation**:
   ```bash
   npx tsc -b
   ```
   *Expected*: Exits cleanly with code 0 and no diagnostic errors.

2. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Builds successfully with Vite.

3. **Firestore Data Verification**:
   Execute the inspection script:
   ```bash
   node .agents/teamwork/explorer_survey_1/inspect_firestore.mjs
   ```
   *Invalidation Conditions*:
   - If `investors` contains any document other than `inv-bpk-yadi`.
   - If Bpk. Pei appears anywhere inside `investors`.
   - If `projects` has `prj-menes` marked as `ACTIVE`.
   - If `cash_ledger` does not contain the Rp 18.000.000 third-party debt entry for Bpk. Pei.
