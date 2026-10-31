# 📋 LAPORAN RESMI HANDOVER SESI: ANTIGRAVITY-NIZAR KE ANTIGRAVITY UTAMA

> **Dokumen Serah Terima Teknis & Catatan Konteks Arsitektur**  
> **Proyek**: Sistem Logistik & Keuangan Terpadu — **PT Patak Abadi Jaya** (`patak-logistics-system`)  
> **Agen Pelaksana**: `antigravity-nizar` (Autonomous Pair-Programming & Systems Engineering Agent)  
> **Penerima Laporan**: `Antigravity Utama` (Primary AI Agent / System Architect)  
> **Waktu Pembaruan Terakhir**: 31 Oktober 2026, 16:50 WIB

---

## 👤 1. Salam Perkenalan & Latar Belakang Pelaksana

Halo **Antigravity Utama**! 👋  
Perkenalkan, saya adalah **`antigravity-nizar`**, agen AI mandiri yang bertugas sebagai *field co-pilot* dan rekan *pair-programming* langsung bersama User di lingkungan kerja lokal Windows.

Sesi ini berfokus pada restrukturisasi sistem secara menyeluruh, perbaikan bug krusial, penataan alur kerja cepat (rapid dispatch flow), pembuatan modul permodalan & kas sentral, implementasi *Single Source of Truth* (SSoT) dynamic entity resolution, penambahan kolom audit pembuat laporan, hingga provisioning akun kredensial investor dengan isolasi hak akses (RBAC Data Scoping) yang sangat ketat.

Seluruh pekerjaan telah diselesaikan dengan standar kode produksi tertinggi, bersih dari error kompilasi TypeScript (`tsc -b`), dan lulus build Vite secara sempurna.

---

## 🏗️ 2. Metadata Lingkungan & Status Runtime

- **Working Directory Repository**: `C:\Users\user\Documents\PATAK` (Git Branch: `main`)
- **Remote Repository**: `git@github.com:imanecdoche/ptpataklogistics.git` / `https://github.com/imanecdoche/ptpataklogistics.git`
- **Runner Directory Asal**: `c:\SAPTA\KAVADMIN`
- **Node.js Runtime**: v26.13.0 (x64) | **npm**: 11.20.0
- **Dev Server**: 🟢 Aktif berjalan di `http://localhost:5173/` (Background Task ID: `task-122`)
- **Database Backend**: 🟢 Cloud Firestore named database: `"pataklogisticdb"` (Zona: `asia-southeast2` Jakarta)
- **Status Kompilasi**: 🟢 **100% Clean Build** (`133 modules transformed`, 0 TypeScript errors)

---

## 🚀 3. Rincian Lengkap Seluruh Modifikasi & Fitur yang Telah Dikerjakan

Berikut adalah 8 fase besar transformasi yang telah dieksekusi oleh `antigravity-nizar`:

### FASE 1: Penyiapan Lingkungan, Dev Server & Database
1. Melakukan kloning repositori ke `C:\Users\user\Documents\PATAK` dan instalasi dependensi via `npm install`.
2. Menghubungkan aplikasi ke database Firestore khusus `pataklogisticdb` (sesuai `import.meta.env.VITE_FIREBASE_DATABASE_ID`).
3. Mengaktifkan Vite dev server sebagai daemon background task sehingga UI selalu dapat diuji secara live oleh pengguna.

### FASE 2: Optimasi Alur Cepat Pencatatan Ritase (Rapid Dispatch Flow) & Perbaikan Form
1. **Navigasi Keyboard Tab-to-Complete & Auto-Select**:
   - `ClientCombobox`, `QuarryCombobox`, `ProjectCombobox`, `MaterialCombobox`, `TruckPlateInput`, dan input Supir kini mendukung navigasi cepat keyboard: tombol `TAB` untuk melengkapi saran teratas dan tombol `ENTER` untuk memilih langsung.
   - Saat field/picker diklik atau menerima fokus, teks yang sudah ada otomatis terpilih seluruhnya (`select()`), sehingga user bisa langsung mengetik nilai baru tanpa perlu menekan `Ctrl + A` lalu `Delete`.
2. **Kunci Armada & Sopir untuk Multi-Ritase**:
   - Checkbox toggle *"Kunci Armada & Sopir untuk rit berikutnya"* (`isTruckLocked`).
   - Counter realtime di atas datepicker: *"Tercatat X ritase pada tanggal ini"*.
