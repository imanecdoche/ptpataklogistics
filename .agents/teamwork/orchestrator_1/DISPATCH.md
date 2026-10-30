# Dispatch Assignment

## 2026-10-30T06:42:28Z
You are the Project Orchestrator for the Patak Logistics System project.
Your working directory is: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/orchestrator_1
Project root: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System
The authoritative user request is recorded in: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System/.agents/teamwork/ORIGINAL_REQUEST.md

Please review ORIGINAL_REQUEST.md and .agents/RULES.md.
Decompose and orchestrate the task across specialists:
1. Production Master Data Migration & Seeding:
   - Clean real-world operational data into Firestore `pataklogisticdb`.
   - Single active investor "Bpk. Yadi" with Rp 30.000.000 initial capital / active balance, linked to fund both active projects.
   - Master Projects: exactly 2 active operational projects: "Proyek Konservasi Situ Cikedal" (Kec. Cikedal, Pandeglang) and "Proyek Irigasi Cipeucang" (Kec. Cipeucang, Pandeglang).
   - Deactivate / mark "Proyek Menes" as inactive/completed so it does not appear in dispatch input dropdowns.
   - Record Rp 18.000.000 liability to Bpk. Pei strictly as company debt / third-party loan under PT Patak Abadi Jaya's general ledger (`cash_ledger`), strictly excluded from project investor tables and ritase profit sharing.
2. Field Operator Transaction Journal & Periodic Recap:
   - Implement and verify dedicated operational transaction journal view accessible to field operators and dispatchers.
   - Enable filtering and aggregation by flexible operational cycles (specifically 2-week and 2-month periods as mandated in Papah's audio guidance).
   - Display operational logistics data: dispatch tickets, waybills, license plates, driver names, commodity types, quarry origin, destination project, cubic/tonnage volumes.
3. Strict Role-Based Privacy & Access Control (RBAC):
   - Enforce strict field isolation between field operators and company management.
   - Dispatcher and field operator roles must have zero visibility into investor capital, investor profiles, profit margins, internal cash balances, or shareholder dividence.
   - Management roles (`founder`, `developer`, `admin`) retain full visibility and oversight over all financial ledgers, debt obligations, investor equity, and company margins.
4. Complete Compliance with Design & Formatting Rules:
   - Comply with all workspace rules in .agents/RULES.md (PhoneInput, title casing, CurrencyInput, MetricCardCurrency, icons/search.png, naked icons, Icons8 standard, etc.).
5. Ensure system stability: `npx tsc -b` passes with 0 errors and `npm run build` succeeds.

Maintain plan.md, progress.md, and BRIEFING.md in your working directory.
When finished and verified, report completion back to the Sentinel.
