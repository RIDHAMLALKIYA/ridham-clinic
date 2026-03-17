import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, and, desc, asc, not } from 'drizzle-orm';
import { sendEmail } from './mail';

/**
 * Automatically calculates queue positions for arrived patients
 * and sends notifications if they hit the Top 10 or Top 20 thresholds.
 */
export async function processQueueNotifications() {
  console.log('[QueueNotifier] 🔍 Checking queue for notifications...');

  // 1. Fetch current arrived queue ordered by urgency and arrival (ID)
  // This matches the order shown in the Doctor Dashboard
  const queue = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      email: patients.email,
      notifiedTop10: appointments.notifiedTop10,
      notifiedTop20: appointments.notifiedTop20,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'arrived'))
    .orderBy(desc(appointments.emergencyFlag), appointments.id);

  if (queue.length === 0) {
    console.log('[QueueNotifier] 📭 Queue is empty. No notifications to send.');
    return;
  }

  // 2. Process patients in the queue
  for (let i = 0; i < queue.length; i++) {
    const appt = queue[i];
    const rank = i + 1; // 1-indexed rank

    // -- THRESHOLD: TOP 10 --
    if (rank <= 10 && !appt.notifiedTop10) {
      if (appt.email) {
        console.log(`[QueueNotifier] 📣 Sending TOP 10 alert to ${appt.patientName} (Rank #${rank})`);
        
        const subject = 'Your Appointment is Approaching - HealthCore Clinic';
        const text = `Hello ${appt.patientName},\n\nYou are in the Top 10 of today's waiting list! Please reach the waiting area immediately as your consultation will start shortly.\n\nBest regards,\nHealthCore Team`;
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px;">
            <h2 style="color: #059669; margin-top: 0;">Consultation Starting Soon!</h2>
            <p>Hello <strong>${appt.patientName}</strong>,</p>
            <p>You are now at <strong>Rank #${rank}</strong> in the waiting list.</p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #bcf0da;">
               <p style="margin: 0; font-size: 16px; color: #065f46;">
                  🚀 <strong>Please reach the waiting area.</strong> Your turn is coming very shortly!
               </p>
            </div>
            <p style="font-size: 14px; color: #64748b;">We look forward to seeing you inside.</p>
          </div>
        `;

        await sendEmail(appt.email, subject, text, html);
      }
      
      // Update DB to prevent duplicate alerts
      await db.update(appointments)
        .set({ notifiedTop10: true, notifiedTop20: true })
        .where(eq(appointments.id, appt.id));
    }
    
    // -- THRESHOLD: TOP 20 --
    else if (rank <= 20 && !appt.notifiedTop20) {
      if (appt.email) {
        console.log(`[QueueNotifier] 📣 Sending TOP 20 alert to ${appt.patientName} (Rank #${rank})`);
        
        const subject = 'Waiting List Update - HealthCore Clinic';
        const text = `Hello ${appt.patientName},\n\nYou are now in the Top 20 of our waiting list. If you are nearby, kindly reach the clinic now to ensure a smooth check-in.\n\nBest regards,\nHealthCore Team`;
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px;">
            <h2 style="color: #2563eb; margin-top: 0;">Queue Position Update</h2>
            <p>Hello <strong>${appt.patientName}</strong>,</p>
            <p>You have reached <strong>Rank #${rank}</strong> in today's consultation queue.</p>
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #bfdbfe;">
               <p style="margin: 0; font-size: 16px; color: #1e40af;">
                  📍 <strong>Kindly reach the clinic.</strong> You are in the Top 20 waiting list.
               </p>
            </div>
          </div>
        `;

        await sendEmail(appt.email, subject, text, html);
      }
      
      // Update DB to prevent duplicate alerts
      await db.update(appointments)
        .set({ notifiedTop20: true })
        .where(eq(appointments.id, appt.id));
    }
  }

  console.log('[QueueNotifier] ✅ All pending notifications processed.');
}
