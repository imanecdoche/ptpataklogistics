# Workspace Rule: Icon Button Only Priority

## 📌 Absolute Principle
Standardisasi antarmuka aplikasi OstifakODP mengutamakan kesederhanaan visual (*clean-flat*, *minimal*, dan *breathable*).

### 1. Default: Icon Button Only
- Setiap pembuatan komponen tombol aksi di seluruh aplikasi (header, toolbar, view actions, table row actions, kartu, filter bar, dll.), standar utamanya wajib berwujud **Icon Button Only** (ikon tunggal yang bersih tanpa teks label pendamping).
- Berikan atribut `title` atau tooltip aksesibilitas yang deskriptif pada setiap tombol ikon.

### 2. Pengecualian Tombol Primer Krusial
- Teks label hanya diizinkan untuk tombol aksi primer yang sangat krusial dan butuh kejelasan mutlak (misalnya: `"MASUK"`, `"Simpan Perubahan"`, `"Simpan Sesi"`, `"Terbitkan Arahan"`).
- Selain aksi primer tersebut, tombol tindakan sekunder/tersier wajib berupa ikon minimalis murni.

### 3. Anti-Container & Clean-Flat
- Dilarang keras membuat tombol dengan label teks panjang yang dibungkus kotak kontainer tebal, border bertumpuk, atau badge/kapsul mencolok.
- Gunakan hover state yang halus dan proporsional.
