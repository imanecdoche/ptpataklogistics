export type UnitType = 'DT' | 'Ton'; // DT = Dump Truck standar 6 m³
export type PaymentStatus = 'TEMPO' | 'LUNAS';
export type CashFlowType = 'MODAL_AWAL' | 'TOPUP_MODAL' | 'BELI_MATERIAL' | 'BIAYA_OPERASIONAL' | 'PELUNASAN_PIUTANG';

export type ClientType = 'PT' | 'CV' | 'UD' | 'PERORANGAN';

// 1. Koleksi: clients (Master Klien / Perusahaan Kontraktor / Mandor Perorangan)
export interface Client {
  id: string;                // e.g. "cli-pt-maju-karya" (Primary Key mutlak)
  name: string;              // e.g. "PT Maju Karya" atau "Pak Haji Ridwan (Proyek Cilegon)"
  type?: ClientType;         // Klasifikasi tipe entitas
  picName?: string;          // Nama PIC lapangan / mandor
  phoneNumber?: string;      // No HP / WhatsApp
  createdAt: string;         // ISO Timestamp
}

// 2. Koleksi: materials
export interface MaterialItem {
  id: string;
  name: string;              // Contoh: "Batu Belah", "Pasir Extra"
  unit: UnitType;            // Default unit
  defaultBuyPrice: number;   // Harga beli acuan per unit
  defaultSellPrice: number;  // Harga jual acuan per unit
  createdAt: string;
}

// 3. Koleksi: transactions (Pencatatan Ritase)
export interface DispatchTransaction {
  id: string;
  ticketNumber: string;      // Format: PTK-YYYYMMDD-XXXX
  deliveryDate: string;      // Format YYYY-MM-DD (Tanggal Jalan / Pelaksanaan Ritase)
  createdAt: string;         // ISO Timestamp (Waktu Tiket Dibuat di Sistem)
  date?: string;             // Legacy field untuk kompatibilitas
  truckPlate: string;        // No. Plat Truk
  driverName?: string;       // Nama Sopir (Opsional)
  clientId?: string;         // Pautkan ID Klien (Primary Key mutlak)
  clientName?: string;       // Nama resmi klien (snapshot terdenormalisasi)
  customerName: string;      // Legacy field / display fallback
  materialId: string;        // Ref ke MaterialItem.id
  materialName: string;      // Denormalized untuk kecepatan query
  quarryId?: string;         // Ref ke MasterQuarry.id (Opsional)
  quarryName?: string;       // Nama Kuari Asal (snapshot terdenormalisasi)
  projectId?: string;        // Ref ke Project.id (Proyek Tujuan)
  projectName?: string;      // Nama Proyek Tujuan (snapshot terdenormalisasi)
  unit: UnitType;
  quantity: number;          // Jumlah DT atau Ton

  // Komponen Biaya & Pendapatan
  buyPricePerUnit: number;   // Harga beli per DT/Ton (Cash)
  sellPricePerUnit: number;  // Harga jual per DT/Ton (Tempo)
  operationalCost: number;   // Uang jalan, solar, pungli/portal per trip
  
  // Kalkulasi Otomatis
  totalBuyCost: number;      // quantity * buyPricePerUnit
  totalRevenue: number;      // quantity * sellPricePerUnit
  netProfit: number;         // totalRevenue - (totalBuyCost + operationalCost)

  status: PaymentStatus;     // Default: 'TEMPO'
  settledAt?: string;        // Tanggal saat piutang dilunasi pembeli
  notes?: string;
  createdBy: string;         // User email / UID
}

// 4. Koleksi: cash_ledger (Buku Kas & Riil Saldo)
export interface CashLedgerEntry {
  id: string;
  date: string;
  type: CashFlowType;
  amount: number;            // Nominal mutasi
  isCredit: boolean;         // true = Kas Masuk (+), false = Kas Keluar (-)
  runningBalance: number;    // Saldo berjalan (BISA BERNILAI MINUS)
  referenceId?: string;      // ID transaksi ritase terkait (jika ada)
  description: string;
  createdByName: string;
}

