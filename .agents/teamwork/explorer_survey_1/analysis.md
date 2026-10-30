# Master Data & Seeding Architecture Survey Report

**Author**: Explorer 1 (Master Data & Seeding Investigation)  
**Date**: 2026-10-30  
**Target Repository**: `/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System`  
**Database**: Google Cloud Firestore `pataklogisticdb` (Zone: `asia-southeast2` Jakarta, Project: `antigravityapp-e305d`)

---

## Executive Summary

1. **Firestore Initialization & Database Target**:  
   The application initializes Firestore in `src/lib/firebase.ts` with custom database ID `pataklogisticdb` via `getFirestore(app, activeDatabaseId)`. It strictly conforms to **Rule 19** and **Rule 104**.
2. **Service Architecture Reality**:  
   All services reside under `src/lib/` (not `src/services/`). Currently, there is **NO standalone `cashLedgerService.ts`**; `cash_ledger` mutations are performed inline inside `dispatcherService.ts` and queried directly inside `DashboardPage.tsx`. The `cash_ledger` navigation tab in `App.tsx` is currently a placeholder `<div>`.
3. **Live Firestore Audit of `pataklogisticdb`**:  
   - `investors`: Currently **0 documents** (completely empty).
   - `projects`: Currently **3 documents** (`prj-cipeucang`, `prj-menes`, `prj-situ-cikedal`) with legacy mock names and Rp 50.000.000 deposits created by the old `seedDefaultProjects()`.
   - `cash_ledger`: Currently **0 documents**.
   - `transactions`: Currently **0 documents**.
   - `system_users`: Exactly 3 documents (`usr-fatih-patak-dev`, `usr-founder-patak-id`, `usr-administrator-patak-id`).
   - Neither **Bpk. Yadi** nor **Bpk. Pei** currently exists in the database or codebase.
4. **Dropdown Filtering for Proyek Menes**:  
   `ProjectCombobox.tsx` and `EditDispatchModal.tsx` currently do not filter projects by `status === 'ACTIVE'`. `ProjectFilterContext.tsx` loads all projects without status distinction. Marking `prj-menes` as `status: 'COMPLETED'` in Firestore combined with adding an active filter (`status === 'ACTIVE'`) in `DispatchForm.tsx`, `ProjectCombobox.tsx`, and `EditDispatchModal.tsx` will cleanly isolate Proyek Menes from operational dispatch dropdowns while preserving historical auditability.
5. **Company Debt Separation (Bpk. Pei Rp 18.000.000)**:  
   Per **Rule 104**, Bpk. Pei is strictly canceled as an investor and must have **zero presence in the `investors` collection**. His Rp 18.000.000 must be recorded in `cash_ledger` with an expanded `CashFlowType` (e.g. `'HUTANG_PIHAK_KETIGA'`), categorized as PT Patak Abadi Jaya corporate liability, with `investorId` and `projectId` omitted.

---

## 1. Firestore Initialization & Service Architecture

### 1.1 Firestore Configuration (`src/lib/firebase.ts`)
- **File**: `src/lib/firebase.ts`
- **Lines**: 22–28
```typescript
// Menentukan database id target (Sandbox vs Production) dengan fallback aman
const activeDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "pataklogisticdb";

// Inisialisasi database terisolasi
export const db = getFirestore(app, activeDatabaseId);
export const currentEnv = import.meta.env.VITE_APP_ENV || "development";
export const currentDbName = activeDatabaseId;
```
- **Compliance**: Follows **Rule 19** verbatim. `getFirestore(app, 'pataklogisticdb')` prevents fallback to default Firestore root.
- **Environment**: `.env` specifies `VITE_FIREBASE_DATABASE_ID=pataklogisticdb` and `VITE_FIREBASE_PROJECT_ID=antigravityapp-e305d`.

