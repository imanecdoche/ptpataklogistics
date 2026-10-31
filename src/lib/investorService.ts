import {
  collection,
  doc,
  getDoc,
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
import { Investor, InvestorProjectLink, InvestorPayout, InvestorTransferLog, InvestorTransferCategory, InvestorTransferInstallment } from '@/types/database';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatEntityName } from '@/lib/nameUtils';
import { updateProjectBalance } from '@/lib/projectService';
import { recordCashLedgerEntry } from '@/lib/cashLedgerService';

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

const INVESTOR_TRANSFERS_COLLECTION = 'investor_transfers';
const INVESTOR_PAYOUTS_COLLECTION = 'investor_payouts';

/**
 * Real-time listener seluruh riwayat transfer & realokasi dana antar-investor
 */
export function subscribeInvestorTransfers(
  callback: (transfers: InvestorTransferLog[]) => void
): () => void {
  const colRef = collection(db, INVESTOR_TRANSFERS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: InvestorTransferLog[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<InvestorTransferLog, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data investor_transfers:', err);
    }
  );
}

/**
 * Mencatat mutasi transfer / talangan dana antar-investor
 */
export async function createInvestorTransfer(payload: {
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
  note: string;
  receiptUrl?: string;
  createdByName: string;
}): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal transfer harus lebih besar dari 0.');
  }

  if (payload.fromInvestorId === payload.toInvestorId && payload.fromProjectId === payload.toProjectId) {
    throw new Error('Investor dan proyek sumber tidak boleh sama persis dengan tujuan.');
  }

  const colRef = collection(db, INVESTOR_TRANSFERS_COLLECTION);
  const docId = `itf-${Date.now().toString().slice(-6)}`;
  const isTalangan = payload.category === 'TALANGAN_OPERASIONAL';

  const transferDoc: InvestorTransferLog = {
    id: docId,
    date: payload.date || new Date().toISOString().slice(0, 10),
    fromInvestorId: payload.fromInvestorId,
    fromInvestorName: payload.fromInvestorName,
    fromProjectId: payload.fromProjectId || '',
    fromProjectName: payload.fromProjectName || '',
    toInvestorId: payload.toInvestorId,
    toInvestorName: payload.toInvestorName,
    toProjectId: payload.toProjectId || '',
    toProjectName: payload.toProjectName || '',
    amount: numAmount,
    totalAmount: numAmount,
    paidAmount: isTalangan ? 0 : numAmount,
    remainingAmount: isTalangan ? numAmount : 0,
    installments: [],
    ...(payload.receiptUrl ? { receiptUrl: payload.receiptUrl } : {}),
    category: payload.category,
    status: isTalangan ? 'BELUM_LUNAS' : 'LUNAS',
    note: payload.note?.trim() || '',
    createdByName: payload.createdByName,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(colRef, docId), transferDoc);

  // Jika mengaitkan proyek asal dan proyek tujuan, potong & tambah saldo proyek
  if (payload.fromProjectId && payload.toProjectId && payload.fromProjectId !== payload.toProjectId) {
    await updateProjectBalance(payload.fromProjectId, -numAmount);
    await updateProjectBalance(payload.toProjectId, numAmount);
  }

  // Catat riwayat audit ke Buku Kas Utama
  await recordCashLedgerEntry({
    date: new Date().toISOString(),
    type: 'TRANSFER_INVESTOR',
    amount: numAmount,
    isCredit: false,
    description: `Transfer Antar-Investor: Dari ${payload.fromInvestorName} ke ${payload.toInvestorName} (${payload.category}) - ${payload.note || 'Internal'}`,
    referenceId: docId,
    ...(payload.receiptUrl ? { receiptUrl: payload.receiptUrl } : {}),
    createdByName: payload.createdByName
  });

  return docId;
}

/**
 * Mencatat pembayaran cicilan bertahap untuk talangan operasional antar-investor
 */
