require('dotenv').config();
const { db } = require('./db');
const { patients, appointments } = require('./db/schema');
const { processQueueNotifications } = require('./lib/services/queueNotifications');
const { eq } = require('drizzle-orm');

async function testNotifications() {
  console.log('--- STARTING NOTIFICATION TEST ---');

  const testEmail = 'fishmon753@gmail.com';
  const testPhone = '+919999999999';

  try {
    // 1. Clear existing test data
    console.log('Cleaning up old test data...');
    const existingPatients = await db.select().from(patients).where(eq(patients.phoneNumber, testPhone));
    for (const p of existingPatients) {
       await db.delete(appointments).where(eq(appointments.patientId, p.id));
       await db.delete(patients).where(eq(patients.id, p.id));
    }

    console.log('Step 1: Creating 25 test patients...');
    
    for (let i = 1; i <= 25; i++) {
        const [p] = await db.insert(patients).values({
            name: `Patient Test ${i}`,
            phoneNumber: i === 1 ? testPhone : `+911111111${i.toString().padStart(2, '0')}`,
            email: testEmail,
        }).returning();

        await db.insert(appointments).values({
            patientId: p.id,
            status: 'arrived',
            emergencyFlag: i === 1,
        });
    }

    console.log('Step 2: Triggering Notifications...');
    await processQueueNotifications();

    console.log('\n✅ TEST FINISHED.');
    console.log('📬 CHECK EMAIL: fishmon753@gmail.com');
    console.log('You should have 10 "Top 10" emails and 10 "Top 20" emails.');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
  }
  process.exit(0);
}

testNotifications();