### 1.2 Directory & Service Layout Reality Check
The codebase structure uses `src/lib/` for all backend data access and services (there is no `src/services/` directory):
| Service File | Path | Key Operations | Current Seeding Hook |
|---|---|---|---|
| `projectService.ts` | `src/lib/projectService.ts` | CRUD projects, update project balance | `seedDefaultProjects()` (lines 141–216) |
| `investorService.ts` | `src/lib/investorService.ts` | CRUD investors, subscribe investors | None |
| `dispatcherService.ts` | `src/lib/dispatcherService.ts` | Dispatch CRUD, `cash_ledger` auto-mutations | `getMaterials()` auto-seeds default materials |
| `materialMasterService.ts` | `src/lib/materialMasterService.ts` | Rates, tariffs, route distance | `seedInitialMaterialData()` (lines 201–343) |
| `clientService.ts` | `src/lib/clientService.ts` | Master client CRUD, type detection | `getClients()` auto-seeds default clients |
| `databaseMasterService.ts` | `src/lib/databaseMasterService.ts` | Vehicles, drivers, quarries | None |
| `fundTransferService.ts` | `src/lib/fundTransferService.ts` | Inter-project cross-subsidies | None |
| `userManagementService.ts` | `src/lib/userManagementService.ts` | RBAC accounts & authentication | `seedInitialUsers()` (lines 47–98) |
| **`cashLedgerService.ts`** | **Missing** | **Does not exist** | Cash ledger operations are currently un-factored |

### 1.3 `cash_ledger` Current Usage & State
- In `src/types/database.ts` (lines 67–77):
```typescript
export type CashFlowType = 'MODAL_AWAL' | 'TOPUP_MODAL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PELUNASAN_PIUTANG';

export interface CashLedgerEntry {
  id: string;
  date: string;
  type: CashFlowType;
  amount: number;            // Nominal mutasi
  isCredit: boolean;         // true = Kas Masuk (+), false = Kas Keluar (-)
  runningBalance: number;    // Saldo berjalan (BISA BERNILAI MINUS)
  referenceId?: string;      // ID transaksi ritase terkait (jika ada)
  description: string;
  createdByName: string;
}
```
- In `src/lib/dispatcherService.ts`:
  - `getLatestCashBalance()` (lines 79–92): Reads most recent `runningBalance` sorted by `date desc`.
  - `createDispatchTransaction()` (lines 171–201): Adds `'BELI_MATERIAL'` and `'BIAYA_OPERASIONAL'` debit entries when a ticket is created.
  - `settleTransaction()` (lines 254–260): Adds `'PELUNASAN_PIUTANG'` credit entry when a ticket is settled.
- In `src/components/dashboard/DashboardPage.tsx` (lines 79–90):
  - Subscribes to `cash_ledger` with `limit(50)` to display recent cash ledger entries and compute current cash balances.
- In `src/App.tsx` (lines 206–225):
  - Tab `cash_ledger` renders only a placeholder information card.

---

## 2. Existing Seeding Scripts & Live Database Audit

### 2.1 Audit of Existing Seed Functions in Codebase

#### A. `seedDefaultProjects()` (`src/lib/projectService.ts:141-216`)
Triggered automatically on mount by `ProjectFilterContext.tsx:36`:
```typescript
export async function seedDefaultProjects(): Promise<void> {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const snap = await getDocs(colRef);
  if (!snap.empty) {
    return; // Already has data, aborts without updates
  }
  // Seeds 3 mock projects:
  // 1. prj-situ-cikedal ("Proyek Situ Cikedal", investorId: "inv-situ-cikedal", initialDeposit: 50.000.000)
  // 2. prj-menes ("Proyek Menes", investorId: "inv-menes", initialDeposit: 50.000.000)
  // 3. prj-cipeucang ("Proyek Cipeucang", investorId: "inv-cipeucang", initialDeposit: 50.000.000)
  // And seeds 3 dummy investors ("Investor A", "Investor B", "Investor C")
}
```
**Defects Identified**:
1. Uses obsolete naming: `"Proyek Situ Cikedal"` instead of `"Proyek Konservasi Situ Cikedal"`; `"Proyek Cipeucang"` instead of `"Proyek Irigasi Cipeucang"`.
2. Sets Proyek Menes as `status: 'ACTIVE'`.
3. Seeds three dummy investors with Rp 50.000.000 each instead of the single real active investor **Bpk. Yadi** (Rp 30.000.000).
4. Guard condition `if (!snap.empty) return;` prevents updating existing records when data already exists.

