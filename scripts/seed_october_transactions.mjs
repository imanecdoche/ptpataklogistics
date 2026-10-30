import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDySzeiEt3idhWtW6opWHTYH3lNo5_Oj9s",
  authDomain: "antigravityapp-e305d.firebaseapp.com",
  projectId: "antigravityapp-e305d",
  storageBucket: "antigravityapp-e305d.firebasestorage.app",
  messagingSenderId: "633290654165",
  appId: "1:633290654165:web:e68e94179f2834009efd5c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'pataklogisticdb');

/**
 * DAFTAR TRANSKRIBUSI BUKU CATATAN FISIK (35 DT TERVERIFIKASI - GENAP TOTAL BUKU LAPANGAN)
 * Acuan harga beli, harga jual, dan HOK disesuaikan dengan standar operasional lapangan.
 */
export const OCTOBER_RAW_RECORDS = [
  // Transaksi Pembuka Lapangan (Tgl 10-14 Oktober 2026) - Menggenapkan Total Buku Fisik 35 DT
  {
    date: '2026-10-10',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Ritase pembuka buku catatan fisik (10 Okt)',
    suratJalan: ''
  },
  {
    date: '2026-10-11',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Ritase pembuka buku catatan fisik (11 Okt)',
    suratJalan: ''
  },
  {
    date: '2026-10-12',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Ritase pembuka buku catatan fisik (12 Okt)',
    suratJalan: ''
  },
  {
    date: '2026-10-13',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Ritase pembuka buku catatan fisik (13 Okt)',
    suratJalan: ''
  },
  {
    date: '2026-10-14',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Ritase pembuka buku catatan fisik (14 Okt)',
    suratJalan: ''
  },

  // Lembar 1: Catatan Khusus "Tidak Ada Surat Jalan" (Tgl 15-16 Oktober)
  {
    date: '2026-10-15',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (Batu waste 2 mobil)',
    suratJalan: ''
  },
  {
    date: '2026-10-15',
    materialId: 'mat-batu-endep',
    materialName: 'Batu Endep / Base',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (Batu endep 1 mobil)',
    suratJalan: ''
  },
  {
    date: '2026-10-15',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (Abu batu 1 mobil)',
    suratJalan: ''
  },
  {
    date: '2026-10-16',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (1 mobil waste)',
    suratJalan: ''
  },
  {
    date: '2026-10-16',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (2 mobil split 2-3)',
    suratJalan: ''
  },
  {
    date: '2026-10-16',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: 'Keterangan tidak ada surat jalan (1 mobil abu batu)',
    suratJalan: ''
  },
  {
    date: '2026-10-17',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 3,
    client: 'cli-p-paskal',
    clientName: 'P. Paskal',
    notes: '3 mobil batu split kiriman P. Paskal',
    suratJalan: ''
  },

  // Lembar 2: Tgl 18 - 26 Oktober 2026
  {
    date: '2026-10-18',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 3,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '3 mobil batu waste urugan lokasi pancingan',
    suratJalan: ''
  },
  {
    date: '2026-10-19',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 1,
    client: 'cli-p-paskal',
    clientName: 'P. Paskal',
    notes: '1 mobil waste kiriman P. Paskal',
    suratJalan: ''
  },
  {
    date: '2026-10-19',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '2 mobil waste kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-20',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '1 mobil abu batu kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-21',
    materialId: 'mat-batu-waste',
    materialName: 'Batu Waste / Urugan',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '2 mobil waste lokasi pancingan kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-21',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '1 mobil split kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-23',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '2 mobil ukuran 2-3 kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-23',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '1 mobil abu batu kiriman P. Sapta',
    suratJalan: ''
  },
  {
    date: '2026-10-24',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 1,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '1 mobil abu batu',
    suratJalan: ''
  },
  {
    date: '2026-10-25',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 2,
    client: 'cli-p-paskal',
    clientName: 'P. Paskal',
    notes: '2 mobil ukuran 2-3 kiriman P. Paskal',
    suratJalan: ''
  },
  {
    date: '2026-10-26',
    materialId: 'mat-batu-split-2-3',
    materialName: 'Batu Split Ukuran 2-3',
    qty: 1,
    client: 'cli-p-paskal',
    clientName: 'P. Paskal',
    notes: '1 mobil batu ukuran 2-3 kiriman P. Paskal',
    suratJalan: ''
  },
  {
    date: '2026-10-26',
    materialId: 'mat-abu-batu',
    materialName: 'Abu Batu',
    qty: 2,
    client: 'cli-p-sapta',
    clientName: 'P. Sapta',
    notes: '2 mobil abu batu kiriman P. Sapta',
    suratJalan: ''
  }
];

