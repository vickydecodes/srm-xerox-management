import mongoose from 'mongoose';
import '@db/models/branch.model.ts';
import '@db/models/inventory.model.ts';
import '@db/models/product.model.ts';
import { searchProducts } from '../modules/search/search.services.ts';

const MONGODB_URI = 'mongodb://localhost:27017/srm_xerox_db';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  try {
    const q1 = 'raspberry';
    console.log(`Searching for: "${q1}"...`);
    const results1 = await searchProducts(q1);
    console.log(`Results found: ${results1.length}`);
    if (results1.length > 0) {
      console.log('First result:', JSON.stringify(results1[0], null, 2));
    }

    const q2 = 'print';
    console.log(`Searching for: "${q2}"...`);
    const results2 = await searchProducts(q2);
    console.log(`Results found: ${results2.length}`);
    if (results2.length > 0) {
      console.log('First result:', JSON.stringify(results2[0], null, 2));
    }
  } catch (err) {
    console.error('Error running search test:', err);
  } finally {
    await mongoose.connection.close();
    console.log('DB Connection closed');
  }
}

run();
