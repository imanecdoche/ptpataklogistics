export type UnitType = 'DT' | 'Ton'; // DT = Dump Truck standar 6 m³
export type PaymentStatus = 'TEMPO' | 'LUNAS';
export type CashFlowType =
  | 'MODAL_AWAL'
  | 'TOPUP_MODAL'
  | 'BELI_MATERIAL'
  | 'BIAYA_OPERASIONAL'
  | 'PELUNASAN_PIUTANG'
  | 'HUTANG_PIHAK_KETIGA'
  | 'CICILAN_HUTANG'
  | 'BAGI_HASIL_INVESTOR'
  | 'TRANSFER_INVESTOR'
  | 'PEMBAYARAN_PROYEK'
  | 'KASBON_TUKANG';

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
  suratJalan?: string;       // No. Surat Jalan fisik kuari / pengantaran (opsional)
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
  investorId?: string;       // Ref ke Investor.id (Investor Pendana Proyek)
  investorName?: string;     // Nama Investor Pendana (snapshot terdenormalisasi)
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

// Relasi Investor dengan Proyek & Alokasi Modal
export interface InvestorProjectLink {
  projectId: string;
  projectName: string;
  capitalAllocation: number;        // Alokasi modal investor khusus proyek ini (Rp)
  profitSharePercentage?: number;   // Persentase bagi hasil / profit share (%)
}

// 7. Koleksi: investors (Daftar Investor & Permodalan)
export interface Investor {
  id: string;                // e.g. "inv-haji-sulaiman-..."
  name: string;              // Nama Investor / Perusahaan Pemodal
  phoneNumber?: string;      // No HP / WhatsApp
  bankAccount?: string;      // Informasi Bank & Rekening (e.g. "BCA 1234567890 a.n. Fatih")
  initialCapital?: number;   // Nominal Modal / Investasi Awal (Rp)
  profitSharePercentage?: number; // Persentase bagi hasil default/global (%)
  linkedProjects?: InvestorProjectLink[]; // Daftar proyek yang didanai dan alokasi modalnya
  notes?: string;
  createdAt: string;
}

// Catatan Penyerahan Bagi Hasil / Dividen Investor
export interface InvestorPayout {
  id: string;
  investorId: string;
  investorName: string;
  projectId?: string;
  projectName?: string;
  date: string;
  amount: number;
  note: string;
  createdByName: string;
  createdAt: string;
}

// Kategori & Log Transfer / Realokasi Modal Antar-Investor
export type InvestorTransferCategory =
  | 'TALANGAN_OPERASIONAL'
  | 'PENGEMBALIAN_TALANGAN'
  | 'MIGRASI_MODAL'
  | 'BAGI_HASIL_PROYEK'
  | 'LAINNYA';

export interface InvestorTransferLog {
  id: string;
  date: string;
  fromInvestorId: string;
  fromInvestorName: string;
  fromProjectId?: string;
  fromProjectName?: string;
  toInvestorId: string;
  toInvestorName: string;
  toProjectId?: string;
  toProjectName?: string;
  amount: number;
  category: InvestorTransferCategory;
  status: 'LUNAS' | 'BELUM_LUNAS';
  note: string;
  createdByName: string;
  settledAt?: string;
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
  profitSharePercentage?: number; // Persentase bagi hasil investor untuk proyek ini (%)
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

// 11. Koleksi: labor_job_types & labor_payments (HOK Tukang Lapangan)
export type HOKCalculationType = 'PER_M2' | 'BORONGAN';

export interface LaborJobType {
  id: string;                  // e.g. "job-mck", "job-drainase", "job-paving-block"
  name: string;                // e.g. "MCK", "Drainase", "Paving Block"
  unit: 'm²' | 'Borongan';
  defaultRate: number;         // Tarif acuan rupiah per m2 atau estimasi borongan
  description?: string;
  createdAt: string;
}

export interface LaborPayment {
  id: string;
  paymentDate: string;         // YYYY-MM-DD
  projectId: string;
  projectName: string;
  workerName: string;          // Nama kepala tukang / mandor
  workerPhone?: string;
  jobTypeId: string;
  jobTypeName: string;
  calculationType: HOKCalculationType;
  areaSquareMeter?: number;    // Luas m2 jika perhitungan per meter persegi
  ratePerUnit: number;         // Tarif per m2 atau nominal borongan
  totalAmount: number;         // Total pembayaran rupiah
  notes?: string;              // Titik lokasi kerja / keterangan progres
  status: 'LUNAS' | 'PANJAR';  // Status pelunasan upah
  referenceId?: string;
  createdByName: string;
  createdAt: string;
}

// 12. Re-export Tipe Master Material & Matriks Rute Operasional 3 Titik
export * from './materialMaster';


// 13. Koleksi: ticket_approval_requests (Sistem Pengajuan Koreksi & Hapus Tiket Ritase)
export type ApprovalRequestType = 'EDIT' | 'DELETE';
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TicketApprovalRequest {
  id: string;
  ticketId: string;
  ticketNumber: string;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  requestedBy: string;             // Email dispatcher
  requestedByName: string;         // Nama dispatcher
  requestedAt: string;             // ISO Timestamp
  reason: string;                  // Alasan wajib pengajuan
  currentData: Partial<DispatchTransaction>;
  proposedData?: Partial<DispatchTransaction>; // Khusus tipe EDIT
  reviewedBy?: string | null;      // Email atasan yang me-review
  reviewedByName?: string | null;  // Nama atasan yang me-review
  reviewedAt?: string | null;      // ISO Timestamp review
  rejectionReason?: string | null; // Catatan penolakan jika ditolak
}


// 14. Koleksi: project_sub_jobs, worker_kasbon_logs & client_project_payments
export type ProjectSubJobUnit = 'PAKET' | 'M2' | 'M3';
export type ProjectSubJobType = 'MCK' | 'PAVING_BLOCK' | 'DRAINASE' | 'LAINNYA';
export type ProjectSubJobStatus = 'BERJALAN' | 'SELESAI' | 'HOLD';

export interface ProjectSubJob {
  id: string;
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  jobType: ProjectSubJobType;
  jobName: string;
  unit: ProjectSubJobUnit;
  volume: number;
  clientRatePerUnit: number;
  contractAmountClient: number; // volume * clientRatePerUnit
  workerRatePerUnit: number;
  contractAmountWorker: number; // volume * workerRatePerUnit
  workerLeaderName: string;
  workerLeaderPhone?: string;
  status: ProjectSubJobStatus;
  totalKasbonPaid: number;      // Akumulasi kasbon yang sudah ditarik
  remainingWorkerPay: number;   // Sisa hak upah = contractAmountWorker - totalKasbonPaid
  companyMargin: number;        // contractAmountClient - contractAmountWorker
  notes?: string;
  createdAt: string;
}

export interface WorkerKasbonLog {
  id: string;
  subJobId: string;
  subJobName: string;
  projectId: string;
  projectName: string;
  workerLeaderName: string;
  date: string;                 // YYYY-MM-DD
  amount: number;               // Nominal kasbon
  note?: string;                // Keterangan kasbon
  recordedBy: string;
  createdAt: string;
}

export interface ClientProjectPayment {
  id: string;
  paymentDate: string;          // YYYY-MM-DD
  clientId?: string;
  clientName: string;           // e.g. "Kak Angga"
  projectId?: string;
  projectName?: string;
  amount: number;               // e.g. Rp 80.000.000
  paymentMethod?: string;       // Transfer Bank / Tunai
  referenceNumber?: string;
  note?: string;
  recordedBy: string;
  createdAt: string;
}
