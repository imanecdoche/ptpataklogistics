## 2026-10-30T06:58:07Z
You are Worker 1 implementing Milestone 1: Production Master Data Migration & Seeding for Patak Logistics System.
Your working directory is: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/worker_m1
You MUST read ORIGINAL_REQUEST.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/ORIGINAL_REQUEST.md
Also read PROJECT.md at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/PROJECT.md
Also read Explorer 1's handoff report at: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/explorer_survey_1/handoff.md
And review workspace rules in: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/RULES.md (especially Rule 104).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Write Ownership (files you own exclusively):
- src/types/database.ts
- src/lib/cashLedgerService.ts
- src/lib/projectService.ts
- src/lib/investorService.ts
- src/components/ui/ProjectCombobox.tsx
- src/components/dispatcher/DispatchForm.tsx (project filtering)
- src/components/dispatcher/EditDispatchModal.tsx (project filtering)
- scripts/migrate_master_data.mjs

Specific Implementation Tasks:
1. Extend `CashFlowType` in `src/types/database.ts`:
   Add `'HUTANG_PIHAK_KETIGA' | 'CICILAN_HUTANG'` to `CashFlowType`.
2. Formalize `src/lib/cashLedgerService.ts`:
   Provide functions to record cash ledger entries, calculate running balance, and query corporate debt entries.
3. Update `seedDefaultProjects` in `src/lib/projectService.ts` and `seedDefaultInvestors` in `src/lib/investorService.ts`:
   - Single active investor: "Bpk. Yadi" (`id: 'inv-bpk-yadi'`, `initialCapital: 30000000`, active balance Rp 30.000.000, `bankAccount: "BCA - Rekening Investor Bpk. Yadi"`, linked to fund both active projects).
   - Exactly 2 active operational projects:
     1. "Proyek Konservasi Situ Cikedal" (`id: 'prj-situ-cikedal'`, `location: "Kec. Cikedal, Pandeglang"`, `status: 'ACTIVE'`, `investorId: 'inv-bpk-yadi'`, `investorName: 'Bpk. Yadi'`).
     2. "Proyek Irigasi Cipeucang" (`id: 'prj-cipeucang'`, `location: "Kec. Cipeucang, Pandeglang"`, `status: 'ACTIVE'`, `investorId: 'inv-bpk-yadi'`, `investorName: 'Bpk. Yadi'`).
   - "Proyek Menes" (`id: 'prj-menes'`): mark as `status: 'COMPLETED'` so it is preserved in history but inactive for new dispatches.
   - Company Debt Separation: Record the Rp 18.000.000 liability to Bpk. Pei strictly as company debt / third-party loan under PT Patak Abadi Jaya's general ledger (`cash_ledger`), with `type: 'HUTANG_PIHAK_KETIGA'`, `amount: 18000000`, `description: "Pinjaman Pihak Ketiga / Hutang Perseroan Bpk. Pei"`, strictly excluded from project investor tables and ritase profit sharing.
   - Also record Bpk. Yadi's initial capital in `cash_ledger` with `type: 'MODAL_AWAL'`, `amount: 30000000`, `description: "Setoran Modal Awal Investor Bpk. Yadi"`.
4. Project Dropdown Filtering:
   - In `src/components/ui/ProjectCombobox.tsx`, filter items so that only projects with `p.status === 'ACTIVE'` are shown in dropdown options.
   - In `src/components/dispatcher/DispatchForm.tsx` and `src/components/dispatcher/EditDispatchModal.tsx`, ensure project selection options only include active projects so "Proyek Menes" does not appear in dispatch input dropdowns.
5. Create and run `scripts/migrate_master_data.mjs` using node to perform the live upsert / migration on Firestore `pataklogisticdb`. Verify with `inspect_firestore.mjs` that:
   - `investors` has only Bpk. Yadi.
   - `projects` has Situ Cikedal & Cipeucang as ACTIVE, and Menes as COMPLETED.
   - `cash_ledger` has Bpk. Pei Rp 18M debt as HUTANG_PIHAK_KETIGA and Bpk. Yadi Rp 30M as MODAL_AWAL.
6. Run `npx tsc -b` to verify 0 errors.

Report your changes, commands run, and verification outputs in `handoff.md`. Use `send_message` when done.
