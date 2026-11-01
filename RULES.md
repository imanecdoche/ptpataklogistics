# AGENT OPERATING DIRECTIVES & STRICT CONSTRAINTS (rules.md)

Dokumen ini adalah hukum tertinggi operasional sistem. Kegagalan mematuhi aturan di bawah ini dianggap sebagai cacat eksekusi fatal. Baca dan patuhi secara literal sebelum menyentuh kode apa pun.

---

## 1. SCOPE ENFORCEMENT & INTEGRITY (HUKUM RUANG LINGKUP)
1. **Zero Hallucination & Zero Unprompted Initiative**: 
   - HARAM hukumnya menebak, berinisiatif menambahkan alur, atau mengasumsikan kebutuhan yang tidak tertulis.
   - Jika ada parameter, alur logika, tipe data, atau instruksi yang ambigu: **WAJIB BERHENTI DAN BERTANYA**. Jangan berasumsi.
2. **Strict Component Boundary**:
   - Wajib HANYA membuat komponen yang secara eksplisit diminta dalam instruksi.
   - Dilarang keras membuat fitur sampingan, komponen "bonus", tombol tak bertuan, atau halaman ekstra di luar spesifikasi.
3. **No Fluff & No Noise**:
   - Dilarang membuat teks helper, tooltip edukatif, atau pesan tip (*hints*) yang tidak memiliki urgensi fungsional.
   - Semua label, pesan notifikasi, dan deskripsi sistem wajib singkat, padat, lugas, dan bebas basa-basi korporat berlebihan.

---

## 2. UI/UX & STYLING RESTRICTIONS (HUKUM DESAIN & TAMPILAN)
4. **Anti-Cliché Visual Rules**:
   - **HARAM menggunakan icon sparkle / stars / magic-wand** dalam konteks apa pun.
   - **HARAM membuat pulsing dot** (lingkaran berkedip/animasi denyut) yang menandakan status "sistem aktif", "real-time", atau "online".
   - **HARAM menambahkan badge / tag / pill / chips** di samping label atau judul jika tidak ada instruksi tertulis yang memerintahkannya.
5. **Surface & Background Rules (Anti-Glassmorphism)**:
   - Dilarang membuat komponen dengan gaya kombinasi stroke outline tipis bercampur fill semi-transparan (*glassmorphism/translucent stroke*).
   - Seluruh permukaan komponen WAJIB solid: buat **Filled Sekalian** (solid surface murni) tanpa outline stroke yang tidak perlu.
6. **Modal & Dialog Constraints**:
   - Dilarang menambahkan animasi transisi (fade/scale/spring motion) saat popup window dialog / modal terbuka. Tampilkan secara instan.
   - Backdrop modal wajib menggunakan **dim warna datar tanpa efek blur** (`bg-black/40` atau `bg-slate-900/50`, TANPA kelas `backdrop-blur-*`).

---

## 3. ICONOGRAPHY & TYPOGRAPHIC DISCIPLINE (HUKUM IKON & TEKS)
7. **Naked Icons Only**:
   - Dilarang membungkus ikon di dalam kotak, lingkaran latar, atau box berbayang (`rounded-full bg-blue-50 p-2`, dsb).
   - Ikon wajib berdiri telanjang (*naked icon*) berdampingan langsung dengan label, KECUALI untuk komponen tombol khusus aksi ikon (*icon-only button*).
8. **Monochromatic Icon Uniformity**:
   - Dilarang membuat ikon berwarna-warni yang berbeda dari teks pendampingnya.
   - Ikon di samping label WAJIB mewarisi warna yang seragam persis dengan warna teks labelnya (`currentColor` / warna teks induk).
   - Ikon HANYA boleh menggunakan warna semantik (Merah / Hijau / Kuning) saat digunakan khusus untuk menyoroti operasi mutlak: Berhasil (Success), Gagal (Error), atau Peringatan Bahaya (Warning).
9. **No Wrapped Content / Broken Layout**:
   - Dilarang membiarkan teks atau nilai numerik patah/ter-wrap secara canggung karena ukuran wadah (*parent container*) sempit.
   - Pastikan wadah fleksibel atau gunakan proteksi ukuran (`whitespace-nowrap`, `min-w-0`, atau perhitungan kolom grid yang presisi). Nilai finansial rupiah tidak boleh terpotong atau turun baris.
10. **Adaptive Header Action Buttons**:
    - Jika ada tombol aksi yang diposisikan sejajar (*inline*) dengan konten/judul di header suatu card atau panel: tombol tersebut **WAJIB hanya menampilkan icon saja tanpa label teks**, KECUALI jika area horizontal header terbukti sangat lega dan tidak berisiko mendesak elemen lain.
10b. **Icon Library Standard (HARAM Lucide React)**:
    - **DILARANG KERAS** menggunakan atau menginstal `lucide-react`.
    - Seluruh ikon sistem WAJIB menggunakan **Icons8** (format SVG Glyph/Solid monokrom `currentColor`) yang diakses via Icons8 MCP server dan didaftarkan pada lock file `icons8.json`.


---

## 4. CODE STABILITY & STACK SPECIFICS (TAMBAHAN TEKNIS KRUSIAL)
11. **No Fake / Half-Cooked Code**:
    - Dilarang meninggalkan fungsi kosong bertuliskan `// TODO: implement later` atau tombol yang tidak memicu aksi nyata.
    - Semua perhitungan laba rugi, kuantitas ritase, dan saldo kas wajib menggunakan kalkulasi riil dan dibatasi pembulatan desimal yang tepat.
12. **Lenis & Scroll Integrity**:
    - Saat modal atau popup terbuka, matikan fungsi scroll Lenis sementara agar latar belakang tidak ikut bergeser secara aneh (*scroll bleed*).
13. **Strict TypeScript & Safety**:
    - Dilarang menggunakan tipe `any`. Semua relasi data (Material, Transaksi Ritase, Kas/Deposit) wajib memiliki interface TypeScript yang ketat.

---

## 5. QUALITY ASSURANCE & COMPLETION GATE (GERBANG SELESAI)
14. **Iterative Verification Required**:
    - Uji setiap implementasi fitur secara bertahap. Dilarang membangun banyak fitur sekaligus tanpa menguji fungsi sebelumnya.
15. **Mandatory Visual & Rule Self-Audit**:
    - Sebelum mengeluarkan laporan atau menyatakan pekerjaan "SELESAI", agen **WAJIB** membuka dan memvalidasi tampilan halaman yang telah dibuat.
    - Lakukan audit checklist:
      * [ ] Apakah ada icon sparkle atau pulsing dot yang terselip?
      * [ ] Apakah ada teks angka/label yang ter-wrap rusak?
      * [ ] Apakah ada popup yang menggunakan blur atau animasi lambat?
      * [ ] Apakah ada ikon berwarna-warni di samping label?
      * [ ] Apakah ada komponen siluman di luar instruksi awal?
    - Jika ditemukan satu saja pelanggaran aturan di atas, **PERBAIKI KODE TERLEBIH DAHULU**. Baru boleh menyatakan tugas selesai.

---

## 6. INTEGRASI LAYANAN & PERALATAN (TOOLING INTEGRATION)
16. **Google Stitch MCP Server**:
    - **Endpoint**: `https://stitch.googleapis.com/mcp`
    - **Header Autentikasi**: `X-Goog-Api-Key`
    - **Konfigurasi**: Terdaftar aktif di `~/.gemini/antigravity/mcp_config.json` dan `~/.gemini/config/mcp_config.json`.
    - **Helper Client**: Tersedia di `scripts/stitch_client.py` untuk eksekusi langsung seluruh 16 tools Google Stitch (projek, screen, design system).
    - **Skema Tools**: Terpasang di `~/.gemini/antigravity/mcp/stitch/`.

17. **Icons8 MCP Server & Skills Integration**:
    - **Endpoint MCP**: `https://mcp.icons8.com/mcp/`
    - **Transport**: Direct HTTP/SSE streamable dengan fallback `npx mcp-remote` / scripts.
    - **Autentikasi**: OAuth Browser Login.
    - **Gaya Ikon**: Solid-glyph monokrom (`material_rounded` / `currentColor`).
    - **Lock File**: `icons8.json` di root projek mengunci set dan ukuran ikon (`[16, 20, 24]`).
    - **Client CLI**: `scripts/icons8_client.py` (search, preview, lock).
    - **Agent Skills**: Terpasang di `.agents/skills/icons8/`, `asset-check/`, dsb.

---

## 7. SPESIFIKASI OPERASIONAL PRD REVISI (REVISI PRD V1.0)
18. **Model Transaksi & Finansial Beli-Putus vs Tempo**:
    - **Cashflow Gap**: Belanja material di kuari wajib tunai (**Cash Keluar**), sedangkan penjualan ke proyek/konsumen menggunakan sistem **Tempo (Piutang)**.
    - **Pembakuan Satuan Armada**: Satuan ritase baku menggunakan **`DT_6M3`** (Dump Truck kapasitas standar 6 m³) atau satuan timbangan riil (**`Ton`**).
    - **Komponen Transaksi Baru**:
      * `operationalCost`: Beban operasional riil (solar armada, uang jalan supir, retribusi/portal).
      * `paymentStatus`: Status pembayaran transaksi (`'TEMPO'` atau `'LUNAS'`).
      * `paidAt`: Timestamp saat piutang dilunasi (null jika masih tempo).
    - **Rumus Laba Bersih Transaksi**:
      $$\text{Laba Bersih} = \text{Nilai Penjualan} - (\text{Beban Belanja Pokok Material} + \text{Beban Operasional Lapangan})$$
    - **Saldo Kas Riil & Saldo Negatif**:
      $$\text{Saldo Kas Riil} = \text{Modal Awal} - (\text{Total Belanja} + \text{Total Operasional}) + \text{Total Penjualan Berstatus Lunas}$$
      * **Toleransi Saldo Minus**: Saldo kas diperbolehkan dan dapat bernilai negatif (minus) saat belanja tunai mendahului pencairan tempo.
    - **Paperless Rule**: Dilarang membuat antarmuka atau tombol cetak nota/surat jalan fisik (sistem adalah murni dashboard pengawasan digital tanpa kertas).

---

## 8. INFRASTRUKTUR DATABASE & AUTENTIKASI (FIREBASE DEPLOYMENT)
19. **Aturan Mutlak Inisialisasi Database Firestore**:
    - **Database ID Kustom**: Wajib selalu menggunakan nama database kustom **`pataklogisticdb`** via `getFirestore(app, 'pataklogisticdb')`.
    - **Larangan (Haram)**: Dilarang memanggil `getFirestore(app)` tanpa argumen nama database, karena akan otomatis mengarah ke `(default)` yang menyebabkan kegagalan akses dan data tidak tersimpan.
    - **Project ID**: `antigravityapp-e305d` (Location: `asia-southeast2` Jakarta, Edition: `Enterprise`).
    - **Akun Administratif Awal**:
      * Email: `administator@patak.id`
      * Password: `admin123`
      * UID Terverifikasi: `q6l720sGYiSoZHGtw4BuCA58N7A2`
    - **Skema Data**:
      * `materials` (`MaterialItem`): Master katalog material alam & default unit (`DT` / `Ton`).
      * `transactions` (`DispatchTransaction`): Dokumen ritase armada dengan nomor tiket `PTK-YYYYMMDD-XXXX`.
      * `cash_ledger` (`CashLedgerEntry`): Pencatatan mutasi kas berjalan dengan toleransi saldo minus.

20. **Implementasi Halaman Login (Vercel Light Mode Design System)**:
    - **Visual**: Pure Light Mode (`#ffffff` & `#fafafa`), Vercel Geist typography tokens, solid filled card (`#ffffff` dengan subtle border `#eaeaea`).
    - **Iconography**: Icons8 Glyph Filled SVG monokromatik (`currentColor` / `#171717`), logo Google resmi (Google Brand Guidelines 4-color).
    - **Komponen**: Form Email & Kata Sandi, tombol Masuk (Vercel Primary Black `#171717`), tombol Google OAuth, toggle visibility password, dan kartu sesi aktif dengan tombol Keluar/Logout.

21. **Spesifikasi Navigasi Sidebar Kiri (Left Sidebar Navigation)**:
    - **Dimensi & Layout**: Lebar fixed 240px (`w-[240px]`) pada desktop, sticky/fixed dari atas ke bawah (`h-screen`). Pada mobile: responsif drawer dengan backdrop solid datar (`bg-black/40`, tanpa blur) dan hamburger button.
    - **Design Tokens**: Vercel Light Mode (`bg-white`, border pembatas kanan `border-r border-[#eaeaea]`).
    - **Header Sidebar**: Logo PT Patak (`Icons8Truck` size 20) + nama brand "PT Patak" dan sub-label "Logistics System".
    - **Daftar Menu Navigasi (Tepat 4 Menu Sesuai PRD Revisi)**:
      1. `dispatcher`: "Dispatcher & Ritase" (Icon: `Icons8Truck`, ID 3562)
      2. `cash_ledger`: "Kas & Piutang Tempo" (Icon: `Icons8Wallet`, ID 209)
      3. `recap`: "Rekapitulasi Periode" (Icon: `Icons8BarChart`, ID 15)
      4. `materials`: "Master Material" (Icon: `Icons8Layers`, ID 727)
    - **Visual Item Navigasi**:
      * Status Aktif: Latar belakang `bg-[#f5f5f5]`, teks `#111111` font-medium, ikon `currentColor`.
      * Status Inaktif: Latar belakang transparan, teks `#666666`, hover `bg-[#fafafa]` hover teks `#111111`.
      * Dilarang menambahkan badge, tag, counter pill, pulsing dot, atau background bulat pada ikon (wajib naked icon).
    - **Footer Sidebar**:
      * **Info Profil Pengguna**: Menampilkan baris akun di atas tombol keluar dengan avatar duo-monochrome (`/icons/avatar.png`), nama akun tebal, email akun, dan tombol ikon Gear / Pengaturan (`/icons/settings.png`) di sebelah kanan.
      * **Tombol Keluar**: Tombol aksi "Keluar" (`/icons/logout.png`) berada tepat di bawah info akun profil untuk logout dari sistem.

22. **Konfigurasi Localhost & Jaringan Lokal (Network Access)**:
    - Server pengembangan (Vite Dev Server) wajib dapat diakses melalui jaringan lokal LAN (*host: 0.0.0.0* atau flag `--host`) pada port 5173.
    - Script npm `dev` dan `preview` dikonfigurasi dengan opsi `--host` agar dapat diakses dari perangkat mobile/tablet dalam satu jaringan Wi-Fi/LAN lokal.

23. **Standar Identitas Brand, Format Ikon & Halaman Login Mobile**:
    - **Nama Entitas Resmi**: Wajib menggunakan **"PT Patak Abadi Jaya"** di seluruh judul, sidebar, navbar, dan header aplikasi.
    - **Format Ikon**: Diperbolehkan menggunakan format PNG dari Icons8 dengan style *Glyph filled duo-monochrome* (hitam & abu-abu netral) maupun SVG monokromatik resmi.
    - **Aset Ikon Lapangan & Menu**:
      * Logo Utama: Kotak muatan tambang (`/icons/logo-box.png`).
      * Field Email: Amplop surat duo-monochrome (`/icons/mail.png`).
      * Field Password: Gembok duo-monochrome (`/icons/lock.png`).
      * Menu Dispatcher: Truk muatan duo-monochrome (`/icons/truck.png`).
      * Menu Kas & Piutang: Dompet saldo duo-monochrome (`/icons/wallet.png`).
      * Menu Rekapitulasi: Papan grafik tren duo-monochrome (`/icons/chart.png`).
      * Menu Master Material: Tumpukan lapisan material duo-monochrome (`/icons/layers.png`).
      * Profil Akun Pengguna: Avatar duo-monochrome (`/icons/avatar.png`).
      * Pengaturan Akun: Roda gigi gear duo-monochrome (`/icons/settings.png`).
      * Tombol Keluar / Logout: Pintu panah keluar duo-monochrome (`/icons/logout.png`).
      * Tombol Tutup / Close: Silang lingkaran duo-monochrome (`/icons/close.png`) WAJIB selalu digunakan untuk seluruh aksi tutup (drawer, modal, popup).
    - **Tinggi Halaman & Scroll Integrity**:
      * Tinggi kontainer halaman login wajib fleksibel mengikuti tinggi viewport penuh (`h-dvh` atau `h-screen`, `overflow-hidden`), sehingga konten tidak dapat dan tidak perlu di-scroll sama sekali baik di desktop maupun mobile.
    - **Tampilan Khusus Mobile**:
      * Di layar mobile (`< md`), form login tampil *cardless* / *edge-to-edge* tanpa border card luar. Header (logo & nama PT) menempel rapat di atas form (`mb-6`), dan satu kesatuan blok konten utama dipusatkan di tengah vertikal viewport (`flex-1 flex flex-col justify-center`), dengan footer tetap berada di bagian paling bawah.
      * Tampilan desktop (`>= md`) tetap mempertahankan Vercel card berbingkai elegan yang terpusat rapi.
    - **Tipografi Header Login**:
      * Teks judul login: "Masuk ke" di baris pertama, dan di baris bawahnya nama PT "PT Patak Abadi Jaya".
    - **Teks Footer**:
      * Ukuran teks footer dibuat lebih kecil dan ringkas (`text-[10px]` / `text-[9px]`).
    - **Indikator Loading Otentikasi**:
      * Saat tombol login diklik (`isLoading = true`), teks tombol digantikan spinner / loader melingkar yang berputar cepat (`animate-spin`), baik di desktop maupun mobile.
    - **Animasi Toggle Password (Eye Icon) Zero-Blinking**:
      * Menggunakan aset Icons8 Plumpy Animated yang dikemas ke dalam satu *Sprite Sheet* horizontal utuh (`/icons/eye-spritesheet.png`, 11 frame transparan).
      * Dijalankan menggunakan transisi `backgroundPosition` (CSS/interval) tanpa reload atau ganti file gambar, sehingga **100% bebas kedip putih / zero-blinking**.
      * Saat password tersembunyi (hidden), mata terpejam rapat di Frame 0 (`isOpen=false`).
      * Saat di-klik untuk melihat password, mata bertransisi mulus membuka ke Frame 10 (`isOpen=true`) dan berhenti di posisi terbuka.
      * Saat di-klik untuk menyembunyikan kembali, mata bertransisi mulus menutup kembali ke Frame 0 dan berhenti di posisi terpejam.

24. **Konfigurasi Identitas Google OAuth Sign-In (Consent Screen)**:
    - **Nama Tampilan Aplikasi Publik**: Wajib diatur menjadi **"Patak Logistic"** (atau **"PT Patak Abadi Jaya"**).
    - **Lokasi Pengaturan**:
      1. **Firebase Console**: Buka menu *Authentication* -> tab *Sign-in method* -> pilih *Google* -> ubah kolom **Public-facing name for project** dari `project-633290654165` menjadi **`Patak Logistic`** -> klik *Save*.
      2. **Google Cloud Console**: Buka *APIs & Services* -> *OAuth consent screen* (Layar Persetujuan OAuth) pada project `antigravityapp-e305d` -> ubah **App name** menjadi **`Patak Logistic`** -> simpan perubahan.
    - Setelah disimpan, dialog pop-up otentikasi Google akan otomatis menampilkan nama **Patak Logistic** alih-alih ID project internal.

25. **Standar Dialog Sistem (Hukum Mutlak: Dilarang Menggunakan Dialog Bawaan Browser)**:
    - **Larangan Keras (Haram)**: Dilarang keras menggunakan fungsi dialog bawaan browser seperti `window.alert()`, `window.confirm()`, atau `window.prompt()`. Dialog native browser merusak pengalaman pengguna desktop-grade, tidak konsisten antar platform, dan melanggar standar estetika sistem.
    - **Kewajiban Custom UI Dialog**: Seluruh pemanggilan dialog, pesan konfirmasi, pemberitahuan (alert), modal peringatan, maupun dialog form WAJIB menggunakan komponen Custom UI Dialog internal aplikasi.
    - **Spesifikasi & Standar Visual Dialog**:
      * **Backdrop**: Solid dimming `bg-black/40` tanpa efek blur (anti-glassmorphism).
      * **Container Card**: Solid white (`bg-white`) borderless murni tanpa outline stroke (`border-none`), sudut melengkung proporsional (`rounded-[8px]`), bayangan halus terangkat (`shadow-2xl`).
      * **Tombol Tutup (Close Button)**: Wajib selalu menggunakan ikon silang lingkaran duo-monochrome (`/icons/close.png`) di pojok kanan atas dialog.
      * **Tipografi & Tombol Aksi**: Teks bersih tanpa font monospace (kecuali kode teknis/ID), tombol aksi selaras token Vercel (Primary: `bg-[#171717] hover:bg-[#333333] text-white`, Secondary: `bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#171717]`).
      * **Aksesibilitas & Arsitektur**: Disediakan melalui Provider/Hook (`DialogProvider` / `useDialog` atau setara) sehingga dapat dipanggil secara imperatif maupun deklaratif di seluruh penjuru aplikasi tanpa reload atau kedipan visual.

26. **Hukum Larangan Outline Stroke (Borderless & Solid Filled Surfaces)**:
    - **Larangan Mutlak**: Dilarang keras menggunakan garis tepi / border outline stroke (`border`, `border-*`, outline stroke) pada komponen kartu (cards), kontainer konten, tombol aksi, dialog modal, dan input form.
    - **Filosofi Visual**: Seluruh elemen visual wajib murni menggunakan **Filled Solid Surface** dengan pemisahan hierarki visual yang mengandalkan kontras tonal latar belakang (`bg-white` di atas kanvas `#fafafa`, atau `bg-[#f5f5f5]`) dan elevasi bayangan halus (`shadow-sm`, `shadow-md`, `shadow-2xl` untuk modal), bukan garis stroke outline.
    - **Spesifikasi Input Form**: Input field wajib menggunakan latar abu-abu terang borderless (`bg-[#f5f5f5]`), transisi tonal saat fokus (`focus:bg-[#ebebeb]`), tanpa ring/outline stroke (`outline-none focus:outline-none focus:ring-0`).
    - **Spesifikasi Tombol Sekunder**: Tombol sekunder (Batal, Google Sign-In, dsb.) wajib menggunakan filled solid surface (`bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#171717]`), tanpa garis tepi border.
    - **Spesifikasi Kartu & Kontainer**: Kartu desktop dan dialog modal tampil borderless murni (`bg-white` tanpa border) dengan elevasi bayangan halus yang presisi.

27. **Standar Animasi Sidepanel Mobile (Smooth Drawer Transitions)**:
    - **Pergerakan Slide 60fps**: Sidepanel drawer di layar mobile wajib menganimasikan pembukaan dan penutupan secara mulus menggunakan GPU transform `translateX` dengan durasi 300ms dan kurva halus `ease-out` (`duration-300 ease-out`).
    - **Transisi Dua Arah (Enter & Exit)**: Dilarang keras melakukan unmount komponen seketika yang menghilangkan animasi penutupan. Komponen drawer harus tetap ter-mount atau menunggu transisi selesai sebelum unmount (`-translate-x-full` -> `translate-x-0` dan sebaliknya).
    - **Backdrop Fade**: Latar belakang gelap solid `bg-black/40` bertransisi fade mulus (`opacity-0` ke `opacity-100`) selaras dengan durasi drawer 300ms.
    - **Body Scroll Lock**: Saat sidepanel mobile terbuka, scroll halaman belakang (`body`) wajib dikunci (`overflow-hidden`) dan dikembalikan saat tertutup untuk mencegah pergeseran halaman tidak sengaja.
    - **Aksesibilitas & Trigger Tutup**: Penutupan drawer wajib merespons secara mulus terhadap: tombol silang `/icons/close.png`, tap di area backdrop, pemilihan menu navigasi, dan tombol `Escape` pada keyboard.

28. **Standar Proporsi & Skala Sidepanel Desktop (Desktop Sidebar Proportional Scaling)**:
    - **Lebar Khusus Desktop**: Lebar sidepanel khusus layar desktop (`md:`) diatur lega dan proporsional sebesar **280px** (`md:w-[280px]`), bukan 240px yang sempit.
    - **Skala Elemen Desktop**:
      * **Brand Header**: Tinggi `md:h-20`, logo box `md:w-7 md:h-7` (28px), judul `md:text-sm md:font-bold`, subjudul `md:text-xs`.
      * **Menu Navigasi**: Item menu `md:px-3.5 md:py-2.5`, icon menu duo-monochrome `md:w-5 md:h-5` (20px), label menu `md:text-sm font-medium`.
      * **Profil Akun**: Avatar `md:w-9 md:h-9` (36px), nama akun `md:text-sm font-semibold`, email `md:text-xs`, icon pengaturan `md:w-5 md:h-5`.
      * **Tombol Keluar**: `md:px-3.5 md:py-2.5`, icon `md:w-5 md:h-5`, teks `md:text-sm`.
    - **Integritas Mobile**: Skala drawer di mobile (`< md`) tetap dipertahankan kompak (`w-[240px]`, ikon 16px, teks 12px) agar proporsional dan tidak memakan terlalu banyak ruang di layar smartphone.

