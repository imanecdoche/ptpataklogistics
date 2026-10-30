import { UnitType } from './database';

export type MaterialCategory = 'BATU' | 'PASIR' | 'BASE_COURSE' | 'TANAH';

// 1. Entitas Dasar Komoditas Material
export interface MaterialMaster {
  id: string;               // e.g. "MAT-BATU-BELAH"
  code: string;             // e.g. "BB-01"
  name: string;             // "Batu Belah", "Pasir Extra", "Makadam"
  defaultUnit: UnitType;    // 'DT' (6 m³) atau 'Ton'
  category: MaterialCategory;
  defaultBuyPrice?: number; // Acuan harga beli dasar
  defaultSellPrice?: number;// Acuan harga jual dasar
  isActive: boolean;
  createdAt: string;
}

// 2. Harga Tebus & Kualitas per Kuari (Titik Muat)
export interface QuarryMaterialRate {
  id: string;               // e.g. "RATE-QRY1-MAT1"
  materialId: string;
  materialName: string;
  quarryId: string;
  quarryName: string;       // Nama PT Tambang / Kuari
  qualityGrade: string;     // e.g. "Grade A — Hitam Padat Keras", "Grade B — Batu Campur Kali"
  unit: UnitType;
  buyPriceCash: number;     // Harga tebus tunai di mulut tambang (Rp)
  notes?: string;           // Catatan timbangan / ayakan
  updatedAt: string;
}

// 3. Matriks Biaya Jalan Rute (Titik Muat Kuari -> Titik Bongkar Proyek)
export interface RouteOperatingTariff {
  id: string;               // e.g. "RTE-QRY1-PRJ1"
  quarryId: string;         // Titik Muat
  quarryName: string;
  projectId: string;        // Titik Bongkar (Situ Cikedal / Menes / Cipeucang)
  projectName: string;
  distanceKm: number;       // Estimasi jarak tempuh
  standardTripDurationHours?: number;
  standardOperationalCost: number; // Acuan uang solar + saku supir + retribusi/portal jalan (Rp)
  updatedAt: string;
}
