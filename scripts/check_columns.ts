import 'dotenv/config';
import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        const res = await (db as any).execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'`);
        process.stdout.write(JSON.stringify(res.rows, null, 2));
    } catch (e: any) {
        process.stdout.write("ERROR: " + e.message);
    }
    process.exit(0);
}
check();
