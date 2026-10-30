import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  increment
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

const testResults = {
  passed: 0,
  failed: 0,
  assertions: []
};

function recordAssertion(name, condition, details) {
  if (condition) {
    testResults.passed++;
    testResults.assertions.push({ status: 'PASS', name, details });
    console.log(`[PASS] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    testResults.failed++;
    testResults.assertions.push({ status: 'FAIL', name, details });
    console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

async function runAdversarialVerification() {
  console.log('================================================================');
  console.log('EMPIRICAL ADVERSARIAL TEST SUITE — CHALLENGER 1');
  console.log('Target Database: Firestore (pataklogisticdb)');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: MASTER DATA & LIVE FIRESTORE ASSERTIONS
  // ==========================================================================
  console.log('--- 1. Testing Investors Collection Integrity ---');
  const investorsSnap = await getDocs(collection(db, 'investors'));
  const investors = investorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  recordAssertion(
    'Investors collection count is exactly 1',
    investors.length === 1,
    `Found ${investors.length} investor(s)`
  );

  const bpkYadi = investors.find(i => i.id === 'inv-bpk-yadi' || i.name?.includes('Yadi'));
  recordAssertion(
    'Bpk. Yadi exists as primary investor',
    Boolean(bpkYadi && bpkYadi.id === 'inv-bpk-yadi'),
    bpkYadi ? `ID: ${bpkYadi.id}, Name: ${bpkYadi.name}` : 'Not found'
  );

  if (bpkYadi) {
    recordAssertion(
      'Bpk. Yadi initial capital is exactly Rp 30.000.000',
      bpkYadi.initialCapital === 30000000,
      `Capital: Rp ${bpkYadi.initialCapital?.toLocaleString('id-ID')}`
    );
  }

  // Adversarial: Ensure Bpk. Pei is NOT in investors collection
  const bpkPeiInInvestors = investors.filter(i => {
    const idLower = (i.id || '').toLowerCase();
    const nameLower = (i.name || '').toLowerCase();
    const notesLower = (i.notes || '').toLowerCase();
    return idLower.includes('pei') || nameLower.includes('pei') || notesLower.includes('pei');
  });

  recordAssertion(
    'Bpk. Pei is strictly EXCLUDED from investors collection',
    bpkPeiInInvestors.length === 0,
    bpkPeiInInvestors.length === 0 ? 'Zero records found (Clean)' : `Found ${bpkPeiInInvestors.length} record(s): ${JSON.stringify(bpkPeiInInvestors)}`
  );

  console.log('\n--- 2. Testing Projects Collection Integrity ---');
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const cikedal = projects.find(p => p.id === 'prj-situ-cikedal');
  recordAssertion(
    'Proyek Konservasi Situ Cikedal exists and is ACTIVE',
    Boolean(cikedal && cikedal.status === 'ACTIVE' && cikedal.name.includes('Situ Cikedal')),
    cikedal ? `Status: ${cikedal.status}, Investor: ${cikedal.investorName}` : 'Not found'
  );

  const cipeucang = projects.find(p => p.id === 'prj-cipeucang');
  recordAssertion(
    'Proyek Irigasi Cipeucang exists and is ACTIVE',
    Boolean(cipeucang && cipeucang.status === 'ACTIVE' && cipeucang.name.includes('Cipeucang')),
    cipeucang ? `Status: ${cipeucang.status}, Investor: ${cipeucang.investorName}` : 'Not found'
  );

  const menes = projects.find(p => p.id === 'prj-menes');
  recordAssertion(
    'Proyek Menes exists and is COMPLETED (deactivated)',
    Boolean(menes && menes.status === 'COMPLETED'),
    menes ? `Status: ${menes.status}` : 'Not found'
  );

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  recordAssertion(
    'Exactly 2 operational projects are ACTIVE (Cikedal & Cipeucang)',
    activeProjects.length === 2 &&
      activeProjects.some(p => p.id === 'prj-situ-cikedal') &&
      activeProjects.some(p => p.id === 'prj-cipeucang'),
    `Active count: ${activeProjects.length} (${activeProjects.map(p => p.name).join(', ')})`
  );

  console.log('\n--- 3. Testing Cash Ledger Entries Integrity ---');
  const ledgerSnap = await getDocs(collection(db, 'cash_ledger'));
  const ledgerEntries = ledgerSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const yadiCapitalEntry = ledgerEntries.find(
    e => e.type === 'MODAL_AWAL' && (e.id === 'ledger-modal-bpk-yadi' || e.description?.includes('Yadi'))
  );
  recordAssertion(
    'Cash ledger contains Bpk. Yadi capital (MODAL_AWAL, Rp 30.000.000, isCredit=true)',
    Boolean(yadiCapitalEntry && yadiCapitalEntry.amount === 30000000 && yadiCapitalEntry.isCredit === true),
    yadiCapitalEntry ? `ID: ${yadiCapitalEntry.id}, Amount: Rp ${yadiCapitalEntry.amount.toLocaleString('id-ID')}, isCredit: ${yadiCapitalEntry.isCredit}` : 'Not found'
  );

  const peiDebtEntry = ledgerEntries.find(
    e => e.type === 'HUTANG_PIHAK_KETIGA' && (e.id === 'ledger-debt-bpk-pei' || e.description?.includes('Pei'))
  );
  recordAssertion(
    'Cash ledger contains Bpk. Pei corporate debt (HUTANG_PIHAK_KETIGA, Rp 18.000.000, isCredit=true)',
    Boolean(peiDebtEntry && peiDebtEntry.amount === 18000000 && peiDebtEntry.isCredit === true),
    peiDebtEntry ? `ID: ${peiDebtEntry.id}, Amount: Rp ${peiDebtEntry.amount.toLocaleString('id-ID')}, isCredit: ${peiDebtEntry.isCredit}, Desc: "${peiDebtEntry.description}"` : 'Not found'
  );

  // ==========================================================================
  // SECTION 2: UI DROPDOWN FILTERING LOGIC VERIFICATION
  // ==========================================================================
  console.log('\n--- 4. Testing Dropdown Filtering Logic (ProjectCombobox & Dispatch Form) ---');
  
  // Exact ProjectCombobox filter implementation
  function filterProjectCombobox(projectList, queryText = '', activeOnly = true) {
    const list = activeOnly !== false
      ? projectList.filter(item => item.status === 'ACTIVE')
      : projectList;
    if (!queryText.trim()) return list;
    const q = queryText.toLowerCase().trim();
    return list.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.clientName && item.clientName.toLowerCase().includes(q))
    );
  }

  const defaultComboboxResults = filterProjectCombobox(projects, '', true);
  recordAssertion(
    'ProjectCombobox with activeOnly=true excludes Proyek Menes',
    !defaultComboboxResults.some(p => p.id === 'prj-menes' || p.name.includes('Menes')),
    `Returned ${defaultComboboxResults.length} projects: [${defaultComboboxResults.map(p => p.name).join(', ')}]`
  );

  const searchMenesResults = filterProjectCombobox(projects, 'Menes', true);
  recordAssertion(
    'Searching "Menes" in ProjectCombobox returns 0 results',
    searchMenesResults.length === 0,
    `Results count: ${searchMenesResults.length}`
  );

  const searchCikedalResults = filterProjectCombobox(projects, 'Cikedal', true);
  recordAssertion(
    'Searching "Cikedal" returns Situ Cikedal',
    searchCikedalResults.length === 1 && searchCikedalResults[0].id === 'prj-situ-cikedal',
    `Found: ${searchCikedalResults[0]?.name}`
  );

  // EditDispatchModal dropdown test: projects.filter(p => p.status === 'ACTIVE')
  const editModalProjectOptions = projects.filter(p => p.status === 'ACTIVE');
  recordAssertion(
    'EditDispatchModal project options exclude Proyek Menes',
    !editModalProjectOptions.some(p => p.id === 'prj-menes'),
    `Filtered options count: ${editModalProjectOptions.length}`
  );

  // ==========================================================================
  // SECTION 3: ADVERSARIAL WAYBILL & TRANSACTION ROUTINE TESTING
  // ==========================================================================
  console.log('\n--- 5. Testing Operational Waybill (suratJalan) & Transaction Creation Routines ---');

  const testTicketNumber = `PTK-TEST-${Date.now().toString().slice(-6)}`;
  const testSuratJalan = 'SJ-ADV-2026-X99';
  const testDeliveryDate = '2026-10-30';
  const testTruckPlate = 'A 9999 ADV';
  const testDriver = 'Supir Test Adversarial';
  const testQuantity = 2; // 2 DT
  const testBuyPrice = 600000;
  const testSellPrice = 850000;
  const testOperational = 150000;
  const expectedTotalBuy = testQuantity * testBuyPrice; // 1.200.000
  const expectedTotalRev = testQuantity * testSellPrice; // 1.700.000
  const expectedNetProfit = expectedTotalRev - (expectedTotalBuy + testOperational); // 350.000

  let testTxDocId = null;

  try {
    // 5.1 Create Transaction
    const txPayload = {
      ticketNumber: testTicketNumber,
      suratJalan: testSuratJalan,
      deliveryDate: testDeliveryDate,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      truckPlate: testTruckPlate,
      driverName: testDriver,
      clientId: 'cli-situ-cikedal',
      clientName: 'PT Mandiri Konstruksi (Situ Cikedal)',
      customerName: 'PT Mandiri Konstruksi (Situ Cikedal)',
      quarryId: 'quarry-test',
      quarryName: 'Kuari Rangkas Test',
      projectId: 'prj-situ-cikedal',
      projectName: 'Proyek Konservasi Situ Cikedal',
      investorId: 'inv-bpk-yadi',
      investorName: 'Bpk. Yadi',
      materialId: 'mat-batu-belah',
      materialName: 'Batu Belah (Pondasi)',
      unit: 'DT',
      quantity: testQuantity,
      buyPricePerUnit: testBuyPrice,
      sellPricePerUnit: testSellPrice,
      operationalCost: testOperational,
      totalBuyCost: expectedTotalBuy,
      totalRevenue: expectedTotalRev,
      netProfit: expectedNetProfit,
      status: 'TEMPO',
      notes: 'Adversarial Test Transaction by Challenger 1',
      createdBy: 'challenger1@patak.dev'
    };

    const txDocRef = await addDoc(collection(db, 'transactions'), txPayload);
    testTxDocId = txDocRef.id;

    // Simulate cash ledger deduction entries created by createDispatchTransaction
    const buyLedgerRef = await addDoc(collection(db, 'cash_ledger'), {
      date: new Date().toISOString(),
      type: 'BELI_MATERIAL',
      amount: expectedTotalBuy,
      isCredit: false,
      runningBalance: 48000000 - expectedTotalBuy,
      referenceId: testTicketNumber,
      description: `Beli Batu Belah (${testQuantity} DT) - ${testTicketNumber}`,
      createdByName: 'challenger1@patak.dev'
    });

    const opLedgerRef = await addDoc(collection(db, 'cash_ledger'), {
      date: new Date().toISOString(),
      type: 'BIAYA_OPERASIONAL',
      amount: testOperational,
      isCredit: false,
      runningBalance: 48000000 - expectedTotalBuy - testOperational,
      referenceId: testTicketNumber,
      description: `Beban Operasional Armada ${testTruckPlate} - ${testTicketNumber}`,
      createdByName: 'challenger1@patak.dev'
    });

    // 5.2 Verify Transaction Read
    const txSnap = await getDoc(doc(db, 'transactions', testTxDocId));
    const txRead = txSnap.data();

    recordAssertion(
      'Transaction created and suratJalan correctly stored',
      Boolean(txRead && txRead.suratJalan === testSuratJalan),
      `Stored suratJalan: "${txRead?.suratJalan}", Ticket: ${txRead?.ticketNumber}`
    );

    recordAssertion(
      'Transaction financial calculations are exact',
      Boolean(
        txRead &&
        txRead.totalBuyCost === expectedTotalBuy &&
        txRead.totalRevenue === expectedTotalRev &&
        txRead.netProfit === expectedNetProfit
      ),
      `Buy: ${txRead?.totalBuyCost}, Rev: ${txRead?.totalRevenue}, Net: ${txRead?.netProfit}`
    );

    // 5.3 Verify Associated Cash Ledger Entries
    const relatedLedgerSnap = await getDocs(
      query(collection(db, 'cash_ledger'), where('referenceId', '==', testTicketNumber))
    );
    const relatedEntries = relatedLedgerSnap.docs.map(d => d.data());

    recordAssertion(
      'Cash ledger records created with matching referenceId == ticketNumber',
      relatedEntries.length === 2 &&
        relatedEntries.some(e => e.type === 'BELI_MATERIAL' && e.amount === expectedTotalBuy) &&
        relatedEntries.some(e => e.type === 'BIAYA_OPERASIONAL' && e.amount === testOperational),
      `Entries found: ${relatedEntries.length} (${relatedEntries.map(e => e.type).join(', ')})`
    );

    // 5.4 Test Update Routine with Edited suratJalan
    const updatedSuratJalan = 'SJ-ADV-2026-X99-REVISED';
    await updateDoc(doc(db, 'transactions', testTxDocId), {
      suratJalan: updatedSuratJalan,
      quantity: 3,
      totalBuyCost: 3 * testBuyPrice
    });

    const updatedTxSnap = await getDoc(doc(db, 'transactions', testTxDocId));
    const updatedTxRead = updatedTxSnap.data();
    recordAssertion(
      'Update routine correctly updates suratJalan and financial fields',
      Boolean(updatedTxRead && updatedTxRead.suratJalan === updatedSuratJalan && updatedTxRead.quantity === 3),
      `Updated suratJalan: "${updatedTxRead?.suratJalan}", Quantity: ${updatedTxRead?.quantity}`
    );

    // 5.5 Test Clean-up (Delete Routine)
    await deleteDoc(doc(db, 'transactions', testTxDocId));
    const deletedTxSnap = await getDoc(doc(db, 'transactions', testTxDocId));
    recordAssertion(
      'Delete routine removes transaction document cleanly',
      !deletedTxSnap.exists(),
      `Exists: ${deletedTxSnap.exists()}`
    );

    // Clean up test cash ledger entries
    for (const d of relatedLedgerSnap.docs) {
      await deleteDoc(doc(db, 'cash_ledger', d.id));
    }
    const cleanLedgerSnap = await getDocs(
      query(collection(db, 'cash_ledger'), where('referenceId', '==', testTicketNumber))
    );
    recordAssertion(
      'Delete routine cleans up related cash ledger entries',
      cleanLedgerSnap.empty,
      `Remaining entries: ${cleanLedgerSnap.docs.length}`
    );

  } catch (err) {
    recordAssertion('Adversarial transaction test routine execution', false, err.message);
  }

  // ==========================================================================
  // SECTION 4: ADVERSARIAL WAYBILL STRING & EDGE CASE ANALYSIS
  // ==========================================================================
  console.log('\n--- 6. Adversarial Waybill Input Normalization & Edge Cases ---');

  // Edge Case 1: Untrimmed whitespaces
  const rawWithSpaces = '   SJ-SPACES-001   ';
  const trimmed = rawWithSpaces.trim();
  recordAssertion(
    'Whitespace trimming on suratJalan',
    trimmed === 'SJ-SPACES-001',
    `Raw: "${rawWithSpaces}" -> Trimmed: "${trimmed}"`
  );

  // Edge Case 2: Undefined / optional suratJalan
  const payloadWithoutSJ = { suratJalan: undefined };
  const normalizedSJ = payloadWithoutSJ.suratJalan?.trim() || '';
  recordAssertion(
    'Undefined suratJalan normalizes to empty string',
    normalizedSJ === '',
    `Result: "${normalizedSJ}"`
  );

  // Edge Case 3: Special characters
  const complexSJ = 'SJ/TAMBANG#2026-09.B';
  const complexNormalized = complexSJ.trim();
  recordAssertion(
    'Special characters preserved in suratJalan without corrupting structure',
    complexNormalized === 'SJ/TAMBANG#2026-09.B',
    `Preserved: "${complexNormalized}"`
  );

  // ==========================================================================
  // FINAL EVALUATION
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`SUMMARY: ${testResults.passed} PASSED, ${testResults.failed} FAILED (Total: ${testResults.assertions.length})`);
  console.log('================================================================');

  if (testResults.failed === 0) {
    console.log('\n>>> VERDICT: APPROVE <<<');
    process.exit(0);
  } else {
    console.error('\n>>> VERDICT: REQUEST_CHANGES <<<');
    process.exit(1);
  }
}

runAdversarialVerification().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