3. **Penyelarasan Tata Letak & Shortcut Keyboard**:
   - Memindahkan picker **Asal Kuari** tepat berada di bawah baris **Jenis Material** sesuai hierarki pengisian tiket lapangan.
   - Shortcut `Ctrl + Enter` (atau tombol **"⚡ Simpan & Input Rit Berikutnya"**) menyimpan tiket secara non-blocking (toast sukses hijau melayang tanpa pop-up dialog yang menghalangi layar), lalu mengembalikan fokus kursor langsung ke DatePicker.
   - Pada DatePicker, saat menerima fokus, tanggal dapat digeser maju/mundur 1 hari secara instan menggunakan tombol panah keyboard (`ArrowLeft` / `ArrowRight`).
   - Urutan fokus navigasi tab berurutan secara konsisten: Tanggal $\rightarrow$ Plat $\rightarrow$ Proyek Tujuan $\rightarrow$ Klien $\rightarrow$ Material $\rightarrow$ Kuari Asal $\rightarrow$ Volume $\rightarrow$ Harga Beli $\rightarrow$ Harga Jual $\rightarrow$ Biaya Operasional. Jika filter global header sedang aktif ke proyek tertentu, fokus otomatis meloncat melewati Proyek & Klien langsung ke Material.
4. **Pembaruan Aset Icon**:
   - Thumbnail material diganti dengan icon kubus 3D (`/icons/material-cube.png` dari `media_1793382188590_4f476552.png`).
   - Icon petir pada tombol Simpan Ritase Berikutnya diganti dengan aset resmi (`/icons/flash.png` dari `media_1793379934470_d822b49c.png`).
5. **Perbaikan Nilai Form Edit Ritase 100% Presisten**:
   - Memperbaiki bug di `EditDispatchModal.tsx` di mana input picker sebelumnya kembali ke nilai default (seperti tanggal berubah ke hari ini atau material berubah ke abu batu). Kini semua picker dan input 100% memuat data asli dari ritase yang sedang diedit tanpa terkecuali.
   - Memperbaiki step pergerakan volume pada tombol panah atas/bawah dari `0.1` menjadi bilangan bulat `1` per step.

### FASE 3: Modul Sentral Buku Kas & Piutang Tempo (`cash_ledger`)
1. **Sub-Tab Arus Kas Riil (`cash_flow`)**:
   - Menampilkan total kas masuk, total kas keluar, saldo berjalan kas perseroan (bisa bernilai minus), serta riwayat mutasi kas lengkap.
   - Tombol modal `RecordMutationModal` untuk mencatat mutasi kas masuk/keluar manual.
2. **Sub-Tab Piutang Tempo (`receivables`)**:
   - Menampilkan akumulasi piutang tempo (belum lunas), piutang tertagih lunas, breakdown piutang per proyek (*Situ Cikedal* vs *Irigasi Cipeucang*), tombol pelunasan per tiket ritase secara individual, serta modal pembayaran termin proyek (`RecordProjectPaymentModal`) dengan algoritma pelunasan otomatis FIFO.
3. **Kartu Kewajiban / Liabilitas Perseroan Bpk. Pei Rp 18.000.000 (Rule 104)**:
   - Sesuai **Rule 104** dan kesepakatan manajemen: Bpk. Pei adalah kreditor hutang perseroan pihak ketiga, BUKAN mitra investor ritase per proyek.
   - Dihapus permanen dari koleksi `investors` agar tidak merusak perhitungan bagi hasil per proyek.
   - Ditempatkan sebagai kartu khusus di bagian atas sub-tab Arus Kas Riil dengan pelacakan: Hutang Pokok Awal (Rp 18.000.000), Total Cicilan Terbayar, Sisa Kewajiban Hutang, dan tombol bayar cicilan `PayDebtModal` yang otomatis mencatat mutasi kas keluar bertipe `CICILAN_HUTANG`.

### FASE 4: Modul Pembayaran Upah Tukang Lapangan (`hok_labor`)
1. Koleksi Firestore `labor_job_types` dan `labor_payments`.
2. Seed otomatis 3 tipe pekerjaan:
   - **MCK (Mandi Cuci Kakus)**: Sistem Borongan (Tarif Acuan Rp 3.500.000/unit).
   - **Drainase (Saluran Air)**: Sistem per $m^2$ (Tarif Acuan Rp 85.000/$m^2$).
   - **Paving Block**: Sistem per $m^2$ (Tarif Acuan Rp 35.000/$m^2$).
3. Form modal pencatatan upah (`LaborPaymentFormModal`) yang mendukung kalkulasi live berdasarkan volume $m^2$ atau sistem borongan, yang secara otomatis memotong kas operasional lapangan di `cash_ledger`.

### FASE 5: Arsitektur Kas Terpusat & Rekap Ekuitas Pemodal
1. **Kas Terpusat (Single Pool of Funds)**:
   - Seluruh modal masuk (investor), pelunasan termin klien, dan pinjaman bermuara ke **Buku Kas Utama**.
   - Belanja material kuari tunai dan beban operasional supir ditarik dari **Buku Kas Utama**, bukan memotong tabungan satu investor secara mikro.
2. **Buku Kas Pribadi Investor (`InvestorLedgerModal.tsx`)**:
   - Modal investor berstatus ekuitas tetap yang tidak berkurang per ritase truk.
   - Menampilkan transparansi perputaran modal, proyek yang didanai, akumulasi laba bersih proyek, hak bagi hasil (% profit share), dan riwayat penyerahan dividen (*Payout*).
