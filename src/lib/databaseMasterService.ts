import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MasterVehicle, MasterDriver, MasterQuarry, DispatchTransaction } from '@/types/database';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityName, formatPersonName } from '@/lib/nameUtils';

/**
 * 1. ARMADA & PLAT NOMOR (master_vehicles)
 */

export function subscribeMasterVehicles(
  callback: (vehicles: MasterVehicle[]) => void
): () => void {
  const colRef = collection(db, 'master_vehicles');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const list: MasterVehicle[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MasterVehicle, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe master_vehicles:', err);
    }
  );
}

export async function saveMasterVehicle(
  plateNumber: string,
  driverName?: string,
  truckType?: string,
  notes?: string
): Promise<void> {
  const cleanPlate = plateNumber.trim().toUpperCase();
  if (!cleanPlate) throw new Error('Plat nomor wajib diisi');

  // Gunakan plat nomor bersih sebagai Document ID agar tidak terjadi duplikasi
  const docId = cleanPlate.replace(/\s+/g, '-');
  const docRef = doc(db, 'master_vehicles', docId);

  await setDoc(
    docRef,
    {
      plateNumber: cleanPlate,
      driverName: driverName ? formatPersonName(driverName) : '',
      truckType: truckType?.trim() || 'Dump Truck',
      notes: notes?.trim() || '',
      source: 'MANUAL',
      createdAt: new Date().toISOString()
    },
    { merge: true }
  );
}

export async function deleteMasterVehicle(id: string): Promise<void> {
  const docRef = doc(db, 'master_vehicles', id);
  await deleteDoc(docRef);
}

/**
 * Menggabungkan plat nomor dari master_vehicles terdaftar dan transaksi ritase yang pernah ada
 */
export function combineVehicleData(
  transactions: DispatchTransaction[],
  registeredVehicles: MasterVehicle[]
): MasterVehicle[] {
  const map = new Map<string, MasterVehicle>();

  // 1. Masukkan master vehicles yang terdaftar manual
  for (const v of registeredVehicles) {
    const norm = v.plateNumber.trim().toUpperCase();
    map.set(norm, { ...v, totalTrips: 0 });
  }

  // 2. Agregasi dari riwayat transaksi
  for (const tx of transactions) {
    const rawPlate = tx.truckPlate?.trim().toUpperCase();
    if (!rawPlate) continue;

    const existing = map.get(rawPlate);
    if (existing) {
      existing.totalTrips = (existing.totalTrips || 0) + 1;
      if (!existing.driverName && tx.driverName) {
        existing.driverName = tx.driverName;
      }
    } else {
      map.set(rawPlate, {
        id: rawPlate.replace(/\s+/g, '-'),
        plateNumber: rawPlate,
        driverName: tx.driverName?.trim() || '',
        truckType: 'Dump Truck',
        source: 'TRANSACTION',
        totalTrips: 1,
        createdAt: tx.createdAt || tx.date || new Date().toISOString()
      });
    }
  }

  const result = Array.from(map.values());
  // Urutkan berdasarkan total trip terbanyak, lalu nama plat
  result.sort((a, b) => (b.totalTrips || 0) - (a.totalTrips || 0));
  return result;
}

/**
 * 2. MASTER SUPIR (master_drivers)
 */

export function subscribeMasterDrivers(
  callback: (drivers: MasterDriver[]) => void
): () => void {
  const colRef = collection(db, 'master_drivers');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const list: MasterDriver[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MasterDriver, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe master_drivers:', err);
    }
  );
}

export async function saveMasterDriver(
  name: string,
  phoneNumber?: string,
  defaultPlate?: string,
  notes?: string,
  id?: string
): Promise<void> {
  const cleanName = formatPersonName(name);
  if (!cleanName) throw new Error('Nama supir wajib diisi');

  const docId = id || `drv-${Date.now()}`;
  const docRef = doc(db, 'master_drivers', docId);

  await setDoc(
    docRef,
    {
      name: cleanName,
      phoneNumber: phoneNumber ? formatPhoneNumber(phoneNumber) : '',
      defaultPlate: defaultPlate?.trim().toUpperCase() || '',
      notes: notes?.trim() || '',
      createdAt: new Date().toISOString()
    },
    { merge: true }
  );
}

export async function deleteMasterDriver(id: string): Promise<void> {
  const docRef = doc(db, 'master_drivers', id);
  await deleteDoc(docRef);
}

/**
 * 3. MASTER KUARI (master_quarries)
 */

export function subscribeMasterQuarries(
  callback: (quarries: MasterQuarry[]) => void
): () => void {
  const colRef = collection(db, 'master_quarries');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const list: MasterQuarry[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MasterQuarry, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe master_quarries:', err);
    }
  );
}

export async function saveMasterQuarry(
  name: string,
  location?: string,
  contactPerson?: string,
  phoneNumber?: string,
  notes?: string,
  id?: string
): Promise<string> {
  const cleanName = formatEntityName(name);
  if (!cleanName) throw new Error('Nama kuari wajib diisi');

  const docId = id || `qry-${Date.now()}`;
  const docRef = doc(db, 'master_quarries', docId);

  await setDoc(
    docRef,
    {
      name: cleanName,
      location: location?.trim() || '',
      contactPerson: contactPerson ? formatPersonName(contactPerson) : '',
      phoneNumber: phoneNumber ? formatPhoneNumber(phoneNumber) : '',
      notes: notes?.trim() || '',
      createdAt: new Date().toISOString()
    },
    { merge: true }
  );

  return docId;
}

export async function deleteMasterQuarry(id: string): Promise<void> {
  const docRef = doc(db, 'master_quarries', id);
  await deleteDoc(docRef);
}