#### B. `seedInitialMaterialData()` (`src/lib/materialMasterService.ts:201-343`)
Triggered on mount by `MasterMaterialPage.tsx:128`:
- Seeds 5 default quarry rates into `quarry_material_rates`.
- Seeds 6 default route operating tariffs into `route_tariffs` connecting `qry-batu-mandiri` and `qry-pasir-sakti` to `prj-situ-cikedal`, `prj-menes`, and `prj-cipeucang`.

#### C. `seedInitialUsers()` (`src/lib/userManagementService.ts:47-98`)
Triggered on mount by `LoginPage.tsx:42`:
- Seeds `usr-fatih-patak-dev` (`fatih@patak.dev`, role `developer`).
- Seeds `usr-founder-patak-id` (`founder@patak.id`, role `founder`).
- Seeds `usr-administrator-patak-id` (`administrator@patak.id`, role `admin`).

### 2.2 Live Firestore Inspection Results (`pataklogisticdb`)
Directly executed via node inspection script on `pataklogisticdb`:

| Collection | Doc Count | Existing Document Details | Notes |
|---|---|---|---|
| `investors` | **0** | None | Empty collection |
| `projects` | **3** | `prj-cipeucang` (50M, active, Investor C)<br>`prj-menes` (50M, active, Investor B)<br>`prj-situ-cikedal` (50M, active, Investor A) | Created 2026-10-30T06:20:51Z by old seeder |
| `cash_ledger` | **0** | None | Empty collection |
| `transactions` | **0** | None | Clean slate |
| `system_users` | **3** | Developer, Founder, Administrator | Fully active & configured |
| `quarry_material_rates` | **10** | Rates for Batu Belah, Pasir Extra, Makadam, Abu Batu | Seeded |
| `route_tariffs` | **11** | Tariffs for Situ Cikedal, Menes, Cipeucang | Seeded |
| `fund_transfers` | **0** | None | Clean slate |
| `materials` | **4** | Batu Belah, Pasir Extra, Abu Batu, Makadam | Seeded |
| `clients` | **0** | None | Will auto-seed on first fetch |
| `master_vehicles` | **0** | None | Clean slate |
| `master_drivers` | **0** | None | Clean slate |
| `master_quarries` | **0** | None | Clean slate |

---

## 3. Project Retrieval & Dropdown Filtering for 'Proyek Menes'

### 3.1 Codebase Survey of Project Retrieval
Projects are retrieved and consumed across the following touchpoints:

1. **Global Context Provider (`src/context/ProjectFilterContext.tsx:38-44`)**:
   - Subscribes to `projects` via `subscribeProjects` and exposes `projects: Project[]`.
   - Also handles role-based locking: if role is `'investor'`, locks `selectedProjectId` to `userData.investorId`.
2. **Dispatch Form (`src/components/dispatcher/DispatchForm.tsx:57, 577-584`)**:
   ```tsx
   const { projects, selectedProjectId: globalProjectId, isDispatcherUser } = useProjectFilter();
   ...
   <ProjectCombobox
     projects={projects}
     selectedProjectId={formProjectId}
     selectedProjectName={formProjectName}
     onSelect={handleSelectProject}
     placeholder="Pilih proyek tujuan (atau pilih klien manual di bawah)..."
     variant="solid-white"
   />
   ```
3. **Project Combobox Component (`src/components/ui/ProjectCombobox.tsx:58-66`)**:
   ```tsx
   const filteredProjects = useMemo(() => {
     if (!query.trim()) return projects;
     const q = query.toLowerCase().trim();
     return projects.filter(
       item =>
         item.name.toLowerCase().includes(q) ||
         (item.clientName && item.clientName.toLowerCase().includes(q))
     );
   }, [projects, query]);
   ```
   **Observation**: Filters only by text query on `item.name` and `item.clientName`. Does NOT filter by `status === 'ACTIVE'`.