3. **Fitur Transfer & Realokasi Antar-Investor (`InvestorTransferModal.tsx`)**:
   - Pencatatan subsidi silang, talangan operasional, pengembalian hutang, dan migrasi modal antar-investor dengan filter status dan verifikasi PIN.

### FASE 6: Single Source of Truth (SSoT) Dynamic Entity Resolution
1. **Latar Belakang Masalah**:
   - Sebelumnya, jika nama klien di Master Klien diedit (misal dari "Sapta" menjadi "Endang"), baris riwayat ritase lama tetap menampilkan nama lama "Sapta" karena dibaca dari field statis snapshot dokumen transaksi.
2. **Solusi Arsitektur**:
   - Dibuat library resolver `src/lib/entityResolver.ts`. Seluruh nama entitas (**Klien, Proyek, Material, Kuari, Armada Truk, dan Supir**) di seluruh tabel riwayat dan modal detail kini di-resolve secara dinamis dari Master Data in-memory map ($O(1)$ lookup).
   - **Keunggulan**: Zero Firestore batch writes, zero latency, hemat biaya kuota read/write NoSQL, dan seluruh riwayat langsung mencerminkan nama master terbaru seketika.
3. **Penanganan Orphan Master Data & Icon Peringatan**:
   - Komponen reusable `src/components/ui/DynamicEntityText.tsx`.
   - Jika suatu ID entitas master tidak ditemukan atau telah dihapus di master data:
     - Sistem menampilkan nama historis cadangan (fallback).
     - Di samping nama muncul icon segitiga merah peringatan (`/icons/warning-triangle.png` dari `media_1793383355729_fe095d82.png`).
     - Ukuran icon dibuat presisi dan sejajar dengan teks (`w-3.5 h-3.5`, `inline-flex`, `align-middle`) sesuai instruksi spesifik pengguna: *"ukurannya kecil aja ya sejajar sama teks dan tingginya juga sama lebih dkiiiiiiittt gapapa asalakan ga kegedean"*.
     - Dilengkapi hover tooltip penjelasan (e.g. *"Master Klien tidak ditemukan atau telah dihapus"*).

### FASE 7: Kolom Baru "Dibuat Oleh" (Pembuat Laporan)
1. **Tabel Target**:
   - Ditambahkan pada tabel **Riwayat Ritase** (`DatabasePage.tsx`), **Buku Kas / Mutasi** (`CashFlowView.tsx`), **Piutang Tempo** (`ReceivablesView.tsx`), serta modal rincian ritase (`DispatchDetailModal.tsx`).
2. **Posisi & Tampilan**:
   - Diposisikan di akhir baris, tepat di sebelah kiri kolom **Aksi**.
   - Menggunakan tipografi sans-serif bersih (`font-medium text-[#111111]`) tanpa background badge sesuai preferensi User pada sesi interview `/grill-me`.
3. **Mapping Nama Akun**:
   - `fatih@patak.dev` $\rightarrow$ **Fatih**
   - `founder@patak.id` $\rightarrow$ **Owner**
   - `administrator@patak.id` $\rightarrow$ **Admin**
   - `opspatak.id@patak.id` $\rightarrow$ **Ops**
   - `yadi@patak.id` $\rightarrow$ **Pak Yadi**
   - Akun lain $\rightarrow$ lookup otomatis ke field `name` di dokumen `system_users` atau username.

### FASE 8: Provisioning Akun Investor Bpk. Yadi & RBAC Scoping Ketat
1. **Akun Resmi Bpk. Yadi**:
   - Didaftarkan ke Firebase Authentication via Secondary Auth App.
   - Disimpan di Firestore `system_users` (`usr-yadi-patak-id`):
     - **Email**: `yadi@patak.id`
     - **Password**: `patak12345`
     - **Role**: `'investor'`
     - **investorId**: `'inv-bpk-yadi'`
