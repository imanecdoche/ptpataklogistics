import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs
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

async function runIndependentAudit() {
  console.log('>>> [INDEPENDENT FORENSIC AUDIT START] <<<');
  const results = {
    checks: [],
    violations: []
  };

  function recordCheck(name, pass, details) {
    results.checks.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
    if (!pass) {
      results.violations.push({ name, details });
    }
  }

  // 1. INVESTORS CHECK
  console.log('\n--- 1. AUDITING "investors" COLLECTION ---');
  const investorsSnap = await getDocs(collection(db, 'investors'));
  const investors = investorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${investors.length} investor(s):`);
  investors.forEach(inv => console.log(`  - ${inv.id}: ${inv.name} (Capital: Rp ${inv.initialCapital})`));

  const bpkYadi = investors.find(i => i.id === 'inv-bpk-yadi');
  const bpkPeiInInvestors = investors.find(i => 
    (i.name && i.name.toLowerCase().includes('pei')) || 
    (i.id && i.id.toLowerCase().includes('pei'))
  );

  recordCheck(
    'Single Active Investor Bpk. Yadi',
    investors.length === 1 && !!bpkYadi && bpkYadi.name === 'Bpk. Yadi' && bpkYadi.initialCapital === 30000000,
    `Count=${investors.length}, Bpk. Yadi present=${!!bpkYadi}, Capital=${bpkYadi?.initialCapital}`
  );

  recordCheck(
    'Bpk. Pei Excluded from Investors',
    !bpkPeiInInvestors,
    bpkPeiInInvestors ? `FOUND Bpk. Pei in investors: ${JSON.stringify(bpkPeiInInvestors)}` : 'Bpk. Pei is NOT in investors collection'
  );

  // 2. PROJECTS CHECK
  console.log('\n--- 2. AUDITING "projects" COLLECTION ---');
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${projects.length} project(s):`);
  projects.forEach(p => console.log(`  - ${p.id}: "${p.name}" [Status: ${p.status}, Investor: ${p.investorName}]`));

  const situCikedal = projects.find(p => p.id === 'prj-situ-cikedal');
  const cipeucang = projects.find(p => p.id === 'prj-cipeucang');
  const menes = projects.find(p => p.id === 'prj-menes');

  recordCheck(
    'Situ Cikedal Project Active & Funded by Bpk. Yadi',
    !!situCikedal && situCikedal.status === 'ACTIVE' && situCikedal.investorId === 'inv-bpk-yadi',
    `Status=${situCikedal?.status}, InvestorId=${situCikedal?.investorId}`
  );

  recordCheck(
    'Cipeucang Project Active & Funded by Bpk. Yadi',
    !!cipeucang && cipeucang.status === 'ACTIVE' && cipeucang.investorId === 'inv-bpk-yadi',
    `Status=${cipeucang?.status}, InvestorId=${cipeucang?.investorId}`
  );

  recordCheck(
    'Menes Project Completed / Deactivated',
    !!menes && menes.status === 'COMPLETED',
    `Status=${menes?.status}`
  );

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  recordCheck(
    'Exactly 2 Active Operational Projects',
    activeProjects.length === 2 && activeProjects.every(p => p.id === 'prj-situ-cikedal' || p.id === 'prj-cipeucang'),
    `Active count=${activeProjects.length} (${activeProjects.map(p => p.id).join(', ')})`
  );

  // 3. CASH LEDGER CHECK
  console.log('\n--- 3. AUDITING "cash_ledger" COLLECTION ---');
  const ledgerSnap = await getDocs(collection(db, 'cash_ledger'));
  const ledgerEntries = ledgerSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${ledgerEntries.length} cash ledger entries:`);
  ledgerEntries.forEach(e => console.log(`  - ${e.id}: ${e.type} | Rp ${e.amount} | Running: Rp ${e.runningBalance} | "${e.description}"`));

  const peiDebtEntry = ledgerEntries.find(e => 
    e.type === 'HUTANG_PIHAK_KETIGA' && 
    (e.description?.toLowerCase().includes('pei') || e.id?.toLowerCase().includes('pei'))
  );

  const yadiCapitalEntry = ledgerEntries.find(e => 
    e.type === 'MODAL_AWAL' && 
    (e.description?.toLowerCase().includes('yadi') || e.id?.toLowerCase().includes('yadi'))
  );

  recordCheck(
    'Bpk. Pei Rp 18M Liability in Cash Ledger as HUTANG_PIHAK_KETIGA',
    !!peiDebtEntry && peiDebtEntry.amount === 18000000 && peiDebtEntry.type === 'HUTANG_PIHAK_KETIGA',
    `Found=${!!peiDebtEntry}, Type=${peiDebtEntry?.type}, Amount=${peiDebtEntry?.amount}, Desc="${peiDebtEntry?.description}"`
  );

  recordCheck(
    'Bpk. Yadi Rp 30M Capital in Cash Ledger as MODAL_AWAL',
    !!yadiCapitalEntry && yadiCapitalEntry.amount === 30000000 && yadiCapitalEntry.type === 'MODAL_AWAL',
    `Found=${!!yadiCapitalEntry}, Type=${yadiCapitalEntry?.type}, Amount=${yadiCapitalEntry?.amount}`
  );

  // 4. TRANSACTIONS CHECK
  console.log('\n--- 4. AUDITING "transactions" COLLECTION ---');
  const txSnap = await getDocs(collection(db, 'transactions'));
  const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${transactions.length} transaction(s).`);

  let peiProfitFound = false;
  let invalidInvestorInTx = false;
  transactions.forEach(t => {
    if (JSON.stringify(t).toLowerCase().includes('pei')) {
      peiProfitFound = true;
    }
  });

  recordCheck(
    'Zero Profit/Revenue Allocation to Bpk. Pei in Transactions',
    !peiProfitFound,
    peiProfitFound ? 'WARNING: Bpk. Pei mentioned in transactions!' : 'No transaction allocates or mentions Bpk. Pei'
  );

  // 5. SUMMARY
  console.log('\n======================================================');
  console.log(`AUDIT FINISHED. Total checks: ${results.checks.length}. Violations: ${results.violations.length}`);
  console.log('======================================================');

  if (results.violations.length > 0) {
    console.error('VIOLATIONS DETECTED:', results.violations);
    process.exit(1);
  } else {
    console.log('ALL FIRESTORE INTEGRITY AUDIT CHECKS PASSED!');
    process.exit(0);
  }
}

runIndependentAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
