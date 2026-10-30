# Patak Logistics System

Sistem Manajemen Logistik dan Keuangan Armada Operasional Material Tambang & Konstruksi — **PT Patak Abadi Jaya**.

> [!IMPORTANT]
> **PANDUAN KONTEKS LENGKAP & AGENT HANDOVER:**  
> Untuk agen AI atau pengembang yang baru membuka repositori ini di perangkat baru, **wajib membaca berkas [CONTEXT.md](./CONTEXT.md)** untuk memahami seluruh kronologi percakapan, arahan langsung dari Papah (Founder), status database Firestore, serta transkripsi catatan buku fisik lapangan.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Database**: Google Cloud Firestore (`pataklogisticdb`)
- **Autentikasi & Otorisasi**: Role-Based Access Control (`founder`, `developer`, `admin`, `dispatcher`, `investor`)
- **Aturan & Standar Desain**: Dikelola ketat di [`.agents/RULES.md`](./.agents/RULES.md) dan [`RULES.md`](./RULES.md)

---

## 🚀 Menjalankan Aplikasi
```bash
# Instalasi dependensi (jika baru di-clone)
npm install

# Menjalankan server pengembangan lokal
npm run dev

# Memeriksa tipe data TypeScript
npx tsc -b

# Melakukan kompilasi build produksi
npm run build
```

---

## 📋 Status Migrasi Data Riil Lapangan (Oktober 2026)
- **Modal Awal Bpk. Yadi**: Rp 26.500.000 (07-10-2026)
- **Hutang Perseroan Bpk. Pei**: Rp 18.000.000 (08-10-2026, Non-ritase)
- **Pelunasan Termin Proyek**: Rp 20.000.000 (30-10-2026)
- **Total Ritase Siap Input**: 35 Dump Truck (Periode 10–26 Oktober 2026)
- **Skrip Seeding Cepat**: [`scripts/seed_october_transactions.mjs`](./scripts/seed_october_transactions.mjs)