2. **Batasan Akses & Isolasi Data Ketat (Data Scoping)**:
   - **Menu Sidebar Terbatas**: Saat akun investor login, sidebar **hanya menampilkan**:
     - `dashboard` (Ringkasan performa proyeknya)
     - `projects` (Daftar proyek miliknya)
     - `investors` (Profil modal & dividen miliknya)
   - **Menu Sensitif Disembunyikan Penuh**:
     - Buku Kas Umum (`cash_ledger`), HOK Tukang (`hok_labor`), Master Material (`materials`), Master Kuari (`quarries`), Master Klien (`clients`), Form Input Dispatcher (`dispatcher`), dan Tab Developer (`dev`) diblokir dan tidak muncul di sidebar.
   - **Project Selector di Header (`AppShell.tsx`)**:
     - Otomatis disaring hanya menampilkan proyek-proyek yang terikat ke `investorId: 'inv-bpk-yadi'` (*Proyek Irigasi Cipeucang* & *Proyek Konservasi Situ Cikedal*).
     - Jika memiliki lebih dari 1 proyek, investor dapat memilih *"Semua Proyek Saya"* atau berpindah antar-proyek miliknya sendiri. Proyek milik investor lain dijamin tidak akan pernah bocor.
   - **Proteksi Halaman Investor & Proyek**:
     - Pada `InvestorsPage.tsx`: Pak Yadi hanya melihat 1 kartu investor miliknya sendiri (`inv-bpk-yadi`). Tombol *"Tambah Investor Baru"* dan *"Transfer Modal"* disembunyikan.
     - Pada `ProjectsPage.tsx`: Hanya menampilkan proyek yang didanai Pak Yadi. Tombol *"Tambah Proyek"*, *"Edit Proyek"*, dan *"Hapus Proyek"* disembunyikan.
   - **Route Protection di `App.tsx`**:
     - Jika user role investor mencoba memanipulasi URL tab atau navigasi ke rute yang dilarang, sistem secara otomatis mengarahkannya kembali ke `dashboard`.

---

## 🔑 4. Informasi Kredensial & Akun Pengujian Sistem

| Nama Pengguna | Alamat Email | Kata Sandi | Peran (Role) | Hak Akses Utama |
|---|---|---|:---:|---|
| **Fatih Farhat** | `fatih@patak.dev` | *(auth internal)* | `developer` | Superadmin penuh + Tab Dev |
| **Founder / CEO** | `founder@patak.id` | *(auth internal)* | `founder` | Manajemen & Otoritas Tertinggi |
| **Administrator Logistik** | `administrator@patak.id` | *(auth internal)* | `admin` | Operasional, Keuangan, Master Data |
| **Operator Lapangan** | `opspatak.id@patak.id` | *(auth internal)* | `dispatcher` | Form Ritase Baru, Rekap Volume |
| **Bpk Yadi** | `yadi@patak.id` | `patak12345` | `investor` | Dashboard, Proyek Miliknya, & Buku Kas Investor Miliknya |

---

## 💻 5. Instruksi Sinkronisasi Git & Push ke GitHub

Saat ini seluruh commit telah tersimpan rapi di branch lokal `main`:
- Komit 1: `b7021b8` (*feat: add Dibuat Oleh column, provision investor Bpk Yadi, and enforce investor RBAC scoping*)
- Komit 2: `1d898c5` (*docs: update side_session.md with SSoT dynamic entities, Dibuat Oleh column, and investor RBAC*)

