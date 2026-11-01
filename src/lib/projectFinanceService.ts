import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ProjectSubJob,
  WorkerKasbonLog,
  EmployeeKasbonLog,
  ClientProjectPayment
} from '@/types/database';
import { recordCashLedgerEntry } from '@/lib/cashLedgerService';

const SUB_JOBS_COLLECTION = 'project_sub_jobs';
const KASBON_COLLECTION = 'worker_kasbon_logs';
const EMPLOYEE_KASBON_COLLECTION = 'employee_kasbon_logs';
const PAYMENTS_COLLECTION = 'client_project_payments';

/**
 * Mendengarkan daftar sub-pekerjaan fisik (MCK, Paving, Drainase, dll.)
 */
export function subscribeProjectSubJobs(
  callback: (subJobs: ProjectSubJob[]) => void,
  projectId?: string
): () => void {
  const colRef = collection(db, SUB_JOBS_COLLECTION);
  const q = projectId
    ? query(colRef, where('projectId', '==', projectId))
    : colRef;

  return onSnapshot(
    q,
    snapshot => {
      const list: ProjectSubJob[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ProjectSubJob, 'id'>)
      }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe project sub-jobs:', err);
    }
  );
}

export interface SaveSubJobPayload {
  id?: string;
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  jobType: ProjectSubJob['jobType'];
  jobName: string;
  unit: ProjectSubJob['unit'];
  volume: number;
  clientRatePerUnit: number;
  workerRatePerUnit: number;
  workerLeaderName: string;
  workerLeaderPhone?: string;
  status: ProjectSubJob['status'];
  notes?: string;
}

/**
 * Menyimpan / memperbarui sub-pekerjaan fisik dan menghitung kontrak otomatis
 */
export async function saveProjectSubJob(payload: SaveSubJobPayload): Promise<string> {
  const colRef = collection(db, SUB_JOBS_COLLECTION);
  const contractAmountClient = payload.volume * payload.clientRatePerUnit;
  const contractAmountWorker = payload.volume * payload.workerRatePerUnit;
  const companyMargin = contractAmountClient - contractAmountWorker;

  if (payload.id) {
    // Mode Update: Ambil data lama untuk mempertahankan total kasbon
    const docRef = doc(db, SUB_JOBS_COLLECTION, payload.id);
    const snap = await getDoc(docRef);
    const currentData = snap.exists() ? (snap.data() as ProjectSubJob) : null;
    const totalKasbonPaid = currentData?.totalKasbonPaid || 0;
    const remainingWorkerPay = Math.max(0, contractAmountWorker - totalKasbonPaid);

    await updateDoc(docRef, {
      projectId: payload.projectId,
      projectName: payload.projectName,
      clientId: payload.clientId || '',
      clientName: payload.clientName || '',
      jobType: payload.jobType,
      jobName: payload.jobName.trim(),
      unit: payload.unit,
      volume: payload.volume,
      clientRatePerUnit: payload.clientRatePerUnit,
      contractAmountClient,
      workerRatePerUnit: payload.workerRatePerUnit,
      contractAmountWorker,
      workerLeaderName: payload.workerLeaderName.trim(),
      workerLeaderPhone: payload.workerLeaderPhone?.trim() || '',
      status: payload.status,
      totalKasbonPaid,
      remainingWorkerPay,
      companyMargin,
      notes: payload.notes?.trim() || ''
    });
    return payload.id;
  } else {
    // Mode Create Baru
    const newDocId = `psj-${Date.now().toString().slice(-6)}`;
    const newSubJob: ProjectSubJob = {
      id: newDocId,
      projectId: payload.projectId,
      projectName: payload.projectName,
      clientId: payload.clientId || '',
      clientName: payload.clientName || '',
      jobType: payload.jobType,
      jobName: payload.jobName.trim(),
      unit: payload.unit,
      volume: payload.volume,
      clientRatePerUnit: payload.clientRatePerUnit,
      contractAmountClient,
      workerRatePerUnit: payload.workerRatePerUnit,
      contractAmountWorker,
      workerLeaderName: payload.workerLeaderName.trim(),
      workerLeaderPhone: payload.workerLeaderPhone?.trim() || '',
      status: payload.status || 'BERJALAN',
      totalKasbonPaid: 0,
      remainingWorkerPay: contractAmountWorker,
      companyMargin,
      notes: payload.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(colRef, newDocId), newSubJob);
    return newDocId;
  }
}

/**
 * Menghapus sub-pekerjaan fisik
 */
