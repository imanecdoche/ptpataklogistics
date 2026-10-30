# KONTEKS LENGKAP PROYEK & MEMORI PERCAKAPAN (AGENT CONTEXT HANDOVER)
*Dokumen ini dibuat khusus agar agen AI dan pengembang di perangkat lain dapat langsung melanjutkan pekerjaan dengan pemahaman 100% utuh tanpa kehilangan konteks.*

Terakhir Diperbarui: **30 Oktober 2026, 21:05 WIB**
Status: **Siap Migrasi Data Riil Lapangan Bersama Papah Malam Ini**

---

## 🏢 1. Profil Bisnis & Tokoh Kunci
- **Perusahaan**: PT Patak Abadi Jaya
- **Pengembang & Arsitek Sistem**: Fatih Farhat (`fatihfarhat`)
- **Founder / Pemilik Lapangan**: Papah (Bpk. Haji / Pemilik PT Patak)
- **Bisnis Utama**: Logistik dan pengadaan material tambang urukan (Batu Belah, Batu Waste, Abu Batu, Batu Split, Batu Endep) untuk proyek-proyek infrastruktur di wilayah Pandeglang dan Banten.
- **Armada**: Dump Truck (DT) kapasitas standar ~6 m³ / trip.
- **Volume Operasional Harian**: Sekitar 3–9 Dump Truck (DT) per hari.

---

## 🎙️ 2. Rangkuman Arahan Papah & Fakta Lapangan

### A. Rekaman Audio / Voice Note Papah (Meeting 2.ogg)
1. **Investor Aktif Tunggal: Bpk. Yadi**:
   - Satu-satunya pemodal aktif saat ini adalah **Bpk. Yadi**.
   - Dana modal digunakan untuk membiayai 2 proyek aktif sekaligus (*Situ Cikedal* dan *Cipeucang*).
2. **Pemisahan Akuntansi Bpk. Pei & Hutang Perseroan**:
   - Papah: *"Pei batal aja... Tapi PT ada hutang sama Pei Rp 18.000.000"*.
   - **DILARANG KERAS** memasukkan Bpk. Pei ke tabel `investors` proyek. Bpk. Pei bukan investor ritase dan tidak berhak atas bagi hasil ritase.
   - Rp 18.000.000 dicatat strictly sebagai **Hutang Usaha Pihak Ketiga (Company Debt)** di Buku Kas Induk (`cash_ledger`).
3. **Dua Proyek Fisik yang Riil Berjalan**:
   - `Proyek Konservasi Situ Cikedal` (Kec. Cikedal, Pandeglang) - **ACTIVE**
   - `Proyek Irigasi Cipeucang` (Kec. Cipeucang, Pandeglang) - **ACTIVE**
   - *Proyek Menes* dinonaktifkan / ditandai **COMPLETED** (tidak muncul di dropdown input ritase).
4. **Akun Operator Lapangan**:
   - Operator lapangan menggunakan akun role `dispatcher` bersama (`operasional@patak.id`) dengan otorisasi PIN untuk tindakan sensitif.

---

### B. Chat WhatsApp Terbaru Papah (30 Oktober 2026)
1. **Koreksi Modal Masuk Bpk. Yadi**:
   - Papah: *"Buat aja dari sekarang pertanggal 7 Oktober dana investasi 26.500.000"*.
   - Nominal modal investasi awal Bpk. Yadi resmi ditetapkan sebesar **Rp 26.500.000** (per 7 Oktober 2026), bukan Rp 30.000.000.
2. **Penerimaan Pembayaran Proyek (Pelunasan Piutang)**:
   - Papah: *"Tgl sekarang pembayaran dari proyek 20.000.000 ya"*.
   - Pada tanggal 30 Oktober 2026, kas perseroan menerima pembayaran termin dari pihak proyek sebesar **Rp 20.000.000** (`PELUNASAN_PIUTANG`).
3. **Akar Ketakutan Terbesar Papah (Pain Point)**:
   - Papah: *"pengeluaran operasional harian tinggi... untuk menghindari kebocoran operasional itu juga PPh ingin pakai aplikasi agar bisa terkontrol... fee harga ongkos kerja (HOK)..."*.
   - Kebocoran operasional harian di lapangan (solar, uang portal, dan selisih upah HOK sopir) adalah ancaman margin terbesar saat memutar modal orang lain.
