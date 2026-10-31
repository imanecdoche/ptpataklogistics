import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MaterialItem, DispatchTransaction, UnitType } from '@/types/database';
import { updateProjectBalance } from '@/lib/projectService';

const DEFAULT_MATERIALS: (Omit<MaterialItem, 'id' | 'createdAt'> & { id: string })[] = [
  { id: 'mat-batu-belah', name: 'Batu Belah (Pondasi)', unit: 'DT', defaultBuyPrice: 650000, defaultSellPrice: 850000 },
  { id: 'mat-pasir-extra', name: 'Pasir Extra Cor', unit: 'DT', defaultBuyPrice: 700000, defaultSellPrice: 950000 },
  { id: 'mat-abu-batu', name: 'Abu Batu Screen', unit: 'DT', defaultBuyPrice: 600000, defaultSellPrice: 800000 },
  { id: 'mat-makadam', name: 'Makadam / Base Course', unit: 'Ton', defaultBuyPrice: 85000, defaultSellPrice: 120000 }
];

/**
 * Mengambil daftar master material.
 * Menggunakan ID deterministik dan dedup in-memory untuk mencegah duplikasi data.
 */
export async function getMaterials(): Promise<MaterialItem[]> {
  const materialsCol = collection(db, 'materials');
  const snap = await getDocs(materialsCol);

  if (snap.empty) {
    const seeded: MaterialItem[] = [];
    for (const m of DEFAULT_MATERIALS) {
      const now = new Date().toISOString();
      const docRef = doc(materialsCol, m.id);
      await setDoc(docRef, {
        name: m.name,
        unit: m.unit,
        defaultBuyPrice: m.defaultBuyPrice,
        defaultSellPrice: m.defaultSellPrice,
        createdAt: now
      }, { merge: true });
      seeded.push({ ...m, createdAt: now });
    }
    return seeded;
  }

  // Deduplikasi in-memory berdasarkan nama material agar dropdown selalu bersih dan unik
  const uniqueMap = new Map<string, MaterialItem>();
  for (const d of snap.docs) {
    const item = { id: d.id, ...(d.data() as Omit<MaterialItem, 'id'>) };
    const key = item.name.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Generate nomor tiket ritase format: PTK-YYYYMMDD-XXXX
 */
export function generateTicketNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PTK-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Mendapatkan saldo terakhir dari cash_ledger untuk menghitung runningBalance
 */
async function getLatestCashBalance(): Promise<number> {
  try {
    const ledgerCol = collection(db, 'cash_ledger');
    const q = query(ledgerCol, orderBy('date', 'desc'));
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

export interface CreateDispatchPayload {
  ticketNumber?: string;
  suratJalan?: string; // Physical waybill number (Surat Jalan fisik kuari/lapangan)
  deliveryDate: string; // YYYY-MM-DD
  truckPlate: string;
  driverName?: string;
  clientId?: string;
  clientName?: string;
  customerName: string;
  quarryId?: string;
  quarryName?: string;
  projectId?: string;
  projectName?: string;
  investorId?: string;
  investorName?: string;
  materialId: string;
  materialName: string;
  unit: UnitType;
  quantity: number;
  buyPricePerUnit: number;
  sellPricePerUnit: number;
  operationalCost: number;
  notes?: string;
  date?: string;
}

/**
 * Menyimpan tiket ritase baru dan otomatis mencatat mutasi kas keluar di cash_ledger
 */
export async function createDispatchTransaction(
  payload: CreateDispatchPayload,
  userEmail: string
): Promise<string> {
  const ticketNumber = payload.ticketNumber || generateTicketNumber();
  const nowIso = new Date().toISOString();
  const deliveryDate = payload.deliveryDate || nowIso.slice(0, 10);

  const totalBuyCost = payload.quantity * payload.buyPricePerUnit;
  const totalRevenue = payload.quantity * payload.sellPricePerUnit;
  const netProfit = totalRevenue - (totalBuyCost + payload.operationalCost);

  const clientName = payload.clientName?.trim() || payload.customerName.trim();

  const txData: Omit<DispatchTransaction, 'id'> = {
    ticketNumber,
    suratJalan: payload.suratJalan?.trim() || '',
    deliveryDate,
    createdAt: nowIso,
    date: nowIso,
    truckPlate: payload.truckPlate.toUpperCase().trim(),
    driverName: payload.driverName?.trim() || '',
    clientId: payload.clientId || '',
    clientName,
    customerName: clientName,
    quarryId: payload.quarryId || '',
    quarryName: payload.quarryName?.trim() || '',
    projectId: payload.projectId || '',
    projectName: payload.projectName?.trim() || '',
    investorId: payload.investorId || '',
    investorName: payload.investorName?.trim() || '',
    materialId: payload.materialId,
    materialName: payload.materialName,
    unit: payload.unit,
    quantity: payload.quantity,
    buyPricePerUnit: payload.buyPricePerUnit,
    sellPricePerUnit: payload.sellPricePerUnit,
    operationalCost: payload.operationalCost,
    totalBuyCost,
    totalRevenue,
    netProfit,
    status: 'TEMPO',
    notes: payload.notes?.trim() || '',
    createdBy: userEmail
  };

  // 1. Simpan ke koleksi transactions
  const txRef = await addDoc(collection(db, 'transactions'), txData);

  // 2. Integrasi Buku Kas (Cash Ledger): Beban Beli Pokok & Beban Operasional
  let currentBalance = await getLatestCashBalance();
  const ledgerCol = collection(db, 'cash_ledger');

  // Catat Kas Keluar Belanja Material (Tunai Kuari)
  if (totalBuyCost > 0) {
    currentBalance -= totalBuyCost;
    await addDoc(ledgerCol, {
      date: nowIso,
      type: 'BELI_MATERIAL',
      amount: totalBuyCost,
      isCredit: false,
      runningBalance: currentBalance,
      referenceId: ticketNumber,
      description: `Beli ${payload.materialName} (${payload.quantity} ${payload.unit}) - ${ticketNumber}`,
      createdByName: userEmail
    });
  }

  // Catat Kas Keluar Operasional Lapangan (Solar, Supir, Retribusi)
  if (payload.operationalCost > 0) {
    currentBalance -= payload.operationalCost;
    await addDoc(ledgerCol, {
      date: nowIso,
      type: 'BIAYA_OPERASIONAL',
      amount: payload.operationalCost,
      isCredit: false,
      runningBalance: currentBalance,
      referenceId: ticketNumber,
      description: `Beban Operasional & HOK: Truk ${payload.truckPlate.toUpperCase()} (Sopir: ${payload.driverName || 'Supir'}) - ${ticketNumber}`,
      createdByName: userEmail
    });
  }

  // 3. Potong Saldo Kas Berjalan Proyek Terkait
  if (payload.projectId) {
    const projectExpense = totalBuyCost + payload.operationalCost;
    if (projectExpense > 0) {
      await updateProjectBalance(payload.projectId, -projectExpense);
    }
  }

  return txRef.id;
}

/**
 * Menandai transaksi ritase menjadi LUNAS dan mencatat Kas Masuk pelunasan piutang di cash_ledger
 */
export async function settleTransaction(
  transactionId: string,
  ticketNumber: string,
  totalRevenue: number,
  userEmail: string,
  projectId?: string
): Promise<void> {
  const txDoc = doc(db, 'transactions', transactionId);
  const nowIso = new Date().toISOString();

  await updateDoc(txDoc, {
    status: 'LUNAS',
    settledAt: nowIso
  });

  // Jika projectId belum dipassing, coba baca dari dokumen transaksi
  let targetProjectId = projectId;
  if (!targetProjectId) {
    try {
      const snap = await getDoc(txDoc);
      if (snap.exists()) {
        targetProjectId = snap.data()?.projectId;
      }
    } catch (e) {
      console.warn('Gagal membaca projectId transaksi:', e);
    }
  }

  // Tambah Saldo Kas Proyek saat piutang dilunasi
  if (targetProjectId && totalRevenue > 0) {
    await updateProjectBalance(targetProjectId, totalRevenue);
  }

  // Catat Pelunasan Piutang ke Kas Masuk
  let currentBalance = await getLatestCashBalance();
  currentBalance += totalRevenue;

  await addDoc(collection(db, 'cash_ledger'), {
    date: nowIso,
    type: 'PELUNASAN_PIUTANG',
    amount: totalRevenue,
    isCredit: true,
    runningBalance: currentBalance,
    referenceId: ticketNumber,
    description: `Pelunasan Piutang Konsumen - ${ticketNumber}`,
    createdByName: userEmail
  });
}

/**
 * Listener real-time transaksi ritase berdasarkan Tanggal Jalan (deliveryDate).
 * Menggunakan exact match string 'YYYY-MM-DD' sehingga kebal dari offset/gap timezone UTC vs WIB.
 */
export function subscribeTransactionsByDate(
  dateStr: string, // YYYY-MM-DD
  callback: (transactions: DispatchTransaction[]) => void
): () => void {
  const txCol = collection(db, 'transactions');
  const q = query(txCol, where('deliveryDate', '==', dateStr));

  return onSnapshot(
    q,
    snapshot => {
      const list: DispatchTransaction[] = snapshot.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          deliveryDate: data.deliveryDate || (data.date ? data.date.slice(0, 10) : dateStr),
          createdAt: data.createdAt || data.date || new Date().toISOString()
        };
      });
      // Urutkan transaksi berdasarkan waktu input terbaru di atas
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    },
    err => {
      console.warn('Query deliveryDate spesifik gagal, fallback ke fetch semua & filter lokal:', err);
      return onSnapshot(txCol, snap => {
        const all: DispatchTransaction[] = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            ...data,
            deliveryDate: data.deliveryDate || (data.date ? data.date.slice(0, 10) : ''),
            createdAt: data.createdAt || data.date || ''
          };
        });
        const filtered = all.filter(item => item.deliveryDate === dateStr);
        filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(filtered);
      });
    }
  );
}