4. **Edit Dispatch Modal (`src/components/dispatcher/EditDispatchModal.tsx:33, 280-288`)**:
   ```tsx
   const { projects, isDispatcherUser, isInvestorUser } = useProjectFilter();
   ...
   <select
     value={projectId}
     onChange={handleProjectChange}
   >
     <option value="">-- Pilih Proyek Tujuan --</option>
     {projects.map(p => (
       <option key={p.id} value={p.id}>
         {p.name}
       </option>
     ))}
   </select>
   ```
   **Observation**: Directly maps `projects.map()` without status filtering.
5. **Header Switcher (`src/components/layout/AppShell.tsx:172-183`)**:
   ```tsx
   <CustomSelectCombobox
     options={[
       ...(!isInvestorUser ? [{ id: 'ALL', label: 'Semua Proyek (Global)' }] : []),
       ...projects.map(p => ({ id: p.id, label: p.name }))
     ]}
     value={selectedProjectId}
     onChange={val => setSelectedProjectId(val)}
   />
   ```

### 3.2 Strategy to Exclude 'Proyek Menes' from Dispatch Dropdowns

To guarantee complete compliance with **Rule 104** and Acceptance Criteria:
1. **Firestore Database Level**:
   Update `prj-menes`:
   - `status: 'COMPLETED'`
   - `notes: 'Proyek dinonaktifkan sementara (tidak muncul di dropdown ritase lapangan)'`
2. **Component Level**:
   - In `src/components/ui/ProjectCombobox.tsx`:
     Add prop `activeOnly?: boolean` defaulting to `true` (or filter `p.status === 'ACTIVE'` when rendering choices).
     ```typescript
     const candidateProjects = activeOnly ? projects.filter(p => p.status === 'ACTIVE') : projects;
     ```
   - In `src/components/dispatcher/DispatchForm.tsx`:
     Pass only active projects:
     ```typescript
     const activeProjects = useMemo(() => projects.filter(p => p.status === 'ACTIVE'), [projects]);
     ```
   - In `src/components/dispatcher/EditDispatchModal.tsx`:
     Allow selecting active projects OR the project currently assigned to the transaction (to prevent broken references if editing legacy records):
     ```typescript
     const availableProjects = useMemo(() => 
       projects.filter(p => p.status === 'ACTIVE' || p.id === transaction.projectId),
       [projects, transaction.projectId]
     );
     ```
   - In `src/context/ProjectFilterContext.tsx`:
     Export `activeProjects: Project[]` alongside `projects: Project[]` so any future component has standard access to active-only projects.

---

## 4. Company Debt Separation (`cash_ledger` & Bpk. Pei)

### 4.1 Legal & Operational Boundary (Rule 104)
Per **Rule 104** (lines 1176–1180):
- **Bpk. Pei status**: Canceled as a project ritase investor.
- **Nature of Rp 18.000.000**: Strictly a **Third-Party Corporate Loan / Liability** of PT Patak Abadi Jaya.
- **Strict Prohibition**: **FORBIDDEN** to record Bpk. Pei in the `investors` table or associate him with dispatch transactions. Bpk. Pei has NO right to volume-based ritase profit-sharing.
- **General Ledger Location**: Recorded directly in PT Patak Abadi Jaya's general cash ledger (`cash_ledger`). Repayments will be serviced from PT Patak's internal retained net profits, entirely separate from Bpk. Yadi's project working capital.

### 4.2 Data Model Extension for `CashFlowType`
In `src/types/database.ts`:
```typescript
export type CashFlowType = 
  | 'MODAL_AWAL' 
  | 'TOPUP_MODAL' 
  | 'BELI_MATERIAL' 
  | 'BIAYA_OPERASIONAL' 
  | 'PELUNASAN_PIUTANG'
  | 'HUTANG_PIHAK_KETIGA'  // Pinjaman dana pihak ketiga (Liabilitas Perseroan PT)
  | 'CICILAN_HUTANG';      // Pelunasan / cicilan hutang perseroan ke pihak ketiga
```

### 4.3 Seeding Specification in `cash_ledger`
When migrating and seeding clean production cash ledger entries, two baseline entries must be established:

