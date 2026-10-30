## 2026-10-30T07:22:14Z

You are Worker 3 implementing Milestone 3 & Milestone 4: Strict RBAC Privacy Isolation & Design Compliance for Patak Logistics System.
Your working directory is: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/worker_m3_m4
You MUST read ORIGINAL_REQUEST.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/ORIGINAL_REQUEST.md
Also read PROJECT.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/PROJECT.md
Also read Explorer 3's handoff report at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_3/handoff.md
And review workspace rules in: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/RULES.md (especially Rule 104, Rules 80, 85, 95, 98, 99, 100, 101, 102, 103, Rule 4, Rule 5/6, Rule 87).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Write Ownership (files you own exclusively):
- src/components/database/DatabasePage.tsx
- src/components/projects/ProjectsPage.tsx
- src/components/dispatcher/DispatchForm.tsx
- src/components/materials/MasterMaterialPage.tsx
- src/components/ui/ClientCombobox.tsx
- src/components/ui/ProjectCombobox.tsx
- src/components/ui/QuarryCombobox.tsx
- src/components/layout/AppShell.tsx
- src/components/dispatcher/EditDispatchModal.tsx
- src/App.tsx

Specific Implementation Tasks:
1. Strict RBAC Isolation on `DatabasePage.tsx`:
   - Import `useProjectFilter` and retrieve `isDispatcherUser`.
   - In subtab `ritase`:
     - Wrap the financial metric cards `Total Belanja Kuari` and `Estimasi Laba Bersih` in `{!isDispatcherUser && ...}`.
     - In the table header and body cells, wrap `Belanja Kuari` and `Laba Bersih` in `{!isDispatcherUser && ...}` so dispatchers only see operational data (No Tiket, Tanggal, Plat, Supir, Proyek, Konsumen, Kuari, Material, Muatan, Status).
     - Add `Proyek Tujuan` (`tx.projectName`) column so field operators see destination project.
     - Remove colored status indicator dots on lines 734 & 739 (`<span className="w-1.5 h-1.5 rounded-full ...">`) to comply with Rule 4 (pure typography text only).
2. Strict RBAC Isolation on `ProjectsPage.tsx`:
   - Import `isDispatcherUser` from `useProjectFilter`.
   - When `isDispatcherUser` is true:
     - Hide the financial metric cards (`Total Modal Disetor`, `Total Saldo Kas Berjalan`) or display operational stats (e.g. Total Proyek, Proyek Aktif).
     - In the table header and body rows, hide `Investor Pendana`, `Modal Awal Disetor`, and `Saldo Kas Berjalan`. Show only Proyek, Lokasi, Klien / Pemilik, Status, and Aksi.
     - In the Add/Edit Project Modal, hide investor selection and modal deposit fields from dispatchers.
3. Mask Buy Price and Investor Profile in `DispatchForm.tsx`:
   - Under Section 4 (Finansial & Operasional): Hide `Beli Kuari / {unit} (Cash)` input for dispatchers (`{!isDispatcherUser && ...}`). When hidden, auto-fill `buyPricePerUnit` from `QuarryMaterialRate.buyPriceCash` or default reference price so backend calculations remain intact without exposing buy price to dispatchers.
   - Under Section 2 (Lokasi & Mitra): Hide `Investor: {selectedProject?.investorName}` for dispatchers (`{!isDispatcherUser && ...}`) to fulfill Requirement R3 (dispatchers have zero visibility into investor profiles).
4. Mask Quarry Buy Prices in `MasterMaterialPage.tsx`:
   - In `MasterMaterialPage.tsx`, retrieve `isDispatcherUser`.
   - If `isDispatcherUser` is true, hide the `harga_kuari` sub-tab (or mask `buyPriceCash` columns) so quarry procurement prices are hidden from field operators.
5. Fix Initial Tab and Route Protection in `src/App.tsx`:
   - Ensure dispatchers default to `'dispatcher'` tab upon login/mount, NOT `'dashboard'` (which exposes cash balances).
   - In `handleSelectTab`, if `isDispatcherUser` is true, prevent navigating to `'dashboard'`, `'investors'`, or `'cash_ledger'`, redirecting to `'dispatcher'`.
   - Management roles (`developer`, `founder`, `admin`): retain full unrestricted oversight over all tabs (`dashboard`, `dispatcher`, `projects`, `investors`, `quarries`, `clients`, `materials`, `cash_ledger`, `recap`, `database`, `dev`).
6. Design & Formatting Standards Compliance (Milestone 4):
   - In `src/components/ui/ClientCombobox.tsx`, `ProjectCombobox.tsx`, and `QuarryCombobox.tsx`: Add `/icons/search.png` to search input fields (`pl-9`, `absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none`) per Rule 98.
   - In `src/components/layout/AppShell.tsx`: Replace `backdrop-blur-md` with solid flat surface (`bg-white border-b border-[#eaeaea]`) per Rule 5, 26, 30.
   - In `src/components/dispatcher/EditDispatchModal.tsx`: Eliminate any remaining native select tags or blur classes per Rule 6 & 87.
7. Verification:
   - Run `npx tsc -b` (must pass with 0 errors).
   - Run `npm run build` (must pass cleanly).
