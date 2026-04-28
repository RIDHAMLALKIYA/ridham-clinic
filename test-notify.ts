import { db } from './db';
import { patients, appointments } from './db/schema';
import { processQueueNotifications } from './lib/services/queueNotifications';
import { eq } from 'drizzle-orm';

async function testNotifications() {
  console.log('--- STARTING NOTIFICATION TEST ---');

  const testEmail = 'fishmon753@gmail.com';
  const testPhone = '+919999999999';

  // 1. Clear existing test data if any
  const existingPatients = await db.select().from(patients).where(eq(patients.phoneNumber, testPhone));
  for (const p of existingPatients) {
     await db.delete(appointments).where(eq(appointments.patientId, p.id));
     await db.delete(patients).where(eq(patients.id, p.id));
  }

  console.log('Step 1: Creating 25 test patients...');
  
  for (let i = 1; i <= 25; i++) {
    const name = `Patient Test ${i}`;
    const [p] = await db.insert(patients).values({
      name,
      phoneNumber: i === 1 ? testPhone : `+911111111${i.toString().padStart(2, '0')}`,
      email: testEmail, // Send all to the requested test email
    }).returning();

    await db.insert(appointments).values({
      patientId: p.id,
      status: 'arrived', // Mark them as in lobby
      emergencyFlag: i === 1, // Make first one urgent for Rank #1
    });
  }

  console.log('Step 2: Triggering Notifications...');
  await processQueueNotifications();

  console.log('--- TEST FINISHED. Check fishmon753@gmail.com for Top 10 and Top 20 emails ---');
  process.exit(0);
}

testNotifications().catch(console.error);