export async function deleteProjectSubJob(id: string): Promise<void> {
  const docRef = doc(db, SUB_JOBS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Mendengarkan riwayat kasbon tukang/mandor
 */
export function subscribeWorkerKasbonLogs(
  callback: (logs: WorkerKasbonLog[]) => void,
  subJobId?: string
): () => void {
  const colRef = collection(db, KASBON_COLLECTION);
  const q = subJobId
    ? query(colRef, where('subJobId', '==', subJobId))
    : colRef;

  return onSnapshot(
    q,
    snapshot => {
      const list: WorkerKasbonLog[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<WorkerKasbonLog, 'id'>)
      }));
      list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe worker kasbon logs:', err);
    }
  );
}

export interface RecordKasbonPayload {
  subJobId: string;
  subJobName: string;
  projectId: string;
  projectName: string;
  workerLeaderName: string;
  date: string;
  amount: number;
  note?: string;
  userEmail: string;
}

/**
 * Mencatat Kasbon Tukang:
 * 1. Simpan bukti kasbon di worker_kasbon_logs
 * 2. Kurangi plafon hak upah tukang di project_sub_jobs
 * 3. Catat mutasi kas keluar di Buku Kas Utama (cash_ledger)
 */
export async function recordWorkerKasbon(payload: RecordKasbonPayload): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal kasbon harus lebih besar dari 0.');
  }

  // 1. Simpan dokumen kasbon
  const kasbonCol = collection(db, KASBON_COLLECTION);
  const kasbonId = `ksb-${Date.now().toString().slice(-6)}`;
  const kasbonDoc: WorkerKasbonLog = {
    id: kasbonId,
    subJobId: payload.subJobId,
    subJobName: payload.subJobName,
    projectId: payload.projectId,
    projectName: payload.projectName,
    workerLeaderName: payload.workerLeaderName,
    date: payload.date || new Date().toISOString().slice(0, 10),
    amount: numAmount,
    note: payload.note?.trim() || '',
    recordedBy: payload.userEmail,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(kasbonCol, kasbonId), kasbonDoc);

  // 2. Perbarui akumulasi kasbon dan sisa hak upah tukang
  const subJobRef = doc(db, SUB_JOBS_COLLECTION, payload.subJobId);
  const snap = await getDoc(subJobRef);
  if (snap.exists()) {
    const data = snap.data() as ProjectSubJob;
    const newTotalKasbon = (data.totalKasbonPaid || 0) + numAmount;
    const newRemaining = Math.max(0, data.contractAmountWorker - newTotalKasbon);
    await updateDoc(subJobRef, {
      totalKasbonPaid: newTotalKasbon,
      remainingWorkerPay: newRemaining
    });
  }

  // 3. Catat mutasi kas keluar di Buku Kas Utama
  await recordCashLedgerEntry({
    date: payload.date || new Date().toISOString().slice(0, 10),
    type: 'KASBON_TUKANG',
    amount: numAmount,
    isCredit: false,
    description: `Kasbon Mandor: ${payload.workerLeaderName} (${payload.subJobName} - ${payload.projectName}) ${payload.note ? `[${payload.note}]` : ''}`,
    referenceId: kasbonId,
    createdByName: payload.userEmail.split('@')[0] || 'Manajemen'
  });

  return kasbonId;
}

/**
 * Mendengarkan riwayat kasbon karyawan internal proyek
 */
export function subscribeEmployeeKasbonLogs(
  callback: (logs: EmployeeKasbonLog[]) => void,
  projectId?: string
): () => void {
  const colRef = collection(db, EMPLOYEE_KASBON_COLLECTION);
  const q = projectId
    ? query(colRef, where('projectId', '==', projectId))
    : colRef;

  return onSnapshot(
    q,
    snapshot => {
      const list: EmployeeKasbonLog[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<EmployeeKasbonLog, 'id'>)
      }));
      list.sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe employee kasbon logs:', err);
    }
  );
}

export interface RecordEmployeeKasbonPayload {
  projectId: string;
  projectName: string;
  employeeName: string;
  role?: string;
  date: string;
  amount: number;
  note?: string;
  receiptUrl?: string;
  userEmail: string;
}

/**
 * Mencatat Kasbon Karyawan:
 * 1. Simpan dokumen di employee_kasbon_logs
 * 2. Catat mutasi kas keluar di Buku Kas Utama (cash_ledger) dengan tipe KASBON_KARYAWAN
 */
