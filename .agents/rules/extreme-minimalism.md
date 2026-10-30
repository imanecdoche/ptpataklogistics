# Workspace Rule: Extreme Minimalism & Modal Standards

## 📌 Absolute Principle
Sistem antarmuka OstifakODP berpegang teguh pada prinsip minimalis ekstrem (*clean-flat*, *unboxed*, dan *anti-clutter*).

### 1. Header Modal Bersih Tanpa Ikon
- Bagian header seluruh popup modal dialog wajib bersih tanpa ikon pendamping.
- Hanya tampilkan judul teks, deskripsi/subtitle jika diperlukan, dan tombol tutup silang (`X`).

### 2. Form Category Labels
- Dilarang menggunakan penomoran ("1.", "2.", "3.") pada judul bagian atau kategori form.
- Gunakan teks label kategori yang lebih besar, tebal, dan jelas (`text-sm font-bold text-[#0F172A] font-headline`).
- Pisahkan antar bagian form dengan garis pembatas tipis yang tegas (`border-t border-slate-200`).

### 3. Scrollable Lists & Edge Shadows
- Seluruh area pilihan yang dapat digulir (seperti santri picker, tag area, atau daftar entri) wajib memiliki batas tinggi (`max-height`).
- Sembunyikan scrollbar visual (`no-scrollbar`).
- Berikan efek bayangan tepi atas dan bawah (*edge shadow / fade effect*) saat terjadi scroll.

### 4. Modal Near-Fullscreen
- Modal kompleks wajib berukuran lega mendekati fullscreen (`h-[92vh] max-h-[94vh] max-w-5xl`) agar konten terlihat jelas tanpa memicu double scroll pada viewport utama.

### 5. Anti-Decorative Elements
- Kurangi penggunaan ikon secara drastis (hanya pada tombol icon-only atau aksi esensial).
- Hindari kontainer box bertumpuk-tumpuk; gunakan clean-flat layout.
- Hindari badge / tag / kapsul warna-warni yang mencolok; prioritaskan plain text dan tipografi bersih.
