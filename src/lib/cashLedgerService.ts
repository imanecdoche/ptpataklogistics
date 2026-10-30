import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CashLedgerEntry, CashFlowType } from '@/types/database';

const CASH_LEDGER_COLLECTION = 'cash_ledger';

/**
 * Mendapatkan saldo terakhir dari cash_ledger untuk menghitung runningBalance
 */
export async function getLatestCashBalance(): Promise<number> {
  try {
    const ledgerCol = collection(db, CASH_LEDGER_COLLECTION);
    const q = query(ledgerCol, orderBy('date', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty && snap.docs[0]) {
      const latestData = snap.docs[0].data();
      return typeof latestData.runningBalance === 'number' ? latestData.runningBalance : 0;
    }
  } catch (err) {
    console.warn('Gagal mengambil saldo kas terakhir:', err);
  }
  return 0;
}

export interface CreateCashLedgerPayload {
  date?: string;
  type: CashFlowType;
  amount: number;
  isCredit: boolean;
  description: string;
  referenceId?: string;
  createdByName: string;
  customDocId?: string;
}

/**
 * Mencatat entri mutasi baru ke cash_ledger dengan kalkulasi runningBalance otomatis
 */
export async function recordCashLedgerEntry(payload: CreateCashLedgerPayload): Promise<string> {
  const latestBalance = await getLatestCashBalance();
  const currentBalance = latestBalance + (payload.isCredit ? payload.amount : -payload.amount);
  const date = payload.date || new Date().toISOString();

  const entryData: Omit<CashLedgerEntry, 'id'> = {
    date,
    type: payload.type,
    amount: payload.amount,
    isCredit: payload.isCredit,
    runningBalance: currentBalance,
    referenceId: payload.referenceId || '',
    description: payload.description.trim(),
    createdByName: payload.createdByName.trim() || 'System'
  };

  const colRef = collection(db, CASH_LEDGER_COLLECTION);
  if (payload.customDocId) {
    await setDoc(doc(colRef, payload.customDocId), entryData);
    return payload.customDocId;
  }
  const docRef = await addDoc(colRef, entryData);
  return docRef.id;
}

/**
 * Real-time listener seluruh mutasi kas dari Firestore
 */
export function subscribeCashLedger(
  callback: (entries: CashLedgerEntry[]) => void,
  limitCount: number = 100
): () => void {
  const colRef = collection(db, CASH_LEDGER_COLLECTION);
  const q = query(colRef, orderBy('date', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    snap => {
      const list: CashLedgerEntry[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CashLedgerEntry, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data cash_ledger:', err);
    }
  );
}

/**
 * Mengambil daftar mutasi kas sekali baca
 */
export async function getCashLedgerEntries(limitCount: number = 100): Promise<CashLedgerEntry[]> {
  const colRef = collection(db, CASH_LEDGER_COLLECTION);
  const q = query(colRef, orderBy('date', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<CashLedgerEntry, 'id'>)
  }));
}

/**
 * Mengambil daftar entri kewajiban/hutang perseroan pihak ketiga (Bpk. Pei) dan pelunasannya
 */
export async function getCorporateDebtEntries(): Promise<CashLedgerEntry[]> {
  const colRef = collection(db, CASH_LEDGER_COLLECTION);
  const q = query(colRef, orderBy('date', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<CashLedgerEntry, 'id'>)
  }));
  return all.filter(
    entry => entry.type === 'HUTANG_PIHAK_KETIGA' || entry.type === 'CICILAN_HUTANG'
  );
}

/**
 * Menghitung ringkasan liabilitas hutang pihak ketiga perseroan
 */
export async function getCorporateDebtSummary(): Promise<{
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  entries: CashLedgerEntry[];
}> {
  const entries = await getCorporateDebtEntries();
  let totalDebt = 0;
  let totalPaid = 0;

  for (const item of entries) {
    if (item.type === 'HUTANG_PIHAK_KETIGA') {
      totalDebt += item.amount;
    } else if (item.type === 'CICILAN_HUTANG') {
      totalPaid += item.amount;
    }
  }

  return {
    totalDebt,
    totalPaid,
    remainingDebt: Math.max(0, totalDebt - totalPaid),
    entries
  };
}

/**
 * Inisialisasi awal default cash_ledger:
 * 1. Setoran Modal Awal Investor Bpk. Yadi (Rp 30.000.000)
 * 2. Pinjaman Pihak Ketiga / Liabilitas Perseroan Bpk. Pei (Rp 18.000.000)
 */
export async function seedDefaultCashLedger(): Promise<void> {
  try {
    const colRef = collection(db, CASH_LEDGER_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return;
    }

    const dateYadi = '2026-10-30T06:00:00.000Z';
    await setDoc(doc(colRef, 'ledger-modal-bpk-yadi'), {
      date: dateYadi,
      type: 'MODAL_AWAL' as CashFlowType,
      amount: 30000000,
      isCredit: true,
      runningBalance: 30000000,
      referenceId: '',
      description: 'Setoran Modal Awal Investor Bpk. Yadi',
      createdByName: 'System / Management'
    });

    const datePei = '2026-10-30T06:05:00.000Z';
    await setDoc(doc(colRef, 'ledger-debt-bpk-pei'), {
      date: datePei,
      type: 'HUTANG_PIHAK_KETIGA' as CashFlowType,
      amount: 18000000,
      isCredit: true,
      runningBalance: 48000000,
      referenceId: '',
      description: 'Pinjaman Pihak Ketiga / Hutang Perseroan Bpk. Pei',
      createdByName: 'System / Management'
    });
  } catch (err) {
    console.warn('Gagal melakukan seed default cash ledger:', err);
  }
}
