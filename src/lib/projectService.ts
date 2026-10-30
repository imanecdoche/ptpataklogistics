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
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Project, Investor } from '@/types/database';
import { formatEntityName } from '@/lib/nameUtils';

const PROJECTS_COLLECTION = 'projects';
const INVESTORS_COLLECTION = 'investors';

/**
 * Real-time listener seluruh data proyek dari Firestore
 */
export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: Project[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Project, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('Gagal membaca data projects:', err);
    }
  );
}

/**
 * Mengambil daftar proyek sekali baca
 */
export async function getProjects(): Promise<Project[]> {
  const colRef = collection(db, PROJECTS_COLLECTION);
  const snap = await getDocs(query(colRef, orderBy('name', 'asc')));
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<Project, 'id'>)
  }));
}

/**
 * Menyimpan proyek baru atau memperbarui data proyek yang sudah ada
 */
export async function saveProject(
  payload: {
    name: string;
    location: string;
    investorId: string;
    investorName: string;
    clientId: string;
    clientName: string;
    initialDeposit: number;
    currentBalance?: number;
    status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
    notes?: string;
  },
  existingId?: string
): Promise<string> {
  const cleanName = formatEntityName(payload.name);
  if (!cleanName) {
    throw new Error('Nama proyek wajib diisi.');
  }

  const colRef = collection(db, PROJECTS_COLLECTION);

  if (existingId) {
    const docRef = doc(colRef, existingId);
    await updateDoc(docRef, {
      name: cleanName,
      location: payload.location.trim(),
      investorId: payload.investorId,
      investorName: payload.investorName,
      clientId: payload.clientId,
      clientName: payload.clientName,
      initialDeposit: Number(payload.initialDeposit) || 0,
      notes: payload.notes?.trim() || '',
      status: payload.status || 'ACTIVE'
    });
    return existingId;
  }

  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  const docId = `prj-${slug}-${Date.now().toString().slice(-4)}`;
  const initialBal = payload.currentBalance !== undefined ? payload.currentBalance : (Number(payload.initialDeposit) || 0);

  const newProject: Project = {
    id: docId,
    name: cleanName,
    location: payload.location.trim(),
    investorId: payload.investorId,
    investorName: payload.investorName,
    clientId: payload.clientId,
    clientName: payload.clientName,
    initialDeposit: Number(payload.initialDeposit) || 0,
    currentBalance: initialBal,
    status: payload.status || 'ACTIVE',
    notes: payload.notes?.trim() || '',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(colRef, docId), newProject);
  return docId;
}

/**
 * Menghapus proyek dari sistem secara permanen
 */
export async function deleteProject(id: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Memperbarui saldo berjalan proyek (tambah atau kurang)
 */
export async function updateProjectBalance(id: string, delta: number): Promise<void> {
  if (!id) return;
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  await updateDoc(docRef, {
    currentBalance: increment(delta)
  });
}

/**
 * Inisialisasi otomatis master proyek produksi (Situ Cikedal & Cipeucang aktif, Menes completed)
 * dengan klien resmi P. Sapta.
 */
export async function seedDefaultProjects(): Promise<void> {
  try {
    const colRef = collection(db, PROJECTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return;
    }

    const defaultProjects: Project[] = [
      {
        id: 'prj-situ-cikedal',
        name: 'Proyek Konservasi Situ Cikedal',
        location: 'Kec. Cikedal, Pandeglang',
        investorId: 'inv-bpk-yadi',
        investorName: 'Bpk. Yadi',
        clientId: 'cli-p-sapta',
        clientName: 'P. Sapta',
        initialDeposit: 15000000,
        currentBalance: 15000000,
        status: 'ACTIVE',
        notes: 'Penyaluran material batu waste, split, abu batu konservasi Situ Cikedal (Rekanan P. Sapta)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'prj-cipeucang',
        name: 'Proyek Irigasi Cipeucang',
        location: 'Kec. Cipeucang, Pandeglang',
        investorId: 'inv-bpk-yadi',
        investorName: 'Bpk. Yadi',
        clientId: 'cli-p-sapta',
        clientName: 'P. Sapta',
        initialDeposit: 11500000,
        currentBalance: 11500000,
        status: 'ACTIVE',
        notes: 'Proyek infrastruktur drainase & irigasi Cipeucang (Rekanan P. Sapta)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'prj-menes',
        name: 'Proyek Menes',
        location: 'Menes, Pandeglang',
        investorId: 'inv-menes',
        investorName: 'Investor B (Menes)',
        clientId: 'cli-menes',
        clientName: 'CV Menes Raya Perkasa',
        initialDeposit: 0,
        currentBalance: 0,
        status: 'COMPLETED',
        notes: 'Proyek pengurukan dan pemadatan jalan Menes (Selesai)',
        createdAt: new Date().toISOString()
      }
    ];

    for (const prj of defaultProjects) {
      await setDoc(doc(colRef, prj.id), prj);
    }

    // Seed Investor Tunggal Aktif Bpk. Yadi jika belum ada
    const invDocRef = doc(db, INVESTORS_COLLECTION, 'inv-bpk-yadi');
    const invSnap = await getDoc(invDocRef);
    if (!invSnap.exists()) {
      const bpkYadi: Investor = {
        id: 'inv-bpk-yadi',
        name: 'Bpk. Yadi',
        phoneNumber: '+62 812-3456-7890',
        bankAccount: 'BCA - Rekening Investor Bpk. Yadi',
        initialCapital: 26500000,
        notes: 'Investor Tunggal Aktif PT Patak Abadi Jaya (Mendanai Proyek Situ Cikedal & Proyek Irigasi Cipeucang)',
        createdAt: new Date().toISOString()
      };
      await setDoc(invDocRef, bpkYadi);
    }
  } catch (err) {
    console.warn('Gagal melakukan seed default projects:', err);
  }
}