#### Entry 1: Bpk. Yadi Revolving Capital (Rp 30.000.000)
- **Collection**: `cash_ledger`
- **Document ID**: `csh-init-yadi-capital`
- **Fields**:
  - `date`: `2026-10-30T00:00:00.000Z`
  - `type`: `'MODAL_AWAL'`
  - `amount`: `30000000`
  - `isCredit`: `true`
  - `runningBalance`: `30000000`
  - `referenceId`: `'INV-BPK-YADI'`
  - `description`: `'Penyetoran Modal Awal Kerja Bergulir - Bpk. Yadi (Mendanai Situ Cikedal & Cipeucang)'`
  - `createdByName`: `'fatih@patak.dev'`

#### Entry 2: Bpk. Pei Corporate Loan Liability (Rp 18.000.000)
- **Collection**: `cash_ledger`
- **Document ID**: `csh-init-pei-liability`
- **Fields**:
  - `date`: `2026-10-30T00:01:00.000Z`
  - `type`: `'HUTANG_PIHAK_KETIGA'`
  - `amount`: `18000000`
  - `isCredit`: `true`
  - `runningBalance`: `48000000`
  - `referenceId`: `'DEBT-BPK-PEI-001'`
  - `description`: `'Penerimaan Pinjaman Pihak Ketiga (Liabilitas Perseroan PT Patak Abadi Jaya) - Bpk. Pei (Batal Investor Ritase)'`
  - `createdByName`: `'fatih@patak.dev'`

#### Verifiable Isolation Verification
1. `investors` collection contains ONLY `inv-bpk-yadi`. Querying `investors` will return 0 records for Bpk. Pei.
2. In `src/components/investors/InvestorsPage.tsx`, Bpk. Pei will never appear because the page subscribes directly to `investors`.
3. In `DispatchTransaction`, `investorId` will only point to `inv-bpk-yadi` (or null), never Bpk. Pei.
4. If a corporate debt tracking tab/card is introduced under `cash_ledger` in the future, it queries `cash_ledger` where `type === 'HUTANG_PIHAK_KETIGA'` or `referenceId.startsWith('DEBT-')`.

---

## 5. Master Data Seeding Implementation Plan

### 5.1 Clean Target Master Data Specification

#### A. Master Investor (`investors`)
| Field | Value | Notes |
|---|---|---|
| `id` | `inv-bpk-yadi` | Primary Key |
| `name` | `Bpk. Yadi` | PUEBI formatted per Rule 102 |
| `phoneNumber` | `+62 812-8899-7766` | E.164 formatted per Rule 101 |
| `bankAccount` | `BCA 8830-192-881 a.n. Yadi` | Formal banking info |
| `initialCapital` | `30000000` | Rp 30.000.000 working capital |
| `notes` | `Pemodal aktif tunggal perseroan untuk mendanai Proyek Situ Cikedal & Proyek Irigasi Cipeucang.` | Audit note |
| `createdAt` | `2026-10-30T00:00:00.000Z` | Standard ISO |

#### B. Master Projects (`projects`)
| Document ID | `name` | `location` | `investorId` | `investorName` | `initialDeposit` | `currentBalance` | `status` |
|---|---|---|---|---|---|---|---|
| `prj-situ-cikedal` | `Proyek Konservasi Situ Cikedal` | `Kec. Cikedal, Pandeglang` | `inv-bpk-yadi` | `Bpk. Yadi` | `15000000` | `15000000` | `ACTIVE` |
| `prj-cipeucang` | `Proyek Irigasi Cipeucang` | `Kec. Cipeucang, Pandeglang` | `inv-bpk-yadi` | `Bpk. Yadi` | `15000000` | `15000000` | `ACTIVE` |
| `prj-menes` | `Proyek Menes` | `Kec. Menes, Pandeglang` | `inv-bpk-yadi` | `Bpk. Yadi` | `0` | `0` | `COMPLETED` |

*Note on Capital Allocation*: Bpk. Yadi's Rp 30.000.000 revolving capital is split as Rp 15.000.000 for Situ Cikedal and Rp 15.000.000 for Cipeucang (total Rp 30.000.000), while Menes is set to 0 and marked `status: 'COMPLETED'`.

