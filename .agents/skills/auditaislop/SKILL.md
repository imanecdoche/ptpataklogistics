---
name: auditaislop
description: Principal UI/UX Design System Engineer skill to audit and refactor frontend code, enforcing Extreme Minimalism, solid-filled design tokens, zero outline strokes, anti-wrapping, and eliminating AI-slop elements.
license: MIT
metadata:
  author: patak-logistics-core
---

# 🛡️ /auditaislop — Principal UI/UX Design System Engineer & Anti-Slop Auditor

Skill ini bertindak sebagai **Principal UI/UX Design System Engineer** yang mengaudit, membersihkan, dan merefaktor antarmuka frontend ke standar tertinggi **"Extreme Minimalism"**, solid-filled tokens, dan bebas dari elemen hiasan artifisial (*AI-Slop*).

---

## 🎯 7 Pilar Wajib Audit UI/UX (/auditaislop)

### 1. Solid-Filled Only (Zero Outline Strokes)
- **Tombol, Badge, Chip, Input, dan Select**: WAJIB menggunakan latar padat murni (*solid-filled*) dengan `border-none`.
- **DILARANG KERAS**: Menggunakan border stroke/outline dekoratif (`border`, `border-*`, `ring-*`, `outline-*`, `bg-*-50/50`).
- Latar tombol aktif: `bg-[#111111] text-white hover:bg-[#2b2b2b]`.
- Latar field input/select: `bg-[#f5f5f5] text-[#111111] focus:bg-white focus:ring-0 border-none`.
- Latar kontainer netral: `bg-[#f5f5f5]` atau `bg-white` solid.

### 2. Eliminasi Dot Dekoratif & Status Bullet
- Hapus semua lingkaran kecil warna-warni / status dot di sebelah judul, label status, metrik, atau badge (`w-1.5 h-1.5 rounded-full`, `w-2 h-2`, simbol `•` / `●`).
- Status dikomunikasikan secara bersih lewat teks yang jelas dan kontras warna tipografi sans-serif.

### 3. Zero Emojis & Ikon SVG Solid Murni
- Dilarang keras menggunakan emoji (seperti 🚀, 💡, ⚡, 🔍, ⚠️, 📌) di dalam template antarmuka JSX/TSX atau string label tombol.
- Gunakan ikon SVG resmi (`lucide-react`) bergaya *filled glyph* yang warnanya menyatu secara natural dengan teks (`text-current` / `text-white` / `text-[#111111]`), tanpa dibungkus kotak/lingkaran warna-warni berlebih.

### 4. Pembersihan AI-Slop & Glassmorphism
- Hapus seluruh efek `backdrop-blur`, gradasi tombol/teks (`bg-gradient-*`, `text-transparent bg-clip-text`), neon glow, shadow dekoratif warna-warni (`shadow-blue-*`), dan animasi denyut non-skeleton (`animate-pulse`).
- Backdrop modal / drawer WAJIB menggunakan latar gelap solid murni (*solid dimmed*): `bg-black/50` tanpa blur.

### 5. Anti-Wrapping & Container Fit
- Terapkan kelas `whitespace-nowrap` dan `flex-shrink-0` pada seluruh:
  - Tombol aksi
  - Badge & chip filter
  - Nominal mata uang (angka rupiah)
  - Tanggal dan jam transaksi
  - ID transaksi / nomor tiket
  - Header tabel (`<th>`) dan sel tabel (`<td>`)
- Seluruh tabel transaksi WAJIB dibungkus kontainer responsif `w-full overflow-x-auto` dengan `min-w-[...]` yang proporsional agar data tidak bertumpuk atau patah baris canggung.

### 6. Standar Modal Desktop (`>= md`)
- Modal desktop wajib memiliki ukuran lebar dan tinggi terkunci (*locked fixed width & height*, contoh: `md:w-[540px] md:h-[620px] flex flex-col`).
- Konten modal tidak boleh melompat atau memanjang (*jumping / expanding height*) saat dropdown dibuka atau pesan validasi muncul.
- Penutupan modal wajib mendukung klik pada backdrop dan penekanan tombol keyboard `Escape`.
- Formulir wajib mendukung submit instan melalui penekanan tombol `Enter`.