29. **Standar Penyelarasan Garis Header Desktop (Desktop Header Horizon Line Alignment)**:
    - **Hukum Keselarasan Horizon**: Garis batas bawah header sidepanel (`Sidebar`) dan garis batas bawah header konten utama (`AppShell`) WAJIB sejajar lurus horizontal 100% tanpa deviasi/patah piksel sedikit pun.
    - **Tinggi Baku Bersama**: Kedua kontainer header pada layar desktop wajib mengunci tinggi yang sama persis sebesar **80px** (`md:h-20`), dengan garis pembatas bawah `border-b border-[#eaeaea]`.
    - **Pemusatan Konten**: Header konten halaman menggunakan `md:h-20 md:py-0 md:flex md:flex-col md:justify-center px-6` agar teks judul dan subjudul terpusat vertikal secara presisi dan garis bawahnya menyatu lurus sempurna dari ujung kiri ke kanan.

30. **Hukum Larangan Drop Shadow pada Kartu & Kontainer Halaman (Pure Flat Tonal Surface)**:
    - **Larangan Drop Shadow**: Dilarang keras menggunakan efek bayangan (`shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, dsb.) pada kartu (cards), box konten, dan kontainer halaman.
    - **Tampilan Polosan Datar (Flat Surface)**: Seluruh kartu dan kontainer konten wajib tampil polosan murni (*pure flat filled surface*) `bg-white` di atas latar kanvas `#fafafa` tanpa bayangan dan tanpa outline border stroke.
    - **Pengecualian Khusus Overlay**: Efek bayangan elevasi hanya diperkenankan khusus untuk elemen melayang di atas backdrop/overlay (seperti Modal Dialog dan Mobile Drawer) agar memiliki pemisahan visual yang jelas dari layar di belakangnya.

31. **Standar Tipografi Monospace (JetBrains Mono)**:
    - **Font Monospace Baku**: Seluruh elemen teks teknis, kode, ID, status database, token, atau teks yang menggunakan kelas `font-mono` WAJIB menggunakan font keluarga **JetBrains Mono** (`'JetBrains Mono', monospace`).
    - **Pemuatan**: Dimuat secara resmi via Google Fonts CDN di `index.html` dengan `font-display: swap` untuk performa render cepat dan tajam.
    - **Pemberlakuan**: Diatur pada token `--font-mono` di `src/index.css` dan dipetakan ke utilitas font Tailwind CSS.

32. **Standar Tipografi Body & Antarmuka Utama (DM Sans Variable)**:
    - **Font Body Baku**: Seluruh elemen antarmuka pengguna, heading, label, paragraf, tombol, dan teks non-monospace WAJIB menggunakan keluarga font **DM Sans** (`'DM Sans', sans-serif`).
    - **Pemuatan Resmi**: Dimuat langsung dari Google Fonts CDN resmi (`https://fonts.google.com/specimen/DM+Sans`) dengan rangkaian Variable lengkap (`ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000`) dan `font-display: swap`.
    - **Pemberlakuan Global**: Dikonfigurasikan sebagai token `--font-sans` di `src/index.css` serta dipetakan ke `@theme` Tailwind CSS dan `body`, menggantikan font Geist/sistem sebelumnya.

33. **Standar Tinggi Viewport & Zero-Scroll Integrity (Desktop & Mobile Viewport Locking)**:
    - **Penguncian Layar Utuh**: Seluruh tampilan halaman aplikasi (termasuk `AppShell` dan `LoginPage`) jika seluruh konten termuat dalam satu layar/viewport dan tidak ada konten yang offset keluar layar, tingginya WAJIB pas setinggi layar device (`h-dvh max-h-dvh overflow-hidden`), sehingga halaman **100% TIDAK BISA DI-SCROLL** sama sekali (bebas dari ghost scroll/scroll kosong).
    - **Struktur Shell Desktop & Mobile**:
      * Kontainer root: `h-dvh max-h-dvh overflow-hidden flex flex-col md:flex-row bg-[#fafafa]`
      * Sidebar: `h-full md:w-[280px] flex-shrink-0`
      * Kolom kerja utama: `flex-1 flex flex-col min-w-0 h-full overflow-hidden`
      * Header (Navbar mobile & Content Header desktop): `flex-shrink-0`
      * Area kerja konten (`<main>`): `flex-1 overflow-y-auto p-6`. Jika konten tidak melebihi layar, maka 0 scroll; jika kelak ada data tabel/list panjang yang melebihi viewport, hanya area konten yang bergulir mulus tanpa menggeser header dan sidebar.

34. **Standar Efek Karet Mentok Bawah Mobile (Mobile Bottom Rubber Band & Elastic Dome)**:
    - **Penonaktifan Efek Bawaan Browser**: Efek overscroll/pull bawaan browser (Chrome Android & Safari) WAJIB dimatikan menggunakan properti CSS `overscroll-behavior-y: none;` pada html, body, dan kontainer scroll mobile.
    - **Visual Kubah Karet Elastis Berdimensi Lapang**: Saat pengguna melakukan scroll/tarik melewati batas akhir bawah pada layar mobile, muncul kubah setengah lingkaran putih elastis (`bg-white` dengan kurva cubic bezier melengkung tinggi dan bahu lebar `C 15 0, 85 0, 100 100`) yang meregang naik dari tepi bawah layar dengan resistansi tarikan berbobot (damping factor ~0.4x dan batas regang lapang hingga ~135px).
    - **Konten Ter-clip di Dalam Kubah**:
      * Di dalam kubah karet putih terdapat ikon animasi `/icons/icons8-down.gif` berukuran kompak (20px, `w-5 h-5`) dan teks kecil semitransparan: `"Sudah mentok, Pak!"` (`text-[11px]`).
      * Konten ter-clip rapi di dalam kubah putih dengan padding bawah proporsional (`pb-5`), sehingga seluruh ikon dan teks tertampung utuh dan tidak terpotong oleh tepi kurva.
      * Transparansi ikon GIF dan teks WAJIB bernilai sama persis dan bertransisi mulus seiring jarak tarikan (`pullDistance > 20px`).
    - **Pantulan Cepat (Snap-Back)**: Saat jari pengguna dilepas, kubah dan konten langsung memantul cepat kembali ke bawah (~240ms spring cubic-bezier snap-back) hingga tertutup rapi kembali.
    - **Spesifik Layar Mobile**: Efek ini khusus aktif pada interaksi sentuh mobile (`< md`).

35. **Standar Layar Antara Verifikasi Kredensial (Credential Verification Transition Screen)**:
    - **Pemicu & Kondisi Muncul**: Ditampilkan sesaat setelah proses login berhasil (baik email/password maupun Google) dan saat memuat ulang halaman (page refresh) ketika sesi akun sedang aktif/diperiksa, sebelum pengguna masuk dan melihat halaman kerja utama (dashboard).
    - **Desain Layar Penuh Putih**: Kanvas solid putih utuh (`fixed inset-0 z-50 bg-white h-dvh max-h-dvh w-full overflow-hidden`), tanpa scrollbar, tanpa badge/pill/tag tambahan, dan tanpa bingkai/stroke outline.
    - **Komposisi Tengah Layar**: Tepat di tengah layar secara vertikal dan horizontal (`flex flex-col items-center justify-center select-none`):
      * **Ikon Fingerprint Animasi**: Berkas `/icons/icons8-fingerprint.gif` berukuran kompak 48px (`w-12 h-12 object-contain pointer-events-none`).
      * **Teks Verifikasi**: Tepat di bawah ikon dengan jarak proporsional (`mt-3.5` / 14px), teks bertuliskan `"Memverifikasi Kredensial... Harap Tunggu"` berukuran 12px (`text-xs text-[#888888] font-normal tracking-normal`).
    - **Durasi & Transisi Halus (Fade-Out)**:
      * Layar verifikasi tampil aktif selama **3 detik** (`3000ms`) agar animasi sidik jari dapat berjalan beberapa siklus penuh.
      * Setelah 3 detik selesai, layar bertransisi memudar lembut (**Fade-Out ~300ms** via `transition-opacity duration-300 opacity-0`) membuka antarmuka workspace dashboard utama secara elegan tanpa kedipan mendadak.

36. **Spesifikasi Halaman Dispatcher & Ritase (Dispatcher & Fleet Dispatch Management)**:
    - **Tata Letak Split View Responsif**:
      * Desktop: Formulir Input Tiket Ritase Cepat di kolom kiri (`w-[380px]` hingga `w-[420px]`) dan Tabel Transaksi Ritase Hari Ini di kolom kanan (`flex-1 min-w-0`).
      * Mobile: Bertumpuk secara vertikal (`flex-col`) dengan transisi elastis overscroll yang rapi.
    - **Formulir Tiket Ritase & Otomasi Harga**:
      * Data Master Material: Otomatis ditarik dari koleksi `materials` di database `pataklogisticdb`.
      * Autofill Harga Fleksibel: Memilih jenis material otomatis mengisi acuan harga beli tunai kuari, harga jual tempo proyek, dan satuan default, namun staf tetap dapat mengubah harga secara manual per transaksi.
      * Live Kalkulasi PRD: Real-time menghitung Total Belanja Kuari (`quantity * buyPricePerUnit`), Total Omset Penjualan (`quantity * sellPricePerUnit`), dan Estimasi Laba Bersih (`totalRevenue - (totalBuyCost + operationalCost)`).
    - **Otomasi Pembukuan Kas (Cash Ledger Integration)**:
      * Saat tiket ritase baru disimpan, sistem otomatis mencatat 2 mutasi kas keluar di `cash_ledger`: Belanja Material (`BELI_MATERIAL`) dan Beban Operasional Lapangan (`BIAYA_OPERASIONAL`).
    - **Tabel Transaksi & Pemantauan**:
      * Default menampilkan data transaksi Hari Ini (`today`) dilengkapi pemilih tanggal riwayat dan kotak pencarian instan (plat truk, nomor tiket, pembeli).
      * Ringkasan KPI harian (Total Ritase, Total Omset, Total Laba Bersih).
      * Aksi "Tandai Lunas" khusus untuk transaksi berstatus `TEMPO` dengan konfirmasi `CustomDialog`, yang otomatis membukukan kas masuk pelunasan piutang di `cash_ledger`.
      * Tombol "Detail" membuka modal dialog rincian komputasi tiket ritase.
    - **Kepatuhan Desain Mutlak**:
      * Dilarang keras menggunakan badge/pill/tag warna-warni (status `TEMPO` dan `LUNAS` murni teks tipografi bersih).
      * Dilarang menggunakan outline stroke / border pada container kartu (`bg-white` borderless).
      * Dilarang menggunakan drop shadow pada kartu konten.
      * Angka finansial, plat nomor, dan nomor tiket wajib menggunakan font JetBrains Mono.

37. **Standar Responsif Input Finansial Ritase Mobile (Single-Column Unwrapped Inputs)**:
    - **Tata Letak Baris Bertumpuk pada Mobile**: Bidang input `Beli Kuari / {unit} (Cash)` dan `Jual Proyek / {unit} (Tempo)` pada tampilan mobile (`< sm`) WAJIB dipecah menjadi dua baris terpisah (masing-masing menempati 1 baris penuh `w-full` via `grid-cols-1 sm:grid-cols-2`), bukan displit bersebelahan.
    - **Pencegahan Label Terpotong (Anti-Wrap)**: Seluruh label input finansial pada form pencatatan ritase menggunakan `whitespace-nowrap` sehingga teks label tidak terlipat (*wrapped*), tidak berdesakan, dan tetap terbaca utuh dan rapi di semua ukuran layar smartphone.

38. **Standar Komponen Input Mata Uang (Currency Input with Fixed 'Rp' Prefix & 3-Digit Divider)**:
    - **Simbol Tetap Tersemat (Fixed Prefix)**: Seluruh input yang merepresentasikan nilai mata uang/finansial wajib menyematkan label simbol prefix `Rp` tetap (non-editable) di sisi kiri dalam kotak input (`pl-3 pr-1 text-xs font-mono font-medium text-[#888888] select-none pointer-events-none`).
    - **Pemisah 3-Digit Otomatis (Automatic Thousands Divider)**: Saat pengguna mengetik angka atau nilai terisi dari database/master, angka otomatis terformat dengan pemisah ribuan titik (`.`) secara instan (contoh: `650.000`, `850.000`, `150.000`).
    - **Integritas Nilai Numerik (Raw Value Emission)**: Komponen mengekstrak digit murni dan mengalirkan nilai bertipe `number` murni ke state parent (`onChange(num)`), menjaga kalkulasi otomatis tetap presisi dan bebas error string.
    - **Kepatuhan Desain Mutlak**:
      * Kotak input menggunakan permukaan datar abu-abu terang borderless (`bg-[#f5f5f5] focus-within:bg-[#ebebeb]`) tanpa border stroke outline dan tanpa ring glow.
      * Teks angka menggunakan keluarga font **JetBrains Mono** (`font-mono font-medium text-[#111111]`).
      * Terpasang secara global melalui komponen standar terdedikasi `src/components/ui/CurrencyInput.tsx`.

39. **Standardisasi Kapitalisasi Nama Pembeli / Entitas & Otomasi Title Case**:
    - **Format Singkatan Badan Hukum Baku PUEBI**: Mengetik kata `"pt"` atau `"pt."` otomatis diubah menjadi **`PT`** (kapital penuh tanpa titik, sesuai standar resmi Pedoman Umum Ejaan Bahasa Indonesia / PUEBI dan UU Perseroan Terbatas No. 40 Tahun 2007). Standardisasi yang sama juga berlaku untuk badan usaha lainnya seperti `CV`, `UD`, `KM`, dan `Tbk`.
    - **Otomasi Huruf Besar di Awal Kata (Title Case)**: Setiap kata yang diketik pada field nama pembeli/kontraktor proyek (serta nama sopir) otomatis diawali dengan huruf kapital (Capitalize Each Word) secara real-time saat pengguna mengetik (contoh: `"pt maju karya"` otomatis menjadi `"PT Maju Karya"`).

40. **Standar Responsif Input Material & Volume (Mobile Stacked & Right-Aligned Fixed Unit)**:
    - **Tata Letak Bertumpuk pada Layar Mobile**: Bidang input `Jenis Material` dan `Volume` pada layar mobile (`< sm`) WAJIB dipecah menjadi 2 baris terpisah (masing-masing menempati baris penuh `w-full` via `grid-cols-1 sm:grid-cols-3`), tidak dibagi bersebelahan agar dropdown nama material dan input angka tidak terhimpit.
    - **Penyederhanaan Label**: Label input kuantitas cukup bertuliskan **`Volume`** (tanpa embel-embel satuan dalam kurung seperti `Volume (DT)`).
    - **Indikator Satuan Tetap di Sisi Kanan (Fixed Unit Addon)**: Sebagai penunjuk satuan yang jelas dan elegan, satuan material yang aktif (misal: `DT` atau `Ton`) disematkan secara tetap (*non-editable / fixed*) di dalam kotak input pada sisi paling kanan (`pr-3 pl-1 text-xs font-mono font-medium text-[#888888] select-none pointer-events-none`).

41. **Standar Input Angka & Kuantitas (Blank on Backspace & Zero on Unfocus)**:
    - **Toleransi Input Kosong Saat Fokus**: Saat pengguna sedang mengedit/menghapus digit angka (backspace) hingga digit terakhir habis, kotak input WAJIB menjadi kosong murni (`""`) dan DILARANG memaksa memunculkan angka `'0'` seketika. Hal ini mencegah bug input seperti `"03"` atau `"0500"` saat pengguna ingin mengganti angka.
    - **Restorasi Otomatis Saat Unfocused (onBlur)**: Angka `'0'` hanya dimunculkan secara otomatis jika dan hanya jika pengguna meninggalkan field tersebut (unfocused / `onBlur`) dalam keadaan kosong tanpa isi.
    - **Pemberlakuan Global**: Standar ini berlaku seragam pada seluruh input numerik sistem, termasuk input `Volume` ritase serta komponen `CurrencyInput` (Beli Kuari, Jual Proyek, Operasional).

42. **Standar Integritas Data Master Material (Deterministic Doc IDs & Deduplication)**:
    - **Penyebab Terjadinya Duplikasi**: Pemuatan awal data material secara asinkronus (terutama pada hot module reload atau React StrictMode yang menjalankan hook mount berulang kali) sebelumnya menggunakan `addDoc` dengan ID acak sehingga menciptakan salinan dokumen duplikat di Firestore `materials`.
    - **Solusi Database (Deterministic Document ID)**: Dokumen default material WAJIB menggunakan ID deterministik berbasis slug tetap (`mat-batu-belah`, `mat-pasir-extra`, `mat-abu-batu`, `mat-makadam`) via `setDoc(doc(col, id), data, { merge: true })`, sehingga seberapa pun sering dipanggil, Firestore hanya akan meng-update dokumen yang sama tanpa membuat baris baru.
    - **Solusi UI (In-Memory Deduplication Guard)**: Fungsi pemuatan `getMaterials()` wajib memfilter array dokumen berdasarkan nama unik (case-insensitive trim) sehingga dropdown antarmuka pengguna dijamin 100% selalu hanya menampilkan daftar material unik dan bersih.

43. **Standar Komponen Pemilih UI Kustom (Custom UI Pickers: Material Picker Modal & Custom Date Picker)**:
    - **Penggantian Komponen Asli Browser**: Seluruh pemilih dropdown seleksi (termasuk jenis material) dan pemilih tanggal WAJIB menggunakan komponen UI kustom yang dirancang khusus dan DILARANG menggunakan picker native bawaan browser (`<select>` default dan `<input type="date">` default).
    - **Modal Pemilih Jenis Material (`MaterialPickerModal.tsx`)**:
      * **Tampilan Mobile**: Tampil sebagai overlay modal yang hampir memenuhi viewport (`h-[88vh]`) dengan sudut membulat atas `rounded-t-[16px]`, menggunakan backdrop gelap tembus pandang tanpa blur (`bg-black/40`), judul "Jenis Material", dan tombol tutup X (`/icons/close.png`) di bagian header kanan atas. Dilarang menambahkan tombol tutup sekunder di bagian bawah modal.
      * **Tampilan Desktop**: Tampil sebagai jendela popup luas (`w-full md:max-w-xl md:rounded-[12px]`) yang lega dan nyaman diakses di tengah layar dengan backdrop gelap tembus pandang tanpa blur.
      * **Pencarian Cepat (Instant Searchbar)**: Tersemat di area header modal untuk menyaring jenis material dan satuan secara real-time.
      * **Pengurutan Berbasis Frekuensi Transaksi**: Urutan daftar jenis material secara otomatis disusun berdasarkan frekuensi kemunculannya dalam riwayat transaksi ritase (material yang paling sering digunakan otomatis bertengger di posisi paling atas).
      * **Item Kartu Material & Ikon 1:1**: Setiap baris item material dipisahkan oleh pembatas garis tipis (`divide-y divide-[#f5f5f5]`), memiliki thumbnail icon rasio 1:1 di sisi kiri (`w-12 h-12 md:w-14 md:h-14 rounded-[8px] object-cover`) yang diambil dari aset resmi (`public/images/materials/`), nama material yang tegas, dan badge satuan volume tanpa border outline (contoh: `DT` atau `Ton`).
      * **Rincian Finansial**: Pada tampilan desktop, sisi kanan menampilkan acuan harga beli tunai kuari dan acuan harga jual tempo proyek berformat JetBrains Mono.
    - **Komponen Pemilih Tanggal Kustom (`CustomDatePicker.tsx`)**:
      * Dirancang khusus menggantikan `<input type="date">` native browser.
      * **Tampilan Responsif**: Popover kalender di desktop yang terposisi presisi di bawah tombol pemicu, dan bottom-sheet modal dengan backdrop dim gelap tanpa blur pada mobile.
      * **Fungsi Interaktif**: Navigasi antar bulan/tahun, kisi kalender 7-hari dengan penanda hari aktif dan hari ini, serta tombol pintas "Hari Ini" untuk seleksi instan tanggal saat ini.
    - **Kepatuhan Desain Mutlak**:
      * Seluruh container modal dan popover flat borderless tanpa border outline dan tanpa drop shadow (`shadow-md`, `shadow-lg`, `shadow-2xl` dilarang).
      * Tanggal, nilai harga acuan, dan satuan tetap menggunakan font **JetBrains Mono**.

44. **Standar Penanganan Dua Tanggal Transaksi Ritase (Tanggal Jalan & Tanggal Dibuat)**:
    - **Pemisahan Dimensi Waktu Logistik**:
      * **Tanggal Ritase / Jalan (`deliveryDate`)**: String format baku lokal `YYYY-MM-DD` (contoh: `'2026-10-30'`) yang merepresentasikan waktu aktual armada beroperasi / jalan. Terletak di baris paling atas form pencatatan ritase (`fullWidth`) menggunakan `CustomDatePicker`, dengan nilai default "Hari Ini" namun fleksibel diubah ke tanggal lampau (misal: pengiriman kemarin yang baru sempat diinput hari ini).
      * **Tanggal Tiket Dibuat (`createdAt`)**: ISO string timestamp otomatis saat formulir disubmit ke sistem, SELALU mencatat tanggal & jam "hari ini" secara absolut untuk kebutuhan jejak audit (*audit trail*).
    - **Pencegahan Timezone Offset Bug**:
      * Penyaringan riwayat tabel (`subscribeTransactionsByDate`) WAJIB memfilter berdasarkan *exact match* string `deliveryDate == dateStr` (bukan membandingkan UTC ISO string yang bergeser -7 jam pada zona waktu Indonesia WIB).
    - **Penyajian di Tabel Riwayat Ritase (`DispatchTable.tsx`)**:
      * Kolom pertama menyajikan 3 informasi terstruktur:
        1. Nomor Tiket (`ticketNumber`) dengan font **JetBrains Mono** tebal.
        2. Tanggal Jalan (`Jalan: DD MMM YYYY`).
        3. Waktu Tiket Dibuat (`Dibuat: DD MMM YYYY, HH:mm WIB`).
      * Filter kalender tabel secara default menyaring transaksi berdasarkan **Tanggal Jalan** armada.
    - **Penyajian di Modal Rincian (`DispatchDetailModal.tsx`)**:
      * Menampilkan rincian tanggal pelaksanaan jalan dan waktu pencatatan sistem secara transparan dan akurat.

45. **Standar Responsif Modal Rincian Tiket Ritase Mobile (Bottom Sheet & Anti-Wrap Layout)**:
    - **Tata Letak Bottom Sheet Mobile**:
      * Pada tampilan mobile (`< md`), modal rincian transaksi (`DispatchDetailModal.tsx`) WAJIB tampil sebagai *Bottom Sheet* yang menempel di bagian bawah layar (`fixed inset-x-0 bottom-0 w-full rounded-t-[16px] max-h-[90vh] overflow-y-auto`) dengan backdrop gelap tembus pandang tanpa blur (`bg-black/40`), bukan sebagai pop-up kecil melayang di tengah layar yang menyempitkan ruang baca.
      * Pada tampilan desktop (`md:`), modal tetap berpenampilan sebagai pop-up tengah yang elegan (`md:max-w-md md:rounded-[12px]`).
    - **Pencegahan Text-Wrapping & Layout Stacked**:
      * Seluruh data identitas (Plat Nomor vs Pembeli / Kontraktor, serta Jenis Material vs Volume) disusun bertumpuk 1 kolom penuh pada mobile (`grid-cols-1 sm:grid-cols-2`), memberikan ruang baca lega tanpa himpitan.
      * Angka finansial dan mata uang (`Rp`) WAJIB dikunci dengan `whitespace-nowrap flex-shrink-0` sehingga simbol `Rp` dan digit nominal TIDAK PERNAH terputus atau terlipat menjadi dua baris.
      * Label finansial dipadatkan secara bersih dan ringkas (`Beli Kuari (Cash)`, `Operasional Lapangan`, `Penjualan (Tempo)`, `Estimasi Laba Bersih`) dengan `truncate` pada label kiri agar tidak mendorong angka nominal ke baris berikutnya.
      * Tanggal pelaksanaan dan waktu pencatatan sistem disusun secara vertikal/stacked responsif (`flex flex-col sm:flex-row sm:justify-between`) dengan nilai waktu terkunci `whitespace-nowrap`.
    - **Peniadaan Tombol Tutup Ganda**:
      * Cukup menggunakan satu tombol tutup `X` (`/icons/close.png`) di bagian kanan atas header modal. DILARANG menambahkan tombol "Tutup" sekunder di bagian bawah modal agar ruang vertikal layar ponsel tetap hemat dan rapi.

46. **Standar Responsif Kartu Metrik Ringkasan Harian Ritase (Single-Row Stacked Metric Cards on Mobile)**:
    - **Tata Letak 1 Baris 1 Kartu pada Mobile**:
      * Pada tampilan mobile (`< sm`), tiga kartu ringkasan KPI ritase harian (`Total Ritase`, `Total Omset`, dan `Total Laba Bersih`) di `DispatchTable.tsx` DILARANG dijejer menjadi 1 baris 3 kolom.
      * Tiga kartu wajib disusun bertumpuk secara vertikal: **1 baris 1 kartu** (`grid-cols-1 sm:grid-cols-3 gap-2.5`).
    - **Format Horizontal Elegan di Dalam Kartu**:
      * Pada tampilan mobile, isi setiap kartu disusun secara horizontal: **Label metrik di sisi kiri** dan **angka nominal finansial di sisi kanan** (`flex sm:flex-col justify-between sm:justify-start items-center sm:items-start`), menghemat tinggi layar dan menjaga kenyamanan pembacaan data secara instan tanpa terlipat.
      * Pada tampilan desktop (`sm:`), tata letak otomatis kembali ke susunan 3 kolom berdampingan dengan label di atas dan angka di bawah.

47. **Standar Responsif Navigasi Header Mobile (Natural Scroll & Replacement Frosted Glass Header)**:
    - **Perilaku Header Asli pada Mobile**:
      * Header Aplikasi (`PT Patak Abadi Jaya` + logo + tombol menu) dan Header Halaman (`title` & `subtitle` halaman aktif) di mobile DILARANG bersifat *sticky-on-top*.
      * Keduanya ikut ter-scroll secara alami ke atas (*natural scrolling flow*) bersama konten halaman saat pengguna melakukan scroll ke bawah, sehingga area kerja layar ponsel menjadi maksimal dan lega.
    - **Header Pengganti Frosted Glass Kompak**:
      * Setelah kedua header asli ter-scroll keluar layar (threshold ~100px), muncul satu header pengganti mengambang di bagian atas (`fixed top-0 inset-x-0 z-30 md:hidden h-14`).
      * **Styling**: Efek *frosted glass* murni (`bg-white/80 backdrop-blur-md`) dengan sudut bawah membulat (`rounded-b-[16px]`), flat tanpa border outline (`border-none`), dan tanpa drop shadow.
      * **Komposisi Konten**:
        1. Sisi Kiri: Tombol drawer sidepanel (`Icons8Menu`) untuk membuka menu navigasi.
        2. Sisi Tengah: Judul halaman aktif (`text-xs font-bold text-[#111111] truncate`).
        3. Sisi Kanan: Spacer penyeimbang (`w-8`) agar judul tetap presisi di tengah secara simetris.
      * **Animasi Transisi**: Meluncur turun secara murni (*pure slide down* via `transition-transform duration-200 ease-out transform translate-y-0` dan `-translate-y-full`) **tanpa animasi fading (opacity) sama sekali**.
    - **Pemberlakuan Global & Desktop**:
      * Berlaku seragam di **seluruh modul/halaman** sistem (`AppShell.tsx`).
      * Pada tampilan desktop (`md:`), header halaman tetap fixed di atas (`h-20`) sejajar presisi dengan header sidebar tanpa header frosted glass.

48. **Standar Arsitektur Master Klien & Combobox Pencarian Inline (`clients` vs `transactions`)**:
    - **Pemisahan Entitas Master Klien & Transaksi**:
      * DILARANG KERAS mengandalkan teks string nama PT mentah sebagai Primary Key atau identifier unik agregasi statistik di tabel transaksi ritase, guna mencegah data pecah akibat variasi penulisan lapangan (spasi, singkatan, titik, atau kapitalisasi).
      * **Master Koleksi `clients`**: Menyimpan entitas resmi dengan schema baku: `id` (Primary Key mutlak, e.g. `cli-pt-maju-karya`), `name` (Nama resmi berformat Title Case & standar PUEBI tanpa titik), `picName` (Nama PIC/mandor opsional), `phoneNumber` (No telepon/WhatsApp opsional), dan `createdAt`.
      * **Koleksi `transactions`**: Menyimpan referensi `clientId` (Primary Key terindeks), `clientName` (snapshot terdenormalisasi untuk display instan), dan `customerName` (fallback legacy).
    - **Komponen Combobox Pencarian (`ClientCombobox.tsx`)**:
      * Form pencatatan ritase (`DispatchForm.tsx`) WAJIB menggunakan autocomplete combobox pencarian, bukan input teks bebas biasa.
      * Menampilkan daftar klien yang sudah terdaftar dengan filter instan berdasarkan nama, PIC, atau nomor telepon.
      * Jika nama PT yang diketik belum ada di database, sediakan opsi aksi: `+ Daftarkan "[Nama PT]" sebagai PT Baru`.
    - **Modal Pendaftaran Klien Baru (`NewClientModal.tsx`)**:
      * Membuka form modal singkat (Bottom Sheet di mobile, Center Pop-up di desktop) berisi 3 field: Nama Resmi PT (wajib, auto-format PUEBI), Nama PIC/Mandor (opsional), dan No Telp/WA (opsional).
      * Begitu disimpan ke Firestore `clients`, sistem otomatis memilih klien baru tersebut ke dalam formulir ritase tanpa perlu input ulang.

49. **Standar Isolasi Lingkungan Database Firestore (Production vs Sandbox/Testing)**:
    - **Arsitektur Named Databases (Single Project, Multi-Database)**:
      * Untuk menjaga integritas buku kas dan transaksi riil klien, sistem dipisahkan menjadi 2 database terisolasi dalam satu Firebase project `antigravityapp-e305d`:
        1. **Production Database (`pataklogisticdb`)**: Khusus untuk data operasional rill live armada dan kas resmi klien.
        2. **Sandbox / Development Database (`pataklogisticdb-sandbox`)**: Khusus untuk fase testing, eksperimen AI, seed data dummy, dan simulasi kas minus tanpa mengotori database production.
    - **Konfigurasi Environment Otomatis**:
      * `.env.development`: Menetapkan `VITE_APP_ENV="development"` dan `VITE_FIREBASE_DATABASE_ID="pataklogisticdb-sandbox"`.
      * `.env.production`: Menetapkan `VITE_APP_ENV="production"` dan `VITE_FIREBASE_DATABASE_ID="pataklogisticdb"`.
      * Inisialisasi Firestore di `src/lib/firebase.ts` secara dinamis membaca `import.meta.env.VITE_FIREBASE_DATABASE_ID` dengan fallback aman.

50. **Standar Validasi & Format Pengetikan Nama PT / Kontraktor (Hanya Huruf & Spasi, Tanpa Simbol & Angka)**:
    - **Batasan Karakter Ketat (Strict Whitelist)**:
      * Input nama PT / kontraktor HANYA mengizinkan karakter huruf alfabet (`A-Z`, `a-z`) dan spasi tunggal.
      * DILARANG KERAS memasukkan angka (`0-9`) serta seluruh karakter simbol khusus dan tanda baca (`. , / ! @ # $ % ^ & * ( ) _ + - = { } [ ] ; : " ' < > ? ~`). Karakter terlarang wajib langsung dihapus/dibersihkan secara otomatis saat pengetikan.
    - **Standardisasi Penulisan Badan Usaha Resmi**:
      * Entitas badan usaha seperti `PT`, `CV`, `UD`, `KM` otomatis diformat menjadi huruf kapital penuh tanpa tanda titik (`PT`, bukan `PT.` atau `pt`).
      * Entitas `Tbk` diformat Title Case (`Tbk`, bukan `TBK` atau `tbk`).
    - **Pemformatan Title Case Otomatis**:
      * Setiap kata otomatis diawali huruf kapital dan huruf berikutnya huruf kecil (contoh: `PT Maju Karya Sejahtera`).
    - **Preservasi Spasi Mengetik (Trailing Space Preservation)**:
      * Pemformatan otomatis saat pengetikan (`onChange`) wajib mempertahankan spasi di akhir kata agar pengguna dapat terus mengetik kata berikutnya tanpa terganggu cursor jumping atau spasi terpotong.
    - **Pemberlakuan Menyeluruh**:
      * Aturan ini berlaku seragam pada komponen pencarian (`ClientCombobox.tsx`), modal pendaftaran klien (`NewClientModal.tsx`), dan modul servis data (`clientService.ts`).

51. **Standar Penanganan Klien Non-PT & Perorangan (Entitas Klien / Mitra Proyek)**:
    - **Dukungan Entitas Non-PT**:
      * Klien transaksi ritase tidak wajib berbentuk badan hukum PT. Sistem mendukung penuh entitas badan usaha lain (**CV**, **UD**) maupun **Mandor / Kontraktor Perorangan**.
    - **Deteksi Tipe Otomatis (`Client.type`)**:
      * Sistem secara cerdas mengklasifikasikan tipe klien ke dalam schema database (`type: 'PT' | 'CV' | 'UD' | 'PERORANGAN'`) berdasarkan awalan nama:
        * Awalan `PT ...` -> `'PT'`
        * Awalan `CV ...` -> `'CV'`
        * Awalan `UD ...` -> `'UD'`
        * Selain itu (misal `Pak Haji Ridwan`, `Mandor Joko`) -> `'PERORANGAN'`
    - **Perluasan Karakter Tanda Kurung `( )`**:
      * Selain huruf alfabet dan spasi, diizinkan penggunaan tanda kurung buka dan tutup `( )` untuk memudahkan identifikasi proyek/kavling pada klien perorangan (contoh: `Pak Haji Ridwan (Proyek Cilegon)`).
    - **Standardisasi Label Antarmuka Netral**:
      * Dilarang menggunakan label kaku "Nama PT". Seluruh formulir dan header komponen wajib menggunakan label netral: **"Nama Klien / Pembeli Proyek"** atau **"Daftarkan Klien / Pembeli Baru"**.

52. **Standar Standardisasi & Format Nomor Telepon (+62 Fixed Prefix & Divider -)**:
    - **Format Kanonikal Mutlak**:
      * Seluruh nomor telepon di sistem dan database Firestore wajib menggunakan format baku internasional: **`+62 8xx-xxxx-xxxx`** (contoh: `+62 812-3456-7890`).
    - **Pembersihan Otomatis Angka Nol (0) di Awal**:
      * Angka `0` di awal nomor (seperti `0812...`) otomatis dihilangkan saat diketik maupun saat dipaste dari clipboard.
      * Awalan kode negara `+62` atau `62` yang terikut saat paste dari clipboard otomatis dibersihkan agar tidak terjadi duplikasi prefix.
    - **Penyisipan Divider (-) Otomatis**:
      * Karakter strip (`-`) otomatis disisipkan setelah kelompok kode provider (3 digit pertama, e.g. `8xx-`) dan kelompok blok tengah (4 digit, e.g. `xxxx-`).
    - **Komponen Input Khusus (`PhoneInput.tsx`)**:
      * Kotak input memiliki teks prefix fixed `+62 ` di sisi kiri dalam font **JetBrains Mono**.
      * Pengguna hanya perlu mengetik mulai dari angka `8`.
      * Input mendukung paste clipboard instan: teks dengan spasi, tanda kurung, strip, atau format internasional langsung dinormalisasi ke format baku.
      * Jika field nomor telepon kosong, sistem menyimpan string kosong `""` tanpa meninggalkan prefix menggantung.
    - **Integritas Database**:
      * Seluruh data nomor telepon di database Firestore wajib bersih dan terstandarisasi seragam.

53. **Standar Validasi Ketat Tombol Simpan Tiket Ritase (Default Disabled Until 100% Valid)**:
    - **Kondisi Nonaktif Default (Default Disabled)**:
      * Tombol "Simpan Tiket Ritase" pada formulir ritase (`DispatchForm.tsx`) WAJIB berada dalam kondisi nonaktif (`disabled`) secara default.
      * Tombol HANYA akan aktif jika dan hanya jika seluruh input formulir berstatus 100% VALID:
        1. **Tanggal Ritase (Jalan)**: Terisi format tanggal valid (`YYYY-MM-DD`).
        2. **Nomor Plat Truk**: Lengkap 3 bagian (kode wilayah resmi Indonesia + nomor registrasi 1-4 digit + seri huruf belakang 1-3 huruf, contoh: `B 1234 ABC`).
        3. **Klien / Pembeli Proyek**: Klien telah dipilih dari master atau terisi dengan nama valid.
        4. **Jenis Material**: Jenis material acuan ritase telah dipilih.
        5. **Volume Ritase**: Nilai numerik lebih besar dari 0 (`volume > 0`).
        6. **Harga Jual Tempo**: Nilai harga jual tempo per unit lebih besar dari 0 (`sellPricePerUnit > 0`).
        7. **Harga Beli & Operasional**: Nilai harga beli kuari dan beban operasional valid non-negatif ($\ge 0$).
    - **Gaya Tampilan Tombol Saat Disabled**:
      * Menggunakan `disabled:opacity-40 disabled:cursor-not-allowed` tanpa efek hover maupun scale animation saat disabled.
      * Tetap mempertahankan prinsip flat borderless solid surface tanpa drop shadow dan tanpa tooltip edukatif yang tidak diminta.

54. **Standar Sugesti Cerdas Plat Nomor Truk & Auto-Fill Sopir Terakhir (Truck Plate Suggestion & Driver Auto-Fill)**:
    - **Pengambilan Riwayat Armada**:
      * Input plat nomor truk (`TruckPlateInput.tsx`) menyediakan *autocomplete suggestion popover* yang mengambil daftar plat nomor truk unik yang pernah tersimpan di database (`transactions`).
      * Setiap entri armada menyimpan relasi dengan nama sopir terakhir yang pernah membawa armada tersebut beserta frekuensi ritase.
    - **Tampilan Dropdown Popover**:
      * Menggunakan permukaan solid flat tanpa drop shadow (`bg-white rounded-[6px] border border-[#eaeaea] max-h-48 overflow-y-auto`).
      * Nomor plat ditampilkan dengan font **JetBrains Mono** tebal, berdampingan dengan nama sopir terakhir (`Sopir: [Nama]`) jika tercatat.
      * Diurutkan berdasarkan frekuensi armada yang paling sering beroperasi.
    - **Perilaku Seleksi & Auto-Fill Sopir**:
      * Ketika admin mengklik salah satu plat nomor dari suggestion:
        1. Nilai input plat nomor langsung terisi lengkap dan berstatus valid.
        2. Field "Nama Sopir" otomatis terisi (*auto-fill*) dengan nama sopir terakhir armada tersebut (tetap bebas diedit jika terjadi pergantian supir).
    - **Fleksibilitas Armada Baru**:
      * Pengguna tetap bebas mengetik plat nomor baru yang belum pernah ada di database tanpa terhalang suggestion.

55. **Standar Input Field Catatan Fleksibel & Fading Edge (Flexible Notes Field with Top Anchor & Drag Handler)**:
    - **Dimensi Tinggi Awal & Auto-Expansion**:
      * Field Catatan menggunakan komponen textarea auto-expand adaptif (`FlexibleTextarea.tsx`).
      * **Default Awal**: Tepat 1 baris (ketinggian ringkas ~34px–36px setara input teks biasa) saat kosong atau teks pendek.
      * **Batas Auto-Expand**: Tumbuh otomatis ke bawah mengikuti panjang teks atau baris baru (`\n`) hingga maksimal **4 baris** (~96px).
      * **Anchor Atas**: Posisi atas terkunci (top anchor), pertambahan ketinggian mutlak memanjang ke arah bawah.
    - **Perilaku Scroll & Efek Fading Edge**:
      * Jika konten catatan melebihi 4 baris, field menjadi *scrollable* secara vertikal.
      * Dilengkapi efek *fading edge* (gradasi halus di bagian bawah saat ada teks terpotong di bawah, dan gradasi di bagian atas saat di-scroll) sebagai penanda visual elegan bahwa terdapat teks lanjutan.
    - **Garis Handler Tarikan Manual (Manual Drag Handle)**:
      * **Kemunculan Kondisional**: Garis pendek horizontal di bagian tengah-bawah field (`w-8 h-1 rounded-full bg-[#cccccc]`) **hanya muncul jika konten melebihi batas tinggi maksimal (4 baris)** atau sedang dalam mode tarikan manual.
      * **Interaksi Tarikan (Resize)**: User dapat menyeret (*drag*) garis handler ke bawah untuk memperlebar area baca/tulis catatan tanpa batas saat menghadapi konten raksasa (*huge content*). Menyeret ke atas memperkecil kembali hingga batas minimal 4 baris.
      * **Reset Instan**: *Double-click* pada garis handler langsung mengembalikan tinggi field ke mode otomatis adaptif (kembali ke 4 baris atau 1 baris sesuai volume teks).
    - **Perilaku Tombol Keyboard**:
      * **Tombol Enter Biasa**: Membuat baris baru (*newline*) secara natural.
      * **Pintas Ctrl+Enter / Cmd+Enter**: Memicu submit tiket ritase langsung jika seluruh formulir telah valid dan tombol simpan tidak disabled.
    - **Penyajian di Tabel & Modal Detail**:
      * **Tabel Riwayat Ritase (`DispatchTable.tsx`)**: Menampilkan cuplikan catatan 1 baris ringkas dengan pemotongan teks rapi (`truncate` + `...`).
      * **Modal Rincian Tiket (`DispatchDetailModal.tsx`)**: Menampilkan catatan secara lengkap dan utuh dengan mempertahankan spasi dan baris baru (`whitespace-pre-wrap`) di dalam kontainer solid bersih.

56. **Standar Validasi & Konfirmasi Laba Bersih Minus (Negative Net Profit Warning & 5-Second Depleting Button)**:
    - **Indikator Visual Laba Bersih Minus**:
      * Pada area kalkulasi ringkasan ritase (`DispatchForm.tsx`), jika nilai Estimasi Laba Bersih bernilai minus (`netProfit < 0`), label teks `Estimasi Laba Bersih:` dan nominal angka wajib berubah warna menjadi merah pekat (`text-[#cf1124]`).
      * **Animasi Getar Horizontal (Horizontal Shake)**: Bergetar sebentar (~0.6 detik) secara horizontal saat pertama kali nilai laba bersih menyentuh angka minus, dan bergetar kembali jika pengguna memaksakan klik tombol simpan; tidak bergetar secara terus-menerus tanpa henti.
    - **Dialog Konfirmasi Laba Bersih Minus (`NegativeProfitConfirmModal.tsx`)**:
      * Jika form sudah valid namun laba bersih minus, menekan tombol "Simpan Tiket Ritase" (atau shortcut `Ctrl+Enter`) DILARANG langsung menyimpan data ke Firestore, melainkan memunculkan modal dialog konfirmasi khusus: *"Laba Bersih Minus, Yakin Nggak Salah Input?"*.
      * **Isi Dialog**: Menampilkan rincian singkat perbandingan finansial (Belanja Kuari, Beban Operasional, Piutang Penjualan, serta Total Rugi Bersih berwarna merah dengan font **JetBrains Mono**).
      * **Tombol Aksi**:
        1. **Tombol "Batal"**: Langsung aktif, menutup dialog sehingga pengguna dapat mengoreksi harga jual atau beban operasional.
        2. **Tombol "Tetap Simpan" (5-Second Depleting Progress Bar)**:
           - Awalnya berstatus **non-aktif / disabled** selama tepat 5 detik (5000ms).
           - Di dalam kotak tombol terdapat visual *fill progress bar* bernuansa merah peringatan yang menyusut secara halus dari 100% ke 0% tanpa menampilkan angka hitung mundur (*countdown*).
           - Tepat setelah progress bar habis (5 detik berlalu), tombol berubah menjadi solid merah aktif (`bg-[#cf1124] text-white`) dan baru dapat diklik untuk menyimpan transaksi ritase minus tersebut.

57. **Standar Antarmuka Mobile: Formulir Boxless & Fullscreen Drawer Riwayat (Mobile Boxless Form & Fullscreen History Drawer)**:
    - **Pemberlakuan Khusus Mobile (`< md`)**:
      * Seluruh perilaku tata letak ini eksklusif berlaku pada perangkat mobile (`< md`), sementara tata letak desktop (`md:`) tetap berdampingan (*side-by-side*) seperti biasa.
    - **Header Halaman Mobile**:
      * Judul modul dispatcher pada header mobile (baik header utama maupun *frosted glass scroll header*) berubah menjadi **"Catat Ritase Baru"** (menggantikan "Dispatcher & Ritase").
    - **Formulir Ritase Boxless di Mobile (`DispatchForm.tsx`)**:
      * Pada tampilan mobile, wadah formulir bersifat *boxless* (`bg-transparent p-0 border-none rounded-none`), menyatu langsung dengan latar belakang halaman tanpa kartu putih bertingkat.
      * Header internal formulir (*"Catat Ritase Baru / Input armada..."*) disembunyikan pada mobile (`hidden md:block`) untuk menghemat ruang vertikal karena judul sudah tercantum di header halaman.
      * Diberikan bantalan bawah (`pb-20 md:pb-0`) agar tombol aksi simpan tidak tertutup oleh bilah handler bawah.
    - **Bilah Handler Bawah Terdok (Docked Bottom Bar)**:
      * Terdok di sisi paling bawah viewport (`fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md rounded-t-[16px] border-t border-[#eaeaea] px-4 py-3 cursor-pointer`).
      * Memiliki visual *pill grabber* kecil di bagian tengah atas (`w-8 h-1 rounded-full bg-[#cccccc] mx-auto mb-1.5`) dan judul **"Riwayat Ritase Armada"**.
    - **Drawer Layar Penuh Riwayat Ritase (Fullscreen History Drawer)**:
      * Menekan bilah handler bawah memunculkan drawer layar penuh (`fixed inset-0 z-40 md:hidden bg-white flex flex-col`) yang memuat seluruh tabel riwayat ritase (`DispatchTable.tsx`).
      * **Header Frosted Glass Drawer**:
        * Menampilkan judul **"Riwayat Ritase Armada"** di tengah.
        * Menampilkan icon panah bawah bergaya garis (*arrow down style line*) di sisi kiri untuk menutup drawer kembali ke formulir.
    - **Alur Pasca-Simpan Tiket**:
      * Sesaat setelah tiket ritase baru berhasil disimpan dari formulir di mobile, sistem otomatis membuka drawer *Riwayat Ritase Armada* agar admin/petugas langsung dapat memverifikasi baris tiket yang baru saja dicatat.

58. **Standar Layar Pemutusan Sesi / Logging Out (Session Termination Screen with Animated GIF)**:
    - **Pemicu & Alur Konfirmasi**:
      * Saat pengguna mengklik tombol "Keluar" di sidebar navigasi, dialog konfirmasi awal tetap ditampilkan (*"Yakin ingin keluar? Sesi Anda saat ini akan diakhiri."*).
      * Begitu pengguna mengonfirmasi tombol "Keluar", dialog tertutup dan layar pemutusan sesi layar penuh (`SessionTerminatingScreen.tsx`) seketika muncul.
    - **Visual & Animasi**:
      * Menggunakan tata letak layar penuh yang konsisten dengan layar verifikasi kredensial (`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none h-dvh max-h-dvh w-full overflow-hidden`).
      * **GIF Icon**: Menggunakan animasi resmi `logout-square-arrow.gif` (`w-12 h-12 object-contain pointer-events-none`) yang tersimpan di aset lokal sistem (`public/icons/logout-square-arrow.gif`).
      * **Teks Status**: *"Memutuskan sesi, harap tunggu..."* (`text-xs text-[#888888] font-normal mt-3.5 tracking-normal`).
    - **Durasi & Transisi Halus (Smooth Fade-Out)**:
      * Layar pemutusan sesi tampil selama 2.0 detik, kemudian melakukan transisi memudar halus (*fade-out*) selama 300ms (`transition-opacity duration-300 opacity-0`) sebelum akhirnya sesi Firebase `signOut(auth)` dialihkan ke halaman login (`LoginPage`).

59. **Standar Ikon Animasi Utama Halaman Login (Login Main Animated GIF)**:
    - **Aset & Lokasi**:
      * Ikon utama di atas judul form halaman login (`LoginPage.tsx`) menggunakan animasi GIF resmi logistik (`login-main.gif`) yang diimpor dari aset lokal (`assets/login-main.gif` / `public/icons/login-main.gif`).
    - **Dimensi & Tampilan**:
      * Ditampilkan dengan ukuran `w-14 h-14` (56px) `object-contain pointer-events-none` agar detail animasi terlihat hidup dan proporsional dengan judul PT.
    - **Batasan Cakupan (Scope)**:
      * Penggantian animasi GIF ini khusus berlaku untuk tajuk utama halaman login; identitas logo resmi PT di sidebar navigasi desktop dan header mobile tetap menggunakan `/icons/logo-box.png`.

60. **Standar Animasi Meluncur & Frosted Glass Docked Header Riwayat Mobile (Smooth Slide Animation & Frosted Docked Header with Soft Shadow)**:
    - **Bilah Handler Bawah (Docked Bottom Bar)**:
      * Menggunakan gaya *frosted glass* modern (`bg-white/80 backdrop-blur-md rounded-t-[16px] border-t border-[#eaeaea]/80 px-4 py-3`).
      * Dilengkapi bayangan halus ke atas (*soft drop shadow*: `shadow-[0_-4px_20px_rgba(0,0,0,0.06)]`) agar tampak mengambang elegan di atas formulir.
      * Terdapat garis penanda *pill grabber* di bagian tengah atas (`w-8 h-1 rounded-full bg-[#cccccc] mx-auto mb-1.5`).
    - **Animasi Meluncur Dua Arah (300ms Smooth Slide Up & Slide Down)**:
      * **Buka Drawer**: Meluncur naik dari bawah ke atas layar penuh (`translate-y-0`) selama 300ms dengan kurva `ease-out`.
      * **Tutup Drawer**: Menekan tombol panah bawah (style line) meluncurkan kembali drawer ke bawah (`translate-y-full`) selama 300ms dengan kurva `ease-in` tanpa kedip atau menghilang secara mendadak.
      * **Dimensi**: Memenuhi layar penuh 100% (`fixed inset-0 h-dvh`) dengan header frosted glass mandiri (`h-14 bg-white/80 backdrop-blur-md border-b border-[#eaeaea] rounded-b-[16px]`) untuk memaksimalkan ruang baca tabel data ritase.

61. **Standar Interaksi Mobile Gestur: Pull-To-Open, Full-Header Click-to-Close, & Pull-To-Close Drawer (Mobile Gestural Symmetrical Dome System)**:
    - **Penamaan & Konsep Arsitektur**:
      * Pembukaan drawer dari bawah formulir dinamakan **`pulltoopen`**.
      * Penutupan drawer dengan tarikan ke bawah dari atas dinamakan **`pulltoclose`**.
      * Keduanya mengadopsi mekanisme kubah elastis simetris (*symmetrical rubber dome*) dengan respons visual 2-fase (< 75px dan ≥ 75px), haptic feedback, dan snap-back.
    - **Penutupan Drawer Riwayat Fleksibel (Full-Header Click-to-Close)**:
      * Menutup drawer layar penuh *Riwayat Ritase Armada* tidak lagi terbatas hanya pada tombol panah bawah di sudut kiri.
      * Seluruh area header *frosted glass* drawer (`h-14 bg-white/80 backdrop-blur-md border-b border-[#eaeaea] rounded-b-[16px]`) dijadikan target klik/sentuh (`cursor-pointer active:bg-[#f5f5f5]/80 transition-colors`) sehingga pengguna dapat mengetuk di mana saja pada bilah header untuk menutup kembali drawer ke bawah.
    - **Mekanisme `pulltoopen` (Membuka Riwayat dari Halaman Formulir)**:
      * **Lokasi & Pemicu**: Aktif di tab Dispatcher saat posisi scroll form berada di dasar (`scrollTop + clientHeight >= scrollHeight - 2`) dan diusap/ditarik ke atas.
      * **Visual Kubah Bawah**: Kubah muncul dari sisi bawah layar melengkung ke atas. Posisi halaman tetap terkunci di tempatnya.
      * **Aset Panah**: GIF `/icons/icons8-down.gif` diputar 180° (`rotate-180`) sehingga menghadap ke atas. Background putih pekat dihilangkan dengan `mix-blend-multiply`.
      * **Fase 1 (< 75px)**: Kubah berwarna putih pekat (`#ffffff`), teks: *"Tarik lagi untuk membuka riwayat!"* (`text-[11px] font-medium text-[#555555]`).
      * **Fase 2 (≥ 75px - Ambang Pemicu)**:
        - Kubah bertransisi ke hitam pekat (`#111111`).
        - Teks berganti tegas menjadi **"LEPASS!!!"** (`text-[11px] font-bold text-white tracking-wider`).
        - Aset panah di-invert menjadi putih (`invert`).
        - Memicu getaran mikro haptic halus (`navigator.vibrate(25)`).
      * **Pelepasan (Touch Release)**:
        - Jika dilepas pada status "LEPASS!!!", drawer layar penuh *Riwayat Ritase Armada* seketika meluncur terbuka (`translate-y-0`).
        - Kubah memantul kembali (*snap-back*) ke bawah secara elastis.
    - **Mekanisme `pulltoclose` (Menutup Drawer dari Dalam Riwayat)**:
      * **Lokasi & Pemicu**: Aktif di dalam drawer riwayat, dapat ditarik ke bawah dari area header *frosted glass* maupun dari area tabel ketika scroll tabel berada di titik paling atas (`scrollTop <= 0`).
      * **Visual Kubah Atas**: Kubah muncul dari sisi atas layar menjorok/melengkung ke bawah. Posisi bodi drawer tetap stabil dan kokoh di tempatnya selama penarikan.
      * **Aset Panah**: GIF `/icons/icons8-down.gif` dalam orientasi normal menghadap ke bawah, background menyatu transparan (`mix-blend-multiply`).
      * **Fase 1 (< 75px)**: Kubah berwarna putih pekat (`#ffffff`), teks: *"Tarik lagi untuk menutup!"* (`text-[11px] font-medium text-[#555555]`).
      * **Fase 2 (≥ 75px - Ambang Pemicu)**:
        - Kubah bertransisi ke hitam pekat (`#111111`).
        - Teks berganti tegas menjadi **"LEPASS!!!"** (`text-[11px] font-bold text-white tracking-wider`).
        - Aset panah di-invert menjadi putih (`invert`).
        - Memicu getaran mikro haptic halus (`navigator.vibrate(25)`).
      * **Pelepasan (Touch Release)**:
        - Jika dilepas pada status "LEPASS!!!", drawer riwayat ritase meluncur turun menutup ke bawah (`translate-y-full`) selama 300ms `ease-out`, dan state `isHistoryDrawerOpen` diubah ke `false`.
        - Jika dilepas sebelum 75px, kubah atas memantul kembali ke atas tanpa menutup drawer.
    - **Halaman Selain Dispatcher**:
      * Pada halaman modul lain, karet elastis overscroll bawah tetap berstatus standar: kubah putih, teks *"Sudah mentok, Pak!"*, dan panah menghadap ke bawah.

62. **Standar Modul & Tab Navigasi Database Master (Master Database & Entity Management Module)**:
    - **Penempatan & Ikon Sidebar**:
      * Tab baru dinamakan **"Database"** (id: `'database'`), ditempatkan pada urutan ke-5 di sidebar navigasi utama (tepat di bawah 'Master Material' dan di atas tombol Pengaturan & Keluar).
      * Menggunakan ikon resmi `public/icons/database.png` (`w-5 h-5 object-contain`) yang tersimpan di aset sistem.
    - **Header Halaman**:
      * Desktop: Title **"Master Database & Entitas"**, subtitle *"Kelola master armada plat nomor, supir, klien, dan kuari untuk menjaga kebersihan data"*.
      * Mobile: Title **"Database & Entitas"**.
    - **Arsitektur Konten & Sub-Kategori**:
      * Menyediakan sub-navigasi tab bersih di dalam halaman untuk 4 entitas operasional utama:
        1. **Armada & Plat Nomor**: Daftar plat nomor kendaraan operasional. Menampilkan agregasi otomatis dari riwayat transaksi ritase yang sudah tercatat + kemampuan menambah, mengedit, atau menghapus master plat nomor di koleksi Firestore (`master_vehicles`).
        2. **Daftar Supir**: Mengelola daftar nama dan kontak supir armada (`master_drivers`).
        3. **Klien / Pelanggan**: Mengelola daftar rekanan pembeli material logistik (`master_clients`).
        4. **Kuari Asal**: Mengelola daftar kuari penambangan/pemasok material (`master_quarries`).
    - **Fitur Suggestion Plat Nomor Form Dispatcher**:
      * Pada formulir pencatatan ritase (`DispatchForm.tsx`), input field plat nomor dilengkapi dengan *autocomplete suggestion* yang mengambil seluruh plat nomor yang pernah tersimpan di database untuk mencegah inkonsistensi penulisan (seperti spasi ganda, typo huruf, atau format acak).

63. **Standar Sub-Tab Bersarang & Animasi Akordeon di Sidepanel (Sidepanel Nested Sub-Tabs & Accordion Collapse/Expand System)**:
    - **Pemisahan Aksi Navigasi vs Expand**:
      * Pada setiap item menu di sidepanel (sidebar desktop maupun drawer mobile), terdapat tombol panah bawah (*arrow down style line*) khusus di sisi kanan tombol.
      * **Klik Bodi Menu (Ikon + Label)**: Berpindah modul ke tab tersebut tanpa mengubah status akordeon expand/collapse.
      * **Klik Icon Arrow Down**: Melakukan toggle expand/collapse secara independen untuk membuka atau menutup daftar sub-tab tanpa memicu perpindahan halaman yang tidak diinginkan.
    - **Animasi Akordeon Halus**:
      * Sub-tab meluncur muncul dan menyusut dengan transisi CSS halus (`transition-all duration-200 ease-in-out`), disertai rotasi panah 180° (`rotate-180`) saat dalam status terbuka.
    - **Struktur Sub-Tab per Modul**:
      * **Dashboard**: `overview` ("Ringkasan Utama") dan `activity` ("Aktivitas Terkini").
      * **Dispatcher & Ritase**: `new_ticket` ("Catat Ritase Baru") dan `history` ("Riwayat Ritase Armada").
      * **Kas & Piutang Tempo**: `cash_flow` ("Arus Kas Riil") dan `receivables` ("Piutang Tempo").
      * **Rekapitulasi Periode**: `volume` ("Volume Muatan") dan `financial` ("Laba & Finansial").
      * **Master Material**: `catalog` ("Katalog Komoditas") dan `pricing` ("Standar Harga").
      * **Database**: `vehicles` ("Armada & Plat Nomor"), `drivers` ("Daftar Supir"), `clients` ("Klien / Pelanggan"), dan `quarries` ("Kuari Asal").
    - **Perilaku Navigasi Sub-Tab**:
      * Mengklik sub-tab langsung mengarahkan ke modul induk serta menyetel sub-kategori aktif yang sesuai, dan otomatis menutup drawer sidebar pada tampilan mobile.

64. **Standar Modul & Tab Navigasi Dashboard Utama (Executive Logistics Dashboard Module)**:
    - **Penempatan & Ikon Sidebar**:
      * Modul dinamakan **"Dashboard"** (id: `'dashboard'`), ditempatkan pada urutan pertama (paling atas) di sidepanel navigasi (di atas 'Dispatcher & Ritase').
      * Menggunakan ikon resmi `public/icons/dashboard.png` (`w-5 h-5 object-contain`) yang tersimpan di aset sistem.
    - **Landing Page Default**:
      * Menjadi halaman utama/muka yang langsung aktif saat pengguna berhasil login ke sistem (`currentTab = 'dashboard'`).
    - **Header Halaman**:
      * Desktop: Title **"Dashboard Operasional"**, subtitle *"Ringkasan metrik ritase harian, estimasi finansial, dan arus kas armada"*.
      * Mobile: Title **"Dashboard Logistik"**.
    - **Konten Sub-Kategori**:
      1. **Ringkasan Utama (`overview`)**: Menampilkan KPI cards (Total Ritase Hari Ini, Estimasi Laba Bersih, Posisi Kas Riil, Piutang Tempo Berjalan, Armada Aktif) dengan font **JetBrains Mono**.
      2. **Aktivitas Terkini (`activity`)**: Feed log transaksi ritase armada keluar-masuk secara real-time.

65. **Standar Layar Penuh Deteksi Terputus & Reconnecting (Fullscreen Connection Loss & Reconnection Screen)**:
    - **Pemicu Deteksi Koneksi (Multi-layer Detection)**:
      * Sistem mendeteksi terputusnya internet, offline, atau koneksi macet/lambat secara multi-layer (browser offline event, navigator.onLine, serta konektivitas Firestore/probe).
    - **Tampilan Fase 1: Terputus & Menghubungkan Ulang (< 10 Detik)**:
      * Layar seketika berubah menjadi layar penuh putih pekat (`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center select-none h-dvh max-h-dvh w-full overflow-hidden`).
      * **Animasi GIF**: Menggunakan animasi resmi `offline-reconnecting.gif` (`w-24 h-24 md:w-28 md:h-28 object-contain pointer-events-none`) yang tersimpan di aset sistem (`public/icons/offline-reconnecting.gif`).
      * **Teks Status**:
        - Judul: *"Waduh. Kayaknya koneksi terputus nih!"* (`text-sm md:text-base font-bold text-[#111111] mt-4`).
        - Sub-teks: *"Tunggu ya, lagi menghubungkan ulang..."* (`text-xs text-[#666666] mt-1.5`).
    - **Tampilan Fase 2: Konfirmasi Offline (Setelah 10 Detik)**:
      * Jika setelah tepat 10 detik (10.000ms) koneksi masih belum berhasil terhubung kembali:
      * **Animasi GIF**: Berganti menjadi animasi resmi `offline-disconnected.gif` (`w-24 h-24 md:w-28 md:h-28 object-contain pointer-events-none`) yang tersimpan di aset sistem (`public/icons/offline-disconnected.gif`).
      * **Teks Status**: Berubah menjadi *"Maaf banget, kayaknya kamu emang lagi offline deh."* (`text-xs md:text-sm text-[#555555] font-medium mt-4`).
      * **Tombol Aksi**: Tampil tombol *"Coba Hubungkan Ulang"* (`bg-[#111111] hover:bg-black text-white px-4 py-2 rounded-[8px] text-xs font-medium mt-4 cursor-pointer transition-colors`).
    - **Pemulihan Koneksi Otomatis (Back Online)**:
      * Begitu koneksi internet atau database berhasil pulih, layar offline seketika memudar halus selama 300ms (*fade-out transition*) dan kembali ke antarmuka aplikasi secara instan tanpa me-reload halaman, menjaga agar data form yang sedang diisi pengguna tidak hilang.

66. **Standar Seluruh Tabel: Kolom Fixed Width, Anti-Wrapping (Zero-Wrap), & Running Text Marquee Universal**:
    - **TIDAK ADA KONTEN YANG WRAPPED (`whitespace-nowrap`)**:
      * Seluruh sel tabel di seluruh aplikasi (Tabel Riwayat Ritase Dispatcher, Tabel Aktivitas Dashboard, dan Tabel Database Master: Armada, Supir, Klien, Kuari) mutlak dilarang melipat baris teks (zero text wrapping).
      * Setiap sel memiliki styling `whitespace-nowrap` yang konsisten.
      * Kontainer pembungkus tabel wajib memiliki `overflow-x-auto` yang memungkinkan scroll horizontal mulus pada resolusi layar apa pun tanpa merusak layout.
    - **Lebar Tetap Tiap Kolom (Strict Fixed Column Widths)**:
      * Setiap kolom didefinisikan dengan kelas lebar tetap atau min-width eksplisit (misal: `w-[150px]`, `w-[130px]`, `w-[180px]`, dll.) sesuai proporsi data agar susunan tabel kokoh, konsisten, dan tidak melar/bergeser saat data berubah.
      * Kolom "Catatan Ritase" pada tabel riwayat ritase dipisahkan menjadi kolom tersendiri dengan lebar tetap (180px - 220px).
    - **Komponen Running Text Marquee Universal (`RunningText`)**:
      * Digunakan secara universal pada semua kolom yang berpotensi memiliki teks panjang (Catatan Ritase, Alamat Proyek Klien, Nama Perusahaan Klien, dll).
      * Komponen secara otomatis mengukur apakah lebar konten melebihi lebar wadah kolomnya (`scrollWidth > clientWidth`).
      * Jika konten pas/pendek: tampil statis normal.
      * Jika konten panjang/overflow: otomatis menjalankan animasi marquee loop horizontal terus-menerus secara halus dengan jeda sejenak (~1.5s) di awal agar teks awal mudah terbaca.
      * **Pause on Hover**: Saat kursor mouse berada di atas teks running, animasi otomatis berhenti sejenak (pause) dan menampilkan tooltip native `title` teks lengkap untuk kemudahan membaca atau meng-copy data.
    - **Sticky Header (`thead sticky top-0`)**:
      * Header tabel menempel di bagian atas saat scroll vertikal dengan latar belakang solid `#ffffff` ber-z-index tepat, memastikan konteks nama kolom selalu tampak.

67. **Standar Keluarga Waiting Screen & Desktop Scaling (Waiting Screen Family Architecture)**:
    - **Definisi & Terminologi Resmi**:
      * Tiga layar transisi dan penanganan status aplikasi secara resmi dikelompokkan sebagai **"Waiting Screen"**:
        1. **Layar Memverifikasi Kredensial** (`VerifyingScreen.tsx`): Tampil saat login berhasil diverifikasi (durasi 3.0s dengan transisi fade-out).
        2. **Layar Logging Out / Pemutusan Sesi** (`SessionTerminatingScreen.tsx`): Tampil saat proses logout dipicu pengguna (durasi 2.0s dengan transisi fade-out).
        3. **Layar Terputus Koneksi & Reconnecting** (`OfflineOverlay.tsx`): Tampil saat sambungan internet / database hilang atau lambat (fase 1 <10s, fase 2 >=10s).
    - **Desktop Scaling (Responsif & Megah di Layar Lebar)**:
      * **Mobile View (< 768px)**: Mempertahankan skala standar yang rapi dan elegan (ikon fingerprint/logout: 48px `w-12 h-12`, animasi offline: 96px `w-24 h-24`, tipografi `text-xs`).
      * **Desktop View (md: / >= 768px)**: Menerapkan pembesaran proporsional 1.5x - 1.8x agar proporsinya megah, mantap, dan seimbang di layar monitor lebar:
        - `VerifyingScreen`: Ikon fingerprint membesar ke 80px (`md:w-20 md:h-20`), teks keterangan membesar ke `md:text-sm md:mt-4`.
        - `SessionTerminatingScreen`: Ikon logout membesar ke 80px (`md:w-20 md:h-20`), teks keterangan membesar ke `md:text-sm md:mt-4`.
        - `OfflineOverlay`: Animasi reconnecting & disconnected membesar ke 176px (`md:w-44 md:h-44`), judul membesar ke `md:text-xl md:mt-6`, sub-teks membesar ke `md:text-sm md:mt-2`, tombol *"Coba Hubungkan Ulang"* membesar ke `md:text-sm md:px-5 md:py-2.5 md:mt-5`.

68. **Standar Popover Konteks Menu Kolom Aksi Seluruh Tabel (Table Action Popover Context Menu)**:
    - **Ikon Tombol Aksi Resmi**:
      * Seluruh kolom "Aksi" pada tabel menggunakan ikon menu tiga baris horizontal (`public/icons/menu-bars.png` / `assets/menu-bars.png`) berukuran `w-4 h-4 object-contain`, dibungkus tombol minimalis `w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f0f0f0] transition-colors cursor-pointer`.
    - **Arsitektur Floating Portal (Anti-Clipping)**:
      * Popover menu dirender secara dinamis menggunakan React Portal ke `document.body` dengan koordinat absolut terhadap tombol pemicu (`getBoundingClientRect()`), menjamin popover 100% tidak pernah terpotong oleh `overflow-x-auto` atau batas kontainer tabel.
      * Dilengkapi animasi kemunculan halus (`animate-in fade-in zoom-in-95 duration-150`), shadow halus (`shadow-lg border border-[#eaeaea] bg-white rounded-[8px] p-1`), dan otomatis tertutup saat klik di luar area (*click outside*), saat halaman di-scroll, atau saat menekan tombol `Escape`.
    - **Daftar Opsi Kontekstual per Modul**:
      * **Tabel Riwayat Ritase & Dashboard**:
        1. *"Lihat Detail Ritase"*: Membuka modal detail rincian transaksi (`DispatchDetailModal`).
        2. *"Tandai Lunas"*: Hanya muncul/aktif jika status transaksi masih `'TEMPO'`.
        3. *"Salin No. Tiket"*: Menyalin nomor tiket ritase ke clipboard pengguna dengan indikasi feedback visual.
      * **Tabel Master Database (Armada, Supir, Klien, Kuari)**:
        1. *"Salin Data"* (Plat Truk / Nama Supir / PIC / Nama Kuari): Menyalin identifier ke clipboard.
        2. *"Hubungi via WhatsApp"*: Muncul otomatis jika entitas memiliki nomor telepon/kontak yang valid, membuka tautan `https://wa.me/...`.
        3. *"Hapus Data"*: Opsi dengan warna teks merah (`text-red-600 hover:bg-red-50`) untuk memicu dialog konfirmasi penghapusan data.

69. **Standar Animasi Buka Tutup Drawer Date Picker (Date Picker Drawer Open/Close Transitions)**:
    - **Animasi Mobile Bottom Drawer**:
      * Saat dibuka: meluncur halus dari bawah ke atas (`translate-y-0`) dengan transisi easing cubic-bezier (`duration-250 ease-out`).
      * Saat ditutup: meluncur halus ke bawah layar (`translate-y-full`) dengan transisi (`duration-200 ease-in`).
      * Memiliki garis pegangan minimalis (*drag handle pill* warna `#dddddd` berukuran `w-10 h-1 rounded-full mx-auto mb-3`) di bagian atas kalender.
      * Mendukung gesture swipe/drag down untuk menutup drawer secara alami pada perangkat layar sentuh.
      * Backdrop dim (`bg-black/40`) bertransisi fade-in dan fade-out secara sinkron selama 200ms tanpa flicker.
    - **Animasi Desktop Popover**:
      * Popover tanggal di desktop muncul dengan transisi scale & slide-down 8px (`translate-y-[-8px] opacity-0` ke `translate-y-0 opacity-100`) dan memudar halus saat ditutup.

70. **Standar Autocomplete Suggestion Nama Supir Form Ritase (Driver Name Database Autocomplete System)**:
    - **Sumber Data Agregasi**:
      * Input field Nama Sopir di `DispatchForm.tsx` dilengkapi *autocomplete suggestions* yang mengambil data secara real-time dari koleksi master supir (`master_drivers`) digabungkan dengan histori transaksi ritase yang pernah tercatat.
    - **Perilaku Pemilihan & Auto-Fill Plat Armada**:
      * Input tetap fleksibel menerima nama supir baru yang diketik manual.
      * Tampilan dropdown suggestion menampilkan Nama Supir serta plat armada default/terakhirnya.
      * Jika pengguna memilih supir yang memiliki data plat nomor default, dan kolom input plat nomor armada di form masih kosong, sistem secara otomatis mengisikan plat nomor tersebut ke dalam formulir untuk mempercepat proses input dispatcher.

71. **Standar Penataan Metric Cards Mobile: 1 Kolom Vertikal (Mobile Single-Column Vertical Metric Cards Stacking)**:
    - **Tata Letak Khusus Mobile (`< sm`)**:
      * Seluruh kartu ringkasan metrik (metric cards / KPI cards) baik di Dashboard (`DashboardPage.tsx`) maupun di Riwayat Ritase Database (`DatabasePage.tsx`) DILARANG menggunakan grid 2 kolom di layar ponsel.
      * Wajib menggunakan susunan 1 kolom berjejer ke bawah (`grid-cols-1`) agar kartu metrik tampil lega, bernapas, dan angka nominal tidak berdesakan.
    - **Responsif Tablet & Desktop**:
      * Layar tablet (`sm:`): 2 kolom (`sm:grid-cols-2`).
      * Layar desktop (`lg:`): 4 kolom sejajar (`lg:grid-cols-4`).

72. **Standar Sub-Tab 'Riwayat Ritase' Halaman Database (All-Time Scope, Multi-Filter, Multi-Sorting, & Cash Ledger Sync)**:
    - **Posisi Utama & Integrasi Sidebar**:
      * Sub-tab "Riwayat Ritase" (`ritase`) diposisikan sebagai sub-tab **pertama** di halaman Database (`DatabasePage.tsx`) serta di menu navigasi sidebar (`Sidebar.tsx`).
    - **Cakupan Data & Filter Rentang Waktu**:
      * Default menampilkan seluruh data riwayat ritase (*All-Time*) tanpa batasan tanggal tunggal.
      * Dilengkapi opsi filter cepat: *Semua Waktu*, *Hari Ini*, *Bulan Ini*, dan *30 Hari Terakhir*.
    - **Filter Multi-Dimensi & Sorting Cerdas**:
      * **Status Pembayaran**: Filter *Semua*, *TEMPO* (kuning amber), dan *LUNAS* (hijau).
      * **Material & Klien**: Filter dropdown dinamis berdasarkan material dan pelanggan yang terdaftar.
      * **Sorting Multi-Opsi**: *Tanggal Terbaru* (default), *Tanggal Terlama*, *Omset Tertinggi*, *Omset Terendah*, *Laba Bersih Tertinggi*, dan *Laba Bersih Terendah*.
      * **Search Bar Instan**: Menyaring teks secara real-time pada No. Tiket, No. Plat, Nama Sopir, Nama Klien, Jenis Material, dan Catatan.
    - **Kepatuhan Aturan Tabel 66**:
      * Kolom dengan fixed-width (`table-fixed`), zero-wrap (`whitespace-nowrap`), sticky `thead`, `overflow-x-auto`, `<RunningText />` untuk teks panjang, font JetBrains Mono untuk angka/tanggal/rupiah, dan menu aksi via `TableActionMenu` (`menu-bars.png`).
    - **Sinkronisasi Penuh Buku Kas (`cash_ledger`)**:
      * Saat tiket diedit: mutasi kas terkait (`BELI_MATERIAL`, `BIAYA_OPERASIONAL`, `PELUNASAN_PIUTANG`) yang berelasi via `referenceId: ticketNumber` otomatis diperbarui nominal dan deskripsinya.
      * Saat tiket dihapus: seluruh mutasi kas terkait di `cash_ledger` otomatis dibersihkan dan dihapus permanen agar pembukuan kas riil tidak mengalami selisih gaib.

73. **Standar Dialog Konfirmasi & Sandi Otorisasi 7-Digit Masked PIN "2008005" Seluruh Aksi Destruktif & Edit Database (PIN Authorization Dialog System)**:
    - **Sandi Otorisasi Default**:
      * Sandi resmi sistem: **`2008005`**.
    - **Cakupan Otorisasi Mutlak**:
      * Berlaku untuk SELURUH aksi destruktif (Hapus Tiket Ritase, Hapus Armada, Hapus Supir, Hapus Klien, Hapus Kuari).
      * Berlaku untuk SELURUH aksi pengeditan data (Simpan Edit Tiket Ritase, Edit Armada, Edit Supir, Edit Klien, Edit Kuari).
    - **Antarmuka 7 Kotak Digit Terpisah dengan Masking Titik (7-Digit Segmented Masked PIN)**:
      * Menampilkan 7 kotak terpisah per digit angka.
      * Angka yang diketik otomatis disamarkan (*hidden*) menjadi bulatan titik hitam (`●`).
      * Mendukung *auto-focus*, navigasi otomatis ke kotak berikutnya (*auto-advance*), tombol *backspace* mundur, dan *paste* clipboard 7 digit langsung terisi.
    - **Respons Validasi & Animasi Getar**:
      * Jika sandi salah: memicu animasi getar horizontal (*shake*), umpan balik haptic (`navigator.vibrate`), teks peringatan merah pekat (*"Sandi otorisasi salah. Periksa kembali sandi Anda."*), dan kotak otomatis dibersihkan untuk input ulang.
      * Tombol konfirmasi hanya dapat diklik jika ke-7 digit telah terisi lengkap.
      * Hanya jika sandi tepat `2008005`, aksi eksekusi penghapusan atau penyimpanan edit dijalankan.

74. **Standar Sidepanel Navigasi Mobile Default Collapsed (Mobile Sidepanel Default Collapsed Accordion)**:
    - **Perilaku Khusus Mobile (`< 768px`)**:
      * Pada tampilan perangkat mobile (`< 768px`), seluruh accordion sub-tab menu pada sidepanel navigasi (`Sidebar.tsx`) wajib berada dalam kondisi **collapsed (tertutup/terlipat)** secara default.
      * Setiap kali pengguna membuka sidepanel navigasi di mobile (`isMobileOpen`), seluruh sub-menu terlipat rapi dan pengguna dapat mengetuk ikon panah untuk membuka modul yang dikehendaki secara spesifik.

75. **Standar Hak Akses Akun Khusus Developer & Modul Tab Dev Console (Developer Account & Dev Console Module)**:
    - **Identitas Akun Developer**:
      * Email developer resmi sistem: **`fatih@patak.dev`**.
      * Akun ini memiliki status root tertinggi, kekebalan permanen dari penghapusan dan penonaktifan, serta waktu sesi aktif yang selalu diperbarui.
    - **Visibilitas Tab Dev Console**:
      * Tab **"Dev"** (id: `'dev'`) di sidepanel navigasi (`Sidebar.tsx`) dan routing sistem (`App.tsx`) bersifat **eksklusif dan tersembunyi**.
      * Hanya tampil dan dapat diakses oleh akun developer (`fatih@patak.dev`) atau akun founder (`founder@patak.id`). Akun peran lain (admin, dispatcher, viewer) sama sekali tidak dapat melihat maupun mengakses tab ini.
    - **Ikon & Navigasi Tab**:
      * Menggunakan ikon resmi terminal developer `public/icons/dev-terminal.png` (`w-5 h-5 object-contain`).
      * Memiliki sub-menu navigasi bersarang (*accordion*): *Semua Akun* (`all`), *Menunggu ACC* (`pending`), *Akun Aktif* (`active`), dan *Akun Nonaktif* (`inactive`).

76. **Standar Formulir Halaman Penuh Permintaan Akses (Full-Page Request Access Layout Identical to Login)**:
    - **Tampilan Penuh (Bukan Windowed / Modal)**:
      * Formulir permintaan akses akun baru DILARANG disajikan dalam bentuk dialog pop-up/windowed modal (`RequestAccessModal.tsx`).
      * Wajib disajikan sebagai **halaman penuh (Full Page)** (`RequestAccessView.tsx`) dengan tata letak, proporsi, dan visual yang identik dengan Halaman Login (`LoginPage.tsx`):
        - Wadah luar: `h-dvh max-h-dvh overflow-hidden bg-[#ffffff] flex flex-col justify-between items-center p-4 md:p-6`.
        - Grup tengah: `w-full max-w-[380px] flex-1 flex flex-col justify-center my-auto`.
        - Header Brand: Menggunakan animasi gif resmi `loginMainGif` (`w-14 h-14 object-contain`), teks pengantar *"Permintaan Akses"*, judul *"PT Patak Abadi Jaya"*, dan sub-teks *"Daftarkan akun untuk mendapatkan hak akses operasional"*.
        - Footer: *"Akses internal terbatas untuk manajemen & operasional PT Patak Abadi Jaya"*.
    - **Navigasi Pergantian Tampilan Halus (State Switch)**:
      * Menekan tombol *"Minta Akses"* di login mengubah status tampilan ke `authView = 'request_access'` secara instan tanpa reload halaman.
      * Di bagian bawah form permintaan akses, terdapat teks dan tautan minimalis *"Sudah memiliki akun? Masuk"* untuk kembali ke tampilan formulir login.
    - **Formulir Permintaan Akses (Gaya Vercel Filled Surface)**:
      * **Nama Lengkap**: Input nama pengguna dengan label berikon avatar (`/icons/avatar.png`), wadah `bg-[#f5f5f5] rounded-[6px] h-10 px-3`.
      * **Email Pengguna**: Input username dengan *fixed suffix* domain **`@patak.id`** di sisi kanan field (`bg-[#eaeaea] text-[#555555] font-mono border-l font-semibold`). Karakter yang diketik otomatis dibersihkan menjadi huruf kecil dan karakter valid email, menjamin format selalu `@patak.id`.
      * **Kata Sandi**: Input kata sandi dengan validasi ketat minimal **8 karakter**, label berikon gembok (`/icons/lock.png`), dan tombol *eye toggle* (`EyeToggleIcon`) untuk intip sandi.
      * **Tombol Aksi**: Tombol solid hitam `w-full h-10 bg-[#171717] hover:bg-[#333333] active:bg-[#444444] text-white text-sm font-medium rounded-[6px]` bertuliskan *"Kirim Permintaan"*.
    - **Layar Pasca-Pengajuan ("Permintaan Berhasil Dikirim!")**:
      * Sesaat setelah form disubmit, sistem menampilkan layar transisi waiting screen bertema sukses (`RequestSubmittedScreen.tsx`):
        - Judul: *"Permintaan berhasil dikirim!"* (`font-bold text-lg text-[#111111]`).
        - Sub-teks: *"Mohon tunggu, permintaan kamu sedang di-review ya! Silakan cek secara berkala"* (`text-xs text-[#666666]`).
        - Tombol CTA: *"Kembali ke Halaman Login"*.

77. **Standar Penanganan Akun Pending & Akun Nonaktif Saat Login (Login Status Gating & WhatsApp Quick Access)**:
    - **Pemeriksaan Status Kredensial Saat Login**:
      * Saat pengguna menekan "Masuk" di halaman login, sistem terlebih dahulu memeriksa status akun di database Firestore (`getUserStatusByEmail`).
    - **Layar Menunggu Review (`ReviewPendingScreen.tsx`)**:
      * Jika status akun masih **`PENDING`** (belum disetujui developer):
        - Judul: *"Akunmu masih di-review nih."* (`font-bold text-lg text-[#111111]`).
        - Sub-teks: *"Mohon tunggu, permintaan kamu sedang di-review ya! Silakan cek secara berkala!"* (`text-xs text-[#666666]`).
        - Ajakan Akses Cepat: *"Butuh akses cepat ya? Yuk, hubungi developer!"* (`text-xs text-[#555555] font-medium mt-3`).
        - Tombol CTA *"Kontak Developer"*: Membuka aplikasi WhatsApp ke nomor resmi developer **`082111500190`** dengan template pesan otomatis yang memuat detail nama dan kredensial email pemohon untuk meminta persetujuan kilat.
        - Tombol CTA *"Kembali ke Halaman Login"*.
    - **Layar Akun Nonaktif (`AccountInactiveScreen.tsx`)**:
      * Jika status akun **`INACTIVE`** (misalnya karena tidak aktif selama $\ge 30$ hari):
        - Judul: *"Akun kamu dinonaktifkan nih."* (`font-bold text-lg text-[#dc2626]`).
        - Sub-teks: *"Karna tidak ada aktifitas selama n hari."* (menampilkan hitungan hari inaktif riil).
        - Tombol CTA *"Minta Akses ke Developer"*: Membuka WhatsApp ke **`082111500190`** untuk permohonan pengaktifan kembali akun.

78. **Standar Penonaktifan Otomatis Akun Setelah 30 Hari Tanpa Aktivitas Sesi Login (30-Day Inactivity Auto-Deactivation Rule)**:
    - **Ambang Batas & Evaluasi Sesi**:
      * Setiap akun dengan status `ACTIVE` dievaluasi berdasarkan timestamp sesi login terakhirnya (`lastLoginAt`).
      * Jika selisih waktu antara sesi login terakhir dengan waktu saat ini mencapai **30 hari atau lebih** ($\ge 30$ hari), akun secara otomatis diubah statusnya menjadi **`INACTIVE`** dengan alasan *"Tidak ada aktivitas selama n hari"*.
    - **Pembaruan Sesi Login**:
      * Setiap kali pengguna berhasil login ke sistem, fungsi `updateUserLastLogin` secara otomatis memperbarui field `lastLoginAt` dengan timestamp ISO saat ini.
    - **Pengecualian Mutlak**:
      * Akun Developer (`fatih@patak.dev`) dan Akun Founder (`founder@patak.id`) dikecualikan secara mutlak dan permanen dari aturan penonaktifan 30 hari.

79. **Standar Fitur & Operasional Tab Dev Console Pengguna (Dev Console User Management & ACC System)**:
    - **Metrik Kartu Ringkasan (1-Kolom di Mobile)**:
      * Menampilkan 4 kartu ringkasan: Total Akun Sistem, Menunggu ACC (Pending), Akun Berstatus Aktif, dan Akun Nonaktif (>30 Hari Inaktif).
      * Mengikuti aturan penataan metrik: berjejer 1 kolom ke bawah pada perangkat mobile (`grid-cols-1`) dan 4 kolom pada desktop (`lg:grid-cols-4`).
    - **Filter Sub-Tab & Search Bar Cepat**:
      * Filter tab: *Semua*, *Menunggu Review*, *Aktif*, *Nonaktif* dengan indikator badge angka jumlah akun.
      * Input pencarian menyaring nama, email, dan role secara real-time.
    - **Tabel Pengguna (Kepatuhan Penuh Aturan 66)**:
      * Format `table-fixed`, zero text wrapping (`whitespace-nowrap`), sticky `thead`, `overflow-x-auto`, `<RunningText />` untuk nama panjang, font JetBrains Mono untuk email, tanggal, dan relative time.
    - **Aksi Persetujuan / ACC (`approveUserAccount`)**:
      * Opsi *"ACC / Setujui Akun"* di menu baris tabel membuka dialog konfirmasi ACC.
      * Begitu disetujui, akun didaftarkan ke Firebase Auth secara seamless via **Secondary Firebase App Auth** tanpa memutus sesi developer yang sedang aktif, dan status Firestore diubah ke `ACTIVE`.
    - **Aksi Buat Akun Langsung (`createAccountDirectly`)**:
      * Tombol *"Buat Akun Baru"* di header membuka modal pendaftaran akun langsung dengan username domain `@patak.id`, password min 8 karakter, dan pemilihan role.
    - **Aksi Edit & Hapus Akun**:
      * Edit akun memungkinkan pengubahan nama, role, atau status manual.
      * Opsi Hapus Akun dan Nonaktifkan Akun disembunyikan dan dicegah mutlak untuk akun developer dan founder.

80. **Standar Akun Khusus Founder/CEO/Owner PT Patak Abadi Jaya (Founder Root Privileges & Permanent Immunity)**:
    - **Identitas Akun Founder**:
      * Email founder resmi: **`founder@patak.id`**.
      * Peran (*role*): **`founder`** (Founder / CEO / Owner PT Patak Abadi Jaya).
    - **Hak Akses Setara Developer**:
      * Memiliki akses penuh (*root privilege*) setara dengan developer ke seluruh sistem, termasuk akses eksklusif ke tab Dev Console (`DevPage.tsx`).
    - **Kekebalan Mutlak & Permanen**:
      * Dikecualikan permanen dari penonaktifan otomatis 30 hari inaktif.
      * Dilindungi dari aksi penonaktifan manual dan penghapusan permanen (`isDeveloperEmail` guards).
      * Di-seed otomatis saat inisialisasi aplikasi bersama akun developer dan akun admin default.

81. **Standar Input Picker Combobox Kuari Asal pada Formulir Ritase & Integrasi Transaksi (Master Quarry Integration)**:
    - **Komponen Combobox Kuari Asal (`QuarryCombobox.tsx`)**:
      * Dirancang khusus untuk pemilihan cepat sumber kuari tambang pada tiket ritase logistik.
      * Menampilkan daftar kuari terdaftar yang bersumber langsung secara real-time dari koleksi master `quarries` di Firestore.
      * Dilengkapi fitur pencarian langsung (*filter search*), tombol hapus pilihan (*clear button*), serta opsi pendaftaran kilat kuari baru (*inline quick-registration* via `+ Tambah Kuari Baru`).
    - **Penempatan Sejajar di Formulir Ritase (`DispatchForm.tsx`)**:
      * Ditempatkan berdampingan secara responsif dengan input Klien / Tujuan Proyek (`ClientCombobox.tsx`) dalam grid 2-kolom (`grid-cols-1 sm:grid-cols-2`), memberikan keseimbangan intuitif antara Titik Asal Material (Kuari) dan Titik Bongkar / Tujuan (Klien).
    - **Penyimpanan Transaksi & Detail Logistik**:
      * Field `quarryId` dan `quarryName` tersimpan permanen dalam setiap dokumen transaksi ritase (`DispatchTransaction`).
      * Terintegrasi ke dalam tabel riwayat ritase (`DispatchTable.tsx` dan `DatabasePage.tsx`), modal rincian ritase (`DispatchDetailModal.tsx`), serta modal edit tiket ritase (`EditDispatchModal.tsx`).

82. **Standar Entitas Finansial Investor & Manajemen Master di Database (Investor Master & Capital Tracking)**:
    - **Entitas Master Investor (`Investor`)**:
      * Dikelola melalui koleksi Firestore `investors` via `investorService.ts` (`subscribeInvestors`, `saveInvestor`, `updateInvestor`, `deleteInvestor`).
      * Memuat atribut:
        - `id`: Pengenal unik investor (format `inv-[slug]-[timestamp]`).
        - `name`: Nama lengkap investor atau nama perusahaan pemodal.
        - `phoneNumber`: Nomor kontak atau nomor WhatsApp aktif.
        - `bankAccount`: Informasi perbankan resmi (nama bank, nomor rekening, dan nama pemilik rekening).
        - `initialCapital`: Nilai nominal modal / investasi awal (angka moneter dalam Rupiah).
        - `notes`: Catatan peruntukan modal atau rincian kesepakatan pembiayaan armada/operasional.
        - `createdAt`: Timestamp waktu pendaftaran investor.
    - **Penyajian Tabel Master Investor di Database (`DatabasePage.tsx`)**:
      * Ditempatkan sebagai sub-tab ke-6 (*Investor*) pada halaman Database dan navigasi sidepanel accordion *Database Master*.
      * Mengikuti standar Aturan 66: `table-fixed`, zero text wrapping (`whitespace-nowrap`), sticky `thead`, `overflow-x-auto`, `<RunningText />` untuk nama dan catatan panjang, serta tipografi JetBrains Mono untuk nomor telepon, tanggal, dan nominal modal dalam Rupiah.
    - **Otorisasi Keamanan PIN Otorisasi (Default "2008005")**:
      * Selaras dengan Aturan 73, setiap aksi edit data investor maupun aksi destruktif (penghapusan data investor) di tab Database WAJIB melalui dialog konfirmasi dan verifikasi sandi otorisasi default **`2008005`** (`requestAuthorization` via `PinAuthModal`).

83. **Standar Arsitektur Multi-Proyek & Multi-Investor Terpilah (Multi-Project & Multi-Investor Architecture)**:
    - **Struktur Entitas & Relasi Proyek**:
      * Setiap proyek operasional dikelola melalui interface `Project` (`src/types/database.ts`) dan koleksi Firestore `projects`.
      * Setiap proyek terikat secara langsung dengan 1 Investor utama (`investorId`, `investorName`) dan 1 Klien/Pemilik Proyek (`clientId`, `clientName`).
      * **Relasi One-to-Many (1 Investor untuk Banyak Proyek)**: Jumlah proyek berjalan dapat lebih banyak daripada jumlah investor. Satu dana investor dapat dialokasikan ke beberapa proyek sekaligus, di mana masing-masing proyek memiliki alokasi modal awal disetor (`initialDeposit`) dan saldo kas berjalan (`currentBalance`) yang terpantau terpisah.
      * Memuat status proyek (`ACTIVE`, `ON_HOLD`, `COMPLETED`).
    - **Global Project Filter Context & Header Switcher**:
      * Seluruh status proyek global dikelola melalui `ProjectFilterContext.tsx` (`useProjectFilter`).
      * Dropdown switcher proyek diletakkan di header `AppShell` (desktop dan mobile) dengan opsi `[Semua Proyek | Situ Cikedal | Menes | Cipeucang]`.
      * Seluruh komponen dasbor, kartu metrik, dan tabel ritase otomatis menyesuaikan filter data berdasarkan `selectedProjectId`.
    - **Tabel Master Proyek di Database (`DatabasePage.tsx`)**:
      * Hadir sebagai sub-tab `projects` (*Master Proyek*) lengkap dengan aksi tambah proyek baru, edit data proyek, dan hapus proyek dengan proteksi PIN `2008005`.
      * Menampilkan kolom: Nama Proyek, Lokasi, Investor Pendana, Klien / Pemilik, Modal Awal Disetor, Saldo Kas Berjalan, Status, dan Aksi.
    - **Auto-Seeding 3 Proyek & Investor Awal**:
      * Pada inisialisasi awal, sistem secara otomatis men-seed 3 proyek utama: Proyek Situ Cikedal (Investor A), Proyek Menes (Investor B), dan Proyek Cipeucang (Investor C).

84. **Standar Mekanisme Subsidi Silang Internal & Kas Talangan Antar-Proyek (Internal Cross-Subsidy & Cash Loans)**:
    - **Pencatatan Mutasi Talangan (`FundTransferLog`)**:
      * Dikelola melalui koleksi Firestore `fund_transfers` via `fundTransferService.ts` (`subscribeFundTransfers`, `createFundTransfer`, `settleFundTransfer`).
      * Setiap peminjaman kas talangan antar-proyek (`status: 'PINJAM'`) secara otomatis memotong saldo kas proyek sumber (`updateProjectBalance(fromProjectId, -amount)`) dan menambahkan saldo kas proyek peminjam (`updateProjectBalance(toProjectId, amount)`).
    - **Pelunasan Kas Talangan (`settleFundTransfer`)**:
      * Saat pinjaman dikembalikan (`status: 'LUNAS_KEMBALI'`), saldo secara otomatis dikembalikan ke proyek sumber dan dipotong dari proyek peminjam.
    - **Kerahasiaan Mutasi Kas Talangan**:
      * Data mutasi subsidi silang dan kas talangan ini HANYA boleh diakses dan dilihat oleh internal manajemen PT Patak (`developer`, `founder`, `admin`).
      * DILARANG KERAS memunculkan atau membocorkan mutasi kas talangan ini pada laporan eksternal investor manapun.
    - **Proteksi Otorisasi PIN `2008005`**:
      * Pencatatan talangan baru maupun aksi pengembalian/pelunasan dana talangan WAJIB melalui verifikasi PIN `2008005`.

85. **Standar RBAC Masking Margin Laba & Privasi Data Investor (Role-Based Margin Privacy & Investor Data Isolation)**:
    - **Hak Akses & Isolasi Investor (`role: 'investor'`)**:
      * Akun investor hanya dapat mengakses data proyek miliknya sendiri (`lockedInvestorId`). Global project switcher otomatis terkunci pada proyek terkait.
      * Investor HANYA boleh melihat volume muatan/ritase, saldo kas berjalan proyek miliknya, modal disetor, serta status tempo/lunas penagihan klien.
      * DILARANG KERAS menampilkan angka belanja kuari (*buy price*), margin keuntungan bersih (*net profit*), dan mutasi kas talangan subsidi silang kepada pengguna role investor.
    - **Hak Akses Orang Lapangan (`role: 'dispatcher'`)**:
      * Orang lapangan berfokus pada data operasional pengiriman (plat armada, supir, material, volume muatan, dan uang jalan/solar).
      * Angka harga tebus kuari dan estimasi margin keuntungan internal disembunyikan dari formulir input, modal rincian ritase, kartu metrik, dan tabel ringkasan dasbor.
    - **Hak Akses Penuh Manajemen (`developer`, `founder`, `admin`)**:
      * Memiliki visibilitas penuh terhadap kalkulasi omset, modal beli kuari, margin laba bersih riil, serta kontrol terhadap mutasi kas talangan antar-proyek.

86. **Standar Arsitektur Master Material & Matriks Operasional 3 Titik (Commodity, Quarry Rates & Route Tariffs)**:
    - **Model Relasi 3 Layer**:
      * **Layer 1: Master Komoditas (`MaterialMaster` / `MaterialItem`)**: Menyimpan jenis komoditas dasar (`Batu Belah`, `Pasir Extra`, `Makadam`, `Abu Batu`), kode, kategori (`BATU`, `PASIR`, `BASE_COURSE`, `TANAH`), satuan acuan (`DT` / `Ton`), dan harga acuan dasar.
      * **Layer 2: Katalog Mutu & Harga Tebus Kuari (`QuarryMaterialRate`)**: Menghubungkan material ke kuari/tambang asal spesifik (Titik Muat). Memuat spesifikasi grade kualitas (contoh: *Grade A — Hitam Padat Keras*, *Grade B — Batu Campur Kali*), satuan, dan harga tebus tunai cash di mulut tambang (`buyPriceCash`).
      * **Layer 3: Matriks Tarif Biaya Jalan Rute (`RouteOperatingTariff`)**: Menghubungkan Titik Muat (Kuari Asal) ke Titik Bongkar (Proyek Tujuan). Memuat estimasi jarak tempuh rute riil (`distanceKm`) dan standar biaya operasional armada (`standardOperationalCost` acuan solar + saku sopir + retribusi jalan).
    - **Halaman Master Material (`MasterMaterialPage`)**:
      * Memiliki 3 sub-tab fungsional:
        1. `harga_kuari`: Katalog Tebus Tambang (Harga & Mutu Kuari).
        2. `rute_operasional`: Standar Biaya Jalan Operasional Armada (Rute Kuari -> Proyek).
        3. `katalog`: Katalog Komoditas Material Terdaftar.
      * Mematuhi seluruh aturan tabel Rule 66: `table-fixed`, zero-wrap, sticky header, format monokromatis solid-filled, angka `whitespace-nowrap`, dan font angka JetBrains Mono.
    - **Rekomendasi Otomatis pada Form Catat Ritase (`DispatchForm`)**:
      * Ketika operator memilih Proyek Tujuan + Kuari Asal + Jenis Material, sistem secara otomatis mengisi nilai rekomendasi:
        1. Harga Beli Kuari (`buyPricePerUnit`) langsung terisi dari data `QuarryMaterialRate` yang cocok.
        2. Biaya Operasional Jalan (`operationalCost`) langsung terisi dari data `RouteOperatingTariff` yang cocok sesuai rute kuari ke proyek tujuan.
      * Operator tetap dapat menyesuaikan angka tersebut secara manual jika ada kebutuhan darurat lapangan.
    - **Otorisasi PIN `2008005`**:
      * Selaras dengan Aturan 76, setiap aksi penambahan/pengubahan tarif kuari, rute jalan, maupun penghapusan data di Master Material wajib melewati verifikasi PIN `2008005`.

87. **Standar Custom UI Mutlak untuk Semua Elemen Picker (Mandatory Custom UI Pickers)**:
    - **Larangan Native Select & Native Pickers**:
      * DILARANG KERAS menggunakan tag `<select>` native browser atau date picker bawaan browser `<input type="date">` untuk pemilihan entitas apapun di seluruh aplikasi.
    - **Implementasi Custom UI Terstandarisasi**:
      * Seluruh pemilih data (picker/combobox/dropdown/select) WAJIB menggunakan komponen Custom UI:
        * Pemilih Tanggal: `CustomDatePicker`
        * Pemilih Material: `MaterialPickerModal` atau custom material picker UI
        * Pemilih Kuari: `QuarryCombobox` atau custom kuari picker UI
        * Pemilih Klien: `ClientCombobox`
        * Pemilih Proyek: `ProjectCombobox` atau custom project selector UI
        * Pemilih Satuan & Kategori: Custom UI dropdown/combobox dengan pencarian cepat, keyboard navigation, popover styling `#ffffff`, border `#eaeaea`, dan hover state `#f5f5f5`.
    - **Visual & Ergonomi Konsisten**:
      * Semua picker harus selaras dengan estetika clean monokromatis solid-filled, border presisi `[8px]`, font JetBrains Mono / Inter, dan bebas dari animasi melambat atau efek blur.

88. **Standar Header Halaman Tab Hanya Judul Tanpa Deskripsi (Minimalist Tab Header Only Title)**:
    - **Header Bersih Tanpa Subtitle/Deskripsi**:
      * Seluruh header halaman tab aplikasi (baik di desktop maupun mobile) WAJIB HANYA menampilkan judul halaman (`title`).
      * DILARANG KERAS menampilkan baris teks deskripsi, keterangan, atau subtitle di bawah judul pada header tab manapun.
    - **Optimasi Ruang Kerja Vertikal**:
      * Tinggi bilah header desktop dirancang kompak dan proporsional (`h-16`) agar sejajar presisi dengan dropdown switcher proyek dan menghemat ruang kerja pengguna.

89. **Standar Penamaan Picker Proyek Hanya Nama Proyek Tanpa Alamat (Project Picker Name Only)**:
    - **Tampilan Bersih Nama Proyek**:
      * Di seluruh elemen pemilih/picker proyek di setiap halaman (`ProjectCombobox`, dropdown switcher header, modal transfer kas, modal edit ritase, dsb.), teks opsi WAJIB HANYA memuat **nama proyek saja (`p.name`)**.
      * DILARANG KERAS memunculkan alamat lengkap, lokasi, atau sub-label alamat (`p.location`) pada dropdown maupun item pemilih proyek di seluruh halaman aplikasi.

90. **Standar Styling Input Form Pembuatan Ritase Baru (Pure White Fill #ffffff Murni Borderless Tanpa Outline Stroke)**:
    - **High-Contrast Pure White Solid Fill (#ffffff) & Zero Outline Stroke**:
      * Seluruh elemen input pada formulir Catat Ritase Baru (`DispatchForm`):
        * Background: `bg-white` / `bg-[#ffffff]` (filled warna putih murni).
        * Outline / Border: Outline stroke dihapus total (`border-none` / `border-0`, `outline-none focus:outline-none focus:ring-0`). Murni mengandalkan solid filled surface putih murni di atas kontainer tonal `#f5f5f5` tanpa garis tepi.
        * Teks input: `text-black font-semibold` (teks hitam pekat kontras tinggi).
        * Sudut: `rounded-[6px]`.
      * Kontainer form pembuatan ritase baru menggunakan surface tonal `#f5f5f5` (`bg-[#f5f5f5] rounded-[10px]`) borderless agar seluruh input field putih murni `#ffffff` tampak kontras, tegas, dan mudah dibedakan tanpa memerlukan garis tepi border.
      * Berlaku untuk seluruh elemen input di form ritase: pemilih tanggal (`CustomDatePicker`), nomor plat truk (`TruckPlateInput`), nama supir, pemilih proyek tujuan (`ProjectCombobox`), nama PT klien (`ClientCombobox`), pemilih kuari asal (`QuarryCombobox`), tombol trigger pemilih jenis material, volume ritase, harga beli cash kuari (`CurrencyInput`), harga jual tempo proyek (`CurrencyInput`), beban operasional armada (`CurrencyInput`), dan textarea catatan tambahan (`FlexibleTextarea`).

91. **Standar Pemisah Isian Form Pembuatan Ritase Baru (Section Dividers & Logical Grouping)**:
    - **Pemisah Garis Horizontal Antar-Jenis Isian**:
      * Formulir Catat Ritase Baru (`DispatchForm`) wajib memisahkan setiap kelompok jenis isian menggunakan garis pembatas horizontal (`border-t border-[#eaeaea] my-3` atau divider bersih berlabel halus).
      * Kelompok isian terbagi menjadi:
        1. **Waktu & Armada Truk**: Tanggal pelaksanaan ritase, nomor plat truk, dan nama supir.
        2. **Lokasi & Mitra**: Proyek tujuan, PT/klien pembeli, dan kuari asal.
        3. **Komoditas & Volume**: Jenis material alam dan volume ritase (DT / Ton).
        4. **Finansial & Operasional**: Harga beli kuari (cash), harga jual proyek (tempo), dan beban operasional uang jalan armada (solar/supir/portal).
        5. **Catatan & Otorisasi**: Catatan tambahan lapangan, kalkulasi laba bersih, dan tombol simpan tiket.

92. **Standar Mutlak Input Nominal Uang Auto-Formatting Rupiah (Mandatory CurrencyInput Auto-Formatting)**:
    - **Penerapan Universal `CurrencyInput`**:
      * Seluruh input nominal uang/rupiah di seluruh modal, form, dan halaman aplikasi (termasuk modal Kas Talangan Antar-Proyek `FundTransferSection`, modal tambah proyek, modal investor, tarif kuari, ritase, dsb.) WAJIB menggunakan komponen `CurrencyInput` dengan auto-formatting pemisah ribuan titik (`.`) dan label prefix `Rp`.
      * DILARANG KERAS menggunakan tag `<input type="number">` polos untuk memasukkan nominal uang atau biaya di manapun dalam seluruh sistem.
    - **Kepatuhan Custom UI Picker**:
      * Selaras dengan Aturan 87, modal Kas Talangan Antar-Proyek (`FundTransferSection`) dan seluruh modal lainnya dilarang menggunakan elemen `<select>` native browser, melainkan wajib menggunakan Custom UI picker.

93. **Standar Tata Letak Desktop Dispatcher & Ritase (Stacked Layout — Form Di Atas, Riwayat Di Bawah)**:
    - **Larangan Split-View Desktop**:
      * Pada tampilan desktop, halaman Dispatcher dan Ritase (`DispatcherPage.tsx` / `App.tsx`) DILARANG membagi layar menjadi split view berdampingan (2 kolom horizontal) antara form pencatatan ritase dan tabel riwayat.
    - **Susunan Vertikal Terstruktur**:
      * Kontainer formulir Catat Ritase Baru diletakkan di bagian atas, dan kontainer Tabel Riwayat Ritase Armada diposisikan tepat secara vertikal (**stacked**) di bawah formulir ritase dengan pembatas dan spasi yang proporsional.

94. **Standar Penggunaan Logo Resmi Perusahaan (Official PT Patak Logo Asset)**:
    - **Aset Logo Resmi**:
      * Logo resmi PT Patak Abadi Jaya menggunakan aset gambar asli `assets/PT LOGO.png` yang disajikan melalui path web `/icons/pt-logo.png` (`public/icons/pt-logo.png`).
    - **Penempatan Logo Konsisten**:
      * Digunakan secara konsisten pada:
        1. Header Sidebar Kiri Desktop (`Sidebar.tsx`)
        2. Header Mobile Navbar (`AppShell.tsx`)
        3. Header Kartu Sesi Halaman Login (`LoginPage.tsx`)

95. **Standar Tab Mandiri Sidepanel untuk Proyek, Investor, dan Kuari / Suplier (Dedicated Sidepanel Tabs)**:
    - **Daftar & Urutan Menu Sidepanel (Tepat 10 Menu)**:
      1. `dashboard`: "Dashboard" (`/icons/dashboard.png`)
      2. `dispatcher`: "Dispatcher & Ritase" (`/icons/truck.png`)
      3. `projects`: "Proyek" (`/icons/project.png`)
      4. `investors`: "Investor" (`/icons/investor.png`)
      5. `quarries`: "Kuari / Suplier" (`/icons/quarry.png`)
      6. `materials`: "Master Material" (`/icons/layers.png`)
      7. `cash_ledger`: "Kas & Piutang Tempo" (`/icons/wallet.png`)
      8. `recap`: "Rekapitulasi Periode" (`/icons/chart.png`)
      9. `database`: "Database" (`/icons/database.png`)
      10. `dev`: "Dev Console" (`/icons/dev-terminal.png`)
    - **Pembersihan Redundansi Sub-Tab Database**:
      * Sub-tab `projects`, `investors`, dan `quarries` di dalam halaman Database dihapus agar tidak terjadi duplikasi pengelolaan.
      * Halaman Master Database murni mengelola 4 entitas teknis operasional: `ritase` (Riwayat Ritase), `vehicles` (Armada & Plat Nomor), `drivers` (Daftar Supir), dan `clients` (Klien / Pelanggan).
    - **Format Halaman Mandiri (Single View Efisien)**:
      * Ketiga halaman baru tampil sebagai single-view tanpa sub-tab bersarang di sidepanel.
      * Header halaman hanya judul tanpa deskripsi (Rule 88).
      * Dilengkapi kartu metrik ringkasan, search box instan, filter status cepat di atas tabel, dan form modal tambah/edit yang diproteksi PIN `2008005`.
      * Seluruh input nominal uang wajib menggunakan `CurrencyInput` (Rule 92) dan seluruh pemilih menggunakan Custom UI (Rule 87).
    - **Kebijakan RBAC Sidepanel**:
      * Manajemen (`admin`, `founder`, `developer`): Akses penuh ke seluruh 10 tab.
      * `investor`: Terisolasi pada Dashboard dan tab Proyek miliknya serta info investasinya di tab Investor (tanpa akses ke Kuari/Suplier, Dispatcher, dan Kas talangan).
      * `dispatcher`: Mengakses Dispatcher, Proyek, Kuari/Suplier, Master Material, dan Database (tanpa akses ke tab Investor).

96. **Standar Informasi Investor Terhubung & Kontrol Kecukupan Kas Proyek pada Form Ritase (Project Investor Reference & Cash Adequacy Control)**:
    - **Baris Informasi Investor Terhubung pada Form Ritase (`DispatchForm`)**:
      * Diletakkan di baris akhir selebar kontainer (full-width) pada Section 2 (*Lokasi & Mitra*) di formulir Catat Ritase Baru (`DispatchForm`).
      * Menampilkan label `"Investor"` dan teks tebal nama investor penanggung jawab pendanaan proyek terkait (`selectedProject.investorName`).
      * Jika pengguna mencatat ritase tanpa memilih proyek tujuan terlebih dahulu (order eceran/non-proyek), baris menampilkan teks placeholder halus `"— (Pilih proyek tujuan terlebih dahulu)"`.
      * Terbuka untuk seluruh role pengguna (termasuk Dispatcher) sebagai referensi penanggung jawab pendanaan proyek.
    - **Kontrol Kecukupan Saldo Kas Proyek Berjalan pada Live Calculation Box**:
      * Khusus untuk akun manajemen (`!isDispatcherUser`), kotak kalkulasi ritase menampilkan baris `"Saldo Kas Proyek Berjalan"` dan baris kalkulasi `"Estimasi Sisa Saldo Kas"`.
      * Jika total pengeluaran tunai tiket ritase (belanja tunai kuari + beban operasional jalan) melebihi saldo kas proyek berjalan, sistem menampilkan indikator peringatan visual teks merah bahwa saldo kas proyek tidak mencukupi untuk belanja kuari & operasional.

97. **Standar Tata Letak Filter Riwayat Ritase (Filter Bar Stacked Label & Grid System)**:
    - **Label Vertikal Di Atas Dropdown (Stacked Layout)**:
      * Seluruh label filter (Waktu, Status, Material, Klien, Urutkan) WAJIB diposisikan tepat di atas dropdown masing-masing (bukan inline di sebelah kiri).
      * Menggunakan format penulisan Title Case bersih ("Waktu", "Status", "Material", "Klien", "Urutkan"), ukuran teks 11px font-medium warna abu-abu netral (`#777777`).
    - **Tata Letak Desktop (Grid 5 Kolom Berjejer Rapi)**:
      * Pada tampilan desktop (`lg:` ke atas), kelima filter disusun rapi ke samping dalam grid 5 kolom presisi (`grid-cols-5 gap-3`) dengan lebar seragam dari ujung kiri hingga kanan kontainer.
    - **Tata Letak Mobile (Grid 2 Kolom dengan Urutkan Full-Width)**:
      * Pada tampilan mobile (`< lg`), filter disusun menggunakan grid 2 kolom (`grid-cols-2 gap-3`):
        * Baris 1: Filter Waktu & Filter Status
        * Baris 2: Filter Material & Filter Klien
        * Baris 3: Filter Urutkan mengambil lebar penuh 2 kolom (`col-span-2`).
    - **Implementasi Custom UI Picker (Rule 87 & Pure White Surface)**:
      * Seluruh dropdown filter WAJIB menggunakan komponen Custom UI (`CustomSelectCombobox`) dengan permukaan putih murni (`#ffffff`), border halus (`#eaeaea`), rounded `[8px]`, teks `xs text-[#111111]`, dan popover menu terstandarisasi.
      * DILARANG KERAS menggunakan elemen `<select>` native browser.

98. **Standar Ikon Kaca Pembesar pada Seluruh Field Searchbar (Universal Searchbar Icon Standard)**:
    - **Aset Resmi Ikon Pencarian**:
      * Seluruh field input pencarian (searchbar) di seluruh aplikasi WAJIB menggunakan aset ikon resmi `public/icons/search.png` (`/icons/search.png`).
    - **Posisi & Ukuran Standar**:
      * Diletakkan di sebelah kiri di dalam input (`absolute left-3 top-1/2 -translate-y-1/2`), ukuran `w-4 h-4` (`16px`), `object-contain`, dan `pointer-events-none`.
      * Input teks wajib diberi padding kiri yang proporsional (`pl-9`) agar teks placeholder dan input tidak menabrak ikon.
    - **Cakupan Universal Seluruh Aplikasi**:
      * Wajib diterapkan pada seluruh searchbar halaman utama: Database (`DatabasePage`), Proyek (`ProjectsPage`), Investor (`InvestorsPage`), Kuari (`QuarriesPage`), Master Material (`MasterMaterialPage`), Riwayat Ritase (`DispatchTable`), dan Dev Console (`DevPage`).
      * Wajib diterapkan pula pada input pencarian di dalam modal dan combobox: `ClientCombobox`, `CustomSelectCombobox`, dan `MaterialPickerModal`.

99. **Standar Tipografi Kartu Metrik Tanpa Monospace (Sans-Serif Bold Metric Cards)**:
    - **Larangan Font Monospace pada Kartu Metrik**:
      * DILARANG KERAS menggunakan kelas `font-mono` pada angka nominal atau nilai statistik di seluruh kartu metrik (*Metric Cards* / *KPI Cards*) di seluruh halaman aplikasi.
    - **Penerapan Font Sans-Serif Standar**:
      * Angka dan nominal pada kartu metrik wajib menggunakan font sans-serif tebal dengan tracking rapat (`font-bold tracking-tight`), ukuran `text-2xl` atau `text-xl md:text-2xl`.
      * Teks label penjelas tetap proporsional dan bersih (`text-[11px] font-medium text-[#666666]` / `text-[#888888]`).
    - **Format Simbol "Rp" Lebih Kecil & Semi-Transparan**:
      * Pada kartu metrik yang menyajikan nilai uang/finansial, simbol `"Rp"` dibuat berukuran lebih kecil (`text-xs` / `text-sm`), `font-semibold`, semi-transparan (`opacity-50`), dan menempel rapat tanpa spasi terpisah (`gap-0.5`) langsung di samping kiri angka nominal.
      * Untuk nominal negatif/defisit, tanda minus diletakkan paling depan sebelum simbol Rp (contoh: `-Rp500.000`) dengan warna merah tegas (`#cf1124`).

100. **Standar Tab Mandiri Klien & Kebijakan Hak Akses Penghapusan Klien (Dedicated Clients Tab & Deletion Policy)**:
    - **Daftar & Urutan Menu Sidepanel (Tepat 11 Menu)**:
      1. `dashboard`: "Dashboard" (`/icons/dashboard.png`)
      2. `dispatcher`: "Dispatcher & Ritase" (`/icons/truck.png`)
      3. `projects`: "Proyek" (`/icons/project.png`)
      4. `investors`: "Investor" (`/icons/investor.png`)
      5. `quarries`: "Kuari / Suplier" (`/icons/quarry.png`)
      6. `clients`: "Klien" (`/icons/client.png`)
      7. `materials`: "Master Material" (`/icons/layers.png`)
      8. `cash_ledger`: "Kas & Piutang Tempo" (`/icons/wallet.png`)
      9. `recap`: "Rekapitulasi Periode" (`/icons/chart.png`)
      10. `database`: "Database" (`/icons/database.png`)
      11. `dev`: "Dev Console" (`/icons/dev-terminal.png`)
    - **Pembersihan Sub-Tab Klien di Halaman Database**:
      * Sub-tab `clients` di dalam halaman Database dihapus agar tidak terjadi duplikasi pengelolaan.
      * Halaman Master Database murni mengelola 3 entitas teknis operasional armada: `ritase` (Riwayat Ritase), `vehicles` (Armada & Plat Nomor), dan `drivers` (Daftar Supir).
    - **Format Halaman Mandiri `ClientsPage.tsx`**:
      * Dibuat modul mandiri `src/components/clients/ClientsPage.tsx`.
      * Header halaman bersih hanya judul "Klien" tanpa deskripsi (Rule 88).
      * Dilengkapi 3 Metric Cards (Total Klien Terdaftar, Klien Tipe PT/CV/Kontraktor, Klien Perorangan/Mandor) dengan tipografi sans-serif tebal non-monospace (Rule 99).
      * Searchbar dilengkapi ikon resmi `/icons/search.png` di sebelah kiri (`pl-9`) (Rule 98).
    - **Kebijakan RBAC & Restriksi Penghapusan (Deletion Security)**:
      * **Hak Akses Tab**: Dibuka untuk Manajemen (`admin`, `founder`, `developer`) dan `dispatcher`. Tertutup untuk `investor`.
      * **Restriksi Opsi Hapus Klien**: Opsi "Hapus Klien" pada menu aksi titik tiga (`TableActionMenu`) **HANYA TERSEDIA untuk role `founder` dan `developer`**. Role `admin` dan `dispatcher` dilarang melihat atau mengeksekusi opsi hapus klien untuk mencegah hilangnya relasi piutang/transaksi.

101. **Standar Standardisasi Menyeluruh Format Nomor Telepon (+62 8xx-xxxx-xxxx)**:
    - **Komponen Input Baku (`PhoneInput`)**:
      * SELURUH form input nomor telepon di aplikasi (Modal Tambah/Edit Supir di `DatabasePage`, Modal Tambah/Edit Kuari di `QuarriesPage`, Modal Tambah/Edit Investor di `InvestorsPage`, serta Modal Tambah/Edit Klien di `NewClientModal` dan `EditClientModal`) WAJIB menggunakan komponen `<PhoneInput />`.
      * Dilarang menggunakan `<input type="tel">` polos tanpa format otomatis.
      * Komponen `PhoneInput` wajib menampilkan prefix fixed `+62 ` di sisi kiri, membuang otomatis angka `0` atau `62` di awal, dan menyisipkan divider strip (`-`) per kelompok digit secara live (`8xx-xxxx-xxxx`).
    - **Sanitasi Database Service**:
      * Seluruh fungsi penyimpanan data kontak ke database Firestore (`saveMasterDriver`, `saveMasterQuarry`, `saveInvestor`, `saveClient`, `updateClient`) WAJIB memproses `phoneNumber` dengan fungsi kanonikal `formatPhoneNumber(phoneNumber)`.
      * Data yang tersimpan di Firestore selalu baku berformat `+62 8xx-xxxx-xxxx` (atau string kosong `""` jika tidak diisi), mencegah inkonsistensi data.
    - **Tampilan Tabel & Komponen Antarmuka**:
      * Seluruh tampilan nomor kontak di tabel data (Tabel Supir, Tabel Kuari, Tabel Investor, Tabel Klien, dan Dropdown Combobox) WAJIB diformat dengan `formatPhoneNumber()` agar nomor lama atau unformatted dari database otomatis ditampilkan rapi dan seragam sebagai `+62 8xx-xxxx-xxxx`.

102. **Standar Standardisasi Menyeluruh Format Nama Entitas & Nama Orang (PUEBI Title Case & Legal Entity Auto-Formatting)**:
    - **Prinsip Utama & Universalitas**:
      * SEMUA input nama di SELURUH modul dan halaman aplikasi (Klien, PIC, Supir, Kuari, Investor, Proyek, Pengguna Sistem/Auth) WAJIB mengimplementasikan pemformatan otomatis secara live (*as-you-type*) dan saat penyimpanan ke database (*sanitization on write*).
      * DILARANG KERAS membiarkan field nama menerima teks huruf kecil semua atau tanpa standardisasi huruf kapital.
    - **Nama Entitas Bisnis & Perusahaan (`formatEntityNameLive` / `formatEntityName`)**:
      * Diterapkan pada nama Klien, Kuari Tambang, Perusahaan Investor, Proyek Operasional, dan Komoditas Material.
      * Otomatis mengkapitalisasi huruf pertama setiap kata (Title Case).
      * Menstandardisasi singkatan badan hukum resmi Indonesia sesuai PUEBI dan UU Perseroan Terbatas:
        - `PT` (Perseroan Terbatas) -> huruf kapital penuh tanpa titik (`PT`).
        - `CV` (Commanditaire Vennootschap) -> huruf kapital penuh tanpa titik (`CV`).
        - `UD` (Usaha Dagang) -> huruf kapital penuh tanpa titik (`UD`).
        - `KM` (Koperasi Mandiri/Keluarga Mas) -> huruf kapital penuh tanpa titik (`KM`).
        - `Tbk` (Terbuka) -> kapital awal dan huruf kecil (`Tbk`).
      * Mendukung kata bersambung bertanda hubung (contoh: `Bojong-Gede` -> `Bojong-Gede`), serta mempertahankan spasi di akhir kata secara aman saat pengguna masih mengetik tanpa cursor jumping.
    - **Nama Orang / Pribadi (`formatPersonNameLive` / `formatPersonName`)**:
      * Diterapkan pada nama Supir (`DatabasePage`, `DispatchForm`, `EditDispatchModal`), nama PIC Lapangan / Kontak Person (`QuarriesPage`, `NewClientModal`, `EditClientModal`), nama Investor Pribadi, nama Pengguna Akun (`DevPage`), dan pendaftaran akun (`RequestAccessModal`, `RequestAccessView`).
      * Mengkapitalisasi huruf pertama setiap kata secara rapi dan mempertahankan gelar kehormatan / sapaan (contoh: `Bpk.`, `Ibu`, `Haji`, `Dr.`).
    - **Sanitasi Database Service**:
      * Seluruh backend service (`databaseMasterService.ts`, `clientService.ts`, `investorService.ts`, `projectService.ts`, `userManagementService.ts`) WAJIB memanggil `formatEntityName()` atau `formatPersonName()` sebelum menulis data ke Firestore.

103. **Standar Standardisasi Menyeluruh Input & Format Nominal Uang (Rupiah Currency Standard)**:
    - **Komponen Input Baku (`CurrencyInput`)**:
      * SELURUH form input yang menerima nilai uang/rupiah di SELURUH modul (Modal Tambah/Edit Proyek, Modal Tambah/Edit Investor, Modal Tambah/Edit Biaya Rute Material, Formulir Ritase & Edit Ritase) WAJIB menggunakan komponen `<CurrencyInput />`.
      * DILARANG KERAS menggunakan `<input type="number">` polos untuk nilai uang.
      * Fitur Baku `CurrencyInput`:
        - Prefix simbol `Rp` statis di sisi kiri dengan gaya abu-abu netral.
        - Pemisah ribuan otomatis dengan tanda titik (`.`) gaya Indonesia (`id-ID`).
        - Mengizinkan input dikosongkan saat pengguna menekan Backspace (tidak terkunci pada angka 0 saat mengetik).
        - Menormalkan ke angka `0` saat kehilangan fokus (*blur*) jika field ditinggalkan dalam keadaan kosong.
    - **Tampilan Angka Finansial pada Tabel & Teks Naratif (`formatRupiah`)**:
      * Tampilan nilai uang di tabel, rincian transaksi, modal konfirmasi, dan tooltip WAJIB diformat menggunakan fungsi kanonikal `formatRupiah(val)`: `'Rp ' + Math.round(val).toLocaleString('id-ID')` (contoh: `Rp 1.500.000`).
    - **Tampilan Angka Finansial pada Kartu Metrik (`MetricCardCurrency`)**:
      * Seluruh kartu metrik KPI yang menyajikan nilai uang WAJIB menggunakan `<MetricCardCurrency amount={...} />`.
      * Simbol `Rp` berukuran lebih kecil (`text-xs`/`text-sm`), semi-transparan (`opacity-50`), menempel rapat langsung dengan angka tanpa spasi.
      * Untuk nilai negatif, tanda minus ditempatkan di depan simbol Rp (`-Rp500.000`) dengan kelas warna defisit (`text-[#cf1124]`).
      * Angka menggunakan font sans-serif bold tracking-tight (`font-bold tracking-tight`), DILARANG menggunakan `font-mono`.

104. **Standar Master Data Produksi & Pemisahan Liabilitas Perseroan (Prinsip Non-Investor Debt & Single Investor Allocation)**:
    - **Investor Tunggal Aktif (Bpk. Yadi - Rp 30.000.000)**:
      * Pemodal aktif tunggal awal perseroan adalah Bpk. Yadi dengan total modal disetor riil Rp 30.000.000 yang dialokasikan sebagai modal kerja bergulir (*revolving working capital*) untuk mendanai 2 proyek aktif sekaligus.
      * Seluruh porsi bagi hasil investor dari ritase proyek yang didanai dialokasikan secara transparan ke Bpk. Yadi tanpa subsidi silang investor lain di fase awal.
    - **Pemisahan Liabilitas Hutang Bpk. Pei (Rp 18.000.000)**:
      * Bpk. Pei berstatus BATAL sebagai investor proyek ritase.
      * Uang Rp 18.000.000 berstatus murni **Kewajiban / Liabilitas Perseroan (Hutang Pihak Ketiga)** milik PT Patak Abadi Jaya.
      * DILARANG KERAS mencatatkan Bpk. Pei ke dalam tabel `investors` atau mengaitkannya ke transaksi ritase. Bpk. Pei TIDAK berhak atas bagi hasil keuntungan per m³/ton pengiriman batu.
      * Pencatatan hutang Bpk. Pei ditempatkan di Buku Kas Induk Perseroan (`cash_ledger`), dan pelunasannya dicicil dari laba bersih internal PT Patak, bukan dari modal proyek Bpk. Yadi.
    - **Dua Proyek Fisik Riil Aktif**:
      * Dua proyek operasional aktif resmi adalah:
        1. `Proyek Konservasi Situ Cikedal` (Kec. Cikedal, Pandeglang)
        2. `Proyek Irigasi Cipeucang` (Kec. Cipeucang, Pandeglang)
      * Proyek Menes untuk sementara dinonaktifkan (`status: 'COMPLETED'` / `isActive: false`) dan wajib disembunyikan dari dropdown pilihan proyek pada formulir input ritase lapangan agar operator terhindar dari salah pilih.
    - **Hak Akses Jurnal Transaksi Global & Privasi Finansial (VN Papah)**:
      * Operator lapangan / akun dengan role `dispatcher` hanya berhak mengakses formulir ritase dan **Jurnal Transaksi Operasional** (nomor surat jalan, nopol truk, nama supir, komoditas, kuari asal, proyek tujuan, kubikasi/tonase, tanggal) dengan filter periode 2 mingguan dan 2 bulanan.
      * Seluruh data dapur finansial (tab Investor, nominal bagi hasil, saldo modal investor, margin keuntungan PT, dan tab Kas Perseroan) tertutup rapat dan hanya dapat diakses oleh peran Manajemen (`founder`, `developer`, `admin`).

105. **Standar Entitas Database Material Terpusat & Sinkronisasi Tarif Kuari-Rute (Single Source of Truth)**:
    - **Arsitektur Entitas Terpusat (Bebas Kode Acak & Duplikasi)**:
      * Seluruh data material di dalam aplikasi wajib mengacu pada satu entitas database terpusat (*Single Source of Truth*). Dilarang keras membuat entitas duplikat, variasi nama manual, atau kode acak (`Math.random()` / `Date.now()`).
      * Format ID Entitas Baku:
        - **Komoditas Dasar**: Berformat `MAT-[NAMA_SLUG]` (contoh: `MAT-BATU-BELAH`, `MAT-PASIR-EXTRA`, `MAT-ABU-BATU`, `MAT-MAKADAM`).
        - **Tarif Material per Kuari**: Berformat deterministik `RATE-[QUARRY_ID]-[MATERIAL_ID]` (contoh: `RATE-qry-batu-mandiri-MAT-BATU-BELAH`). Tidak boleh ada tarif ganda untuk kuari dan material yang sama.
        - **Tarif Biaya Jalan Rute**: Berformat deterministik `RTE-[QUARRY_ID]-[PROJECT_ID]` (contoh: `RTE-qry-batu-mandiri-prj-situ-cikedal`).
    - **Harga Beli & Harga Jual Berbasis Kuari**:
      * Setiap relasi material dengan kuari asal wajib menyimpan dua parameter finansial:
        1. **Harga Beli Tebus Kuari (`buyPriceCash`)**: Biaya tebus tunai di mulut tambang per satuan (`DT` / `Ton`).
        2. **Harga Jual Standar (`sellPrice`)**: Standar harga penagihan ke proyek/klien per satuan.
      * Sistem otomatis menghitung margin kotor (`sellPrice - buyPriceCash`).
    - **Struktur Halaman `MasterMaterialPage.tsx`**:
      * Menggunakan 3 sub-tab terstruktur secara hierarkis:
        1. `catalog` (Katalog Komoditas Material): Kelola komoditas material baku, satuan standar, dan harga acuan dasar.
        2. `pricing` (Harga & Mutu Kuari): Hubungkan material ke kuari asal dengan harga beli dan harga jual.
        3. `routes` (Biaya Jalan Rute): Tarif standar uang jalan rute Kuari -> Proyek.
    - **Otomasi Form Ritase Dispatcher (`DispatchForm.tsx` & `EditDispatchModal.tsx`)**:
      * Saat Kuari Asal dan Material dipilih, sistem WAJIB otomatis menarik (`auto-fill`) **Harga Beli** dan **Harga Jual** dari `quarry_material_rates` yang cocok. Jika belum diset khusus, sistem otomatis menggunakan harga dasar komoditas (`defaultBuyPrice` dan `defaultSellPrice`).
      * Saat Kuari Asal dan Proyek Tujuan dipilih, sistem WAJIB otomatis menarik acuan uang jalan rute dari `route_tariffs`.

106. **Standar Desain & Struktur Seluruh Tabel Aplikasi (Unified Data Table Architecture)**:
    - **Kontainer Pembungkus & Overflow**:
      * Seluruh tabel di seluruh aplikasi wajib dibungkus dalam kontainer kartu seragam: `<div className="border border-[#eaeaea] rounded-[10px] bg-white overflow-hidden">` dengan pembungkus gulir horizontal `<div className="w-full overflow-x-auto select-text">`.
      * Tabel menggunakan kelas `w-full table-fixed text-left text-xs border-collapse min-w-[...]`.
    - **Header Tabel (`thead`)**:
      * Header tabel menempel di bagian atas saat scroll vertikal (`sticky top-0 z-10 select-none`).
      * Latar belakang solid abu-abu terang seragam: `bg-[#f9f9f9] border-b border-[#eaeaea]`.
      * Tipografi kolom: `text-[11px] font-semibold text-[#555555] uppercase tracking-wider`.
      * Padding sel header: `py-2.5 px-3` (atau `py-2.5 px-4` jika ruang sel longgar), rata tengah atau rata kanan sesuai jenis konten sel.
    - **Baris & Sel Data (`tbody tr / td`)**:
      * Kerapatan baris kompak data-dense: padding `py-2.5 px-3` (tinggi baris ~40px) untuk memaksimalkan jumlah baris data yang terbaca per layar tanpa banyak scroll.
      * Pembatas antar-baris halus: `divide-y divide-[#eaeaea]`.
      * Status hover baris: `hover:bg-[#fafafa] transition-colors`.
      * Anti-wrapping mutlak: `whitespace-nowrap` pada seluruh sel per Rule 66.
      * Teks panjang berpotensi terpotong wajib dibungkus komponen `<RunningText />`.
    - **Tipografi Nilai Sel (Pemisahan Presisi Sans-Serif vs Monospace)**:
      * **Nilai Finansial & Volume**: Wajib menggunakan font sans-serif tebal dengan tracking rapat (`font-bold tracking-tight text-[#111111]`) per Rule 99. DILARANG menggunakan `font-mono` untuk angka nominal Rupiah, kubikasi DT, atau tonase.
      * **Kode Teknis & Identifier**: Menggunakan font monospace rapi (`font-mono text-[#555555]` atau `font-mono font-semibold text-[#111111]`) khusus untuk No. Tiket, No. Surat Jalan Fisik, Plat Truk, dan Kode Unik Material agar karakter berbaris rapi (*tabular alignment*).
      * **Nama Entitas & Teks Utama**: Font sans-serif tebal elegan (`font-semibold text-[#111111]`).
    - **Kolom Aksi Seragam (100% TableActionMenu)**:
      * Seluruh kolom aksi di ujung kanan tabel wajib distandarisasi menggunakan komponen menu popover portal `<TableActionMenu />` (dengan ikon `public/icons/menu-bars.png` per Rule 68). Dilarang menampilkan tombol teks berjejer (`Ubah | Hapus`) langsung di baris tabel.
    - **Kolom Status Semantik Murni (Bebas Badge/Tag/Pill)**:
      * Status ditampilkan sebagai teks tebal bersih (`font-bold text-[11px]`) tanpa badge, tag, pill, atau dot per aturan `ai-anti-patterns.md`.
      * Pewarnaan semantik: Hijau `text-emerald-700` untuk `LUNAS` / `ACTIVE`, Oranye/Kuning `text-amber-700` untuk `TEMPO` / `PINJAM`, Abu-abu `text-[#888888]` untuk `SELESAI` / `COMPLETED`.
    - **Tampilan Data Kosong & Loading (In-Table Cell colSpan)**:
      * Keadaan kosong atau memuat data wajib dirender sebagai baris tabel utuh: `<td colSpan={colCount} className="py-10 text-center text-xs text-[#888888] whitespace-nowrap">` agar struktur tabel tetap kokoh dan konsisten.

107. **Standar Visibilitas Kontekstual Filter Proyek Header (Contextual Header Project Switcher)**:
    - **Tampilan Bersyarat Sesuai Relevansi Halaman**:
      * Dropdown pemilih proyek di header atas aplikasi (`AppShell.tsx`), baik pada tampilan desktop maupun mobile, **HANYA DITAMPILKAN** pada halaman-halaman yang datanya terikat secara langsung dengan filter proyek operasional:
        1. `dashboard` (Dasbor Metrik & Feed Ritase Proyek)
        2. `dispatcher` (Pencatatan Ritase & Riwayat Ritase Proyek)
        3. `recap` (Rekapitulasi Ritase Per Proyek)
    - **Penyembunyian Bersih pada Modul Master & Perusahaan**:
      * Pada halaman master dan data perseroan yang bersifat global:
        - `clients` (Katalog Klien / Perusahaan)
        - `quarries` (Katalog Kuari Tambang)
        - `materials` (Master Database Material & Tarif)
        - `cash_ledger` (Buku Kas Induk & Piutang Tempo)
        - `database` (Master Armada & Daftar Supir)
        - `dev` (Dev Console & System Audit)
        - `projects` (Katalog Master Seluruh Proyek)
        - `investors` (Master Pemodal & Investor)
      * Dropdown filter proyek **WAJIB DISEMBUNYIKAN SEPENUHNYA** dari bilah header.
      * Menghilangkan ilusi filter fiktif dan mencegah kebingungan pengguna ("mengapa ganti proyek di header tidak ada data yang berubah sama sekali").

108. **Standar Tombol Aksi Utama di Titlebar Mobile (Mobile Titlebar Primary Action Standard)**:
    - **Penempatan Tombol Aksi di Kanan Titlebar Mobile**:
      * Pada tampilan layar mobile (< 768px), tombol aksi utama penambahan data master (`+ Tambah Proyek`, `+ Tambah Investor`, `+ Tambah Kuari`, `+ Tambah Klien`, serta tombol dinamis di Material & Rute: `+ Komoditas Baru` / `+ Atur Harga` / `+ Tambah Rute`) **WAJIB DIPINDAHKAN ke sisi kanan titlebar mobile** di dalam header `AppShell` (`flex items-center justify-between` sejajar dengan judul halaman).
      * Menggunakan komponen portal `<MobileTitlebarAction />` yang merender children ke dalam kontainer `<div id="mobile-titlebar-action" className="md:hidden" />` pada titlebar mobile `AppShell.tsx`.
    - **Pelebaran Penuh Kolom Pencarian Mobile (100% Full-Width Search Input)**:
      * Di toolbar tabel bawah pada tampilan mobile, tombol aksi disembunyikan (`hidden md:inline-flex`), sehingga kotak input pencarian (*search bar*) otomatis melebar penuh 100% (`w-full flex-1`) untuk kenyamanan pengetikan dan visual yang lega tanpa terdesak tombol.
    - **Tampilan Desktop Tetap Berada di Toolbar Tabel**:
      * Pada tampilan desktop (≥ 768px), tombol aksi tetap berada di dalam toolbar tabel di samping kotak pencarian (`hidden md:inline-flex`), menjaga konsistensi alur kerja desktop yang efisien.
    - **Perilaku Dinamis pada Halaman Sub-Tab (Material & Rute)**:
      * Pada halaman dengan multi sub-tab seperti `MasterMaterialPage`, tombol aksi di titlebar mobile wajib otomatis berubah mengikuti sub-tab yang aktif:
        - Sub-tab Katalog: `+ Komoditas Baru`
        - Sub-tab Harga Kuari: `+ Atur Harga`
        - Sub-tab Rute Acuan: `+ Tambah Rute`

109. **Standar Pengawasan Kebocoran Modal, Terminologi HOK, dan Deteksi Selisih Beban Operasional**:
    - **Standarisasi Terminologi HOK (Harga Ongkos Kerja) Lapangan**:
      * Di seluruh antarmuka pencatatan, modal dialog, kartu metrik, dan tabel laporan, label pengeluaran operasional armada wajib menggunakan istilah resmi lapangan:
        **"Beban Operasional & HOK (Uang Jalan / Supir / Solar)"** (menggantikan sebutan teknis abstrak seperti "Beban Operasional Armada").
      * Pada kolom ringkasan tabel finansial dipersingkat menjadi: **"HOK & Operasional"**.
    - **Deteksi & Peringatan Selisih Beban Operasional (HOK Variance Detection)**:
      * Pada form input ritase (`DispatchForm.tsx`), ketika rute acuan terpilih (`matchedRoute`), jika operator memasukkan beban operasional yang melebihi standar acuan rute (`operationalCost > matchedRoute.standardOperationalCost`), sistem wajib menampilkan indikator selisih pengeluaran secara visual:
        `⚠️ Melebihi acuan rute: +Rp X.XXX (Standar HOK: Rp Y.YYY)`
        menggunakan teks semantik `text-amber-700 text-[11px] font-medium mt-1`.
      * Mencegah kebocoran uang jalan atau penambahan biaya liar tanpa disadari oleh pengawas lapangan.
    - **Pencatatan Transparan Supir di Buku Kas Induk (`cash_ledger`)**:
      * Setiap pencatatan kas keluar operasional otomatis dari transaksi ritase wajib mencantumkan nama supir yang bertugas pada kolom keterangan kas:
        `Beban Operasional & HOK Armada [Plat Truk] (Sopir: [Nama Sopir]) - [No. Tiket]`
        sehingga riwayat mutasi kas dapat diaudit langsung hingga ke personil penerima uang jalan.
    - **Kartu Ringkasan Pengeluaran Modal Harian di Dashboard**:
      * Pada Dashboard Utama, sediakan kartu visual ringkasan pengeluaran modal berjalan:
        **"Kas Keluar Hari Ini"** dengan rincian ganda:
        1. **Belanja Pokok Kuari (Cash)**: Total uang tebus material di kuari.
        2. **HOK & Uang Jalan Supir (Cash)**: Total uang jalan dan upah operasional armada.
      * Memberikan visibilitas langsung dan instan kepada manajemen perseroan mengenai pemakaian modal riil investor per hari.

110. **Standar Arsitektur Progressive Web App (PWA) Standalone**:
    - **Identitas & Penamaan Aplikasi**:
      * Nama Lengkap: `PT Patak Abadi Jaya — Logistics System`
      * Nama Pendek (Home Screen): `Patak` (ringkas, tepat, dan bebas pemotongan titik-titik elipsis pada layar smartphone).
      * Deskripsi: `Sistem Logistik & Keuangan Terpadu PT Patak Abadi Jaya`
      * Bahasa: `id` (Bahasa Indonesia)
    - **Tampilan & Tema Visual**:
      * `display: 'standalone'` (berjalan tanpa bilah URL / address bar peramban, menyerupai aplikasi natif).
      * `orientation: 'portrait-primary'`
      * `theme_color: '#ffffff'` & `background_color: '#ffffff'`
    - **Standar Aset Ikon PWA (`public/icons/pwa/`)**:
      * Seluruh ikon menggunakan canvas latar belakang putih bersih (`#ffffff`) yang kontras dengan logo resmi PT Patak Abadi Jaya.
      * `pwa-192x192.png`: Resolusi 192×192 px untuk Android home screen.
      * `pwa-512x512.png`: Resolusi 512×512 px untuk desktop dan splash screen.
      * `maskable-icon-512x512.png`: Resolusi 512×512 px dengan *safe-zone padding* 20% agar terhindar dari pemotongan lingkaran/tupai (*squircle*) pada sistem operasi Android.
      * `apple-touch-icon.png`: Resolusi 180×180 px canvas RGB solid putih untuk perangkat iOS / iPadOS.
      * `favicon-64x64.png`: Favicon tab browser.
    - **Mekanisme Pembaruan & Caching (Vite PWA & Workbox)**:
      * `registerType: 'autoUpdate'`: Pembaruan service worker terjadi secara otomatis dan mulus di latar belakang tanpa memunculkan pop-up yang mengganggu konsentrasi operator penginput ritase lapangan.
      * Batas precache Workbox disetel hingga 5 MiB (`maximumFileSizeToCacheInBytes: 5 * 1024 * 1024`) untuk memastikan aset animasi offline (`offline-disconnected.gif`) tersimpan penuh dan aplikasi dapat dibuka saat kondisi sinyal nol di area kuari.
      * Runtime caching untuk Google Fonts (`fonts.googleapis.com` via `StaleWhileRevalidate` dan `fonts.gstatic.com` via `CacheFirst`).
    - **Pemasangan Mandiri (Native Install Standard)**:
      * Menghindari penambahan tombol install kustom yang memadati antarmuka pengguna (sesuai aturan `ai-anti-patterns.md`), sepenuhnya mengandalkan pemicu instalasi natif dari browser (Chrome/Edge/Safari).

111. **Standar Transformasi Modal Pop-up ke Bottom Sheet Drawer Layar Mobile**:
    - **Target & Breakpoint Responsif**:
      * Pada perangkat bergerak / mobile (`< md` atau screen width < 768px), seluruh modal pop-up wajib bertransformasi 100% menjadi panel laci bawah (*bottom sheet drawer*) yang meluncur dari dasar layar (`animate-in slide-in-from-bottom duration-300 ease-out`).
      * Pada desktop (`md:`), modal tetap ditampilkan sebagai kartu dialog tengah (*centered modal dialog card*) yang rapi dan proporsional (`md:items-center md:rounded-[12px] md:max-w-xl md:max-h-[90vh]`).
    - **Dimensi Tinggi & Celah Backdrop (Dismiss Tap)**:
      * Tinggi drawer mobile bersifat adaptif sesuai konten dengan batas maksimal 92% viewport height (`max-h-[92vh] rounded-t-[20px]`).
      * Menyisakan celah visual ~8vh di bagian atas layar agar pengguna dapat langsung menyentuh area backdrop gelap (`bg-black/50 transition-opacity`) untuk menutup drawer secara instan tanpa harus menggulir form.
    - **Tata Letak Header & Penutupan Bersih**:
      * Header drawer mobile dibuat rapi dengan judul dan deskripsi rata tengah (`w-full text-center md:text-left`) guna menghadirkan estetika mobile natif yang simetris.
      * Tombol silang penutup ('✕') disembunyikan pada layar mobile (`hidden md:flex`) demi kebersihan visual, mengandalkan sentuhan pada celah backdrop atau tombol aksi bawah.
    - **Bilah Aksi Tempel Bawah (Sticky Bottom Action Bar)**:
      * Tombol aksi formulir ("Batal / Tutup" dan "Simpan / Konfirmasi") wajib ditempelkan di bagian dasar panel (*sticky bottom*) dengan pembatas border tipis (`sticky bottom-0 bg-white border-t border-[#eaeaea] p-4 flex gap-3 z-10`).
      * Pada mobile, tombol aksi otomatis melebar setara (`flex-1 md:flex-none py-2.5 md:py-2 text-center rounded-[8px]`) agar nyaman dijangkau oleh ibu jari operator lapangan (*thumb zone friendly*).
    - **Kontainer Konten & Scroll**:
      * Kontainer form membungkus area input dengan `flex flex-col flex-1 overflow-hidden`, di mana area isian formulir memakai `overflow-y-auto flex-1 overscroll-contain` untuk memastikan scroll berjalan halus tanpa *body-scroll bleed*.

112. **Larangan Penampilan Kolom Kode Unik / ID Teknis Database di Tabel & Header UI**:
    - **Pemberian Ruang Lebar untuk Nama Entitas Bisnis**:
      * Dilarang menampilkan kolom atau sel tabel khusus untuk "Kode Unik", nomor urut buatan (`MAT-01`, `MAT-BATU-AGREGAT`), atau ID internal database (`{tr.id}`, `{investor.id}`) pada seluruh antarmuka publik/operasional.
      * Seluruh ruang lebar kolom wajib dialokasikan secara proporsional kepada **Nama Entitas Asli** (seperti Nama Komoditas, Nama Kuari, Nama Proyek, atau Nama Mitra) dengan bantalan teks (*padding*) dan pembungkus kata (*whitespace/truncate*) yang aman agar teks tidak saling menabrak di layar ponsel pintar.
    - **Perbedaan Tegas dengan Dokumen Fisik Operasional**:
      * Larangan ini **TIDAK BERLAKU** untuk nomor dokumen operasional nyata yang dicetak atau dipegang secara fisik oleh personil lapangan, yaitu: **No. Tiket Ritase** (contoh: `TKT-20261028-001`), **No. Surat Jalan Kuari/Proyek**, dan **Nomor Plat Truk (TNKB)**. Nomor-nomor fisik ini adalah instrumen rekonsiliasi wajib dan tetap ditampilkan secara jelas.
    - **Judul Formulir & Modal yang Bersih dan Manusiawi**:
      * Judul modal edit entitas dilarang mencantumkan kode id teknis dalam tanda kurung (misalnya `Edit Investor (inv-xxx)` atau `Edit Kuari (qry-xxx)`).
      * Judul modal wajib mencantumkan nama entitas yang sedang disunting secara bersih dan manusiawi (contoh: `Edit Investor: [Nama Investor]` atau `Edit Kuari: [Nama Kuari]`).

113. **Penyederhanaan Segmented Control Master Material & Dynamic Entity Resolution Armada**:
    - **Peniadaan Segmented Button "Biaya Jalan Rute" pada Master Material**:
      * Pada halaman Master Material (`MasterMaterialPage`), sub-tab navigasi (segmented button) disederhanakan murni untuk manajemen komoditas (`Katalog Komoditas` dan `Harga & Mutu Kuari`), menghapus tombol segmented "BIAYA JALAN RUTE" agar fokus halaman tetap konsisten pada katalog material dan harga tebus kuari.
      * Sub-tab navigasi sidebar (`Sidebar.tsx`) di bawah modul Master Material diselaraskan secara konsisten (`catalog` dan `pricing`).
    - **Resolusi Entitas Armada Terintegrasi (Anti-False Orphan Warning)**:
      * Pemetaan entitas armada (`vehiclesMap`) untuk pengecekan referensi transaksi pada tabel ritase (`DatabasePage.tsx`) wajib mencakup seluruh armada gabungan (`combinedVehicles` yang menggabungkan armada master tersimpan dan seluruh riwayat transaksi aktif), bukan hanya koleksi master statis.
      * Mencegah munculnya ikon peringatan segitiga merah (*orphan warning triangle*) di samping nomor plat operasional (seperti `B 5000 CAA`) yang sudah aktif dan tercatat secara valid di dalam riwayat database operasional.

114. **Standar Pelabelan Tanggal Operasional Ritase (Tanggal Jalan) & Tata Letak Form**:
    - **Penamaan Baku Input Tanggal Pengiriman**:
      * Seluruh label input pengisian tanggal pengiriman ritase pada formulir dispatcher (`DispatchForm.tsx`) dan modal penyesuaian ritase (`EditDispatchModal.tsx`) WAJIB menggunakan penamaan ringkas, lugas, dan padat: **`Tanggal Jalan`** (menggantikan format lama yang redundan seperti `Tanggal Ritase (Jalan)` atau `Tanggal Ritase / Jalan`).
    - **Tata Letak Bersih & Pemindahan Counter Ritase**:
      * Label "Tanggal Jalan" berdiri sendiri secara bersih di atas komponen pemilih tanggal (*date picker*).
      * Indikator penghitung ritase ("Tercatat X ritase pada tanggal ini") wajib diletakkan di **baris bawah komponen date picker** (`mt-1.5`) agar tidak berhimpitan dengan label di layar ponsel pintar.
      * Menghapus deskripsi bantuan redundan ("Tanggal armada beroperasi/jalan...") di bawah date picker guna memaksimalkan kerapian dan ruang vertikal form mobile.

115. **Standar Penyederhanaan Label Penetapan Harga & Beban Operasional**:
    - **Penyederhanaan Label Penetapan Harga**:
      * Pada formulir ritase (`DispatchForm.tsx`) dan modal penyesuaian ritase (`EditDispatchModal.tsx`), label harga wajib disederhanakan murni menjadi **`Harga Beli ({unit})`** dan **`Harga Jual ({unit}) *`** tanpa embel-embel metode pembayaran seperti `(Cash)` atau `(Tempo)`.
    - **Penyederhanaan Label Beban Operasional**:
      * Label input biaya jalan dan operasional wajib disederhanakan murni menjadi **`Beban Operasional & HOK`** tanpa daftar panjang dalam tanda kurung seperti `(Uang Jalan / Supir / Solar)`.
      * Judul seksi pembungkus tetap baku: **`Penetapan Harga & HOK`**.

116. **Pemisahan Tampilan Volume Satuan Ritase (DT & Ton)**:
    - **Pemisahan Metrik DT dan Ton pada Kartu Dashboard**:
      * Pada kartu metrik dashboard operasional (`DashboardPage.tsx`), rincian volume ritase wajib dipisah secara tegas per satuan: **`Volume: n DT | n Ton`**.
      * Volume dengan satuan DT selalu dibulatkan ke bilangan bulat tanpa koma/desimal (`Math.round(totalVolumeDt)`).
      * Volume dengan satuan Ton menampilkan angka riil dengan maksimal 1 angka di belakang koma desimal jika ada pecahan, atau bilangan bulat jika bulat.

117. **Pembaruan Navigasi Menu & Ikon Mandiri Riwayat Ritase**:
    - **Struktur Menu Mandiri Non-Collapsible**:
      * Menu "Dispatcher" dan "Riwayat Ritase" pada bilah navigasi (`Sidebar.tsx`) berdiri sendiri sebagai menu mandiri tingkat atas tanpa sub-menu atau accordion toggle panah bawah.
      * Urutan tab "Kas & Piutang Tempo" (`cash_ledger`) diposisikan tepat di bawah tab Dashboard pada bilah samping navigasi.
    - **Ikon Mandiri Riwayat Ritase**:
      * Menu "Riwayat Ritase" menggunakan ikon grafis mandiri bertema struk/tiket jalan (`/icons/ritase.png`), memberikan diferensiasi visual yang jelas dari menu Dispatcher (`/icons/truck.png`).

118. **Penghapusan Teks ID Teknis Database pada Kartu Master**:
    - **Kebersihan Teks Identitas Bisnis**:
      * Pada modul Master Proyek (`ProjectsPage.tsx`), Master Kuari (`QuarriesPage.tsx`), dan Master Investor (`InvestorsPage.tsx`), teks kecil ID database (`prj-...`, `qry-...`, `inv-...`) di bawah nama entitas dilarang ditampilkan guna menjaga kebersihan visual antarmuka pengguna sesuai prinsip *breathing space*.

119. **Standar Format Ringkas Mata Uang Akhiran 'K' (Adaptive Overflow Suffix)**:
    - **Penyingkatan Otomatis Saat Overflow**:
      * Pada komponen nominal uang (terutama `<MetricCardCurrency />` pada kartu metrik/KPI dan kolom ringkasan yang rawan overflow teks), jika nominal angka terlalu panjang dan ruang wadah sempit/terpotong, nilai otomatis diringkas dengan memotong 3 digit nol terakhir dan diberi akhiran `K` (contoh: Rp 1.000.000.000 menjadi Rp 1.000.000K).
      * Simbol mata uang "Rp" tetap disertakan secara rapi dan semi-transparan sesuai Rule 99.
      * Dilengkapi atribut `title` dengan teks nominal lengkap tanpa singkatan agar pengguna dapat melihat angka eksak sewaktu-waktu melalui tooltip hover atau tap.

120. **Standar Desain Boxless Formulir Ritase & Kontras Latar Workspace (#ededed)**:
    - **Peniadaan Parent Container Box pada Form Ritase**:
      * Formulir pencatatan ritase (`DispatchForm.tsx`) dibuat sepenuhnya *boxless* tanpa wadah pembungkus (`bg-[#f5f5f5] rounded-[10px] p-4 md:p-6` dihilangkan) agar tata letak formulir terasa lapang, leluasa, dan tidak terkungkung kotak.
      * Judul desktop formulir ("Catat Ritase Baru") dipertahankan sebagai teks heading flat yang bersih tanpa garis pembatas bawah (*borderless header*).
      * Kotak ringkasan kalkulasi finansial di bagian bawah diformat sebagai kartu putih solid bersih (`bg-white rounded-[8px] border border-[#dcdcdc] p-3.5`).
    - **Standardisasi Warna Latar Workspace Global**:
      * Latar belakang kanvas workspace aplikasi global (`AppShell.tsx`) distandarisasi menggunakan warna netral sejuk **`bg-[#ededed]`** (menggantikan latar lama yang terlalu terang `#fafafa`), sehingga seluruh isian formulir input putih (`bg-white`) tampak kontras, tegas, dan tidak tenggelam.

121. **Bilah Kontrol Atas Dashboard (Filter Drawer & Line Chart Drawer)**:
    - **Bilah Kontrol Khusus & Touch Target Luas**:
      * Pada halaman Dashboard (`DashboardPage.tsx`), disediakan bilah kontrol khusus di atas kartu KPI dengan dua tombol berukuran besar dan *touch target* nyaman (min-h: 52px):
        1. **Tombol Filter** (menggunakan ikon `/icons/filter-slider.png`): Membuka panel drawer dari bawah (*bottom sheet*) dengan parameter filter lengkap (rentang tanggal, proyek, kuari, jenis material, dan status pembayaran) yang secara dinamis memperbarui metrik KPI dan tabel dashboard.
        2. **Tombol Chart** (menggunakan ikon `/icons/chart-line.png`): Membuka panel drawer dari bawah (*bottom sheet*) berisi grafik garis SVG interaktif dengan switcher antara 'Tren Ritase & Volume' (Trip, DT, Ton) dan 'Tren Finansial' (Omzet & Laba Bersih), dilengkapi titik sentuh interaktif dan ringkasan statistik puncak, rata-rata, dan total.

122. **Universal Table Row Context Menu (Klik Kanan & Tap-and-Hold 500ms)**:
    - **Interaksi Baris Tabel (<tr>)**:
      * Pada seluruh tabel data di sistem (diimplementasikan via `TableActionMenu.tsx`), setiap baris tabel (`<tr>`) dapat memicu menu konteks popover aksi:
        1. **Desktop**: Melalui klik kanan (`contextmenu`) tepat di posisi kursor mouse dengan pencegahan context menu browser default.
        2. **Mobile / Touchscreen**: Melalui *tap and hold* (sentuh dan tahan) selama 500 ms di posisi sentuhan jari, dilengkapi getaran mikro (*haptic vibration*) jika didukung peramban. Jika jari bergeser > 10px untuk scrolling, gesture long-press otomatis dibatalkan.
        3. Baris tabel yang aktif menampilkan menu konteks otomatis diberi highlight warna seleksi halus (`bg-[#f0f0f0]`) selama popover terbuka.

123. **Standar Desain Modal Finansial & Zero-AI-Slop Layout**:
    - **Pembersihan Elemen AI-Slop (Zero-Slop Standard)**:
      * Seluruh emoji grafis (seperti 🔨, 💰, 💸, 🖨️, ✏️, 🗑️) DILARANG KERAS digunakan pada tombol aksi, navigasi tab, kartu ringkasan, maupun status empty state.
      * Seluruh ikon tombol aksi dan kontrol WAJIB menggunakan ikon SVG garis mikro yang presisi (`strokeWidth={1.75}` atau `{2}`).
      * Tanda tambah pada tombol aksi utama ("Tambah Sub-Pekerjaan", "Daftarkan Sub-Pekerjaan Pertama", dll.) WAJIB berupa elemen ikon SVG plus, DILARANG berupa karakter string teks biasa (`+`).
      * DILARANG menampilkan ornamen bullet/dot/bulat berwarna (seperti titik hijau) di samping nama proyek; judul proyek tampil bersih dan langsung (*clean text heading*).
    - **Pemicu Modal Rincian pada Tabel Master (Clickable Entity Name & Action Menu)**:
      * DILARANG KERAS menjejalkan tombol badge/pill warna-warni (misalnya `📊 Sub-Proyek & Kasbon`) di samping teks nama entitas yang merusak lebar kolom dan memotong nama entitas menjadi terpotong (`Pr...`).
      * Pembukaan modal rincian komprehensif dilakukan secara elegan melalui:
        1. Teks Nama Entitas yang dapat diklik langsung (`text-[#111111] hover:text-[#008060] hover:underline cursor-pointer block truncate`).
        2. Menu Aksi tabel resmi (`TableActionMenu` via titik tiga, klik kanan desktop, atau tap-and-hold baris tabel).
    - **Standar Tinggi Fixed Modal Besar di Desktop (`h-[88vh]`)**:
      * Seluruh modal data besar dengan navigasi tab atau rekapitulasi data komprehensif (`ProjectFinancialsModal`, `InvestorLedgerModal`, `ApprovalCenterModal`) WAJIB menggunakan tinggi fixed pada layar desktop: **`h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh]`**.
      * Area badan tab/konten WAJIB menggunakan **`flex-1 min-h-0 overflow-y-auto`** sehingga wadah modal tetap stabil, kokoh, dan tidak berubah-ubah tinggi (*zero layout jumping*) saat pengguna berpindah tab dengan jumlah baris data yang berbeda-beda.
      * Modal form input ringkas dan dialog konfirmasi tetap menggunakan tinggi proporsional sesuai kebutuhan formulir.
    - **Hierarki & Layout Tombol Aksi Header Modal (Single-Row Baris Bawah)**:
      * Header modal hanya memiliki 1 tombol aksi utama (*Primary Button*) bertema monokrom hitam solid (`bg-[#111111] hover:bg-black text-white`) dengan ikon SVG plus.
      * Tombol aksi pendukung (*Secondary Buttons*: Catat Bayar, Kasbon Mandor, Cetak Rekap) diformat sebagai tombol outline bersih (`bg-white hover:bg-[#f9fafb] text-[#111111] border border-[#d1d5db]`).
      * **Tata Letak Baris Mandiri (Single Row)**: Seluruh deretan tombol aksi diposisikan dalam satu baris tersendiri di bawah informasi proyek (`flex items-center gap-2 overflow-x-auto pb-0.5 whitespace-nowrap`), sehingga tidak patah atau terdesak wrap menjadi 2 baris.
      * **Tombol Tutup Modal (`✕`)**: Diposisikan terpisah dan mandiri di pojok kanan atas sejajar dengan nama proyek menggunakan ikon SVG silang mikro dengan status hover halus.
    - **Penerapan Standar Metrik Finansial (Rule 99 & Rule 119)**:
      * 4 Kartu KPI Ringkasan Proyek di dalam modal WAJIB menggunakan `<MetricCardCurrency />` dengan tipografi sans-serif bold (`font-bold tracking-tight`), DILARANG menggunakan `font-mono` pada angka nominal utama kartu metrik.
      * Wadah kartu metrik menggunakan latar sejuk (`bg-[#fafafa]`) dengan kartu putih ber-border lembut (`bg-white p-3.5 rounded-[10px] border border-[#eaeaea]`).
    - **Navigasi Tab Sederhana Tanpa Badge Warna-Warni**:
      * Hapus seluruh badge bulat/pill berwarna cerah (`bg-amber-100`, `bg-emerald-100`, dll.) pada switcher tab.
      * Label tab menggunakan teks bersih dengan penghitung netral sederhana, contoh: `Sub-Pekerjaan (n)`, `Ritase Material (n)`, `Kasbon Mandor (n)`, `Pembayaran Klien (n)`.
      * Indikator tab aktif ditandai secara elegan dengan garis bawah hitam solid (`border-b-2 border-[#111111] text-[#111111]`).

124. **Standar Universal Modal Mobile (Drawer Bottom Panel / Bottom Sheet)**:
    - **Pola Bottom Sheet Menempel di Dasar Layar (Mobile)**:
      * Khusus tampilan mobile (`< md:`), SELURUH modal pop-up window di sistem WAJIB bertransformasi menjadi **drawer bottom panel (bottom sheet)**:
        1. **Posisi & Margin**: Menempel di dasar layar tanpa margin samping/bawah (`flex items-end md:items-center justify-center p-0 md:p-4`).
        2. **Lebar Penuh**: Lebar 100% layar mobile penuh (`w-full md:max-w-...`).
        3. **Sudut Membulat**: Membulat hanya di sisi atas (`rounded-t-[20px] md:rounded-[12px]` atau `md:rounded-[16px]`).
        4. **Tanpa Pull Handle Bar**: Langsung menampilkan header judul modal yang bersih menempel di bagian atas.
        5. **Tinggi Fixed Proporsional**: Untuk modal data/rekapitulasi besar (`ProjectFinancialsModal`, `InvestorLedgerModal`), tinggi di mobile ditetapkan **`h-[92vh] max-h-[92vh]`** (memberi sisa ruang gelap ~8vh di bagian atas), sedangkan modal form input ringkas menggunakan `max-h-[92vh]`.
    - **Animasi Meluncur Mulus (Smooth Slide-In & Slide-Out)**:
      * Animasi kemunculan drawer di mobile WAJIB menggunakan efek meluncur mulus dari dasar layar: **`animate-in slide-in-from-bottom duration-300 ease-out`**.
    - **Backdrop & Tap on Blur to Close**:
      * Seluruh modal wajib memiliki lapisan backdrop terpisah: `<div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />`.
      * Menyentuh/tap pada area blur di luar panel drawer (*tap on blur*) otomatis menutup modal secara instan dan responsif.

125. **Penyederhanaan Adaptif Nominal Uang Berjenjang (K, Jt, Mil, Tri), Layout Header Modal, & Anti-Wrapping Tabel Modal**:
    - **Penyederhanaan Adaptif Nominal Uang Saat Wadah Sempit / Mentok**:
      * Jika parent pembungkus sempit, teks nominal uang kepanjangan, atau mentok komponen lain, teks nominal uang WAJIB disederhanakan secara berjenjang (*tiered adaptive simplification*) menggunakan akhiran skala Indonesia:
        1. **< 1.000**: Ditampilkan angka bulat murni (contoh: `500`).
        2. **1.000 s/d < 1.000.000 (Ribu)**: Akhiran **`K`** tanpa spasi (contoh: `750K`, `12,5K`).
        3. **1.000.000 s/d < 1.000.000.000 (Juta)**: Akhiran **`Jt`** dengan spasi (contoh: `12,5 Jt`, `50 Jt`).
        4. **1.000.000.000 s/d < 1.000.000.000.000 (Miliar)**: Akhiran **`Mil`** dengan spasi (contoh: `125,23 Mil`, `2,5 Mil`).
        5. **>= 1.000.000.000.000 (Triliun)**: Akhiran **`Tri`** dengan spasi (contoh: `1,5 Tri`).
      * **Presisi & Pemisah Desimal**: Maksimal 2 angka di belakang koma dengan pemisah koma khas Indonesia (`,`), memotong angka nol mubazir di akhir (contoh: `125,23 Mil`, bukan `125,230 Mil` atau `125,00 Mil`).
      * **Komponen & Helper**:
        - Tersedia fungsi utility `formatSimplifiedCurrency(amount)` dan `formatRupiahSimplified(amount)` di `src/lib/currencyUtils.ts`.
        - Komponen universal `<AdaptiveCurrency amount={...} />` di `src/components/ui/AdaptiveCurrency.tsx` dan `<MetricCardCurrency />` di `src/components/ui/MetricCardCurrency.tsx` yang menggunakan `ResizeObserver` tersembunyi untuk mendeteksi kapasitas ruang parent wadah secara otomatis.
      * **Tooltip Presisi Utuh**: Elemen pembungkus nominal WAJIB menyertakan atribut `title` yang memuat nominal penuh tanpa singkatan (misalnya `title="Rp 125.230.000.000"`), sehingga pengguna dapat melihat nilai rupiah presisi saat cursor melayang (hover).
    - **Penempatan Alamat Proyek pada Header Modal**:
      * Alamat proyek WAJIB diposisikan berdiri sendiri pada 1 baris mandiri tepat di bawah judul nama proyek (`<p className="text-xs text-[#666666] mt-0.5">{project.location}</p>`), TANPA tanda titik/bullet/dot (`•`) di bagian awal kalimat.
    - **Pencegahan Konten Ter-Wrap pada Tabel Data Modal (Anti-Wrapping Table Standard)**:
      * Seluruh tabel data di dalam tab modal (misalnya Ritase Material, Kasbon Tukang, Pembayaran Klien) DILARANG KERAS membiarkan teks sel patah / wrap ke bawah secara berantakan di layar kecil.
      * Wadah tabel WAJIB dibungkus dengan kontainer scroll horizontal: `overflow-x-auto`.
      * Tabel WAJIB menetapkan batas lebar minimum (`min-w-[650px]` hingga `min-w-[720px]`).
      * Seluruh sel header (`<th>`) dan sel isi data (`<td>`) WAJIB memiliki kelas **`whitespace-nowrap`** sehingga informasi tersusun rapi dalam 1 baris lurus tanpa kata yang terpotong secara vertikal.

126. **Standar Peletakan Tanda Minus (Rp -), Presistensi Tab, Inline Chart Monokrom, Universal Pagination 20 Baris, Desain Header Investor, & Integrasi Kolom Ritase (Tanpa Kolom Status/Konsumen)**:
    - **Format Peletakan Tanda Minus Mata Uang (`Rp -`)**:
      * Pada seluruh tampilan nominal mata uang negatif, tanda minus (-) WAJIB diletakkan **setelah simbol Rp** (contoh: `Rp -17.136.500`), BUKAN di depan Rp (`-Rp 17.136.500`).
      * Aturan ini berlaku mutlak pada utility `src/lib/currencyUtils.ts` (`formatRupiah` & `formatSimplifiedCurrency`) serta komponen `<MetricCardCurrency />` dan `<AdaptiveCurrency />`.
    - **Presistensi Halaman & Subtab Saat Refresh (`localStorage`)**:
      * Tab dan subtab navigasi yang sedang dibuka oleh pengguna WAJIB disimpan secara persisten di `localStorage` (`patak_active_tab` dan `patak_active_subtab`).
      * Saat browser di-refresh, halaman otomatis kembali ke tab/subtab terakhir yang sedang dibuka. Sesi keluar (*logout*) otomatis membersihkan kedua key tersebut.
    - **Grafik Garis Tren Dashboard Inline Permanen & Bebas Titik Hijau**:
      * Grafik garis operasional & finansial di dashboard WAJIB selalu tampil secara inline dan permanen tepat di bawah 4 kartu matriks ringkasan KPI (tanpa tombol drawer atau tombol silang tutup).
      * Desain chart wajib bernuansa monokrom bersih: titik data berwarna hitam (`#111111`), tanpa titik hijau (`●`), dan tipografi tanggal serta tooltip menggunakan font sans-serif seutuhnya (zero `font-mono`). Default filter operasional di dashboard diset ke "Semua Waktu" (`ALL`).
    - **Kartu Quick Action Hub Charcoal**:
      * Kartu ringkasan aksi cepat di dashboard menggunakan latar belakang hitam charcoal (`bg-[#1c1c1e]`), ikon dibungkus lingkaran putih (`w-10 h-10 rounded-full bg-white`), dan teks berwarna putih pekat.
    - **Standar Universal Pagination 20 Baris Per Halaman (`TablePagination`)**:
      * Seluruh tabel transaksi berkapasitas data banyak (Dashboard, Riwayat Dispatcher, Rekapitulasi, dan Buku Kas) WAJIB menggunakan komponen universal `<TablePagination />` (`src/components/ui/TablePagination.tsx`).
      * Batasan baris aktif tepat **20 baris per halaman**, dilengkapi ringkasan baris (*Menampilkan X - Y dari Z data*), tombol Sebelumnya & Berikutnya, nomor halaman dinamis dengan ellipsis (...), dan auto-reset ke halaman 1 saat parameter filter atau pencarian diubah.
    - **Ikon Global & Penyederhanaan Toolbar Header Investor**:
      * Ikon pencarian diganti secara global di `public/icons/search.png` menggunakan aset kaca pembesar bulat bersih terbaru.
      * Header tabel Investor: teks deskripsi panjang dihapus, kolom pencarian dipindahkan ke sisi kiri, dan dua tombol aksi (*Transfer Antar-Investor* dan *Tambah Investor*) diseragamkan dengan gaya hitam solid (`bg-[#111111] hover:bg-[#2b2b2b] text-white`) dengan ikon putih (`/icons/transfer.png` dan `/icons/plus.png`).
      * Tombol "Buku Kas" di baris tabel investor diganti menjadi icon-only button bersih (`w-7 h-7`) menggunakan aset `/icons/ledger.png`.
      * Persentase bagi hasil pada kolom proyek terdanai investor dibungkus dalam pill badge warna hijau tua dengan teks putih (`bg-[#15803d] text-white rounded-full px-2 py-0.5 text-[10px] font-bold`).
    - **Penyederhanaan Kolom Tabel & Integrasi Relasi (Proyek, Lokasi, dan Konsumen)**:
      * **Tabel Master Proyek**: Kolom "Lokasi" dihapus dari header; alamat lokasi proyek dipindahkan tepat di bawah nama proyek dalam ukuran font sekunder (`text-[11px] text-[#666666]`).
      * **Tabel Riwayat Ritase (Dashboard, Riwayat Dispatcher, Input Ritase, Rekap Operasional & Finansial, dan Detail Ritase Proyek)**:
        1. Kolom **"Status"** (Tempo / Lunas) dihapus total dari tabel-tabel transaksi ritase (kecuali pada tabel Piutang Buku Kas yang memerlukan aksi pelunasan tombol "Lunasi").
        2. Kolom **"Konsumen"** dihapus total dari tabel-tabel transaksi ritase; nama konsumen / klien dipindahkan tepat di bawah nama proyek tujuan dalam ukuran font sekunder (`text-[11px] text-[#666666]`).

127. **Standar Halaman 404 Not Found (Standalone Full-Screen, Brand Minimalis Elegan, Edge-to-Edge Kanvas Putih)**:
    - **Tampilan Layar Penuh Mandiri (Standalone Full-Screen)**:
      * Halaman 404 Not Found WAJIB ditampilkan secara penuh (*full-screen standalone*) tanpa pembungkus `<AppShell>` (tanpa sidebar dan tanpa topbar navigasi) agar pengguna terfokus penuh saat rute tidak dikenali.
    - **Kanvas Edge-to-Edge Putih Bersih (Zero Card Wrapper)**:
      * Latar belakang halaman 404 menggunakan `bg-white min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none` tanpa kartu pembungkus (boxless edge-to-edge).
    - **Elemen Brand & Tipografi**:
      * Di bagian atas terpasang logo resmi squircle PT Patak Abadi Jaya (`/icons/pt-logo.png`, `w-16 h-16 rounded-[14px] mx-auto mb-6 shadow-xs`).
      * Angka "404" ditampilkan dalam tipografi besar tegas (`text-6xl md:text-7xl font-extrabold text-[#111111] tracking-tight leading-none mb-3`).
      * Judul "Halaman Tidak Ditemukan" (`text-lg md:text-xl font-bold text-[#111111] mb-2 tracking-tight`) dan deskripsi singkat yang jelas.
      * Kotak URL yang dicoba diakses menggunakan wadah solid abu-abu terang `bg-[#f5f5f5] rounded-[8px] px-4 py-2.5 max-w-md w-full mx-auto mb-8 font-mono text-xs text-[#333333] break-all select-all` (tanpa border stroke).
    - **Aksi Tunggal Navigasi**:
      * Hanya ada 1 tombol aksi utama hitam solid (`bg-[#111111] hover:bg-[#2b2b2b] text-white rounded-[10px] px-6 py-3.5 text-xs md:text-sm font-semibold border-none cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs whitespace-nowrap`) bertuliskan "Kembali ke Dashboard".
      * Jika pengguna sedang dalam sesi login, tombol mengarahkan ke dashboard utama. Jika pengguna belum login (tamu/unauthenticated), tombol mengarahkan ke halaman login.
    - **Kepatuhan AI Anti-Patterns**:
      * Dilarang menambahkan badge/tag/pill tanpa perintah, dilarang border outline stroke (`border`, `ring-*`), dilarang emoji di string UI, dan dilarang animasi berdenyut non-skeleton.