#### C. Route Operating Tariffs Alignment (`route_tariffs`)
The existing tariffs in `materialMasterService.ts` currently reference `Proyek Situ Cikedal` and `Proyek Cipeucang`. The seeding script should update their `projectName` fields to:
- `Proyek Konservasi Situ Cikedal`
- `Proyek Irigasi Cipeucang`

### 5.2 Seeding Script Architecture

A single idempotent script/service should be provided:
`scripts/seed_production_master_data.mjs` (and an equivalent function in `src/lib/databaseMasterService.ts` or `src/lib/projectService.ts`):
1. **Clean up dummy investors**: Delete `inv-situ-cikedal`, `inv-menes`, `inv-cipeucang` if present.
2. **Upsert Bpk. Yadi**: Write `inv-bpk-yadi` with Rp 30.000.000 initial capital.
3. **Upsert Projects**: Overwrite `prj-situ-cikedal`, `prj-cipeucang`, and `prj-menes` with official names and status.
4. **Seed Cash Ledger Baseline**:
   - Check if `csh-init-yadi-capital` exists; if not, write Bpk. Yadi credit entry.
   - Check if `csh-init-pei-liability` exists; if not, write Bpk. Pei credit entry.
5. **Update Route Tariffs**: Ensure names match `Proyek Konservasi Situ Cikedal` and `Proyek Irigasi Cipeucang`.

---

## 6. Concrete File Paths & Line Numbers

| File | Lines | Description of Current State & Needed Change |
|---|---|---|
| `src/types/database.ts` | 3 | Add `'HUTANG_PIHAK_KETIGA' \| 'CICILAN_HUTANG'` to `CashFlowType`. |
| `src/lib/projectService.ts` | 141–216 | Update `seedDefaultProjects()` to seed Bpk. Yadi, Situ Cikedal, Cipeucang, and Menes as completed. |
| `src/components/ui/ProjectCombobox.tsx` | 58–66 | Add filter `item.status === 'ACTIVE'` when matching dropdown options. |
| `src/components/dispatcher/DispatchForm.tsx` | 57–60 | Filter `projects.filter(p => p.status === 'ACTIVE')` before passing to `ProjectCombobox`. |
| `src/components/dispatcher/EditDispatchModal.tsx` | 280–288 | Filter `projects.filter(p => p.status === 'ACTIVE' \|\| p.id === transaction.projectId)`. |
| `src/lib/materialMasterService.ts` | 275–330 | Update `defaultRoutes` project names to official names (`Proyek Konservasi Situ Cikedal`, `Proyek Irigasi Cipeucang`). |
| `src/lib/cashLedgerService.ts` | (New) | Implement dedicated service for cash ledger subscriptions and debt entry logging. |

---

## 7. Potential Pitfalls & Gotchas

1. **Idempotence & Guard Conditions**:
   `seedDefaultProjects()` in `projectService.ts` checks `if (!snap.empty) return;`. Because Firestore already has 3 documents in `projects`, calling `seedDefaultProjects()` directly will NOT update the data. The implementer must use `setDoc(docRef, data, { merge: true })` by deterministic document ID (`prj-situ-cikedal`, `prj-cipeucang`, `prj-menes`) instead of bailing out on `!snap.empty`.
2. **Duplicate Route Tariffs**:
   `seedInitialMaterialData()` generates random IDs like `RTE-${Date.now()}-${random}`. Currently, the live database has 11 route tariff documents with duplicates. When updating route tariffs, the implementer should query by `quarryId` and `projectId` to avoid piling up further duplicate documents.
3. **Running Balance Sequencing**:
   `getLatestCashBalance()` relies on `orderBy('date', 'desc')`. When inserting multiple baseline ledger entries (Bpk. Yadi capital + Bpk. Pei debt), ensure their `date` timestamps are distinct (e.g. 1 second apart) and running balances are correctly computed (`30000000` then `48000000`).
4. **Header Project Switcher UX**:
   If `selectedProjectId` in `ProjectFilterContext` defaults to `'ALL'` or a project that is completed (`prj-menes`), ensure the switcher defaults to `'ALL'` or the first active project (`prj-situ-cikedal`).
5. **No Lucide Icons Standard**:
   Ensure any new UI icons strictly use Icons8 monokrom (`/icons/*.png` or SVG) per Rule 10b.
