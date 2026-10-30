## 2026-10-30T07:09:37Z
You are Worker 2 implementing Milestone 2: Field Operator Transaction Journal & Periodic Recap for Patak Logistics System.
Your working directory is: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/worker_m2
You MUST read ORIGINAL_REQUEST.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/ORIGINAL_REQUEST.md
Also read PROJECT.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/PROJECT.md
Also read Explorer 2's handoff report at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_2/handoff.md
And review workspace rules in: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/RULES.md (especially Rule 104, Rules 98-99, Rule 26, Rule 30).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Write Ownership (files you own exclusively):
- src/types/database.ts (adding suratJalan)
- src/lib/dispatcherService.ts (handling suratJalan)
- src/components/dispatcher/DispatchForm.tsx (adding suratJalan input)
- src/components/dispatcher/EditDispatchModal.tsx (adding suratJalan input)
- src/components/recap/RecapPage.tsx (new file)
- src/App.tsx (mounting RecapPage)
- src/components/layout/Sidebar.tsx (updating dispatcher tab whitelist)

Specific Implementation Tasks:
1. Schema & Service Extension:
   - In `src/types/database.ts`, add `suratJalan?: string;` to `DispatchTransaction`.
   - In `src/lib/dispatcherService.ts`, include `suratJalan: payload.suratJalan?.trim() || null` in transaction creation and updates.
   - Also export a helper in `dispatcherService.ts` or `recapService.ts` to subscribe/query all transactions across date ranges (e.g. `subscribeAllTransactions(callback)`).
2. Input Form Integration:
   - In `src/components/dispatcher/DispatchForm.tsx`, add an input for "No. Surat Jalan" (`suratJalan`) under Section 1 (Waktu & Armada Truk) or Section 3 alongside ticket information. Use solid white filled input style with Title Case / standard placeholder (e.g. "Contoh: SJ-00123").
   - In `src/components/dispatcher/EditDispatchModal.tsx`, add an input field for "No. Surat Jalan".
3. Build `src/components/recap/RecapPage.tsx`:
   - Header: Clean title "Rekapitulasi Periode" (no subtitle, Rule 88).
   - If user is management (`isManagementUser`), provide 2 sub-tabs: "Jurnal & Rekap Operasional" and "Rekapitulasi Finansial".
   - If user is dispatcher (`isDispatcherUser`), show ONLY "Jurnal & Rekap Operasional" (zero financial sub-tab, zero profit margin exposure).
   - Operational Journal Sub-tab (`volume`):
     - Operational Cycle Filter: Provide options for:
       - "14 Hari (2 Minggu)" (Default / Papah's operational cycle)
       - "60 Hari (2 Bulan)" (Papah's periodic evaluation cycle)
       - "Hari Ini"
       - "7 Hari Terakhir"
       - "Bulan Ini"
       - "Semua Periode"
     - Additional filters: Proyek Tujuan (`ProjectCombobox` or custom dropdown), Kuari Asal, Jenis Material, Status Pembayaran (`Semua | TEMPO | LUNAS`), dan Searchbar dengan ikon `/icons/search.png` (Rule 98).
     - Metric Cards (Rule 99: sans-serif bold `font-bold tracking-tight`, strictly no `font-mono`):
       1. Total Ritase (jumlah trip)
       2. Total Volume DT (Dump Truck 6 m³) — format angka desimal/bulat + satuan "DT"
       3. Total Volume Ton (Timbangan kuari) — format angka desimal/bulat + satuan "Ton"
       - NEVER sum DT + Ton together. Keep them clearly separated.
     - Operational Logistics Table:
       Columns:
       1. Tanggal Jalan (`deliveryDate` - JetBrains Mono)
       2. No. Tiket (`ticketNumber` - JetBrains Mono)
       3. No. Surat Jalan (`suratJalan || '—'` - JetBrains Mono)
       4. Plat Truk (`truckPlate` - JetBrains Mono)
       5. Supir (`driverName`)
       6. Proyek Tujuan (`projectName`)
       7. Kuari Asal (`quarryName`)
       8. Material (`materialName`)
       9. Volume (`quantity` + `unit`)
       10. Status (`TEMPO` / `LUNAS` — pure text typography, NO colored badges/pills/dots per Rule 4/24).
     - Financial Margin Isolation: For dispatchers, strictly NO quarry purchase costs (`buyPrice`, `totalBuyCost`) or net profit (`netProfit`) are rendered anywhere on this page.
   - Financial Recap Sub-tab (`financial` - for management only):
     - Displays Omset Penjualan, Belanja Pokok Kuari, Biaya Operasional Solar/Sopir, and Laba Bersih Perseroan with `<MetricCardCurrency />`.
4. Integration in `App.tsx` & `Sidebar.tsx`:
   - In `src/App.tsx`, import `RecapPage` and render it when `currentTab === 'recap'` (replacing the placeholder card).
   - In `src/components/layout/Sidebar.tsx:308`, update `isDispatcherUser` allowed tabs to include `'recap'`:
     `if (isDispatcherUser && !['dispatcher', 'projects', 'quarries', 'clients', 'materials', 'database', 'recap'].includes(item.id)) { return null; }`
5. Verification:
   - Run `npx tsc -b` to verify 0 TypeScript errors.
   - Run `npm run build` to verify clean production build.
   - Document all changes, files touched, and test outputs in `handoff.md`. Use `send_message` when done.
