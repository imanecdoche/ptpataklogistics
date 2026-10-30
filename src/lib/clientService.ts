import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, ClientType } from '@/types/database';
import { formatPhoneNumber } from '@/lib/phoneUtils';

/**
 * Mendeteksi tipe klien secara otomatis dari awalan nama:
 * PT -> PT, CV -> CV, UD -> UD, selain itu dianggap perorangan/mandor.
 */
export function detectClientType(name: string): ClientType {
  if (!name) return 'PERORANGAN';
  const clean = name.trim().toUpperCase();
  if (clean.startsWith('PT ') || clean === 'PT') return 'PT';
  if (clean.startsWith('CV ') || clean === 'CV') return 'CV';
  if (clean.startsWith('UD ') || clean === 'UD') return 'UD';
  return 'PERORANGAN';
}

/**
 * Helper untuk format satu kata: mendukung Title Case & pembakuan PT/CV/UD/Tbk
 * serta mempertahankan tanda kurung buka/tutup ( )
 */
function formatWordWithParen(token: string): string {
  if (!token) return '';
  const startsWithParen = token.startsWith('(');
  const endsWithParen = token.endsWith(')');
  const core = token.replace(/[()]/g, '');
  if (!core) return token;

  const upper = core.toUpperCase();
  let formatted = '';
  if (['PT', 'CV', 'UD', 'KM', 'TBK'].includes(upper)) {
    formatted = upper === 'TBK' ? 'Tbk' : upper;
  } else {
    formatted = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
  }

  if (startsWithParen) formatted = '(' + formatted;
  if (endsWithParen) formatted = formatted + ')';
  return formatted;
}

/**
 * Membersihkan input dan hanya mengizinkan huruf alfabet (A-Z, a-z), spasi, dan tanda kurung ( ).
 * Menghapus seluruh angka, simbol aneh, dan tanda baca lain.
 */
export function sanitizeClientNameInput(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z\s()]/g, '');
}

/**
 * Standardisasi format nama klien secara real-time saat pengguna mengetik (live input).
 * Mengizinkan huruf, spasi, dan tanda kurung ( ) untuk nama mandor/proyek perorangan.
 * Otomatis Title Case & huruf kapital PT/CV/UD tanpa titik, serta menjaga trailing space.
 */
export function formatClientNameLive(input: string): string {
  if (!input) return '';

  // 1. Larangan simbol aneh & angka: hanya izinkan huruf, spasi, dan tanda kurung ( )
  const sanitized = input.replace(/[^a-zA-Z\s()]/g, '');

  // 2. Cek apakah ada spasi di akhir (pengguna sedang menekan spasi untuk kata berikutnya)
  const hasTrailingSpace = /\s$/.test(sanitized);

  // 3. Pisahkan per kata
  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return hasTrailingSpace ? ' ' : '';
  }

  // 4. Format setiap kata
  const formattedWords = words.map(formatWordWithParen);

  const joined = formattedWords.join(' ');
  return hasTrailingSpace ? joined + ' ' : joined;
}

/**
 * Standardisasi format nama klien final (Title Case, huruf kapital entitas tanpa titik, kurung lokasi rapi)
 */
export function formatClientName(input: string): string {
  if (!input) return '';

  const sanitized = input.replace(/[^a-zA-Z\s()]/g, ' ');
  return sanitized
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(formatWordWithParen)
    .join(' ');
}

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'cli-pt-maju-karya',
    name: 'PT Maju Karya',
    type: 'PT',
    picName: 'Pak Joko',
    phoneNumber: '+62 812-3456-7890',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cli-pt-karya-beton-perkasa',
    name: 'PT Karya Beton Perkasa',
    type: 'PT',
    picName: 'Pak Bambang',
    phoneNumber: '+62 813-9876-5432',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cli-pt-jaya-konstruksi-abadi',
    name: 'PT Jaya Konstruksi Abadi',
    type: 'PT',
    picName: 'Pak Hendra',
    phoneNumber: '+62 821-5678-1234',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cli-pt-sinar-agung-properti',
    name: 'PT Sinar Agung Properti',
    type: 'PT',
    picName: 'Ibu Ratna',
    phoneNumber: '+62 856-7891-2345',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cli-pak-haji-ridwan',
    name: 'Pak Haji Ridwan (Proyek Cilegon)',
    type: 'PERORANGAN',
    picName: 'Pak Haji Ridwan',
    phoneNumber: '+62 811-2233-4455',
    createdAt: new Date().toISOString()
  }
];

