import { db } from './db';
import { users } from './db/schema';

async function check() {
  try {
    const allUsers = await db.select().from(users);
    console.log("Users in Database:");
    console.log(allUsers.map(u => ({ email: u.email, role: u.role })));
  } catch(e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}

check();
