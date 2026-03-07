import { Client } from "@upstash/qstash";
import { sendEmail } from "./mail";

const qstashToken = process.env.QSTASH_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

const qstashClient = new Client({
  token: qstashToken || "",
});

export async function scheduleReminder(appointmentId: number, patientName: string, email: string, scheduleTime: Date, messageType: '30min' | 'exact') {
  const delay = Math.floor((scheduleTime.getTime() - Date.now()) / 1000);
  
  // Don't schedule if the time is in the past
  if (delay <= 0) return;

  // LOCAL MODE: If on localhost or missing QStash token, use setTimeout
  // This ensures it works for you locally without needing a domain/ngrok.
  const isLocal = appUrl.includes('localhost') || !qstashToken;

  if (isLocal) {
    console.log(`[Local Scheduler] Reminder set for ${patientName} in ${delay} seconds (${messageType})`);
    
    setTimeout(async () => {
      let subject = "Appointment Reminder - HealthCore Clinic";
      let message = "";
      
      if (messageType === '30min') {
        message = `Hello ${patientName},\n\nThis is a reminder that your appointment at HealthCore Clinic is in 30 minutes. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
      } else {
        subject = "Your Appointment is Starting Now - HealthCore Clinic";
        message = `Hello ${patientName},\n\nYour appointment at HealthCore Clinic is starting now. Please proceed to the waiting area if you haven't already.\n\nBest regards,\nHealthCore Team`;
      }

      try {
        await sendEmail(email, subject, message);
        console.log(`[Local Scheduler] Reminder sent to ${email}`);
      } catch (err) {
        console.error(`[Local Scheduler] Failed to send email:`, err);
      }
    }, delay * 1000);

    return { messageId: "local-timer" };
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
    console.log(`[QStash] Reminder scheduled for ${scheduleTime.toISOString()}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("[QStash] Error scheduling reminder:", error);
  }
}
