import { Client } from '@upstash/qstash';
import { sendEmail } from './mail';

const qstashToken = process.env.QSTASH_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

const qstashClient = new Client({
  token: qstashToken || '',
});

// Helper to format date for logging
const fmt = (d: Date) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

export async function scheduleReminder(
  appointmentId: number,
  patientName: string,
  email: string,
  scheduleTime: Date,
  messageType: '30min' | 'exact'
) {
  const delay = Math.floor((scheduleTime.getTime() - Date.now()) / 1000);
  const now = new Date();

  console.log(`[Scheduler] Attempting to schedule '${messageType}' for ${patientName}`);
  console.log(`[Scheduler] Target Time: ${fmt(scheduleTime)} | Current Time: ${fmt(now)}`);
  console.log(`[Scheduler] Calculated Delay: ${delay} seconds (${(delay / 60).toFixed(1)} mins)`);

  // Don't schedule if the time is in the past
  if (delay <= 0) {
    console.warn(`[Scheduler] ⚠️ Skipping: Schedule time is in the past.`);
    return;
  }

  // LOCAL MODE: If on localhost OR strictly missing QStash token
  // If appUrl is set to something else but token is missing, we still fallback to local
  const isLocal = appUrl.includes('localhost') || !qstashToken;

  if (isLocal) {
    if (!appUrl.includes('localhost')) {
      console.warn(`[Scheduler] ⚠️ WARNING: Running in 'Local Mode' on a non-localhost URL (${appUrl}). Reminders will likely fail if this is a serverless environment (Vercel). Please set QSTASH_TOKEN.`);
    }

    console.log(`[Local Timer] ✅ Timer started for ${patientName} (${messageType}). Will execute in ${delay}s.`);

    setTimeout(async () => {
      console.log(`[Local Timer] 🔔 Executing '${messageType}' reminder for ${patientName} (${email})`);
      let subject = 'Appointment Reminder - HealthCore Clinic';
      let message = '';

      if (messageType === '30min') {
        message = `Hello ${patientName},\n\nThis is a reminder that your appointment at HealthCore Clinic is in 30 minutes. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
      } else {
        subject = 'Your Appointment is Starting Now - HealthCore Clinic';
        message = `Hello ${patientName},\n\nYour appointment at HealthCore Clinic is starting now. Please proceed to the waiting area if you haven't already.\n\nBest regards,\nHealthCore Team`;
      }

      try {
        await sendEmail(email, subject, message);
        console.log(`[Local Timer] 📧 Email sent to ${email}`);
      } catch (err) {
        console.error(`[Local Timer] ❌ Failed to send email:`, err);
      }
    }, delay * 1000);

    return { messageId: 'local-timer' };
  }

  // PRODUCTION MODE: Use QStash
  try {
    const result = await qstashClient.publishJSON({
      url: `${appUrl}/api/reminders`,
      body: {
        appointmentId,
        patientName,
        email,
        messageType,
      },
      delay: delay,
    });
    console.log(`[QStash] ✅ Scheduled successfully: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('[QStash] ❌ Error scheduling reminder:', error);
  }
}