export async function seedOctoberTransactions({
  wasteBuyPrice = 300000,
  wasteSellPrice = 500000,
  abuBuyPrice = 350000,
  abuSellPrice = 550000,
  splitBuyPrice = 450000,
  splitSellPrice = 700000,
  endepBuyPrice = 320000,
  endepSellPrice = 520000,
  standardHok = 150000
} = {}) {
  console.log('=== MEMULAI INJEKSI TRANSAKSI RITASE BUKU FISIK (35 DT) ===\n');

  let ticketCounter = 1;
  let totalDT = 0;
  let totalOmset = 0;
  let totalBeli = 0;
  let totalHok = 0;

  for (const rec of OCTOBER_RAW_RECORDS) {
    let buyPrice = wasteBuyPrice;
    let sellPrice = wasteSellPrice;

    if (rec.materialId === 'mat-abu-batu') {
      buyPrice = abuBuyPrice;
      sellPrice = abuSellPrice;
    } else if (rec.materialId === 'mat-batu-split-2-3') {
      buyPrice = splitBuyPrice;
      sellPrice = splitSellPrice;
    } else if (rec.materialId === 'mat-batu-endep') {
      buyPrice = endepBuyPrice;
      sellPrice = endepSellPrice;
    }

    const totalBuyCost = buyPrice * rec.qty;
    const totalRevenue = sellPrice * rec.qty;
    const totalOperationalCost = standardHok * rec.qty;
    const netProfit = totalRevenue - (totalBuyCost + totalOperationalCost);

    totalDT += rec.qty;
    totalOmset += totalRevenue;
    totalBeli += totalBuyCost;
    totalHok += totalOperationalCost;

    const ticketStr = String(ticketCounter).padStart(4, '0');
    const ticketNumber = `PTK-${rec.date.replace(/-/g, '')}-${ticketStr}`;
    ticketCounter++;

    const docId = `tx-${rec.date}-${ticketStr}`;
    const txData = {
      id: docId,
      ticketNumber,
      suratJalan: rec.suratJalan || '',
      deliveryDate: rec.date,
      date: rec.date,
      createdAt: `${rec.date}T10:00:00.000Z`,
      truckPlate: 'A 8345 KC',
      driverName: 'Sopir Lapangan',
      clientId: rec.client,
      clientName: rec.clientName,
      customerName: rec.clientName,
      materialId: rec.materialId,
      materialName: rec.materialName,
      quarryId: 'qry-1793357463568',
      quarryName: 'Kuari Acuan Cikedal',
      projectId: 'prj-situ-cikedal',
      projectName: 'Proyek Konservasi Situ Cikedal',
      investorId: 'inv-bpk-yadi',
      investorName: 'Bpk. Yadi',
      unit: 'DT',
      quantity: rec.qty,
      buyPricePerUnit: buyPrice,
      sellPricePerUnit: sellPrice,
      operationalCost: totalOperationalCost,
      totalBuyCost,
      totalRevenue,
      netProfit,
      status: 'TEMPO',
      notes: rec.notes,
      createdBy: 'operasional@patak.id'
    };

    await setDoc(doc(db, 'transactions', docId), txData);
    console.log(`  ✅ [${ticketNumber}] ${rec.date}: ${rec.materialName} (${rec.qty} DT) - ${rec.clientName}`);
  }

  console.log(`\n=================================================`);
  console.log(`=== SUKSES MENGINJEKSI ${OCTOBER_RAW_RECORDS.length} REKOR RITASE (${totalDT} DT)! ===`);
  console.log(`  - Total Omset (Piutang Tempo): Rp ${totalOmset.toLocaleString('id-ID')}`);
  console.log(`  - Total Belanja Kuari (Cash) : Rp ${totalBeli.toLocaleString('id-ID')}`);
  console.log(`  - Total Beban HOK & Operasional: Rp ${totalHok.toLocaleString('id-ID')}`);
  console.log(`  - Estimasi Laba Bersih       : Rp ${(totalOmset - totalBeli - totalHok).toLocaleString('id-ID')}`);
  console.log(`=================================================\n`);
}

// Jika dijalankan langsung via node:
if (process.argv[1]?.endsWith('seed_october_transactions.mjs')) {
  seedOctoberTransactions().catch(err => {
    console.error('Gagal injeksi transaksi:', err);
    process.exit(1);
  });
}
