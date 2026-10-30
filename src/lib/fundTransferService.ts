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
import { FundTransferLog } from '@/types/database';
import { updateProjectBalance } from '@/lib/projectService';

const FUND_TRANSFERS_COLLECTION = 'fund_transfers';

/**
 * Real-time listener seluruh data riwayat subsidi silang / talangan antar-proyek
 */
export function subscribeFundTransfers(
  callback: (transfers: FundTransferLog[]) => void
): () => void {
  const colRef = collection(db, FUND_TRANSFERS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: FundTransferLog[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<FundTransferLog, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data fund_transfers:', err);
    }
  );
}

/**
 * Membuat mutasi kas talangan baru antar-proyek (Subsidi Silang Internal)
 * Secara otomatis memotong saldo proyek sumber dan menambah saldo proyek penerima
 */
export async function createFundTransfer(payload: {
  date: string;
  fromProjectId: string;
  fromProjectName: string;
  toProjectId: string;
  toProjectName: string;
  amount: number;
  note: string;
  recordedBy: string;
}): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal talangan harus lebih dari 0.');
  }

  if (payload.fromProjectId === payload.toProjectId) {
    throw new Error('Proyek sumber talangan tidak boleh sama dengan proyek penerima.');
  }

  const colRef = collection(db, FUND_TRANSFERS_COLLECTION);
  const docId = `ftr-${Date.now().toString().slice(-6)}`;

  const newTransfer: FundTransferLog = {
    id: docId,
    date: payload.date || new Date().toISOString().slice(0, 10),
    fromProjectId: payload.fromProjectId,
    fromProjectName: payload.fromProjectName,
    toProjectId: payload.toProjectId,
    toProjectName: payload.toProjectName,
    amount: numAmount,
    status: 'PINJAM',
    note: payload.note?.trim() || 'Internal subsidi silang talangan solar/kuari',
    recordedBy: payload.recordedBy,
    createdAt: new Date().toISOString()
  };

  // 1. Simpan dokumen talangan
  await setDoc(doc(colRef, docId), newTransfer);

  // 2. Potong saldo kas proyek sumber
  await updateProjectBalance(payload.fromProjectId, -numAmount);

  // 3. Tambah saldo kas proyek penerima talangan
  await updateProjectBalance(payload.toProjectId, numAmount);

  return docId;
}

/**
 * Melunasi kembali pinjaman talangan antar-proyek
 * Saldo dikembalikan ke proyek sumber asal dan dipotong dari proyek yang meminjam
 */
export async function settleFundTransfer(
  transferId: string,
  fromProjectId: string,
  toProjectId: string,
  amount: number
): Promise<void> {
  const numAmount = Number(amount);
  const docRef = doc(db, FUND_TRANSFERS_COLLECTION, transferId);

  // 1. Update status talangan menjadi LUNAS_KEMBALI
  await updateDoc(docRef, {
    status: 'LUNAS_KEMBALI',
    settledAt: new Date().toISOString()
  });

  // 2. Kembalikan saldo ke proyek sumber (pemberi pinjaman)
  await updateProjectBalance(fromProjectId, numAmount);

  // 3. Kurangi saldo proyek peminjam
  await updateProjectBalance(toProjectId, -numAmount);
}

/**
 * Menghapus catatan talangan
 */
export async function deleteFundTransfer(id: string): Promise<void> {
  const docRef = doc(db, FUND_TRANSFERS_COLLECTION, id);
  await deleteDoc(docRef);
}
