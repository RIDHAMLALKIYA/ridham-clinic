require('dotenv').config();
const { Client } = require('pg');

async function testNotifications() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Database');

    const testEmail = 'fishmon753@gmail.com';
    const testPhone = '+919999999999';

    // 1. Delete old test data
    console.log('Cleaning up old test data...');
    await client.query('DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE phone_number = $1)', [testPhone]);
    await client.query('DELETE FROM patients WHERE phone_number = $1', [testPhone]);

    // 2. Create 25 test records
    console.log('Step 1: Creating 25 test patients in arrived (Lobby) status...');
    for (let i = 1; i <= 25; i++) {
        const name = `Test Patient ${i}`;
        const pResult = await client.query(
            'INSERT INTO patients (name, phone_number, email) VALUES ($1, $2, $3) RETURNING id',
            [name, i === 1 ? testPhone : `+911111111${i.toString().padStart(2, '0')}`, testEmail]
        );
        const pId = pResult.rows[0].id;
        
        await client.query(
            'INSERT INTO appointments (patient_id, status, emergency_flag) VALUES ($1, $2, $3)',
            [pId, 'arrived', i === 1]
        );
    }

    console.log('\n✅ 25 Patients inserted. Status: Arrived (Waiting in Lobby)');
    console.log('----------------------------------------------------');
    console.log('TEST INSTRUCTIONS:');
    console.log('1. Go to your Doctor Dashboard.');
    console.log('2. Click any patient "CALL NEXT" or change status to "CONSULTING".');
    console.log('3. Check fishmon753@gmail.com.');
    console.log('   - You will see "Top 10" and "Top 20" alert emails arrive.');
    console.log('----------------------------------------------------');

  } catch (err) {
    console.error('❌ Error during setup:', err);
  } finally {
    await client.end();
  }
}

testNotifications();
