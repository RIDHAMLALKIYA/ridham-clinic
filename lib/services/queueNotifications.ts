import { db } from '@/db';
import { appointments, patients, settings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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
      preferredLanguage: patients.preferredLanguage,
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
      // PREVENT EMAIL SPAM BUG: Ensure we only send the notification once per appointment/position
      const settingKey = `q_notif_${position}_${patient.id}`;
      const [alreadyNotified] = await db.select().from(settings).where(eq(settings.key, settingKey));
      
      if (alreadyNotified) continue;

      console.log(`[QueueNotifier] 📧 Notifying ${patient.patientName} (Pos: ${position})`);
      
      let subject = `Queue Update: Position ${position} - HealthCore Clinic`;
      let message = `Hello ${patient.patientName},\n\nYou are moving up in the queue! You are now at position ${position} at HealthCore Clinic.\n\nPlease stay close to the clinic area. We will notify you again when you are next in line.\n\nBest regards,\nHealthCore Team`;

      if (patient.preferredLanguage === 'gu') {
        subject = `કતાર અપડેટ: સ્થાન ${position} - હેલ્થકોર ક્લિનિક`;
        message = `નમસ્તે ${patient.patientName},\n\nતમે અત્યારે કતારમાં આગળ વધી રહ્યા છો! તમે હવે હેલ્થકોર ક્લિનિકમાં ${position} નંબર પર છો.\n\nકૃપા કરીને ક્લિનિકના વેટિંગ એરિયામાં રહો. જ્યારે તમારો વારો આવશે ત્યારે અમે તમને ફરીથી જાણ કરીશું.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`;
      }
      
      try {
        await sendEmail(
          patient.patientEmail,
          subject,
          message
        );
        // Lock this notification so it never sends again for this appointment
        await db.insert(settings).values({ key: settingKey, value: 'sent' });
      } catch (err) {
        console.error(`[QueueNotifier] Failed to notify patient ${patient.id}:`, err);
      }
    }
  }
}