/**
 * Mengambil daftar master klien dari Firestore.
 * Jika koleksi masih kosong, otomatis melakukan seeding klien awal.
 */
export async function getClients(): Promise<Client[]> {
  const clientsCol = collection(db, 'clients');
  const snap = await getDocs(clientsCol);

  if (snap.empty) {
    const seeded: Client[] = [];
    for (const c of DEFAULT_CLIENTS) {
      const docRef = doc(clientsCol, c.id);
      await setDoc(docRef, {
        name: c.name,
        type: c.type || detectClientType(c.name),
        picName: c.picName || '',
        phoneNumber: c.phoneNumber || '',
        createdAt: c.createdAt
      }, { merge: true });
      seeded.push(c);
    }
    return seeded;
  }

  // Deduplikasi in-memory berdasarkan nama unik
  const uniqueMap = new Map<string, Client>();
  for (const d of snap.docs) {
    const data = d.data() as Omit<Client, 'id'>;
    const item: Client = { 
      id: d.id, 
      ...data,
      type: data.type || detectClientType(data.name)
    };
    const key = item.name.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  const list = Array.from(uniqueMap.values());
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/**
 * Mendaftarkan Klien / Mitra baru ke database master
 */
export async function createClient(data: {
  name: string;
  type?: ClientType;
  picName?: string;
  phoneNumber?: string;
}): Promise<Client> {
  const formattedName = formatClientName(data.name);
  const clientType = data.type || detectClientType(formattedName);
  const nowIso = new Date().toISOString();

  // Buat slug deterministik dari nama
  const slug = formattedName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const customId = `cli-${slug || Math.random().toString(36).substring(2, 9)}`;

  const clientData = {
    name: formattedName,
    type: clientType,
    picName: data.picName?.trim() || '',
    phoneNumber: data.phoneNumber ? formatPhoneNumber(data.phoneNumber) : '',
    createdAt: nowIso
  };

  const docRef = doc(db, 'clients', customId);
  await setDoc(docRef, clientData, { merge: true });

  return {
    id: customId,
    ...clientData
  };
}

/**
 * Listener real-time koleksi clients
 */
export function subscribeClients(callback: (clients: Client[]) => void): () => void {
  const clientsCol = collection(db, 'clients');
  const q = query(clientsCol, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    snap => {
      const list: Client[] = snap.docs.map(d => {
        const data = d.data() as Omit<Client, 'id'>;
        return {
          id: d.id,
          ...data,
          type: data.type || detectClientType(data.name)
        };
      });
      callback(list);
    },
    err => {
      console.warn('Real-time query clients gagal, fallback ke fetch biasa:', err);
      getClients().then(callback).catch(console.error);
    }
  );
}

/**
 * Menghapus dokumen klien dari database
 */
export async function deleteClient(id: string): Promise<void> {
  const docRef = doc(db, 'clients', id);
  await deleteDoc(docRef);
}

/**
 * Memperbarui data klien yang sudah ada
 */
export async function updateClient(
  id: string,
  data: {
    name: string;
    picName?: string;
    phoneNumber?: string;
  }
): Promise<void> {
  const formattedName = formatClientName(data.name);
  const clientType = detectClientType(formattedName);
  const docRef = doc(db, 'clients', id);

  await setDoc(
    docRef,
    {
      name: formattedName,
      type: clientType,
      picName: data.picName?.trim() || '',
      phoneNumber: data.phoneNumber ? formatPhoneNumber(data.phoneNumber) : ''
    },
    { merge: true }
  );
}

