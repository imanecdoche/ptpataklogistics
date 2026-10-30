import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function inspectMore() {
  const extraCollections = ['system_users', 'quarry_material_rates', 'route_tariffs', 'fund_transfers'];
  
  for (const colName of extraCollections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\nCollection [${colName}]: ${snap.docs.length} documents`);
      snap.docs.forEach((doc, idx) => {
        if (idx < 5) {
          console.log(`  - ID: ${doc.id} =>`, JSON.stringify(doc.data()));
        } else if (idx === 5) {
          console.log(`  ... (${snap.docs.length - 5} more docs)`);
        }
      });
    } catch (err) {
      console.error(`Error querying [${colName}]:`, err.message);
    }
  }
  process.exit(0);
}

inspectMore();
