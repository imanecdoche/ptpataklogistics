import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  QuarryMaterialRate,
  RouteOperatingTariff,
  getQuarryRateId,
  getRouteTariffId,
  getMaterialId
} from '@/types/materialMaster';
import { MaterialItem, UnitType } from '@/types/database';
import { formatEntityName } from '@/lib/nameUtils';

const QUARRY_RATES_COLLECTION = 'quarry_material_rates';
const ROUTE_TARIFFS_COLLECTION = 'route_tariffs';
const MATERIALS_COLLECTION = 'materials';

/**
 * Real-time listener untuk Katalog Tebus Kuari (Harga & Mutu Tambang)
 */
export function subscribeQuarryRates(callback: (rates: QuarryMaterialRate[]) => void): () => void {
  const colRef = collection(db, QUARRY_RATES_COLLECTION);
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: QuarryMaterialRate[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<QuarryMaterialRate, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data quarry_material_rates:', err);
    }
  );
}

/**
 * Real-time listener untuk Matriks Biaya Jalan Rute (Titik Muat Kuari -> Titik Bongkar Proyek)
 */
export function subscribeRouteTariffs(callback: (routes: RouteOperatingTariff[]) => void): () => void {
  const colRef = collection(db, ROUTE_TARIFFS_COLLECTION);
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: RouteOperatingTariff[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<RouteOperatingTariff, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data route_tariffs:', err);
    }
  );
}

/**
 * Real-time listener untuk Katalog Komoditas Material
 */
export function subscribeCommodities(callback: (commodities: MaterialItem[]) => void): () => void {
  const colRef = collection(db, MATERIALS_COLLECTION);
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: MaterialItem[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MaterialItem, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data materials:', err);
    }
  );
}

/**
 * Simpan atau perbarui data Harga & Mutu Kuari (Deterministik ID)
 */
export async function saveQuarryRate(payload: {
  id?: string;
  materialId: string;
  materialName: string;
  quarryId: string;
  quarryName: string;
  qualityGrade: string;
  unit: UnitType;
  buyPriceCash: number;
  sellPrice: number;
  notes?: string;
}): Promise<string> {
  const rateId = payload.id || getQuarryRateId(payload.quarryId, payload.materialId);
  const docRef = doc(db, QUARRY_RATES_COLLECTION, rateId);

  const data: Omit<QuarryMaterialRate, 'id'> = {
    materialId: payload.materialId,
    materialName: formatEntityName(payload.materialName),
    quarryId: payload.quarryId,
    quarryName: formatEntityName(payload.quarryName),
    qualityGrade: payload.qualityGrade || 'Standar',
    unit: payload.unit,
    buyPriceCash: Number(payload.buyPriceCash) || 0,
    sellPrice: Number(payload.sellPrice) || 0,
    notes: payload.notes || '',
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, data, { merge: true });
  return rateId;
}

/**
 * Hapus data Harga & Mutu Kuari
 */
