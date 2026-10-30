import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Investor } from '@/types/database';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityName } from '@/lib/nameUtils';

const INVESTORS_COLLECTION = 'investors';

/**
 * Real-time listener seluruh data investor dari Firestore
 */
export function subscribeInvestors(callback: (investors: Investor[]) => void): () => void {
  const colRef = collection(db, INVESTORS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: Investor[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Investor, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data investors:', err);
    }
  );
}

/**
 * Menyimpan investor baru atau memperbarui data investor yang sudah ada
 */
export async function saveInvestor(
  payload: {
    name: string;
    phoneNumber?: string;
    bankAccount?: string;
    initialCapital?: number;
    notes?: string;
  },
  existingId?: string
): Promise<string> {
  const cleanName = formatEntityName(payload.name);
  if (!cleanName) {
    throw new Error('Nama investor wajib diisi.');
  }

  const colRef = collection(db, INVESTORS_COLLECTION);

  if (existingId) {
    const docRef = doc(colRef, existingId);
    await updateDoc(docRef, {
      name: cleanName,
      phoneNumber: payload.phoneNumber ? formatPhoneNumber(payload.phoneNumber) : '',
      bankAccount: payload.bankAccount?.trim() || '',
      initialCapital: Number(payload.initialCapital) || 0,
      notes: payload.notes?.trim() || ''
    });
    return existingId;
  }

  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  const docId = `inv-${slug}-${Date.now().toString().slice(-4)}`;
  const newInvestor: Investor = {
    id: docId,
    name: cleanName,
    phoneNumber: payload.phoneNumber ? formatPhoneNumber(payload.phoneNumber) : '',
    bankAccount: payload.bankAccount?.trim() || '',
    initialCapital: Number(payload.initialCapital) || 0,
    notes: payload.notes?.trim() || '',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(colRef, docId), newInvestor);
  return docId;
}

/**
 * Memperbarui field parsial investor
 */
export async function updateInvestor(id: string, data: Partial<Investor>): Promise<void> {
  const docRef = doc(db, INVESTORS_COLLECTION, id);
  await updateDoc(docRef, data);
}

/**
 * Menghapus investor dari sistem secara permanen
 */
export async function deleteInvestor(id: string): Promise<void> {
  const docRef = doc(db, INVESTORS_COLLECTION, id);
  await deleteDoc(docRef);
}