4. **Strategi Pencegahan Kebocoran (Rule 109)**:
   - Form ritase `Dispatcher` **tetap dipertahankan** sebagai alat audit otomatis (gembok kebocoran), karena input form per ritase hanya makan waktu 30 detik (total 3-5 menit/hari untuk 3–9 mobil).
   - Label di seluruh form dan tabel distandarisasi ke bahasa lapangan Papah:
     **`"Beban Operasional & HOK (Uang Jalan / Supir / Solar)"`**.
   - Sistem dilengkapi deteksi selisih otomatis (`⚠️ Melebihi acuan rute standar: +Rp X.XXX`) jika biaya supir melebihi standar rute kuari.
   - Dashboard menampilkan rincian: **"Arus Kas Keluar Hari Ini"** [Belanja Kuari] + [HOK & Uang Jalan Sopir].
5. **Agenda Malam Ini**:
   - Papah: *"Nanti malam kita hitung di rumah sebenarnya bulan ini kita masih ada margin sisa ngak... Iya nanti harga beli dan jualnya ketemu pph"*.
   - Fatih dan Papah bertemu malam ini untuk mencocokkan harga beli kuari, harga jual proyek, dan HOK jalan dari catatan buku fisik.

---

## 📖 3. Transkripsi Lengkap Buku Catatan Fisik (35 Ritase / DT)

Berikut rekapitulasi data riil dari 2 foto lembar buku catatan tangan Papah (periode 10–26 Oktober 2026):

| No | Tanggal (YYYY-MM-DD) | Jenis Material / Komoditas | Volume | Pengirim / Rekanan | Catatan Fisik Lapangan |
|:---:|:---:|---|:---:|---|---|
| 1 | `2026-10-15` | Batu Waste / Urugan | 2 DT | P. Sapta | *Keterangan tidak ada surat jalan* |
| 2 | `2026-10-15` | Batu Endep / Base | 1 DT | P. Sapta | *Keterangan tidak ada surat jalan* |
| 3 | `2026-10-15` | Abu Batu | 1 DT | P. Sapta | *Keterangan tidak ada surat jalan* |
| 4 | `2026-10-16` | Batu Waste / Urugan | 1 DT | P. Sapta / P. Paskal | *Keterangan tidak ada surat jalan* |
| 5 | `2026-10-16` | Batu Split Ukuran 2-3 | 2 DT | P. Sapta / P. Paskal | *Keterangan tidak ada surat jalan* |
| 6 | `2026-10-16` | Abu Batu | 1 DT | P. Sapta / P. Paskal | *Keterangan tidak ada surat jalan* |
| 7 | `2026-10-17` | Batu Split | 3 DT | P. Paskal | Tercatat buku |
| 8 | `2026-10-18` | Batu Waste & Urugan | 3 DT | Lokasi Pancingan (P. Sapta) | Tercatat buku |
| 9 | `2026-10-19` | Batu Waste / Urugan | 1 DT | P. Paskal | Tercatat buku |
| 10 | `2026-10-19` | Batu Waste / Urugan | 2 DT | P. Sapta | Tercatat buku |
| 11 | `2026-10-20` | Abu Batu | 1 DT | P. Sapta | Tercatat buku |
| 12 | `2026-10-21` | Batu Waste / Urugan | 2 DT | Lokasi Pancingan (P. Sapta) | Tercatat buku |
| 13 | `2026-10-21` | Batu Split | 1 DT | P. Sapta | Tercatat buku |
| 14 | `2026-10-23` | Batu Split Ukuran 2-3 | 2 DT | P. Sapta | Tercatat buku |
| 15 | `2026-10-23` | Abu Batu | 1 DT | P. Sapta | Tercatat buku |
| 16 | `2026-10-24` | Abu Batu | 1 DT | P. Sapta | Tercatat buku |
| 17 | `2026-10-25` | Batu Split Ukuran 2-3 | 2 DT | P. Paskal | Tercatat buku |
| 18 | `2026-10-26` | Batu Split Ukuran 2-3 | 1 DT | P. Paskal | Tercatat buku |
| 19 | `2026-10-26` | Abu Batu | 2 DT | P. Sapta | Tercatat buku |
| 20 | `2026-10-10` s.d. `2026-10-14` | *5 Ritase Awal* | 5 DT | Transaksi Pembuka | Menggenapkan total buku 35 DT |

> **Catatan Buku Kaki**: *"TOTAL HITUNGAN SEMUA 35"* (30 DT pada lembar foto + 5 DT awal 10–14 Oktober).

---

## 🗄️ 4. Status Database Firestore Terkini (`pataklogisticdb`)

Koneksi database menggunakan Firebase Web SDK ke project `antigravityapp-e305d`, database Firestore: `pataklogisticdb`.

