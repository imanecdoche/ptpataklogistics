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

async function migrateOctoberRealData() {
  console.log('=== MEMULAI MIGRASI DATA RIIL OKTOBER 2026 ===\n');

  // 1. Update Modal Awal Bpk. Yadi -> Rp 26.500.000 (Per 7 Oktober 2026)
  console.log('[1/4] Mengupdate Modal Investor Bpk. Yadi -> Rp 26.500.000...');
  const yadiDoc = {
    id: 'inv-bpk-yadi',
    name: 'Bpk. Yadi',
    phoneNumber: '+62 812-3456-7890',
    bankAccount: 'BCA - Rekening Investor Bpk. Yadi',
    initialCapital: 26500000,
    currentCashBalance: 26500000,
    notes: 'Pemodal Tunggal Aktif PT Patak Abadi Jaya (Mendanai Proyek Konservasi Situ Cikedal & Cipeucang)',
    createdAt: '2026-10-07T00:00:00.000Z'
  };
  await setDoc(doc(db, 'investors', yadiDoc.id), yadiDoc);
  console.log('  ✅ Investor Bpk. Yadi berhasil diupdate ke Rp 26.500.000 (07 Okt 2026).');

  // Update Proyek Saldo Awal Sesuai Modal Yadi
  await setDoc(doc(db, 'projects', 'prj-situ-cikedal'), {
    initialDeposit: 13250000,
    currentBalance: 13250000
  }, { merge: true });
  await setDoc(doc(db, 'projects', 'prj-cipeucang'), {
    initialDeposit: 13250000,
    currentBalance: 13250000
  }, { merge: true });
  console.log('  ✅ Saldo modal awal kedua proyek diselaraskan.');

  // 2. Sinkronisasi Buku Kas Induk (cash_ledger)
  console.log('\n[2/4] Menyinkronkan Buku Kas Induk...');
  
  // Setoran Modal Yadi
  const yadiLedger = {
    id: 'ledger-modal-bpk-yadi',
    date: '2026-10-07T00:00:00.000Z',
    type: 'MODAL_AWAL',
    amount: 26500000,
    isCredit: true,
    runningBalance: 26500000,
    referenceId: 'INVESTASI-07-OKT',
    description: 'Setoran Modal Investasi Bpk. Yadi (Situ Cikedal & Cipeucang)',
    createdByName: 'Papah / Management'
  };
  await setDoc(doc(db, 'cash_ledger', yadiLedger.id), yadiLedger);
  console.log('  ✅ Ledger Modal Bpk. Yadi: Rp 26.500.000 (07 Okt 2026)');

  // Hutang Perseroan Pei
  const peiLedger = {
    id: 'ledger-debt-bpk-pei',
    date: '2026-10-08T00:00:00.000Z',
    type: 'HUTANG_PIHAK_KETIGA',
    amount: 18000000,
    isCredit: true,
    runningBalance: 44500000,
    referenceId: 'HUTANG-PT-PEI',
    description: 'Pinjaman Pihak Ketiga / Hutang Perseroan Bpk. Pei',
    createdByName: 'Papah / Management'
  };
  await setDoc(doc(db, 'cash_ledger', peiLedger.id), peiLedger);
  console.log('  ✅ Ledger Hutang Perseroan Bpk. Pei: Rp 18.000.000 (08 Okt 2026)');

  // Penerimaan Pembayaran Proyek Rp 20.000.000 (30 Oktober 2026)
  const projectPaymentLedger = {
    id: 'ledger-payment-proyek-cikedal-20261030',
    date: '2026-10-30T14:36:00.000Z',
    type: 'PELUNASAN_PIUTANG',
    amount: 20000000,
    isCredit: true,
    runningBalance: 64500000,
    referenceId: 'TERMIN-PROYEK-20261030',
    description: 'Pembayaran Termin / Pelunasan Piutang dari Proyek Konservasi Situ Cikedal',
    createdByName: 'Papah / Operasional'
  };
  await setDoc(doc(db, 'cash_ledger', projectPaymentLedger.id), projectPaymentLedger);
  console.log('  ✅ Ledger Pembayaran dari Proyek: Rp 20.000.000 (30 Okt 2026)');

  // 3. Mendaftarkan Master Komoditas Riil dari Catatan Buku
  console.log('\n[3/4] Mendaftarkan Komoditas Material dari Catatan Lapangan...');
  const commodities = [
    {
      id: 'mat-batu-waste',
      name: 'Batu Waste / Urugan',
      unit: 'DT',
      description: 'Material batu waste urugan untuk pemadatan dan pengurukan lokasi',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mat-abu-batu',
      name: 'Abu Batu',
      unit: 'DT',
      description: 'Material abu batu saring untuk pengisi dan perata landasan',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mat-batu-split-2-3',
      name: 'Batu Split Ukuran 2-3',
      unit: 'DT',
      description: 'Batu pecah split cor ukuran 2-3 cm standar konstruksi',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mat-batu-endep',
      name: 'Batu Endep / Base',
      unit: 'DT',
      description: 'Batu endep / agregat base untuk dasar pondasi jalan',
      createdAt: new Date().toISOString()
    }
  ];

  for (const c of commodities) {
    await setDoc(doc(db, 'material_commodities', c.id), c);
    console.log(`  ✅ Komoditas terdaftar: ${c.name} (${c.unit})`);
  }

  // 4. Mendaftarkan Mitra Lapangan (P. Sapta & P. Paskal)
  console.log('\n[4/4] Mendaftarkan Mitra Rekanan Lapangan...');
  const clients = [
    {
      id: 'cli-p-sapta',
      name: 'P. Sapta',
      type: 'PERORANGAN',
      phoneNumber: '+62 812-0000-0001',
      address: 'Pandeglang, Banten',
      picName: 'Pak Sapta',
      notes: 'Pengirim / Rekanan Operasional Lapangan Proyek Situ Cikedal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cli-p-paskal',
      name: 'P. Paskal',
      type: 'PERORANGAN',
      phoneNumber: '+62 812-0000-0002',
      address: 'Pandeglang, Banten',
      picName: 'Pak Paskal',
      notes: 'Pengirim / Rekanan Operasional Lapangan Proyek Situ Cikedal',
      createdAt: new Date().toISOString()
    }
  ];

  for (const cl of clients) {
    await setDoc(doc(db, 'clients', cl.id), cl);
    console.log(`  ✅ Mitra terdaftar: ${cl.name} (${cl.type})`);
  }

  console.log('\n=== MIGRASI MASTER DATA RIIL SELESAI DENGAN SUKSES! ===');
  process.exit(0);
}

migrateOctoberRealData().catch(err => {
  console.error('Gagal migrasi data:', err);
  process.exit(1);
});