export async function deleteQuarryRate(id: string): Promise<void> {
  const docRef = doc(db, QUARRY_RATES_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Simpan atau perbarui data Biaya Jalan Rute (Deterministik ID)
 */
export async function saveRouteTariff(payload: {
  id?: string;
  quarryId: string;
  quarryName: string;
  projectId: string;
  projectName: string;
  distanceKm: number;
  standardOperationalCost: number;
  standardTripDurationHours?: number;
}): Promise<string> {
  const routeId = payload.id || getRouteTariffId(payload.quarryId, payload.projectId);
  const docRef = doc(db, ROUTE_TARIFFS_COLLECTION, routeId);

  const data: Omit<RouteOperatingTariff, 'id'> = {
    quarryId: payload.quarryId,
    quarryName: formatEntityName(payload.quarryName),
    projectId: payload.projectId,
    projectName: formatEntityName(payload.projectName),
    distanceKm: Number(payload.distanceKm) || 0,
    standardOperationalCost: Number(payload.standardOperationalCost) || 0,
    standardTripDurationHours: Number(payload.standardTripDurationHours) || 1,
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, data, { merge: true });
  return routeId;
}

/**
 * Hapus data Biaya Jalan Rute
 */
export async function deleteRouteTariff(id: string): Promise<void> {
  const docRef = doc(db, ROUTE_TARIFFS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Simpan atau perbarui data Komoditas Material Baku (Deterministik ID)
 */
export async function saveCommodity(payload: {
  id?: string;
  name: string;
  unit: UnitType;
  defaultBuyPrice: number;
  defaultSellPrice: number;
}): Promise<string> {
  const cleanName = formatEntityName(payload.name);
  const matId = payload.id || getMaterialId(cleanName);
  const docRef = doc(db, MATERIALS_COLLECTION, matId);

  const data = {
    name: cleanName,
    unit: payload.unit,
    defaultBuyPrice: Number(payload.defaultBuyPrice) || 0,
    defaultSellPrice: Number(payload.defaultSellPrice) || 0,
    createdAt: new Date().toISOString()
  };

  await setDoc(docRef, data, { merge: true });
  return matId;
}

/**
 * Hapus data Komoditas Material
 */
export async function deleteCommodity(id: string): Promise<void> {
  const docRef = doc(db, MATERIALS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * 4 Komoditas Baku Utama PT Patak Abadi Jaya
 */
export const STANDARD_COMMODITIES = [
  {
    id: 'mat-batu-belah',
    name: 'Batu Belah (Pondasi)',
    unit: 'DT' as UnitType,
    defaultBuyPrice: 600000,
    defaultSellPrice: 850000
  },
  {
    id: 'mat-pasir-extra',
    name: 'Pasir Extra Beton',
    unit: 'DT' as UnitType,
    defaultBuyPrice: 750000,
    defaultSellPrice: 1050000
  },
  {
    id: 'mat-abu-batu',
    name: 'Abu Batu Screen',
    unit: 'DT' as UnitType,
    defaultBuyPrice: 480000,
    defaultSellPrice: 720000
  },
  {
    id: 'mat-makadam',
    name: 'Makadam Base Course',
    unit: 'DT' as UnitType,
    defaultBuyPrice: 540000,
    defaultSellPrice: 800000
  }
];

/**
 * Inisialisasi seeding data acuan awal (jika database materials, quarry_material_rates, atau route_tariffs kosong)
 */
export async function seedInitialMaterialData(): Promise<void> {
  try {
    // 1. Seed 4 Komoditas Standar jika belum ada
    const matSnap = await getDocs(collection(db, MATERIALS_COLLECTION));
    if (matSnap.empty) {
      for (const item of STANDARD_COMMODITIES) {
        await setDoc(doc(db, MATERIALS_COLLECTION, item.id), {
          name: item.name,
          unit: item.unit,
          defaultBuyPrice: item.defaultBuyPrice,
          defaultSellPrice: item.defaultSellPrice,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Seed Tarif Kuari Standar jika belum ada
    const ratesSnap = await getDocs(collection(db, QUARRY_RATES_COLLECTION));
    if (ratesSnap.empty) {
      const defaultRates = [
        {
          id: 'rate_qry-batu-mandiri_mat-batu-belah',
          materialId: 'mat-batu-belah',
          materialName: 'Batu Belah (Pondasi)',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Grade A — Hitam Padat Keras',
          unit: 'DT' as UnitType,
          buyPriceCash: 600000,
          sellPrice: 850000,
          notes: 'Mutu standar pondasi gedung & bendungan',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rate_qry-pasir-sakti_mat-batu-belah',
          materialId: 'mat-batu-belah',
          materialName: 'Batu Belah (Pondasi)',
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          qualityGrade: 'Grade B — Batu Campur Kali',
          unit: 'DT' as UnitType,
          buyPriceCash: 520000,
          sellPrice: 780000,
          notes: 'Untuk urukan dasar dan talud ringan',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rate_qry-pasir-sakti_mat-pasir-extra',
          materialId: 'mat-pasir-extra',
          materialName: 'Pasir Extra Beton',
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          qualityGrade: 'Ayakan Halus Bebas Lumpur',
          unit: 'DT' as UnitType,
          buyPriceCash: 750000,
          sellPrice: 1050000,
          notes: 'Kadar lumpur di bawah 3%',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rate_qry-batu-mandiri_mat-makadam',
          materialId: 'mat-makadam',
          materialName: 'Makadam Base Course',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Ukuran 5/7 Standar Jalan',
          unit: 'DT' as UnitType,
          buyPriceCash: 540000,
          sellPrice: 800000,
          notes: 'Pengerasan badan jalan dan sub-base',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rate_qry-batu-mandiri_mat-abu-batu',
          materialId: 'mat-abu-batu',
          materialName: 'Abu Batu Screen',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Screening Halus Kering',
          unit: 'DT' as UnitType,
          buyPriceCash: 480000,
          sellPrice: 720000,
          notes: 'Lapisan perata paving & aspal',
          updatedAt: new Date().toISOString()
        }
      ];

      for (const rate of defaultRates) {
        await setDoc(doc(db, QUARRY_RATES_COLLECTION, rate.id), rate);
      }
    }

    // 3. Seed Tarif Rute Standar ke 2 Proyek Aktif jika belum ada
    const routesSnap = await getDocs(collection(db, ROUTE_TARIFFS_COLLECTION));
    if (routesSnap.empty) {
      const defaultRoutes = [
        {
          id: 'rte_qry-batu-mandiri_prj-situ-cikedal',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          projectId: 'prj-situ-cikedal',
          projectName: 'Proyek Konservasi Situ Cikedal',
          distanceKm: 18,
          standardOperationalCost: 150000,
          standardTripDurationHours: 1,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rte_qry-pasir-sakti_prj-situ-cikedal',
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          projectId: 'prj-situ-cikedal',
          projectName: 'Proyek Konservasi Situ Cikedal',
          distanceKm: 38,
          standardOperationalCost: 260000,
          standardTripDurationHours: 2.5,
          updatedAt: new Date().toISOString()
        }
      ];

      for (const route of defaultRoutes) {
        await setDoc(doc(db, ROUTE_TARIFFS_COLLECTION, route.id), route);
      }
    }
  } catch (err) {
    console.warn('Gagal men-seed data acuan material awal:', err);
  }
}