export interface KnownTruck {
  plate: string;
  lastDriverName?: string;
  count: number;
}

/**
 * Mengambil / mendengarkan riwayat seluruh armada truk unik yang pernah tersimpan di transaksi
 * Termasuk nama sopir terakhir yang pernah membawa truk tersebut
 */
export function subscribeKnownTrucks(callback: (trucks: KnownTruck[]) => void): () => void {
  const txCol = collection(db, 'transactions');
  return onSnapshot(
    txCol,
    snap => {
      const truckMap = new Map<string, { lastDriverName?: string; count: number; latestDate: string }>();

      for (const d of snap.docs) {
        const data = d.data() as Partial<DispatchTransaction>;
        const plate = data.truckPlate?.trim().toUpperCase();
        if (!plate) continue;

        const driver = data.driverName?.trim();
        const date = data.createdAt || data.date || '';

        const existing = truckMap.get(plate);
        if (!existing) {
          truckMap.set(plate, {
            lastDriverName: driver || undefined,
            count: 1,
            latestDate: date
          });
        } else {
          existing.count += 1;
          if (date >= existing.latestDate && driver) {
            existing.lastDriverName = driver;
            existing.latestDate = date;
          }
        }
      }

      const list: KnownTruck[] = Array.from(truckMap.entries()).map(([plate, info]) => ({
        plate,
        lastDriverName: info.lastDriverName,
        count: info.count
      }));

      // Urutkan berdasarkan frekuensi transaksi armada terbanyak
      list.sort((a, b) => b.count - a.count);
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe known trucks:', err);
    }
  );
}

