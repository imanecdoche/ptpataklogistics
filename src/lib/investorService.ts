import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Investor, InvestorProjectLink } from '@/types/database';
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
 * Menyimpan investor baru atau memperbarui data investor yang sudah ada,
 * sekaligus menyinkronkan penugasan proyek, alokasi modal, dan profit share.
 */
export async function saveInvestor(
  payload: {
    name: string;
    phoneNumber?: string;
    bankAccount?: string;
    initialCapital?: number;
    profitSharePercentage?: number;
    linkedProjects?: InvestorProjectLink[];
    notes?: string;
  },
  existingId?: string
): Promise<string> {
  const cleanName = formatEntityName(payload.name);
  if (!cleanName) {
    throw new Error('Nama investor wajib diisi.');
  }

  const colRef = collection(db, INVESTORS_COLLECTION);
  let finalId = existingId;

  if (finalId) {
    const docRef = doc(colRef, finalId);
    await updateDoc(docRef, {
      name: cleanName,
      phoneNumber: payload.phoneNumber ? formatPhoneNumber(payload.phoneNumber) : '',
      bankAccount: payload.bankAccount?.trim() || '',
      initialCapital: Number(payload.initialCapital) || 0,
      profitSharePercentage: Number(payload.profitSharePercentage) || 0,
      linkedProjects: payload.linkedProjects || [],
      notes: payload.notes?.trim() || ''
    });
  } else {
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    finalId = `inv-${slug}-${Date.now().toString().slice(-4)}`;
    const newInvestor: Investor = {
      id: finalId,
      name: cleanName,
      phoneNumber: payload.phoneNumber ? formatPhoneNumber(payload.phoneNumber) : '',
      bankAccount: payload.bankAccount?.trim() || '',
      initialCapital: Number(payload.initialCapital) || 0,
      profitSharePercentage: Number(payload.profitSharePercentage) || 0,
      linkedProjects: payload.linkedProjects || [],
      notes: payload.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(colRef, finalId), newInvestor);
  }

  // Sinkronisasi Dua Arah dengan Koleksi Proyek (projects)
  try {
    const projectsCol = collection(db, 'projects');
    const linkedProjectIds = new Set((payload.linkedProjects || []).map(p => p.projectId));

    // 1. Cari proyek yang sebelumnya terhubung ke investor ini
    const prevLinkedQuery = query(projectsCol, where('investorId', '==', finalId));
    const prevSnap = await getDocs(prevLinkedQuery);

    for (const d of prevSnap.docs) {
      if (!linkedProjectIds.has(d.id)) {
        // Proyek dilepas dari investor ini
        await updateDoc(doc(db, 'projects', d.id), {
          investorId: '',
          investorName: ''
        });
      }
    }

    // 2. Perbarui proyek yang terhubung saat ini dengan data alokasi dan profit share
    if (payload.linkedProjects && payload.linkedProjects.length > 0) {
      for (const link of payload.linkedProjects) {
        if (!link.projectId) continue;
        const pRef = doc(db, 'projects', link.projectId);
        await updateDoc(pRef, {
          investorId: finalId,
          investorName: cleanName,
          initialDeposit: Number(link.capitalAllocation) || 0,
          profitSharePercentage: Number(link.profitSharePercentage) || 0
        });
      }
    }
  } catch (syncErr) {
    console.warn('Gagal menyinkronkan proyek terkait investor:', syncErr);
  }

  return finalId;
}

/**
 * Memperbarui field parsial investor
 */
export async function updateInvestor(id: string, data: Partial<Investor>): Promise<void> {
  const docRef = doc(db, INVESTORS_COLLECTION, id);
  await updateDoc(docRef, data);
}

/**
 * Menghapus investor dari sistem secara permanen dan melepaskan ikatan pada proyek
 */
export async function deleteInvestor(id: string): Promise<void> {
  const docRef = doc(db, INVESTORS_COLLECTION, id);
  await deleteDoc(docRef);

  // Unlink semua proyek yang sebelumnya terhubung
  try {
    const projectsCol = collection(db, 'projects');
    const q = query(projectsCol, where('investorId', '==', id));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, 'projects', d.id), {
        investorId: '',
        investorName: ''
      });
    }
  } catch (err) {
    console.warn('Gagal melepaskan kaitan proyek dari investor yang dihapus:', err);
  }
}

/**
 * Inisialisasi otomatis investor tunggal aktif (Bpk. Yadi) jika koleksi investors masih kosong
 */
export async function seedDefaultInvestors(): Promise<void> {
  try {
    const colRef = collection(db, INVESTORS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return;
    }

    const defaultInvestor: Investor = {
      id: 'inv-bpk-yadi',
      name: 'Bpk. Yadi',
      phoneNumber: '+62 812-3456-7890',
      bankAccount: 'BCA - Rekening Investor Bpk. Yadi',
      initialCapital: 26500000,
      profitSharePercentage: 50,
      notes: 'Investor Tunggal Aktif PT Patak Abadi Jaya (Mendanai Proyek Situ Cikedal & Proyek Irigasi Cipeucang)',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(colRef, defaultInvestor.id), defaultInvestor);
  } catch (err) {
    console.warn('Gagal melakukan seed default investors:', err);
  }
}
