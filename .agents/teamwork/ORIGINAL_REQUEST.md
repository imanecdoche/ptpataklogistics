# Original User Request

## 2026-10-30T06:41:09Z

Migrate Patak Logistics System to clean production master data with a single active investor (Bpk. Yadi - Rp 30.000.000) funding two operational projects (Proyek Konservasi Situ Cikedal & Proyek Irigasi Cipeucang), record PT company liability to Bpk. Pei (Rp 18.000.000) outside project equity, and implement privacy-controlled transaction journals for field operators.

Working directory: /media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System
Integrity mode: development

## Requirements

### R1. Production Master Data Migration & Seeding
Migrate and seed clean real-world operational data into Firestore `pataklogisticdb`:
- Master Investor: Single active investor "Bpk. Yadi" with Rp 30.000.000 initial capital / active balance, linked to fund both active projects.
- Master Projects: Exactly 2 active operational projects:
  1. "Proyek Konservasi Situ Cikedal" (Kec. Cikedal, Pandeglang)
  2. "Proyek Irigasi Cipeucang" (Kec. Cipeucang, Pandeglang)
- Project Deactivation: Deactivate or mark "Proyek Menes" as inactive/completed so it does not appear in dispatch input dropdowns.
- Company Debt Separation: Record the Rp 18.000.000 liability to Bpk. Pei strictly as a company debt / third-party loan under PT Patak Abadi Jaya's general ledger (`cash_ledger`), strictly excluded from project investor tables and ritase profit sharing.

### R2. Field Operator Transaction Journal & Periodic Recap (Papah's Mandate)
Implement and verify a dedicated operational transaction journal view accessible to field operators and dispatchers:
- Enable filtering and aggregation by flexible operational cycles (specifically 2-week and 2-month periods as mandated in Papah's audio guidance).
- Display operational logistics data: dispatch tickets, waybills, license plates, driver names, commodity types, quarry origin, destination project, and cubic/tonnage volumes.

### R3. Strict Role-Based Privacy & Access Control (RBAC)
Enforce strict field isolation between field operators and company management:
- Dispatcher and field operator roles must have zero visibility into investor capital, investor profiles, profit margins, internal cash balances, or shareholder dividence.
- Management roles (`founder`, `developer`, `admin`) retain full visibility and oversight over all financial ledgers, debt obligations, investor equity, and company margins.

### R4. Complete Compliance with Design & Formatting Rules
Ensure all newly migrated data and UI components comply with workspace rules:
- Phone numbers standardized with `+62 8xx-xxxx-xxxx` and `<PhoneInput />` (Rule 101).
- Entity and personal names auto-formatted to PUEBI Title Case with capitalized legal forms (`PT`, `CV`, `UD`, `KM`, `Tbk`) (Rule 102).
- Currency inputs using `<CurrencyInput />` and metric cards using `<MetricCardCurrency />` with sans-serif bold typography (Rule 103, Rule 99).
- Search fields equipped with `/icons/search.png` (Rule 98).

## Acceptance Criteria

### Master Data & Seeding Integrity
- [ ] Firestore collection `investors` contains only Bpk. Yadi as active investor with Rp 30.000.000.
- [ ] Firestore collection `projects` has "Proyek Konservasi Situ Cikedal" and "Proyek Irigasi Cipeucang" active and selectable in dispatch dropdowns.
- [ ] "Proyek Menes" is excluded from dispatch dropdowns.
- [ ] Bpk. Pei is not listed in `investors` table and does not receive ritase profit-sharing allocations.
- [ ] Company debt of Rp 18.000.000 to Bpk. Pei is properly logged under corporate liabilities in `cash_ledger`.

### Access Control & Privacy
- [ ] Dispatcher accounts cannot view the Investor tab, investor cards, profit margins, or investor cash balances.
- [ ] Founder (`founder`) and Developer (`developer`) accounts have unrestricted access to all modules including Investor and Company Debt.

### System Stability
- [ ] `npx tsc -b` executes cleanly with 0 TypeScript compilation errors.
- [ ] `npm run build` produces a successful production build.
