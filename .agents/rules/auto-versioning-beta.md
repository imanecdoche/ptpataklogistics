# Workspace Rule: Auto-Versioning (BETA Format)

## 📌 Absolute Principle
Aplikasi OSDIGI menerapkan mekanisme transparansi versi berbasis rilis BETA.

### 1. Pola Format Versi
- Format versi wajib 4-digit dengan prefiks `v` dan akhiran `b` (BETA):
  `v<Major>.<Minor>.<Patch>.<Build>b` (contoh: `v1.1.0.2b`).

### 2. Aturan Inkrementasi Otomatis
- **Major Update**: Peningkatan arsitektur besar / perombakan sistem -> Naikkan digit ke-1 (misal `v2.0.0.0b`).
- **Minor Update**: Fitur modul baru atau halaman baru -> Naikkan digit ke-2 (misal `v1.2.0.0b`).
- **Patch Update**: Peningkatan / refaktor fungsionalitas -> Naikkan digit ke-3 (misal `v1.1.1.0b`).
- **Bug Fix / Micro Update**: Perbaikan bug, styling, shortcut, atau metadata -> Naikkan digit ke-4 (misal `v1.1.0.3b`).

### 3. File Acuan Sumber Versi
- `src/config/version.ts`: Menyimpan konstanta `APP_VERSION`, `BUILD_DATE`, `RELEASE_CHANNEL`, serta ringkasan changelog.
- `package.json`: Disinkronkan dengan versi terkini.