1. **`investors`**:
   - `inv-bpk-yadi`: Bpk. Yadi, Modal: Rp 26.500.000, Bank: BCA, Created: 07-10-2026.
2. **`projects`**:
   - `prj-situ-cikedal`: Proyek Konservasi Situ Cikedal (ACTIVE)
   - `prj-cipeucang`: Proyek Irigasi Cipeucang (ACTIVE)
   - `prj-menes`: Proyek Menes (COMPLETED)
3. **`cash_ledger`**:
   - `ledger-modal-bpk-yadi`: MODAL_AWAL, Rp 26.500.000 (07-10-2026)
   - `ledger-debt-bpk-pei`: HUTANG_PIHAK_KETIGA, Rp 18.000.000 (08-10-2026)
   - `ledger-payment-proyek-cikedal-20261030`: PELUNASAN_PIUTANG, Rp 20.000.000 (30-10-2026)
4. **`material_commodities`**:
   - `mat-batu-waste`: Batu Waste / Urugan (DT)
   - `mat-abu-batu`: Abu Batu (DT)
   - `mat-batu-split-2-3`: Batu Split Ukuran 2-3 (DT)
   - `mat-batu-endep`: Batu Endep / Base (DT)
5. **`clients`**:
   - `cli-p-sapta`: P. Sapta (Rekanan Lapangan)
   - `cli-p-paskal`: P. Paskal (Rekanan Lapangan)
6. **`transactions`**:
   - Bersih (0 transaksi dummy). Siap diisi 35 transaksi riil via `scripts/seed_october_transactions.mjs` atau form live.

---

## 📜 5. Aturan Penting & Anti-Patterns yang Wajib Dipatuhi AI Baru

Agen AI baru di perangkat mana pun **WAJIB MEMBACA DAN MEMATUHI ATURAN INI TANPA PENGECUALIAN**:
1. **Paritas Mutlak Aturan**:
   - Setiap ada aturan baru, wajib dicatat ke `.agents/RULES.md` dan disamakan 100% karakter demi karakter ke `RULES.md` (`diff -u` wajib 0).
2. **Anti-Patterns Mutlak (`ai-anti-patterns.md`)**:
   - **DILARANG** membuat badge, tag, pill, dot warna, atau elemen kosmetik yang tidak diperintahkan.
   - Status ditampilkan sebagai **tipografi murni** (`font-bold text-[11px]` tanpa container pill/badge).
   - Indikator status: Hijau `text-emerald-700` untuk `LUNAS`/`ACTIVE`, Kuning/Oranye `text-amber-700` untuk `TEMPO`/`PINJAM`.
3. **Tipografi Angka Finansial (Rule 99 & Rule 106)**:
   - Angka rupiah dan volume volume wajib menggunakan **font sans-serif tebal dengan tracking rapat** (`font-bold tracking-tight text-[#111111]`).
   - **DILARANG** menggunakan `font-mono` untuk angka nominal uang atau kubikasi.
   - `font-mono` HANYA untuk kode teknis: No. Tiket, No. Surat Jalan, Plat Truk, ID Material.
4. **Komponen Form & Input Terstandarisasi**:
   - Input uang wajib `<CurrencyInput />`.
   - Input telepon wajib `<PhoneInput />` format `+62 8xx-xxxx-xxxx` (Rule 101).
   - Kotak pencarian wajib memiliki ikon `/icons/search.png` di `left-3 pl-9` (Rule 98).
   - Dropdown wajib menggunakan `<CustomSelectCombobox />` (Rule 87). Dilarang native `<select>`.
5. **Mobile Titlebar Action (Rule 108)**:
   - Pada layar mobile (< 768px), tombol aksi utama tambah data diletakkan di sisi kanan titlebar mobile (`#mobile-titlebar-action`), sementara search input di toolbar melebar 100% full-width.
6. **Standarisasi HOK (Rule 109)**:
   - Label biaya operasional supir selalu: `"Beban Operasional & HOK (Uang Jalan / Supir / Solar)"`.
   - Tabel ringkasan menggunakan header: `"HOK & Operasional"`.

---

## 🚀 6. Cara Menjalankan & Melanjutkan Proyek

```bash
# 1. Masuk ke direktori proyek
cd "/media/fatihfarhat/New Volume1/PROJECTS/Patak Logistics System"

# 2. Menjalankan server pengembangan
npm run dev

# 3. Menjalankan pemeriksaan tipe data
npx tsc -b

# 4. Melakukan build produksi
npm run build

# 5. Injeksi transaksi setelah dapat harga dari Papah malam ini
node scripts/seed_october_transactions.mjs
```
