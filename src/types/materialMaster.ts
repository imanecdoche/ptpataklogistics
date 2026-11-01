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
  id: string;               // e.g. "rate_qry-batu-mandiri_mat-batu-belah"
  materialId: string;
  materialName: string;
  quarryId: string;
  quarryName: string;       // Nama PT Tambang / Kuari
  qualityGrade: string;     // e.g. "Grade A — Hitam Padat Keras", "Grade B — Batu Campur Kali"
  unit: UnitType;
  buyPriceCash: number;     // Harga tebus tunai di mulut tambang (Rp)
  sellPrice: number;        // Harga jual standar ke proyek/klien (Rp)
  notes?: string;           // Catatan timbangan / ayakan
  updatedAt: string;
}

// 3. Matriks Biaya Jalan Rute (Titik Muat Kuari -> Titik Bongkar Proyek)
export interface RouteOperatingTariff {
  id: string;               // e.g. "rte_qry-batu-mandiri_prj-situ-cikedal"
  quarryId: string;         // Titik Muat
  quarryName: string;
  projectId: string;        // Titik Bongkar (Situ Cikedal)
  projectName: string;
  distanceKm: number;       // Estimasi jarak tempuh
  standardTripDurationHours?: number;
  standardOperationalCost: number; // Acuan uang solar + saku supir + retribusi/portal jalan (Rp)
  updatedAt: string;
}

/**
 * Generator ID deterministik untuk relasi tarif kuari (mencegah duplikasi data)
 */
export function getQuarryRateId(quarryId: string, materialId: string): string {
  const cleanQ = (quarryId || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cleanM = (materialId || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `rate_${cleanQ}_${cleanM}`;
}

/**
 * Generator ID deterministik untuk relasi tarif rute kuari -> proyek
 */
export function getRouteTariffId(quarryId: string, projectId: string): string {
  const cleanQ = (quarryId || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const cleanP = (projectId || 'unknown').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return `rte_${cleanQ}_${cleanP}`;
}

/**
 * Generator ID deterministik untuk komoditas material baku
 */
export function getMaterialId(name: string): string {
  const slug = (name || 'material')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `mat-${slug}`;
}