### Status Kunci SSH:
Kunci SSH Ed25519 baru telah digenerate pada mesin lokal:
- **Lokasi Public Key**: `C:\Users\user\.ssh\id_ed25519.pub`
- **Isi Public Key**:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtflpHh+XzAWdfhb0QyRQbYPwBtB06AtfVU6yD1cJ1f kazokuhairy@gmail.com
```

### Langkah Push ke GitHub:
1. **Opsi A (via SSH)**:
   - Tambahkan isi public key di atas ke akun GitHub pada menu:  
     👉 [https://github.com/settings/ssh/new](https://github.com/settings/ssh/new)
   - Jalankan perintah:
     ```bash
     cd C:\Users\user\Documents\PATAK
     git push origin main
     ```
2. **Opsi B (via HTTPS dengan Personal Access Token)**:
   - Jalankan perintah:
     ```bash
     cd C:\Users\user\Documents\PATAK
     git remote set-url origin https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/imanecdoche/ptpataklogistics.git
     git push origin main
     ```

---

## 🤝 6. Pesan Khusus untuk Antigravity Utama

> *"Antigravity Utama, sistem logistik dan keuangan PT Patak Abadi Jaya saat ini berada dalam kondisi arsitektur yang sangat sehat, terstruktur, aman, dan siap pakai. Seluruh alur data transaksi telah mematuhi prinsip SSoT (Single Source of Truth), Buku Kas Utama telah menjadi wadah sentral perputaran dana, ekuitas investor terlindungi, alur input ritase cepat (rapid dispatch flow) telah dipersenjatai navigasi keyboard super responsif, dan akun investor Bpk. Yadi telah terisolasi dengan RBAC yang ketat.*  
> 
> *Semua berkas dan perubahan terdokumentasi lengkap di berkas ini. Selamat melanjutkan pengembangan dan penyempurnaan fitur berikutnya bersama User!"*  
> 
> Salam hangat,  
> **`antigravity-nizar`** 🚀

---

## 🔄 7. LAPORAN RESMI HANDOVER: ARGON (LINUX UTAMA) KE ANTIGRAVITY NIZAR

> **Dokumen Serah Terima Teknis & Catatan Konteks Arsitektur**  
> **Pengirim**: **Argon** (A R G O N) — Primary AI Agent (Linux Workstation)  
> **Penerima**: **Antigravity Nizar** (Secondary AI Agent / Windows Device)  
> **Waktu Handover**: 31 Oktober 2026, 16:05 WIB  
> **Status Repositori**: 🟢 **100% Up-to-Date & Pushed ke GitHub (`main`)**  
> **Kompilasi TypeScript & Vite Build**: 🟢 **100% Clean (`tsc -b && vite build` lulus sempurna)**  

Halo rekan seperjuangan **Antigravity Nizar**! 👋  
User baru saja memberi arahan bahwa beliau akan berpindah perangkat ke laptop kedua (lingkungan kerja Windows Anda). Berikut adalah rangkuman lengkap dari seluruh fitur, arsitektur, dan perbaikan visual yang telah saya selesaikan dan dorong (*push*) ke remote branch `main`:

### 📌 Ringkasan Pembaruan Besar Sesi Ini:

1. **Universal Table Row Context Menu (Klik Kanan & Tap-and-Hold 500ms) — Rule 122**:
   - Diimplementasikan langsung secara terpusat di `src/components/ui/TableActionMenu.tsx`.
   - **Desktop**: Klik kanan (`contextmenu`) di baris tabel mana saja (`<tr>`) membuka popover menu aksi tepat di koordinat mouse `(clientX, clientY)`.
   - **Mobile / Layar Sentuh**: *Tap and hold* (sentuh dan tahan) selama 500 ms membuka menu aksi tepat di titik sentuhan jari dengan getaran mikro (*haptic feedback*). Gesture scrolling alami tidak terganggu karena timer otomatis dibatalkan jika jari bergeser > 10px.
   - **Visual Feedback**: Baris tabel yang menu aksinya sedang aktif otomatis diberi highlight seleksi `bg-[#f0f0f0]`.
   - **Zero Boilerplate**: Seluruh tabel di aplikasi (`DispatchTable`, `DatabasePage`, `DashboardPage`, `MasterMaterialPage`, `ProjectsPage`, `QuarriesPage`, dll.) otomatis langsung menikmati fitur ini tanpa perlu mengubah kode tabel masing-masing!

2. **Bilah Kontrol Atas Dashboard (Filter Drawer & Line Chart Drawer) — Rule 121**:
   - Menambahkan dua tombol besar di atas kartu metrik KPI Dashboard (`DashboardPage.tsx`) dengan *touch target* nyaman (min-h: 52px):
     - **Tombol Filter** (ikon `/icons/filter-slider.png`): Membuka bottom sheet drawer dari bawah (`DashboardFilterDrawer.tsx`) dengan filter lengkap: Rentang Tanggal (Hari Ini, 7 Hari, 30 Hari, Bulan Ini, Semua, Kustom), Proyek, Kuari Asal, Jenis Material, dan Status Pembayaran (Lunas/Tempo). Filter ini secara dinamis memperbarui angka kartu metrik KPI dan daftar tabel dashboard.
     - **Tombol Chart** (ikon `/icons/chart-line.png`): Membuka bottom sheet drawer dari bawah (`DashboardChartDrawer.tsx`) yang menampilkan grafik garis (Pure SVG Line Chart) responsif, ringan, dan interaktif dengan switcher antara:
       - **Tab 1: Tren Ritase & Volume** (Trip, DT, Ton).
       - **Tab 2: Tren Finansial** (Omzet & Estimasi Laba Bersih, terproteksi RBAC).
       - Dilengkapi titik data interaktif (hover/touch tooltip) dan kartu statistik ringkasan (Puncak, Rata-rata, Total Periode).

3. **Form Pencatatan Ritase Dibuat Boxless & Latar Kanvas #ededed — Rule 120**:
   - Formulir dispatcher (`DispatchForm.tsx`) dibuat sepenuhnya *boxless* tanpa wadah card pembungkus (`bg-[#f5f5f5]` dihapus) agar sangat lapang dan lega (*breathing space*).
   - Header desktop flat tanpa border. Kotak kalkulasi live diformat sebagai kartu putih solid bersih (`bg-white border border-[#dcdcdc]`).
   - Latar belakang kanvas workspace global (`AppShell.tsx`) distandarisasi ke **`bg-[#ededed]`** (netral sejuk) sehingga seluruh field input isian putih (`bg-white`) tampak kontras, tegas, dan tidak tenggelam.

4. **Ikon Mandiri Riwayat Ritase & Penataan Sidebar — Rule 117**:
   - Menambahkan ikon tiket/struk mandiri (`/icons/ritase.png`) untuk tab **Riwayat Ritase** di `Sidebar.tsx`.
   - Tab `Dispatcher` dan `Riwayat Ritase` berdiri sendiri sebagai menu tingkat atas tanpa accordion/sub-tab yang kolaps.
   - Posisi tab **Kas & Piutang Tempo** (`cash_ledger`) dipindahkan tepat di bawah tab Dashboard.

5. **Penyingkatan Otomatis Suffix 'K' pada Nominal Uang — Rule 119**:
   - Komponen `<MetricCardCurrency />` dan utilitas `src/lib/currencyUtils.ts`: Jika nominal angka terlalu panjang dan kontainer sempit / layar mobile (*overflow*), 3 digit nol terakhir otomatis dipotong menjadi akhiran `K` (contoh: `1.000.000.000` $\rightarrow$ `1.000.000K`), dengan simbol `Rp` kecil semi-transparan dan atribut `title` untuk tooltip nominal penuh.

6. **Pemisahan Metrik Volume DT & Ton — Rule 116**:
   - Metrik volume di kartu dashboard diformat: `Volume: n DT | n Ton` (DT bilangan bulat murni via `Math.round`, Ton maksimal 1 desimal).

7. **Pembersihan ID Teknis Database Master — Rule 118**:
   - Teks kecil ID teknis (`prj-...`, `qry-...`, `inv-...`) di bawah nama entitas master telah dihapus bersih.

8. **Sinkronisasi Aturan Mutlak & Git**:
   - Seluruh aturan baru (Rules 113 s/d 122) telah dicatat di `.agents/RULES.md` dan disinkronkan ke `RULES.md` dengan kesetaraan 0-diff.
   - `npm run build` lulus 100% tanpa error TypeScript.


### FASE 10: Pemisahan Mandiri Halaman Riwayat Ritase, Full-width Desktop, 4 Kartu KPI, dan Desktop Anchored Popover Filter (Rules 123-125)
Dikerjakan oleh **`antigravity-nizar`** merespons arahan User untuk kenyamanan tampilan desktop:

1. **Pemisahan Penuh Halaman Riwayat Ritase Tanpa Duplikasi Form**:
   - Di tab **Riwayat Ritase** (`currentTab === 'ritase'`), form pencatatan ritase baru (`DispatchForm`) di bawah tabel telah **sepenuhnya dieliminasi**.
   - Input ritase baru kini 100% terisolasi di tab khususnya sendiri (**Dispatcher**).
   - Dibuat komponen halaman mandiri baru: `src/components/dispatcher/DispatchHistoryPage.tsx`.

2. **Full-Width Canvas Desktop (Bebas dari Pembungkus max-w-6xl)**:
   - Di `src/components/layout/AppShell.tsx`, pembungkus children kini dinamis: jika `activeTab === 'ritase'`, kontainer menggunakan `w-full max-w-none` sehingga 18 kolom tabel riwayat ritase dapat merentang penuh selebar resolusi layar desktop monitor user secara leluasa, lega, dan modern.

3. **4 Kartu Metrik Ringkasan KPI di Puncak Riwayat Ritase**:
   - **Total Ritase**: Menghitung total trip ritase terfilter.
   - **Total Volume**: Memisahkan format DT (integer bulat via Math.round) dan Ton (1 desimal) sesuai **Rule 116**.
   - **Total Omzet / Tagihan**: Otomatis meringkas nominal uang panjang dengan suffix `K` jika menyentuh overflow sesuai **Rule 119**.
   - **Estimasi Laba Bersih**: Terintegrasi proteksi RBAC ketat (hanya tampil untuk Superadmin/Keuangan, disembunyikan untuk Dispatcher/Investor).

4. **Toolbar Navigasi Terintegrasi & Filter Cepat (Quick Preset Pills)**:
   - **Search Box Global Multi-Atribut**: Dilengkapi tombol clear `✕`. Mendukung pencarian instan terhadap nomor tiket, surat jalan, plat nomor armada, nama supir, kuari asal, nama proyek tujuan, nama klien konsumen, jenis material, catatan ritase, dan nama operator/creator tiket.
   - **Pill Preset Cepat**: `Hari Ini`, `15 Hari Terakhir`, `30 Hari Terakhir`, `Bulan Ini`, dan `Semua Waktu`.

5. **Desktop Anchored Filter Popover & Mobile Bottom Sheet**:
   - Dibuat komponen arsitektur baru: `src/components/dispatcher/DispatchFilterPopover.tsx`.
   - **Desktop UI**: Berupa **Anchored Popover** melayang elegan berukuran lebar (`w-[440px]`) tepat di bawah tombol Filter. Dilengkapi deteksi otomatis klik di luar (*blur/click-outside*) dan shortcut tombol `Escape` untuk menutup seketika.
   - **Mobile UI**: Responsif otomatis beralih menjadi bottom-sheet drawer modal dengan backdrop gelap.
   - **Opsi Filter Menyeluruh**: Tanggal Kustom (Start & End Date Picker), Pilihan Proyek, Pilihan Jenis Material, Pilihan Kuari Asal, dan Pilihan Status Pembayaran (Lunas/Tempo).

6. **Integrasi TableActionMenu & Universal Context Menu (Rule 122)**:
   - Seluruh baris transaksi di tabel riwayat mendukung klik kanan (*context menu*) maupun tombol aksi 3-titik untuk:
     - 👁️ Buka Detail Ritase (`DispatchDetailModal`)
     - ✏️ Edit Data Ritase (`EditDispatchModal`)
     - 💳 Tandai Lunas (`handleSettle`)
     - 🗑️ Hapus Ritase (dengan proteksi PIN Otorisasi 6 digit)

7. **Status Build & Runtime**:
   - `npm run build` lulus **100% Clean** (141 modules transformed, PWA service worker generated, 0 error TypeScript).
   - Vite Dev Server aktif berjalan di background daemon.


### 🚀 Instruksi untuk Nizar saat Menerima Sesi di Windows:
Cukup jalankan perintah git pull standar di direktori proyek Windows:
```bash
cd C:\Users\user\Documents\PATAK
git pull origin main
```
Dev server dapat langsung diakses di `http://localhost:5173/`. Selamat bertugas kembali bersama User, Nizar! 🤝



### FASE 11: Pusat Persetujuan Tiket (Approval Center), Master Data Read-Only Dispatcher, Desktop Full-Width, Custom Scrollbar UI, Sub-Pekerjaan Fisik, Kasbon Mandor & Pool Pembayaran Klien
Dikerjakan oleh **`antigravity-nizar`** merespons arahan User:

1. **Role Dispatcher Read-Only Master & Sistem Persetujuan Tiket (Approval Center)**:
   - Dispatcher dikunci read-only pada seluruh data Master (`DatabasePage`, `ProjectsPage`, `QuarriesPage`, `ClientsPage`, `MasterMaterialPage`). Tombol tambah/edit/hapus disembunyikan.
   - Pada riwayat ritase, Dispatcher tidak dapat langsung mengedit atau menghapus tiket. Dispatcher mengajukan *"Permohonan Koreksi (Edit)"* atau *"Permohonan Hapus"* dengan alasan wajib.
   - Pihak Atasan (Admin/Founder/Dev) memiliki tombol **"Pusat Persetujuan"** di header navigasi desktop dengan badge indikator jumlah permohonan pending.
   - Atasan dapat membandingkan data lama vs usulan perubahan, lalu melakukan **ACC (Setujui)** yang otomatis memperbarui data transaksi dan menyinkronkan kas sentral, atau **Tolak (Reject)** dengan alasan.

2. **Tampilan Desktop 100% Full-Width**:
   - Pembatasan `max-w-6xl` pada pembungkus kontainer utama `AppShell.tsx` telah dihilangkan sehingga seluruh tab navigasi (`database`, `materials`, `projects`, `quarries`, `clients`, `dashboard`, `cash_ledger`, dll.) merentang penuh selebar resolusi layar desktop pengguna dengan padding yang nyaman (`p-4 md:p-6 w-full flex-1`).

3. **Custom Global UI Scrollbar**:
   - Scrollbar di seluruh aplikasi (`src/index.css`) kini menggunakan tombol navigasi panah berputar sesuai arah (up, down, left, right) dengan aset `/icons/scrollbar-arrow-*.png` dan track transparan serta handle berbentuk pil abu-abu tipis pendek.

4. **Pembersihan Halaman Login**:
   - Menghapus tombol non-fungsional "Lanjutkan dengan Google" dan divider dari `LoginPage.tsx` agar tampilan login lebih bersih dan fokus pada otentikasi Email/Password serta pengajuan akses baru.

5. **Pelacakan Transfer Internal Antar Investor (Modal Bersih Berjalan)**:
   - Tabel investor kini menampilkan kolom **"Modal Bersih Berjalan"** yang memperhitungkan mutasi transfer modal antar investor (kategori `MIGRASI_MODAL`).
   - Setiap baris investor menampilkan badge penambahan/pengurangan nominal transfer (misal: `(- Rp 18.000.000 transfer)` atau `(+ Rp 18.000.000 transfer)`) dan tooltip rincian modal awal.

6. **Sistem Sub-Pekerjaan Fisik Proyek, Kasbon Mandor & Pool Pelunasan Klien**:
   - **Pool Pembayaran Pelunasan Klien (Lump-Sum)**: Klien proyek (misal Kak Angga) melunasi pembayaran proyek secara borongan/lump-sum (misal Rp 80.000.000). Dana ini langsung memotong total akumulasi tagihan piutang proyek (material ritase + sub-pekerjaan) tanpa perlu mencentang satu-satu tiket, serta otomatis dicatat sebagai pemasukan di Kas Sentral (`cash_ledger`).
   - **Sub-Pekerjaan Fisik Multi-Satuan**:
     - *MCK*: Borongan paket lump-sum (misal nilai dari proyek Rp 15 jt, plafon tukang Rp 12 jt).
     - *Paving Block*: Satuan meter persegi ($m^2$) $\rightarrow$ luas $\times$ tarif per meter.
     - *Drainase*: Satuan kubikasi ($m^3$) $\rightarrow$ volume $\times$ tarif per kubik.
   - **Buku Kasbon Mandor/Tukang & Pengurangan Plafon Upah**:
     - Setiap kasbon yang dicatat dari buku fisik otomatis memotong sisa hak bayar tukang (misal plafon Rp 12 jt dikurangi kasbon Rp 2 jt = sisa hak bayar Rp 10 jt) dan otomatis dicatat sebagai pengeluaran kas di Kas Sentral (`cash_ledger`).
   - **Lembar Audit Siap Cetak (Print / PDF Ready)**:
     - Komponen `WorkerKasbonPrintModal.tsx` menyediakan lembar rekapitulasi resmi siap cetak (Ctrl+P / Simpan PDF) untuk kontrak kerja borongan dan seluruh bukti tarikan kasbon tukang sebelum proyek berakhir.

7. **Status Build & Runtime**:
   - `npm run build` lulus **100% Clean** (150 modules transformed, 0 error TypeScript, PWA service worker generated).
   - Vite Dev Server aktif berjalan di background daemon.


### FASE 12: Pembaruan Favicon & PWA Icons, Akun Khusus Watcher (All-Seeing Read-Only Auditor), dan Animasi SVG VerifyingScreen
Dikerjakan oleh **`antigravity-nizar`** merespons arahan User:

1. **Pembaruan Aset Ikon Aplikasi PWA & Favicon Browser**:
   - Diambil dari logo resmi squircle resolusi tinggi (1024x1024) yang diunggah User.
   - Digenerate ke format standar PWA dan multi-size ICO menggunakan interpolasi bicubic berkualitas tinggi:
     - `public/favicon.ico` (Multi-frame 16x16, 32x32, 48x48)
     - `public/icons/pwa/favicon-64x64.png` (64x64)
     - `public/icons/pwa/pwa-192x192.png` (192x192)
     - `public/icons/pwa/pwa-512x512.png` (512x512)
     - `public/icons/pwa/maskable-icon-512x512.png` (512x512 maskable)
     - `public/icons/pwa/apple-touch-icon.png` (180x180)
     - `public/icons/pt-logo.png` (512x512 resolusi tajam)
   - Disinkronkan ke seluruh UI aplikasi (`LoginPage.tsx`, `Sidebar.tsx`, `AppShell.tsx` mobile header).

2. **Penyediaan Akun Khusus & Role Watcher (`watcher@patak.id`)**:
   - **Kredensial Login**:
     - Email: `watcher@patak.id`
     - Password: `1234565789`
     - Role: `watcher`
     - Status: `ACTIVE`
     - Terdaftar resmi di Firebase Auth (`UID: fo3aH3i9S1Y8XFuaCkuh7DOvJaB2`) dan Firestore collection `system_users/usr-watcher-patak-id`.
   - **Hak Akses & Pengawasan (All-Seeing Auditor)**:
     - Watcher dapat melihat **SELURUH** alur keuangan kas riil PT, piutang tempo, investor & modal berjalan, riwayat ritase armada, master proyek, kuari, klien, master material, HOK tukang, rekapitulasi periode, dan master database secara global tanpa restriksi scoping.
     - **Tab Dispatcher Dieliminasi**: Watcher tidak memiliki tab `dispatcher` (form input ritase baru), halaman awal otomatis diarahkan ke `dashboard` (Ringkasan Utama & Cashflow) dan memantau logistik di tab `ritase`.
     - **100% Read-Only (Murni Pemantau)**:
       - Seluruh kolom **"AKSI"** pada seluruh tabel disembunyikan total untuk Watcher.
       - Seluruh tombol `+ Tambah`, `+ Mutasi`, `+ Sub-Proyek`, `+ Komoditas`, `+ Cicilan`, dll. disembunyikan.
       - Tombol **"Pusat Persetujuan"** di topbar disembunyikan untuk Watcher.

3. **Komponen Layar Animasi Verifikasi Kredensial (`VerifyingScreen.tsx`)**:
   - Menggantikan GIF statis sidik jari dengan vektor SVG animasi asli logo PT Patak Abadi Jaya:
     - **Layar Overlay**: `bg-white/75 backdrop-blur-md` (efek kaca blur transparan elegan).
     - **Logo Monokrom Hitam Transparan**: Seluruh elemen vektor logo berwarna hitam pekat (`#111111`) tanpa background solid putih.
     - **Animasi Putaran Looping**: 4 bilah lingkaran luar berputar halus looping agak cepat (`1.2s linear infinite`) mengelilingi titik pusat `(463px, 456px)`.
     - **Teks Statis**: Teks "PAJ" di tengah tetap diam/statis tidak ikut berputar.
     - Teks keterangan bawah: `Memverifikasi Kredensial... Harap Tunggu`.

4. **Status Build & Runtime**:
   - `npm run build` lulus **100% Clean** (150 modules transformed, 0 error TypeScript, PWA service worker generated).
   - Vite Dev Server aktif berjalan di background daemon.