export interface KnownDriver {
  name: string;
  defaultPlate?: string;
  source: 'MASTER' | 'TRANSACTION';
  count: number;
}

/**
 * Mengambil dan mendengarkan daftar supir gabungan dari master_drivers dan riwayat transaksi
 */
export function subscribeKnownDrivers(callback: (drivers: KnownDriver[]) => void): () => void {
  const driverMap = new Map<string, KnownDriver>();

  // 1. Listen master_drivers
  const unsubMaster = onSnapshot(collection(db, 'master_drivers'), snap => {
    for (const d of snap.docs) {
      const data = d.data();
      const name = (data.name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      driverMap.set(key, {
        name,
        defaultPlate: data.defaultPlate?.trim() || undefined,
        source: 'MASTER',
        count: 100 // Berikan prioritas tinggi untuk master terdaftar
      });
    }
    emit();
  });

  // 2. Listen transactions
  const unsubTx = onSnapshot(collection(db, 'transactions'), snap => {
    for (const d of snap.docs) {
      const data = d.data() as Partial<DispatchTransaction>;
      const driver = data.driverName?.trim();
      if (!driver) continue;
      const key = driver.toLowerCase();

      const existing = driverMap.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.defaultPlate && data.truckPlate) {
          existing.defaultPlate = data.truckPlate.trim();
        }
      } else {
        driverMap.set(key, {
          name: driver,
          defaultPlate: data.truckPlate?.trim() || undefined,
          source: 'TRANSACTION',
          count: 1
        });
      }
    }
    emit();
  });

  const emit = () => {
    const list = Array.from(driverMap.values());
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    callback(list);
  };

  return () => {
    unsubMaster();
    unsubTx();
  };
}

export interface UpdateDispatchPayload {
  suratJalan?: string;
  deliveryDate: string; // YYYY-MM-DD
  truckPlate: string;
  driverName?: string;
  clientId?: string;
  clientName?: string;
  customerName: string;
  quarryId?: string;
  quarryName?: string;
  projectId?: string;
  projectName?: string;
  materialId: string;
  materialName: string;
  unit: UnitType;
  quantity: number;
  buyPricePerUnit: number;
  sellPricePerUnit: number;
  operationalCost: number;
  notes?: string;
  status?: 'TEMPO' | 'LUNAS';
}

/**
 * Memperbarui tiket ritase dan menyinkronkan catatan mutasi kas terkait di cash_ledger
 */
