import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc
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

async function migrateMasterData() {
  console.log('=== STARTING PRODUCTION MASTER DATA MIGRATION ===\n');

  // 1. Migrate Investors: Single Active Investor Bpk. Yadi (Rp 30.000.000)
  console.log('[1/4] Migrating collection "investors"...');
  const investorsCol = collection(db, 'investors');
  const existingInvestorsSnap = await getDocs(investorsCol);
  
  for (const invDoc of existingInvestorsSnap.docs) {
    if (invDoc.id !== 'inv-bpk-yadi') {
      console.log(`  Deleting obsolete investor: ${invDoc.id} (${invDoc.data().name})`);
      await deleteDoc(doc(db, 'investors', invDoc.id));
    }
  }

  const bpkYadiInvestor = {
    id: 'inv-bpk-yadi',
    name: 'Bpk. Yadi',
    phoneNumber: '+62 812-3456-7890',
    bankAccount: 'BCA - Rekening Investor Bpk. Yadi',
    initialCapital: 30000000,
    notes: 'Investor Tunggal Aktif PT Patak Abadi Jaya (Mendanai Proyek Situ Cikedal & Proyek Irigasi Cipeucang)',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'investors', bpkYadiInvestor.id), bpkYadiInvestor);
  console.log('  Successfully upserted investor: inv-bpk-yadi (Bpk. Yadi - Rp 30.000.000)');

  // 2. Migrate Projects: Situ Cikedal & Cipeucang as ACTIVE, Menes as COMPLETED
  console.log('\n[2/4] Migrating collection "projects"...');
  const projectsData = [
    {
      id: 'prj-situ-cikedal',
      name: 'Proyek Konservasi Situ Cikedal',
      location: 'Kec. Cikedal, Pandeglang',
      investorId: 'inv-bpk-yadi',
      investorName: 'Bpk. Yadi',
      clientId: 'cli-situ-cikedal',
      clientName: 'PT Mandiri Konstruksi (Situ Cikedal)',
      initialDeposit: 15000000,
      currentBalance: 15000000,
      status: 'ACTIVE',
      notes: 'Penyaluran material batu belah & pasir untuk proyek konservasi Situ Cikedal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prj-cipeucang',
      name: 'Proyek Irigasi Cipeucang',
      location: 'Kec. Cipeucang, Pandeglang',
      investorId: 'inv-bpk-yadi',
      investorName: 'Bpk. Yadi',
      clientId: 'cli-cipeucang',
      clientName: 'PT Cipeucang Sarana Abadi',
      initialDeposit: 15000000,
      currentBalance: 15000000,
      status: 'ACTIVE',
      notes: 'Proyek infrastruktur jembatan & drainase irigasi Cipeucang',
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

  for (const prj of projectsData) {
    await setDoc(doc(db, 'projects', prj.id), prj);
    console.log(`  Upserted project: ${prj.id} -> ${prj.name} [${prj.status}]`);
  }

  // 3. Migrate Cash Ledger: Modal Awal Bpk. Yadi & Hutang Perseroan Bpk. Pei
  console.log('\n[3/4] Migrating collection "cash_ledger"...');
  const yadiLedgerEntry = {
    id: 'ledger-modal-bpk-yadi',
    date: '2026-10-30T06:00:00.000Z',
    type: 'MODAL_AWAL',
    amount: 30000000,
    isCredit: true,
    runningBalance: 30000000,
    referenceId: '',
    description: 'Setoran Modal Awal Investor Bpk. Yadi',
    createdByName: 'System / Management'
  };
  await setDoc(doc(db, 'cash_ledger', yadiLedgerEntry.id), yadiLedgerEntry);
  console.log('  Upserted cash ledger: ledger-modal-bpk-yadi (MODAL_AWAL, Rp 30.000.000, balance: Rp 30.000.000)');

  const peiLedgerEntry = {
    id: 'ledger-debt-bpk-pei',
    date: '2026-10-30T06:05:00.000Z',
    type: 'HUTANG_PIHAK_KETIGA',
    amount: 18000000,
    isCredit: true,
    runningBalance: 48000000,
    referenceId: '',
    description: 'Pinjaman Pihak Ketiga / Hutang Perseroan Bpk. Pei',
    createdByName: 'System / Management'
  };
  await setDoc(doc(db, 'cash_ledger', peiLedgerEntry.id), peiLedgerEntry);
  console.log('  Upserted cash ledger: ledger-debt-bpk-pei (HUTANG_PIHAK_KETIGA, Rp 18.000.000, balance: Rp 48.000.000)');

  // 4. Reconcile route_tariffs project names if any match
  console.log('\n[4/4] Reconciling route_tariffs project references...');
  try {
    const routeSnap = await getDocs(collection(db, 'route_tariffs'));
    let updatedRoutes = 0;
    for (const rDoc of routeSnap.docs) {
      const data = rDoc.data();
      if (data.projectId === 'prj-situ-cikedal' && data.projectName !== 'Proyek Konservasi Situ Cikedal') {
        await updateDoc(doc(db, 'route_tariffs', rDoc.id), {
          projectName: 'Proyek Konservasi Situ Cikedal'
        });
        updatedRoutes++;
      } else if (data.projectId === 'prj-cipeucang' && data.projectName !== 'Proyek Irigasi Cipeucang') {
        await updateDoc(doc(db, 'route_tariffs', rDoc.id), {
          projectName: 'Proyek Irigasi Cipeucang'
        });
        updatedRoutes++;
      }
    }
    console.log(`  Updated ${updatedRoutes} route tariff entries with canonical project names.`);
  } catch (err) {
    console.warn('  Note on route_tariffs reconciliation:', err.message);
  }

  // 5. Verification
  console.log('\n=== RUNNING MIGRATION VERIFICATION ===\n');
  
  // Check investors
  const finalInvestorsSnap = await getDocs(collection(db, 'investors'));
  console.log(`Investors count: ${finalInvestorsSnap.docs.length}`);
  finalInvestorsSnap.docs.forEach(d => console.log('  Investor:', d.id, '=>', d.data().name, `(Capital: Rp ${d.data().initialCapital})`));
  const hasOnlyBpkYadi = finalInvestorsSnap.docs.length === 1 && finalInvestorsSnap.docs[0].id === 'inv-bpk-yadi';
  
  // Check projects
  const finalProjectsSnap = await getDocs(collection(db, 'projects'));
  console.log(`\nProjects count: ${finalProjectsSnap.docs.length}`);
  finalProjectsSnap.docs.forEach(d => console.log('  Project:', d.id, '=>', d.data().name, `[Status: ${d.data().status}, Investor: ${d.data().investorName}]`));
  const situCikedal = finalProjectsSnap.docs.find(d => d.id === 'prj-situ-cikedal')?.data();
  const cipeucang = finalProjectsSnap.docs.find(d => d.id === 'prj-cipeucang')?.data();
  const menes = finalProjectsSnap.docs.find(d => d.id === 'prj-menes')?.data();
  const projectsValid = situCikedal?.status === 'ACTIVE' && cipeucang?.status === 'ACTIVE' && menes?.status === 'COMPLETED';

  // Check cash_ledger
  const finalLedgerSnap = await getDocs(collection(db, 'cash_ledger'));
  console.log(`\nCash Ledger entries: ${finalLedgerSnap.docs.length}`);
  finalLedgerSnap.docs.forEach(d => console.log('  Ledger:', d.id, '=>', d.data().type, `Amount: Rp ${d.data().amount}`, `Balance: Rp ${d.data().runningBalance}`, `Desc: "${d.data().description}"`));
  const yadiEntry = finalLedgerSnap.docs.find(d => d.data().type === 'MODAL_AWAL')?.data();
  const peiEntry = finalLedgerSnap.docs.find(d => d.data().type === 'HUTANG_PIHAK_KETIGA')?.data();
  const ledgerValid = yadiEntry?.amount === 30000000 && peiEntry?.amount === 18000000;

  console.log('\n=======================================');
  console.log('VERIFICATION SUMMARY:');
  console.log('  - Only Bpk. Yadi in investors:', hasOnlyBpkYadi ? 'PASS' : 'FAIL');
  console.log('  - Active projects & completed Menes:', projectsValid ? 'PASS' : 'FAIL');
  console.log('  - Corporate debt & initial capital in cash_ledger:', ledgerValid ? 'PASS' : 'FAIL');
  console.log('=======================================');

  if (hasOnlyBpkYadi && projectsValid && ledgerValid) {
    console.log('\n>>> MIGRATION SUCCESSFUL! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> MIGRATION VERIFICATION FAILED! <<<');
    process.exit(1);
  }
}

migrateMasterData().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
