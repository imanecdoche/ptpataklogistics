import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, firebaseConfig } from '@/lib/firebase';
import { SystemUser, UserRole, UserStatus } from '@/types/database';
import { formatPersonName } from '@/lib/nameUtils';

export const DEVELOPER_EMAIL = 'fatih@patak.dev';
export const FOUNDER_EMAIL = 'founder@patak.id';
export const DEVELOPER_WHATSAPP = '082111500190';

/**
 * Cek apakah email adalah akun Developer atau Founder dengan otoritas tertinggi
 */
export function isDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === DEVELOPER_EMAIL.toLowerCase() || clean === FOUNDER_EMAIL.toLowerCase();
}

/**
 * Inisialisasi Auth Sekunder untuk membuat user baru di Firebase Auth
 * tanpa memutuskan atau mengubah sesi akun developer yang sedang login.
 */
function getSecondaryAuth() {
  const appName = 'SecondaryUserCreationApp';
  const existingApp = getApps().find(a => a.name === appName);
  const secondaryApp = existingApp || initializeApp(firebaseConfig, appName);
  return getAuth(secondaryApp);
}

/**
 * Seed akun awal resmi sistem (fatih@patak.dev, founder@patak.id, dan administrator@patak.id) jika belum ada
 */
export async function seedInitialUsers(): Promise<void> {
  try {
    const colRef = collection(db, 'system_users');

    // 1. Akun Developer
    const devDocRef = doc(colRef, 'usr-fatih-patak-dev');
    const devSnap = await getDoc(devDocRef);
    if (!devSnap.exists()) {
      await setDoc(devDocRef, {
        id: 'usr-fatih-patak-dev',
        name: 'Fatih Farhat',
        email: DEVELOPER_EMAIL,
        role: 'developer',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    }

    // 2. Akun Founder / CEO / Owner (Hak Akses Setara Developer)
    const founderDocRef = doc(colRef, 'usr-founder-patak-id');
    const founderSnap = await getDoc(founderDocRef);
    if (!founderSnap.exists()) {
      await setDoc(founderDocRef, {
        id: 'usr-founder-patak-id',
        name: 'Founder / CEO',
        email: FOUNDER_EMAIL,
        role: 'founder',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    }

    // 3. Akun Administrator Default
    const adminDocRef = doc(colRef, 'usr-administrator-patak-id');
    const adminSnap = await getDoc(adminDocRef);
    if (!adminSnap.exists()) {
      await setDoc(adminDocRef, {
        id: 'usr-administrator-patak-id',
        name: 'Administrator Logistik',
        email: 'administrator@patak.id',
        role: 'admin',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    }

    // 4. Akun Investor Bpk. Yadi
    const yadiDocRef = doc(colRef, 'usr-yadi-patak-id');
    const yadiSnap = await getDoc(yadiDocRef);
    if (!yadiSnap.exists()) {
      await setDoc(yadiDocRef, {
        id: 'usr-yadi-patak-id',
        name: 'Bpk Yadi',
        email: 'yadi@patak.id',
        role: 'investor',
        status: 'ACTIVE',
        investorId: 'inv-bpk-yadi',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: DEVELOPER_EMAIL
      });
    }
  } catch (err) {
    console.warn('Gagal seed initial users:', err);
  }
}

/**
 * Pengguna mengajukan "Minta Akses" di halaman login
 */
export async function requestAccountAccess(payload: {
  name: string;
  username: string; // tanpa @patak.id
  password: string;
}): Promise<SystemUser> {
  const cleanUsername = payload.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (!cleanUsername) {
    throw new Error('Username email tidak valid.');
  }

  const cleanEmail = `${cleanUsername}@patak.id`;
  if (payload.password.length < 8) {
    throw new Error('Kata sandi minimal 8 karakter.');
  }

  const colRef = collection(db, 'system_users');
  const q = query(colRef, where('email', '==', cleanEmail));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existing = snap.docs[0]?.data() as SystemUser;
    if (existing.status === 'PENDING') {
      const err = new Error('Permintaan akun dengan email ini masih dalam peninjauan developer.');
      (err as any).code = 'STATUS_PENDING';
      (err as any).user = existing;
      throw err;
    } else if (existing.status === 'ACTIVE') {
      const err = new Error('Akun dengan email ini sudah terdaftar dan aktif. Silakan langsung login.');
      (err as any).code = 'STATUS_ACTIVE';
      throw err;
    } else if (existing.status === 'INACTIVE') {
      const err = new Error('Akun ini sebelumnya dinonaktifkan. Silakan hubungi developer.');
      (err as any).code = 'STATUS_INACTIVE';
      (err as any).user = existing;
      throw err;
    }
  }

  const docId = `usr-${cleanUsername}-${Date.now().toString().slice(-4)}`;
  const newUser: SystemUser = {
    id: docId,
    name: formatPersonName(payload.name),
    email: cleanEmail,
    role: 'dispatcher',
    status: 'PENDING',
    password: payload.password, // Disimpan sementara untuk auto-creation saat di-ACC developer
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };

  await setDoc(doc(colRef, docId), newUser);
  return newUser;
}

/**
 * Cek status akun berdasarkan email saat login
 * Termasuk kalkulasi otomatis 30 hari tanpa aktivitas login
 */
export async function getUserStatusByEmail(email: string): Promise<SystemUser | null> {
  const cleanEmail = email.trim().toLowerCase();
  
  // Akun Developer dan Founder selalu aktif permanen
  if (isDeveloperEmail(cleanEmail)) {
    if (cleanEmail === FOUNDER_EMAIL.toLowerCase()) {
      return {
        id: 'usr-founder-patak-id',
        name: 'Founder / CEO',
        email: FOUNDER_EMAIL,
        role: 'founder',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
    }
    return {
      id: 'usr-fatih-patak-dev',
      name: 'Fatih Farhat',
      email: DEVELOPER_EMAIL,
      role: 'developer',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  const colRef = collection(db, 'system_users');
  const q = query(colRef, where('email', '==', cleanEmail));
  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const docItem = snap.docs[0];
  if (!docItem) return null;
  const user = { id: docItem.id, ...(docItem.data() as Omit<SystemUser, 'id'>) };

  // Evaluasi aturan 30 hari tanpa aktivitas login
  if (user.status === 'ACTIVE' && user.lastLoginAt) {
    const diffMs = Date.now() - new Date(user.lastLoginAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      // Otomatis nonaktifkan
      await updateDoc(doc(colRef, user.id), {
        status: 'INACTIVE',
        inactiveReason: `Tidak ada aktivitas selama ${diffDays} hari.`
      });
      user.status = 'INACTIVE';
      user.inactiveReason = `Tidak ada aktivitas selama ${diffDays} hari.`;
    }
  }

  return user;
}

/**
 * Memperbarui waktu sesi aktif terakhir (lastLoginAt) saat berhasil login
 */
export async function updateUserLastLogin(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const colRef = collection(db, 'system_users');
  const q = query(colRef, where('email', '==', cleanEmail));
  const snap = await getDocs(q);

  if (!snap.empty && snap.docs[0]) {
    await updateDoc(doc(colRef, snap.docs[0].id), {
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE'
    });
  }
}

/**
 * Mendengarkan seluruh daftar akun sistem secara real-time untuk tab Dev
 */
export function subscribeSystemUsers(callback: (users: SystemUser[]) => void): () => void {
  const colRef = collection(db, 'system_users');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snap => {
      const now = Date.now();
      const list: SystemUser[] = snap.docs.map(d => {
        const u = { id: d.id, ...(d.data() as Omit<SystemUser, 'id'>) };

        // Real-time check 30 days inactivity
        if (!isDeveloperEmail(u.email) && u.status === 'ACTIVE' && u.lastLoginAt) {
          const diffDays = Math.floor((now - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            u.status = 'INACTIVE';
            u.inactiveReason = `Tidak ada aktivitas selama ${diffDays} hari.`;
          }
        }
        return u;
      });
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe system_users:', err);
    }
  );
}

/**
 * Developer menyetujui (ACC) akun yang berstatus PENDING
 * Otomatis mendaftarkan akun ke Firebase Auth via Secondary App
 */
export async function approveUserAccount(
  user: SystemUser,
  approvedBy: string,
  assignedRole: UserRole = 'dispatcher'
): Promise<void> {
  const colRef = collection(db, 'system_users');
  let authUid = user.uid || '';

  // 1. Buatkan akun ke Firebase Auth jika belum memiliki UID
  if (!authUid && user.password) {
    try {
      const secondaryAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
      authUid = cred.user.uid;
      await updateProfile(cred.user, { displayName: user.name });
      await secondaryAuth.signOut();
    } catch (authErr: any) {
      // Jika email sudah terdaftar di auth, abaikan error user-exists
      if (!authErr.message?.includes('email-already-in-use')) {
        console.warn('Pembuatan user di Firebase Auth:', authErr);
      }
    }
  }

  // 2. Perbarui status di Firestore menjadi ACTIVE
  const updateData: Partial<SystemUser> = {
    status: 'ACTIVE',
    role: assignedRole,
    approvedAt: new Date().toISOString(),
    approvedBy,
    password: '' // Bersihkan raw password demi keamanan
  };

  if (authUid) {
    updateData.uid = authUid;
  }

  await updateDoc(doc(colRef, user.id), updateData);
}

/**
 * Developer membuat akun baru secara langsung dari tab Dev
 */
export async function createAccountDirectly(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdBy: string;
}): Promise<void> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanName = formatPersonName(payload.name);
  let authUid = '';

  // 1. Buatkan akun ke Firebase Auth
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, payload.password);
  authUid = cred.user.uid;
  await updateProfile(cred.user, { displayName: cleanName });
  await secondaryAuth.signOut();

  // 2. Simpan ke Firestore
  const docId = `usr-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
  const newUser: SystemUser = {
    id: docId,
    uid: authUid,
    name: cleanName,
    email: cleanEmail,
    role: payload.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    approvedAt: new Date().toISOString(),
    approvedBy: payload.createdBy
  };

  await setDoc(doc(collection(db, 'system_users'), docId), newUser);
}

/**
 * Developer mengedit nama, peran, atau status akun
 */
export async function updateAccountData(
  userId: string,
  data: {
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    inactiveReason?: string | null;
  }
): Promise<void> {
  if ((userId === 'usr-fatih-patak-dev' || userId === 'usr-founder-patak-id') && data.status === 'INACTIVE') {
    throw new Error('Akun Developer dan Founder tidak dapat dinonaktifkan.');
  }
  const payloadToUpdate = { ...data };
  if (payloadToUpdate.name) {
    payloadToUpdate.name = formatPersonName(payloadToUpdate.name);
  }
  const docRef = doc(db, 'system_users', userId);
  await updateDoc(docRef, payloadToUpdate);
}

/**
 * Developer menghapus akun dari sistem
 */
export async function deleteAccountPermanently(userId: string): Promise<void> {
  if (userId === 'usr-fatih-patak-dev' || userId === 'usr-founder-patak-id') {
    throw new Error('Akun Developer dan Founder dilindungi dan tidak dapat dihapus.');
  }
  const docRef = doc(db, 'system_users', userId);
  await deleteDoc(docRef);
}
