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

import {
  formatEntityName as formatClientName,
  formatEntityNameLive as formatClientNameLive,
  formatPersonName
} from '@/lib/nameUtils';

export { formatClientName, formatClientNameLive };

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
    picName: data.picName ? formatPersonName(data.picName) : '',
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
      picName: data.picName ? formatPersonName(data.picName) : '',
      phoneNumber: data.phoneNumber ? formatPhoneNumber(data.phoneNumber) : ''
    },
    { merge: true }
  );
}