// 5. Koleksi: master_vehicles (Daftar Master Armada Truk & Plat Nomor)
export interface MasterVehicle {
  id: string;                // e.g. "B 9123 PDA" (Plat nomor yang dinormalisasi sebagai Primary Key)
  plateNumber: string;       // No. Plat Resmi
  driverName?: string;       // Nama Sopir Utama / Default
  truckType?: string;        // e.g. "Colt Diesel", "Tronton 10 Roda"
  notes?: string;
  source?: 'TRANSACTION' | 'MANUAL'; // Penanda apakah dari riwayat transaksi atau didaftarkan manual
  totalTrips?: number;       // Jumlah ritase yang pernah dijalani
  createdAt: string;
}

// 5. Koleksi: master_drivers (Daftar Sopir Armada)
export interface MasterDriver {
  id: string;
  name: string;
  phoneNumber?: string;
  defaultPlate?: string;     // Plat truk yang biasa dikemudikan
  notes?: string;
  createdAt: string;
}

// 6. Koleksi: master_quarries (Daftar Kuari Asal / Tambang Pasir & Batu)
export interface MasterQuarry {
  id: string;
  name: string;              // e.g. "Kuari Cilegon", "Tambang Rangkas"
  location?: string;         // Lokasi / Kota
  contactPerson?: string;    // PIC Lapangan
  phoneNumber?: string;
  notes?: string;
  createdAt: string;
}

// 7. Koleksi: investors (Daftar Investor & Permodalan)
export interface Investor {
  id: string;                // e.g. "inv-haji-sulaiman-..."
  name: string;              // Nama Investor / Perusahaan Pemodal
  phoneNumber?: string;      // No HP / WhatsApp
  bankAccount?: string;      // Informasi Bank & Rekening (e.g. "BCA 1234567890 a.n. Fatih")
  initialCapital?: number;   // Nominal Modal / Investasi Awal (Rp)
  notes?: string;
  createdAt: string;
}

// 8. Koleksi: projects (Master Proyek & Alokasi Investor)
export interface Project {
  id: string;                // e.g. "prj-situ-cikedal", "prj-menes", "prj-cipeucang"
  name: string;              // Nama Proyek (e.g. "Proyek Situ Cikedal")
  location: string;          // Lokasi Proyek
  investorId: string;        // Pautkan ke ID Investor terkait
  investorName: string;      // Snapshot nama investor
  clientId: string;          // Pautkan ke ID Klien terkait
  clientName: string;        // Snapshot nama klien
  initialDeposit: number;    // Modal awal disetor investor untuk proyek ini
  currentBalance: number;    // Saldo kas berjalan proyek ini (bisa dipotong/ditambah)
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  notes?: string;
  createdAt: string;
}

// 9. Koleksi: fund_transfers (Subsidi Silang Internal / Kas Talangan Antar-Proyek)
export interface FundTransferLog {
  id: string;
  date: string;              // YYYY-MM-DD
  fromProjectId: string;     // Proyek yang dipinjam dananya (sumber talangan)
  fromProjectName: string;
  toProjectId: string;       // Proyek yang ditalangi (penerima pinjaman)
  toProjectName: string;
  amount: number;            // Nominal talangan
  status: 'PINJAM' | 'LUNAS_KEMBALI';
  note: string;              // e.g. "Internal subsidi silang talangan solar/kuari"
  recordedBy: string;        // UID / Email Manajemen PT Patak
  settledAt?: string;        // Tanggal pelunasan kembali
  createdAt: string;
}

// 10. Koleksi: system_users (Manajemen Akun Sistem, Akses, dan Sesi)
export type UserRole = 'developer' | 'founder' | 'admin' | 'dispatcher' | 'investor' | 'viewer';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

export interface SystemUser {
  id: string;                  // Deterministic ID (e.g. email slug)
  uid?: string;                // Firebase Auth UID jika sudah terdaftar
  name: string;                // Nama lengkap pengguna
  email: string;               // Alamat email (@patak.id atau @patak.dev)
  role: UserRole;              // developer | founder | admin | dispatcher | investor | viewer
  status: UserStatus;          // ACTIVE | PENDING | INACTIVE
  investorId?: string;         // Khusus role 'investor': id investor yang terikat
  password?: string;           // Kredensial sementara untuk registrasi otomatis saat ACC
  createdAt: string;           // ISO Timestamp pendaftaran / pembuatan
  lastLoginAt?: string | null; // ISO Timestamp terakhir kali sesi login aktif
  approvedAt?: string | null;  // ISO Timestamp saat di-ACC oleh developer
  approvedBy?: string | null;  // Email developer yang menyetujui
  inactiveReason?: string | null; // Alasan penonaktifan (e.g. "Tidak ada aktivitas selama 30 hari")
}

