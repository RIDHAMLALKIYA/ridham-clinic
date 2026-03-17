import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, and, desc, asc, not } from 'drizzle-orm';
import { sendEmail } from './mail';

/**
 * Automatically calculates queue positions for arrived patients
 * and sends notifications if they hit the Top 10 or Top 20 thresholds.
 */
export async function processQueueNotifications() {
  const activePatients = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      patientEmail: patients.email,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'arrived'))
    .orderBy(desc(appointments.emergencyFlag), appointments.id);

  console.log(`[QueueNotifier] Processing ${activePatients.length} patients in queue...`);

  for (let i = 0; i < activePatients.length; i++) {
    const position = i + 1;
    const patient = activePatients[i];

    if (!patient.patientEmail) continue;

    if (position === 10 || position === 20) {
      console.log(`[QueueNotifier] 📧 Notifying ${patient.patientName} (Pos: ${position})`);
      
      const message = `Hello ${patient.patientName},\n\nYou are moving up in the queue! You are now at position ${position} at HealthCore Clinic.\n\nPlease stay close to the clinic area. We will notify you again when you are next in line.\n\nBest regards,\nHealthCore Team`;
      
      try {
        await sendEmail(
          patient.patientEmail,
          `Queue Update: Position ${position} - HealthCore Clinic`,
          message
        );
      } catch (err) {
        console.error(`[QueueNotifier] Failed to notify patient ${patient.id}:`, err);
      }
    }
  }
}