export async function recordEmployeeKasbon(payload: RecordEmployeeKasbonPayload): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal kasbon harus lebih besar dari 0.');
  }

  // 1. Simpan dokumen kasbon
  const kasbonCol = collection(db, EMPLOYEE_KASBON_COLLECTION);
  const kasbonId = `ksb-emp-${Date.now().toString().slice(-6)}`;
  const kasbonDoc: EmployeeKasbonLog = {
    id: kasbonId,
    projectId: payload.projectId,
    projectName: payload.projectName,
    employeeName: payload.employeeName.trim(),
    role: payload.role?.trim() || '',
    date: payload.date || new Date().toISOString().slice(0, 10),
    amount: numAmount,
    note: payload.note?.trim() || '',
    receiptUrl: payload.receiptUrl || '',
    recordedBy: payload.userEmail,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(kasbonCol, kasbonId), kasbonDoc);

  // 2. Catat kas keluar di Buku Kas Utama
  await recordCashLedgerEntry({
    date: payload.date || new Date().toISOString().slice(0, 10),
    type: 'KASBON_KARYAWAN',
    amount: numAmount,
    isCredit: false,
    description: `Kasbon Karyawan: ${payload.employeeName}${payload.role ? ` (${payload.role})` : ''} [${payload.projectName}]${payload.note ? ` - ${payload.note}` : ''}`,
    referenceId: kasbonId,
    createdByName: payload.userEmail.split('@')[0] || 'Manajemen',
    receiptUrl: payload.receiptUrl
  });

  return kasbonId;
}

/**
 * Hapus dokumen kasbon karyawan
 */
export async function deleteEmployeeKasbon(kasbonId: string): Promise<void> {
  const docRef = doc(db, EMPLOYEE_KASBON_COLLECTION, kasbonId);
  await deleteDoc(docRef);
}

/**
 * Mendengarkan riwayat pembayaran masuk dari klien untuk proyek
 */
export function subscribeClientPayments(
  callback: (payments: ClientProjectPayment[]) => void,
  projectId?: string
): () => void {
  const colRef = collection(db, PAYMENTS_COLLECTION);
  const q = projectId
    ? query(colRef, where('projectId', '==', projectId))
    : colRef;

  return onSnapshot(
    q,
    snapshot => {
      const list: ClientProjectPayment[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ClientProjectPayment, 'id'>)
      }));
      list.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt));
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe client payments:', err);
    }
  );
}

export interface RecordClientPaymentPayload {
  paymentDate: string;
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  note?: string;
  userEmail: string;
}

/**
 * Mencatat Pembayaran Masuk dari Klien (Lump-Sum Payment Pool):
 * 1. Simpan dokumen pembayaran di client_project_payments
 * 2. Catat mutasi kas masuk di Buku Kas Utama (cash_ledger)
 * 3. Otomatis memotong sisa piutang berjalan proyek secara global
 */
export async function recordClientPayment(payload: RecordClientPaymentPayload): Promise<string> {
  const numAmount = Number(payload.amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Nominal pembayaran masuk harus lebih besar dari 0.');
  }

  // 1. Simpan pembayaran
  const payCol = collection(db, PAYMENTS_COLLECTION);
  const payId = `pay-${Date.now().toString().slice(-6)}`;
  const payDoc: ClientProjectPayment = {
    id: payId,
    paymentDate: payload.paymentDate || new Date().toISOString().slice(0, 10),
    clientId: payload.clientId || '',
    clientName: payload.clientName.trim(),
    projectId: payload.projectId || '',
    projectName: payload.projectName?.trim() || '',
    amount: numAmount,
    paymentMethod: payload.paymentMethod?.trim() || 'Transfer Bank',
    referenceNumber: payload.referenceNumber?.trim() || '',
    note: payload.note?.trim() || '',
    recordedBy: payload.userEmail,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(payCol, payId), payDoc);

  // 2. Catat kas masuk di Buku Kas Utama (Kas Perusahaan Bertambah)
  await recordCashLedgerEntry({
    date: payload.paymentDate || new Date().toISOString().slice(0, 10),
    type: 'PEMBAYARAN_PROYEK',
    amount: numAmount,
    isCredit: true,
    description: `Pembayaran Klien: ${payload.clientName} ${payload.projectName ? `[${payload.projectName}]` : ''} - ${payload.note || 'Pelunasan Bertahap Material & Borongan Fisik'}`,
    referenceId: payId,
    createdByName: payload.userEmail.split('@')[0] || 'Manajemen'
  });

  return payId;
}
