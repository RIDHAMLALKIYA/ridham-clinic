'use server';

import { db } from '@/db';
import { patients, appointments, settings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/services/mail';
import { scheduleReminder } from '@/lib/services/scheduler';
import { getSession } from '@/lib/auth';
import { formatTime12h } from '@/lib/utils';
import { generateAppointmentQRCode } from '@/lib/services/qr';

// Security Helper
async function requireAuth(role?: 'doctor' | 'admin') {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function updateAppointment(
  id: number,
  status: string,
  appointmentDate?: string,
  appointmentTime?: string
) {
  await requireAuth('doctor');

  let scheduledAt: Date | null = null;
  if (appointmentDate && appointmentTime) {
    // Force format check to avoid 'Invalid Date' and apply IST (+05:30) 
    // This ensures local clinic time is used even on UTC servers (Vercel)
    const dateStr = `${appointmentDate}T${appointmentTime}:00+05:30`;
    scheduledAt = new Date(dateStr);
    
    if (isNaN(scheduledAt.getTime())) {
      console.error(`[DoctorAction] ❌ Invalid date/time format: ${dateStr}`);
      scheduledAt = null;
    }
  }

  await db
    .update(appointments)
    .set({
      status,
      ...(appointmentDate ? { appointmentDate } : {}),
      ...(appointmentTime ? { appointmentTime } : {}),
      ...(scheduledAt ? { scheduledAt } : {}),
    })
    .where(eq(appointments.id, id));

  if (status === 'scheduled' && scheduledAt) {
    const [appt] = await db.select().from(appointments).where(eq(appointments.id, id));
    const [patient] = await db.select().from(patients).where(eq(patients.id, appt.patientId));
    
    if (patient?.email) {
      console.log(`[DoctorAction] Processing confirmation for ${patient.name} (${patient.email})`);
      const qrCodeDataUrl = await generateAppointmentQRCode(id, patient.email);
      
      const emailText = `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is confirmed for ${appointmentDate} at ${formatTime12h(appointmentTime || '')}.\n\nPlease find your unique check-in QR code attached below. You can use this to check-in when you arrive at the clinic.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb;">Appointment Confirmed!</h2>
          <p>Hello <strong>${patient.name}</strong>,</p>
          <p>Your appointment at <strong>HealthCore Clinic</strong> is confirmed for:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formatTime12h(appointmentTime || '')}</p>
          </div>
          <p>To speed up your arrival, please present the QR code below for check-in:</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrcode" alt="Check-in QR Code" style="width: 200px; height: 200px; border: 2px solid #2563eb; padding: 10px; border-radius: 10px;" />
          </div>
          <p>We look forward to seeing you!</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">Best regards,<br>HealthCore Team</p>
        </div>
      `;

      // Send confirmation synchronously
      await sendEmail(
        patient.email,
        'Appointment Confirmed - HealthCore Clinic',
        emailText,
        emailHtml,
        [{
          filename: 'checkin-qr.png',
          path: qrCodeDataUrl,
          cid: 'qrcode'
        }]
      );

      const now = new Date();
      const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);

      console.log(`[DoctorAction] Time Diagnosis:`);
      console.log(` - Current Time: ${now.toISOString()}`);
      console.log(` - Appt Time: ${scheduledAt.toISOString()}`);
      console.log(` - 30m Before: ${thirtyMinBefore.toISOString()}`);

      if (thirtyMinBefore > now) {
        console.log(`[DoctorAction] 🗓️ Scheduling 30-min reminder (Delayed)`);
        await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min');
      } else if (scheduledAt > now) {
        console.log(`[DoctorAction] ⚡ Appointment is very soon. Sending IMMEDIATE reminder email.`);
        await sendEmail(
          patient.email,
          'Upcoming Appointment Reminder - HealthCore Clinic',
          `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is approaching shortly (at ${formatTime12h(appointmentTime || '')}). We look forward to seeing you!\n\nBest regards,\nHealthCore Team`
        );
      } else {
        console.warn(`[DoctorAction] ⚠️ Appointment is in the past. Skipping 30min automation.`);
      }

      // Always schedule the "Starting Now" reminder if it's still in the future
      if (scheduledAt > now) {
        console.log(`[DoctorAction] 🗓️ Scheduling 'Starting Now' reminder`);
        await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact');
      }
    }
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/admin');
}

export async function callPatient(appointmentId: number) {
  await requireAuth('doctor');
  const today = new Date().toLocaleDateString('en-CA');
  await db
    .update(appointments)
    .set({
      status: 'completed',
      attendedAt: new Date(),
      appointmentDate: today,
    })
    .where(eq(appointments.status, 'called'));
  await db.update(appointments).set({ status: 'called' }).where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function completeConsultation(appointmentId: number) {
  await requireAuth('doctor');
  const today = new Date().toLocaleDateString('en-CA');
  await db
    .update(appointments)
    .set({
      status: 'completed',
      attendedAt: new Date(),
      appointmentDate: today,
    })
    .where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function dismissFollowUp(appointmentId: number) {
  await requireAuth('doctor');
  await db
    .update(appointments)
    .set({ status: 'finalized' })
    .where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
}

export async function setDoctorStatus(status: 'consulting' | 'resting') {
  await requireAuth('doctor');
  const [existing] = await db.select().from(settings).where(eq(settings.key, 'doctor_status'));

  if (existing) {
    await db.update(settings).set({ value: status }).where(eq(settings.key, 'doctor_status'));
  } else {
    await db.insert(settings).values({ key: 'doctor_status', value: status });
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function scheduleReappointment(patientId: number, date: string, time: string) {
  await requireAuth('doctor');
  
  const dateStr = `${date}T${time}:00+05:30`;
  const scheduledAt = new Date(dateStr);
  
  if (isNaN(scheduledAt.getTime())) {
    console.error(`[DoctorAction] ❌ Invalid reappointment date/time: ${dateStr}`);
    throw new Error('Invalid date or time format');
  }

  const result = await db
    .insert(appointments)
    .values({
      patientId,
      status: 'scheduled',
      appointmentDate: date,
      appointmentTime: time,
      scheduledAt,
    })
    .returning({ id: appointments.id });

  const id = result[0].id;
  const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));

  if (patient?.email) {
    console.log(`[DoctorAction] Processing reappointment for ${patient.name}`);
    const qrCodeDataUrl = await generateAppointmentQRCode(id, patient.email);
    
    const emailText = `Hello ${patient.name},\n\nYour follow-up appointment at HealthCore Clinic is confirmed for ${date} at ${formatTime12h(time)}.\n\nPlease find your unique check-in QR code attached below.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563eb;">Follow-up Confirmed!</h2>
        <p>Hello <strong>${patient.name}</strong>,</p>
        <p>Your follow-up appointment at <strong>HealthCore Clinic</strong> is confirmed for:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${formatTime12h(time)}</p>
        </div>
        <p>To speed up your arrival, please present the QR code below for check-in:</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:qrcode" alt="Check-in QR Code" style="width: 200px; height: 200px; border: 2px solid #2563eb; padding: 10px; border-radius: 10px;" />
        </div>
        <p>We look forward to seeing you!</p>
        <p style="margin-top: 30px; font-size: 14px; color: #666;">Best regards,<br>HealthCore Team</p>
      </div>
    `;

    await sendEmail(
      patient.email,
      'Follow-up Appointment Confirmed - HealthCore Clinic',
      emailText,
      emailHtml,
      [{
        filename: 'checkin-qr.png',
        path: qrCodeDataUrl,
        cid: 'qrcode'
      }]
    );

    const now = new Date();
    const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);

    console.log(`[Reappointment] Time Diagnosis:`);
    console.log(` - Current Time: ${now.toISOString()}`);
    console.log(` - Appt Time: ${scheduledAt.toISOString()}`);
    console.log(` - 30m Before: ${thirtyMinBefore.toISOString()}`);

    if (thirtyMinBefore > now) {
      console.log(`[Reappointment] 🗓️ Scheduling 30-min reminder (Delayed)`);
      await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min');
    } else if (scheduledAt > now) {
      console.log(`[Reappointment] ⚡ Appointment is very soon. Sending IMMEDIATE reminder email.`);
      await sendEmail(
        patient.email,
        'Upcoming Appointment Reminder - HealthCore Clinic',
        `Hello ${patient.name},\n\nYour follow-up appointment at HealthCore Clinic is approaching shortly (at ${formatTime12h(time)}). We look forward to seeing you!\n\nBest regards,\nHealthCore Team`
      );
    }

    if (scheduledAt > now) {
      console.log(`[Reappointment] 🗓️ Scheduling 'Starting Now' reminder`);
      await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact');
    }
  }

  revalidatePath('/doctor/dashboard');
}

export async function markAsNotArrived(appointmentId: number) {
  await requireAuth('doctor');

  const [appt] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  if (!appt) return;

  const [patient] = await db.select().from(patients).where(eq(patients.id, appt.patientId));

  if (patient?.email) {
    await sendEmail(
      patient.email,
      'Missed Appointment - HealthCore Clinic',
      `Hello ${patient.name},\n\nWe noticed that you were unable to attend your scheduled appointment today. \n\nYou can easily reschedule your visit by clicking the link below:\n👉 [Reschedule My Appointment](http://localhost:3000/book)\n\nAlternatively, you can reply directly to this email or contact us at +91 98765 43210.\n\nBest regards,\nHealthCore Team`
    );
  }

  await db.update(appointments).set({ status: 'missed' }).where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
}

export async function getNotificationCounts() {
  await requireAuth('doctor');
  
  const reqData = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.status, 'requested'));
    
  const queueData = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.status, 'arrived'));

  return {
    requests: Number(reqData[0]?.count || 0),
    queue: Number(queueData[0]?.count || 0)
  };
}
