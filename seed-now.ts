import * as dotenv from 'dotenv';
dotenv.config();
import { seedAccounts } from './lib/actions/auth';

async function seed() {
  try {
    const res = await seedAccounts();
    console.log("Seed Output:", res);
  } catch(e) {
    console.error("Seed Error:", e);
  }
  process.exit(0);
}
seed();
