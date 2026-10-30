import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LaborJobType, LaborPayment, HOKCalculationType } from '@/types/database';
import { recordCashLedgerEntry } from '@/lib/cashLedgerService';

const JOB_TYPES_COLLECTION = 'labor_job_types';
const LABOR_PAYMENTS_COLLECTION = 'labor_payments';

export const DEFAULT_JOB_TYPES: (Omit<LaborJobType, 'createdAt'>)[] = [
  {
    id: 'job-mck',
    name: 'MCK (Mandi Cuci Kakus)',
    unit: 'Borongan',
    defaultRate: 3500000,
    description: 'Pembangunan atau renovasi fasilitas sanitasi MCK warga'
  },
  {
    id: 'job-drainase',
    name: 'Drainase (Saluran Air)',
    unit: 'm²',
    defaultRate: 85000,
    description: 'Pemasangan batu belah dan plesteran saluran drainase air'
  },
  {
    id: 'job-paving-block',
    name: 'Paving Block',
    unit: 'm²',
    defaultRate: 35000,
    description: 'Pemasangan dan perataan jalan conblock/paving block'
  }
];

/**
 * Mengambil daftar master tipe pekerjaan tukang
 */
export async function getLaborJobTypes(): Promise<LaborJobType[]> {
  const colRef = collection(db, JOB_TYPES_COLLECTION);
  const snap = await getDocs(colRef);

  if (snap.empty) {
    const seeded: LaborJobType[] = [];
    for (const item of DEFAULT_JOB_TYPES) {
      const now = new Date().toISOString();
      const docRef = doc(colRef, item.id);
      const data: LaborJobType = { ...item, createdAt: now };
      await setDoc(docRef, data, { merge: true });
      seeded.push(data);
    }
    return seeded;
  }

  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<LaborJobType, 'id'>)
  }));
}

/**
 * Real-time listener daftar tipe pekerjaan tukang
 */
export function subscribeLaborJobTypes(
  callback: (types: LaborJobType[]) => void
): () => void {
  const colRef = collection(db, JOB_TYPES_COLLECTION);
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    async snap => {
      if (snap.empty) {
        const seeded = await getLaborJobTypes();
        callback(seeded);
      } else {
        const list: LaborJobType[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<LaborJobType, 'id'>)
        }));
        callback(list);
      }
    },
    err => {
      console.warn('Gagal membaca data labor_job_types:', err);
    }
  );
}

/**
 * Menyimpan / memperbarui master tipe pekerjaan tukang
 */
export async function saveLaborJobType(
  payload: {
    name: string;
    unit: 'm²' | 'Borongan';
    defaultRate: number;
    description?: string;
  },
  existingId?: string
): Promise<string> {
  const colRef = collection(db, JOB_TYPES_COLLECTION);
  const now = new Date().toISOString();

  if (existingId) {
    await setDoc(
      doc(colRef, existingId),
      {
        name: payload.name.trim(),
        unit: payload.unit,
        defaultRate: Number(payload.defaultRate) || 0,
        description: payload.description?.trim() || ''
      },
      { merge: true }
    );
    return existingId;
  }

  const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  const docId = `job-${slug}-${Date.now().toString().slice(-4)}`;
  const data: LaborJobType = {
    id: docId,
    name: payload.name.trim(),
    unit: payload.unit,
    defaultRate: Number(payload.defaultRate) || 0,
    description: payload.description?.trim() || '',
    createdAt: now
  };

  await setDoc(doc(colRef, docId), data);
  return docId;
}

/**
 * Real-time listener daftar pembayaran upah HOK tukang lapangan
 */
export function subscribeLaborPayments(
  callback: (payments: LaborPayment[]) => void
): () => void {
  const colRef = collection(db, LABOR_PAYMENTS_COLLECTION);
  const q = query(colRef, orderBy('paymentDate', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const list: LaborPayment[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<LaborPayment, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data labor_payments:', err);
    }
  );
}

/**
 * Mencatat pembayaran upah HOK tukang lapangan dan membukukan mutasi kas keluar secara otomatis
 */
export async function recordLaborPayment(
  payload: {
    paymentDate: string;
    projectId: string;
    projectName: string;
    workerName: string;
    workerPhone?: string;
    jobTypeId: string;
    jobTypeName: string;
    calculationType: HOKCalculationType;
    areaSquareMeter?: number;
    ratePerUnit: number;
    totalAmount: number;
    notes?: string;
    status: 'LUNAS' | 'PANJAR';
    referenceId?: string;
  },
  userEmail: string
): Promise<string> {
  const nowIso = new Date().toISOString();
  const paymentDate = payload.paymentDate || nowIso.slice(0, 10);
  const colRef = collection(db, LABOR_PAYMENTS_COLLECTION);

  const paymentData: Omit<LaborPayment, 'id'> = {
    paymentDate,
    projectId: payload.projectId,
    projectName: payload.projectName,
    workerName: payload.workerName.trim(),
    workerPhone: payload.workerPhone?.trim() || '',
    jobTypeId: payload.jobTypeId,
    jobTypeName: payload.jobTypeName,
    calculationType: payload.calculationType,
    areaSquareMeter: payload.calculationType === 'PER_M2' ? (Number(payload.areaSquareMeter) || 0) : undefined,
    ratePerUnit: Number(payload.ratePerUnit) || 0,
    totalAmount: Number(payload.totalAmount) || 0,
    notes: payload.notes?.trim() || '',
    status: payload.status,
    referenceId: payload.referenceId?.trim() || '',
    createdByName: userEmail,
    createdAt: nowIso
  };

  const docRef = await addDoc(colRef, paymentData);

  // Otomatis catat mutasi kas keluar di Buku Kas Induk (cash_ledger)
  if (paymentData.totalAmount > 0) {
    const calcDetail = payload.calculationType === 'PER_M2'
      ? `${payload.areaSquareMeter || 0} m² @ Rp ${payload.ratePerUnit.toLocaleString('id-ID')}`
      : 'Borongan';

    await recordCashLedgerEntry({
      date: `${paymentDate}T12:00:00.000Z`,
      type: 'BIAYA_OPERASIONAL',
      amount: paymentData.totalAmount,
      isCredit: false,
      referenceId: payload.referenceId || docRef.id,
      description: `HOK Tukang: ${payload.workerName} (${payload.jobTypeName} - ${calcDetail}) - ${payload.projectName}`,
      createdByName: userEmail
    });
  }

  return docRef.id;
}