export async function updateDispatchTransaction(
  transactionId: string,
  ticketNumber: string,
  payload: UpdateDispatchPayload,
  userEmail: string
): Promise<void> {
  const totalBuyCost = payload.quantity * payload.buyPricePerUnit;
  const totalRevenue = payload.quantity * payload.sellPricePerUnit;
  const netProfit = totalRevenue - (totalBuyCost + payload.operationalCost);
  const clientName = payload.clientName?.trim() || payload.customerName.trim();

  const updateData: Partial<DispatchTransaction> = {
    deliveryDate: payload.deliveryDate,
    suratJalan: payload.suratJalan !== undefined ? payload.suratJalan.trim() : '',
    truckPlate: payload.truckPlate.toUpperCase().trim(),
    driverName: payload.driverName?.trim() || '',
    clientId: payload.clientId || '',
    clientName,
    customerName: clientName,
    quarryId: payload.quarryId || '',
    quarryName: payload.quarryName?.trim() || '',
    projectId: payload.projectId || '',
    projectName: payload.projectName?.trim() || '',
    materialId: payload.materialId,
    materialName: payload.materialName,
    unit: payload.unit,
    quantity: payload.quantity,
    buyPricePerUnit: payload.buyPricePerUnit,
    sellPricePerUnit: payload.sellPricePerUnit,
    operationalCost: payload.operationalCost,
    totalBuyCost,
    totalRevenue,
    netProfit,
    notes: payload.notes?.trim() || ''
  };

  if (payload.status) {
    updateData.status = payload.status;
  }

  // 1. Update dokumen transaksi
  const txRef = doc(db, 'transactions', transactionId);
  await updateDoc(txRef, updateData);

  // 2. Sinkronkan mutasi cash_ledger dengan referenceId == ticketNumber
  try {
    const ledgerCol = collection(db, 'cash_ledger');
    const q = query(ledgerCol, where('referenceId', '==', ticketNumber));
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const data = d.data();
      const docRef = doc(db, 'cash_ledger', d.id);

      if (data.type === 'BELI_MATERIAL') {
        await updateDoc(docRef, {
          amount: totalBuyCost,
          description: `Beli ${payload.materialName} (${payload.quantity} ${payload.unit}) - ${ticketNumber}`,
          updatedBy: userEmail
        });
      } else if (data.type === 'BIAYA_OPERASIONAL') {
        await updateDoc(docRef, {
          amount: payload.operationalCost,
          description: `Beban Operasional & HOK: Truk ${payload.truckPlate.toUpperCase()} (Sopir: ${payload.driverName || 'Supir'}) - ${ticketNumber}`,
          updatedBy: userEmail
        });
      } else if (data.type === 'PELUNASAN_PIUTANG') {
        await updateDoc(docRef, {
          amount: totalRevenue,
          description: `Pelunasan Piutang Konsumen - ${ticketNumber}`,
          updatedBy: userEmail
        });
      }
    }
  } catch (err) {
    console.warn('Gagal menyinkronkan cash_ledger saat update tiket:', err);
  }
}

/**
 * Menghapus tiket ritase dari transactions dan menghapus seluruh mutasi kas terkait di cash_ledger
 */
export async function deleteDispatchTransaction(
  transactionId: string,
  ticketNumber: string
): Promise<void> {
  // 1. Hapus transaksi dari transactions
  const txRef = doc(db, 'transactions', transactionId);
  await deleteDoc(txRef);

  // 2. Hapus seluruh mutasi kas terkait di cash_ledger
  try {
    const ledgerCol = collection(db, 'cash_ledger');
    const q = query(ledgerCol, where('referenceId', '==', ticketNumber));
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'cash_ledger', d.id));
    }
  } catch (err) {
    console.warn('Gagal menghapus mutasi cash_ledger saat hapus tiket:', err);
  }
}

/**
 * Mendengarkan seluruh riwayat ritase (All-Time) diurutkan tanggal pengiriman terbaru
 */
export function subscribeAllTransactions(
  callback: (transactions: DispatchTransaction[]) => void
): () => void {
  const txCol = collection(db, 'transactions');
  return onSnapshot(
    txCol,
    snap => {
      const list: DispatchTransaction[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          deliveryDate: data.deliveryDate || (data.date ? data.date.slice(0, 10) : ''),
          createdAt: data.createdAt || data.date || ''
        };
      });
      // Default: Urutkan tanggal jalan terbaru, jika sama urutkan createdAt terbaru
      list.sort((a, b) => {
        const dateDiff = (b.deliveryDate || '').localeCompare(a.deliveryDate || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      callback(list);
    },
    err => {
      console.warn('Gagal subscribe all transactions:', err);
    }
  );
}


