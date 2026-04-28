'use server';

import { db } from '@/db';
import { patients, appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

/**
 * Pre-warms the database cache for a specific patient.
 * This pulls the record into the database buffer cache so the actual 
 * 'Call Patient' action happens instantly.
 */
export async function prefetchPatientData(patientId: number) {
    const session = await getSession();
    if (!session) return;

    // We just do a simple select. The database will now have these pages in RAM.
    await Promise.all([
        db.select().from(patients).where(eq(patients.id, patientId)).limit(1),
        db.select().from(appointments).where(eq(appointments.patientId, patientId)).limit(5)
    ]);
}
