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
import { QuarryMaterialRate, RouteOperatingTariff } from '@/types/materialMaster';
import { MaterialItem, UnitType } from '@/types/database';

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
 * Simpan atau perbarui data Harga & Mutu Kuari
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
  notes?: string;
}): Promise<string> {
  const rateId = payload.id || `RATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const docRef = doc(db, QUARRY_RATES_COLLECTION, rateId);

  const data: Omit<QuarryMaterialRate, 'id'> = {
    materialId: payload.materialId,
    materialName: payload.materialName,
    quarryId: payload.quarryId,
    quarryName: payload.quarryName,
    qualityGrade: payload.qualityGrade,
    unit: payload.unit,
    buyPriceCash: payload.buyPriceCash,
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
 * Simpan atau perbarui data Biaya Jalan Rute
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
  const routeId = payload.id || `RTE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const docRef = doc(db, ROUTE_TARIFFS_COLLECTION, routeId);

  const data: Omit<RouteOperatingTariff, 'id'> = {
    quarryId: payload.quarryId,
    quarryName: payload.quarryName,
    projectId: payload.projectId,
    projectName: payload.projectName,
    distanceKm: payload.distanceKm,
    standardOperationalCost: payload.standardOperationalCost,
    standardTripDurationHours: payload.standardTripDurationHours || 1,
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
 * Simpan atau perbarui data Komoditas Material
 */
export async function saveCommodity(payload: {
  id?: string;
  name: string;
  unit: UnitType;
  defaultBuyPrice: number;
  defaultSellPrice: number;
}): Promise<string> {
  const matId = payload.id || `MAT-${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
  const docRef = doc(db, MATERIALS_COLLECTION, matId);

  const data = {
    name: payload.name,
    unit: payload.unit,
    defaultBuyPrice: payload.defaultBuyPrice,
    defaultSellPrice: payload.defaultSellPrice,
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
 * Inisialisasi seeding data acuan awal (jika database quarry_material_rates atau route_tariffs kosong)
 */
export async function seedInitialMaterialData(): Promise<void> {
  try {
    const ratesSnap = await getDocs(collection(db, QUARRY_RATES_COLLECTION));
    if (ratesSnap.empty) {
      const defaultRates: Array<Omit<QuarryMaterialRate, 'id'>> = [
        {
          materialId: 'mat-batu-belah',
          materialName: 'Batu Belah (Pondasi)',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Grade A — Hitam Padat Keras',
          unit: 'DT',
          buyPriceCash: 600000,
          notes: 'Mutu standar pondasi gedung & jembatan',
          updatedAt: new Date().toISOString()
        },
        {
          materialId: 'mat-batu-belah',
          materialName: 'Batu Belah (Pondasi)',
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          qualityGrade: 'Grade B — Batu Campur Kali',
          unit: 'DT',
          buyPriceCash: 520000,
          notes: 'Untuk urukan dasar dan talud ringan',
          updatedAt: new Date().toISOString()
        },
        {
          materialId: 'mat-pasir-extra',
          materialName: 'Pasir Extra Beton',
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          qualityGrade: 'Ayakan Halus Bebas Lumpur',
          unit: 'DT',
          buyPriceCash: 750000,
          notes: 'Kadar lumpur di bawah 3%',
          updatedAt: new Date().toISOString()
        },
        {
          materialId: 'mat-makadam',
          materialName: 'Makadam Base Course',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Ukuran 5/7 Standar Jalan',
          unit: 'DT',
          buyPriceCash: 540000,
          notes: 'Pengerasan badan jalan',
          updatedAt: new Date().toISOString()
        },
        {
          materialId: 'mat-abu-batu',
          materialName: 'Abu Batu Screen',
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          qualityGrade: 'Screening Halus Kering',
          unit: 'DT',
          buyPriceCash: 480000,
          notes: 'Lapisan perata paving & aspal',
          updatedAt: new Date().toISOString()
        }
      ];

      for (const rate of defaultRates) {
        const id = `RATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await setDoc(doc(db, QUARRY_RATES_COLLECTION, id), rate);
      }
    }

    const routesSnap = await getDocs(collection(db, ROUTE_TARIFFS_COLLECTION));
    if (routesSnap.empty) {
      const defaultRoutes: Array<Omit<RouteOperatingTariff, 'id'>> = [
        {
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          projectId: 'prj-situ-cikedal',
          projectName: 'Proyek Situ Cikedal',
          distanceKm: 18,
          standardOperationalCost: 150000,
          standardTripDurationHours: 1,
          updatedAt: new Date().toISOString()
        },
        {
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          projectId: 'prj-menes',
          projectName: 'Proyek Menes',
          distanceKm: 25,
          standardOperationalCost: 190000,
          standardTripDurationHours: 1.5,
          updatedAt: new Date().toISOString()
        },
        {
          quarryId: 'qry-batu-mandiri',
          quarryName: 'PT Tambang Batu Mandiri',
          projectId: 'prj-cipeucang',
          projectName: 'Proyek Cipeucang',
          distanceKm: 32,
          standardOperationalCost: 230000,
          standardTripDurationHours: 2,
          updatedAt: new Date().toISOString()
        },
        {
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          projectId: 'prj-situ-cikedal',
          projectName: 'Proyek Situ Cikedal',
          distanceKm: 38,
          standardOperationalCost: 260000,
          standardTripDurationHours: 2.5,
          updatedAt: new Date().toISOString()
        },
        {
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          projectId: 'prj-menes',
          projectName: 'Proyek Menes',
          distanceKm: 30,
          standardOperationalCost: 220000,
          standardTripDurationHours: 2,
          updatedAt: new Date().toISOString()
        },
        {
          quarryId: 'qry-pasir-sakti',
          quarryName: 'PT Kuari Pasir Sakti',
          projectId: 'prj-cipeucang',
          projectName: 'Proyek Cipeucang',
          distanceKm: 45,
          standardOperationalCost: 290000,
          standardTripDurationHours: 3,
          updatedAt: new Date().toISOString()
        }
      ];

      for (const route of defaultRoutes) {
        const id = `RTE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await setDoc(doc(db, ROUTE_TARIFFS_COLLECTION, id), route);
      }
    }
  } catch (err) {
    console.warn('Gagal men-seed data acuan material awal:', err);
  }
}