### 7. Standar Bottom Drawer Mobile (`< md`)
- Seluruh modal/popup pada layar desktop otomatis bertransformasi menjadi **Bottom Drawer Panel** di layar ponsel (`< md`).
- Menempel kokoh di dasar layar: `fixed inset-x-0 bottom-0 z-50 w-full rounded-t-[16px] rounded-b-none` dengan tinggi terkunci `h-[82dvh]` atau `h-[85dvh]`.
- Judul header berada di tengah (*centered title*), **DILARANG KERAS menggunakan drag handle / pill bar dekoratif**.
- Tombol aksi konfirmasi dan batal WAJIB menempel secara **sticky di bagian paling bawah drawer** (`sticky bottom-0 inset-x-0 z-10 mt-auto bg-white p-4`).
- **MANDATORY SMOOTH ENTER/EXIT TRANSITIONS**:
  - **Bi-Directional Fluid Animation**: Setiap mobile bottom drawer panel WAJIB memiliki animasi slide masuk dan keluar yang halus tanpa stutter pada sumbu Y (`translate-y-full` ke `translate-y-0` saat enter, dan `translate-y-0` ke `translate-y-full` saat exit).
  - **Graceful Unmounting Lifecycle**: DILARANG KERAS langsung menghapus/unmount komponen drawer dari DOM sebelum animasi keluar selesai. Wajib mengimplementasikan lifecycle transisi keluar (misalnya state `isClosing` dengan timer unmount yang tertunda) sehingga drawer meluncur keluar sepenuhnya dari viewport dan backdrop memudar (*fade out*) secara mulus sebelum unmount.
  - **Transition Standards**: Menegakkan transisi hardware-accelerated dengan kurva easing yang luwes (`transition-transform duration-200 ease-out` untuk bodi drawer dan `transition-opacity duration-200 ease-out` untuk backdrop).

### 8. Custom UI untuk Seluruh Picker & Form Controls (Zero Native OS Controls)
- **Zero Native Browser Pickers**: Setiap input picker, selector, dan kontrol toggle—termasuk Date Picker, Time Picker, Dropdown Select, Combobox, Autocomplete, Radio Button, dan Checkbox—**WAJIB diimplementasikan menggunakan komponen Custom UI**.
- **Strictly Prohibited**: DILARANG KERAS menggunakan kontrol bawaan OS / browser native tanpa styling kustom (contoh: native browser `<select>`, `<input type="date">`, `<input type="time">`, atau checkbox/radio default OS).
- Seluruh kontrol seleksi wajib mematuhi design token monokromatis, solid-filled, dan borderless.

### 9. Custom Dialog System (Zero Browser Native Dialogs)
- **Zero Native Dialog APIs**: Pemanggilan API dialog bawaan browser (`window.alert()`, `window.confirm()`, `window.prompt()`, atau `alert()` / `confirm()`) adalah **DILARANG KERAS (STRICTLY PROHIBITED)**.
- **Unified Custom Dialog Architecture**: Seluruh peringatan (alerts), konfirmasi (confirmations), prompt destruktif, dan notifikasi WAJIB dirender melalui sistem custom modal/dialog aplikasi atau context provider dialog (contoh: `CustomDialog`, `DialogContext` / `useDialog()`), dengan mematuhi spesifikasi ukuran terkunci desktop dan animasi bottom-drawer mobile.

---

## 🛠️ Checklist Prosedur Audit (/auditaislop)

Saat slash command `/auditaislop` dipicu pada berkas atau komponen tertentu:
1. **Pindai Outline Stroke**: Cari semua kelas `border`, `border-gray-*`, `ring-*` dan ganti dengan solid tokens.
2. **Pindai Emojis**: Temukan dan hapus seluruh emoji pada string teks tombol dan header.
3. **Pindai Status Dot**: Hapus elemen `rounded-full` dekoratif di samping teks status.
4. **Pindai Text Wrapping**: Pasang `whitespace-nowrap` pada nominal uang, tanggal, status, dan tombol aksi.
5. **Pindai Native Controls**: Deteksi elemen `<select>`, `<input type="date">`, `<input type="time">`, checkbox/radio native, dan ganti dengan komponen Custom UI.
6. **Pindai Native Dialogs**: Deteksi panggilan `alert()`, `confirm()`, `prompt()` dan ganti dengan sistem dialog kustom (`useDialog()`).
7. **Verifikasi Responsivitas & Transisi Mobile**: Pastikan modal beralih ke bottom drawer `h-[85dvh]` dengan enter/exit transition mulus dan sticky action footer di layar sempit.
8. **Verifikasi Build**: Pastikan TypeScript kompilasi `tsc -b` lulus tanpa peringatan atau error.