export async function recordInvestorTalanganInstallment(payload: {
  transferId: string;
  amount: number;
  date?: string;
  note?: string;
  receiptUrl?: string;
  userEmail: string;
}): Promise<void> {
  const docRef = doc(db, INVESTOR_TRANSFERS_COLLECTION, payload.transferId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Data talangan operasional tidak ditemukan.');
  }

  const tr = snap.data() as InvestorTransferLog;
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal cicilan harus lebih besar dari 0.');
  }

  const totalAmount = tr.totalAmount ?? tr.amount ?? 0;
  const currentPaid = tr.paidAmount ?? (tr.status === 'LUNAS' ? totalAmount : 0);
  const newPaid = currentPaid + numAmount;
  const newRemaining = Math.max(0, totalAmount - newPaid);
  const isFullySettled = newRemaining <= 0;

  const installmentId = `inst-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const dateStr = payload.date || now.slice(0, 10);

  const newInstallment: InvestorTransferInstallment = {
    id: installmentId,
    date: dateStr,
    amount: numAmount,
    receiptUrl: payload.receiptUrl || '',
    note: payload.note?.trim() || '',
    createdByName: payload.userEmail,
    createdAt: now
  };

  const installments = [...(tr.installments || []), newInstallment];

  await updateDoc(docRef, {
    totalAmount,
    paidAmount: newPaid,
    remainingAmount: newRemaining,
    status: isFullySettled ? 'LUNAS' : 'BELUM_LUNAS',
    ...(isFullySettled ? { settledAt: now } : {}),
    installments
  });

  // Catat Kas Keluar Cicilan Hutang di cash_ledger
  await recordCashLedgerEntry({
    date: `${dateStr}T12:00:00.000Z`,
    type: 'CICILAN_HUTANG',
    amount: numAmount,
    isCredit: false,
    description: `Cicilan Talangan: ${tr.fromInvestorName} (Ref: ${payload.transferId}) ${payload.note ? `[${payload.note}]` : ''}`,
    referenceId: payload.transferId,
    ...(payload.receiptUrl ? { receiptUrl: payload.receiptUrl } : {}),
    createdByName: payload.userEmail
  });
}

/**
 * Melunasi catatan talangan operasional antar-investor
 */
export async function settleInvestorTransfer(
  transferId: string,
  userEmail: string
): Promise<void> {
  const docRef = doc(db, INVESTOR_TRANSFERS_COLLECTION, transferId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: 'LUNAS',
    settledAt: now
  });

  await recordCashLedgerEntry({
    date: now,
    type: 'TRANSFER_INVESTOR',
    amount: 0,
    isCredit: true,
    description: `Pelunasan Talangan Antar-Investor (Ref: ${transferId})`,
    referenceId: transferId,
    createdByName: userEmail
  });
}

/**
 * Real-time listener seluruh riwayat penyerahan bagi hasil (payout) ke investor
 */
export function subscribeInvestorPayouts(
  callback: (payouts: InvestorPayout[]) => void
): () => void {
  const colRef = collection(db, INVESTOR_PAYOUTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: InvestorPayout[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<InvestorPayout, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data investor_payouts:', err);
    }
  );
}

/**
 * Mencatat penyerahan bagi hasil / dividen ke investor (memotong Kas Utama)
 */
export async function recordInvestorPayout(payload: {
  investorId: string;
  investorName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  date?: string;
  note?: string;
  createdByName: string;
}): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal bagi hasil harus lebih besar dari 0.');
  }

  const colRef = collection(db, INVESTOR_PAYOUTS_COLLECTION);
  const docId = `payout-${Date.now().toString().slice(-6)}`;
  const date = payload.date || new Date().toISOString().slice(0, 10);

  const newPayout: InvestorPayout = {
    id: docId,
    investorId: payload.investorId,
    investorName: payload.investorName,
    projectId: payload.projectId || '',
    projectName: payload.projectName || '',
    date,
    amount: numAmount,
    note: payload.note?.trim() || 'Penyerahan Bagi Hasil / Profit Share ke Investor',
    createdByName: payload.createdByName,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(colRef, docId), newPayout);

  // Potong langsung dari Buku Kas Utama
  await recordCashLedgerEntry({
    date: new Date().toISOString(),
    type: 'BAGI_HASIL_INVESTOR',
    amount: numAmount,
    isCredit: false,
    description: `Penyerahan Bagi Hasil ke ${payload.investorName}: ${payload.note || 'Dividen Laba Proyek'}`,
    referenceId: docId,
    createdByName: payload.createdByName
  });

  return docId;
}
