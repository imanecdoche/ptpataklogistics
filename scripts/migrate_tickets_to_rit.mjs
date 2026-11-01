import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';

const app = initializeApp({
  projectId: 'antigravityapp-e305d'
});
const db = getFirestore(app, 'pataklogisticdb');

function formatDDMMYY(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const yyyy = parts[0];
    const mm = parts[1];
    const dd = parts[2];
    const yy = yyyy.slice(-2);
    return `${dd}${mm}${yy}`;
  }
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

async function migrate() {
  console.log('--- Memulai Migrasi Format Tiket Ritase ke RIT-DDMMYY-XX ---');
  
  const txSnap = await getDocs(collection(db, 'transactions'));
  console.log(`Ditemukan ${txSnap.size} transaksi di Firestore.`);

  const list = [];
  txSnap.forEach(d => {
    const data = d.data();
    list.push({
      id: d.id,
      ticketNumber: data.ticketNumber,
      deliveryDate: data.deliveryDate || (data.date ? data.date.slice(0, 10) : ''),
      createdAt: data.createdAt || data.date || '',
      data
    });
  });

  // Urutkan berdasarkan tanggal pengiriman (deliveryDate) kemudian waktu buat (createdAt)
  list.sort((a, b) => {
    if (a.deliveryDate !== b.deliveryDate) {
      return a.deliveryDate.localeCompare(b.deliveryDate);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  const dateCounters = {};
  const updates = [];

  for (const item of list) {
    const dateKey = item.deliveryDate;
    dateCounters[dateKey] = (dateCounters[dateKey] || 0) + 1;
    const seqStr = String(dateCounters[dateKey]).padStart(2, '0');
    const ddmmyy = formatDDMMYY(dateKey);
    const newTicket = `RIT-${ddmmyy}-${seqStr}`;

    updates.push({
      txId: item.id,
      oldTicket: item.ticketNumber,
      newTicket: newTicket,
      date: dateKey
    });
  }

  console.log(`Memproses batch update untuk ${updates.length} transaksi ritase...`);

  // Kita gunakan writeBatch untuk memastikan atomic / konsisten
  // Firebase membatasi max 500 operasi per batch
  const batch = writeBatch(db);

  for (const u of updates) {
    const txRef = doc(db, 'transactions', u.txId);
    batch.update(txRef, { ticketNumber: u.newTicket });
  }

  // Cari dan update cash_ledger yang mereferensikan oldTicket
  const ledgerSnap = await getDocs(collection(db, 'cash_ledger'));
  console.log(`Memeriksa ${ledgerSnap.size} dokumen cash_ledger...`);
  
  let ledgerUpdateCount = 0;
  ledgerSnap.forEach(d => {
    const data = d.data();
    const oldRef = data.referenceId;
    if (oldRef) {
      const match = updates.find(u => u.oldTicket === oldRef);
      if (match) {
        const ledgerRef = doc(db, 'cash_ledger', d.id);
        const newDesc = data.description 
          ? data.description.replaceAll(match.oldTicket, match.newTicket)
          : data.description;
        batch.update(ledgerRef, {
          referenceId: match.newTicket,
          description: newDesc
        });
        ledgerUpdateCount++;
      }
    }
  });

  console.log(`Ditemukan ${ledgerUpdateCount} mutasi cash_ledger yang akan di-update.`);

  // Commit batch
  await batch.commit();
  console.log('✅ Berhasil meng-commit batch update ke Firestore!');

  // Verifikasi hasil
  console.log('--- Verifikasi Pasca Migrasi ---');
  const verifyTxSnap = await getDocs(collection(db, 'transactions'));
  let invalidCount = 0;
  verifyTxSnap.forEach(d => {
    const t = d.data().ticketNumber;
    if (!t || !t.startsWith('RIT-')) {
      console.error(`❌ Transaksi ${d.id} memiliki tiket tidak valid: ${t}`);
      invalidCount++;
    }
  });

  const verifyLedgerSnap = await getDocs(collection(db, 'cash_ledger'));
  let lingeringPtk = 0;
  verifyLedgerSnap.forEach(d => {
    const str = JSON.stringify(d.data());
    if (str.includes('PTK-')) {
      console.warn(`⚠️ Masih ada PTK- di cash_ledger ${d.id}:`, str);
      lingeringPtk++;
    }
  });

  if (invalidCount === 0 && lingeringPtk === 0) {
    console.log(`🎉 SUKSES TOTAL! Seluruh ${verifyTxSnap.size} ritase dan mutasi buku kas telah 100% distandarisasi ke RIT-DDMMYY-XX.`);
  } else {
    console.warn(`Peringatan: invalidCount=${invalidCount}, lingeringPtk=${lingeringPtk}`);
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});
