'use server';

import { db } from '@/db';
import { patients, appointments, settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/services/mail';
import { scheduleReminder } from '@/services/scheduler';
import { getSession } from '@/lib/auth';
import { formatTime12h } from '@/lib/utils';

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
    scheduledAt = new Date(`${appointmentDate}T${appointmentTime}`);
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
      await sendEmail(
        patient.email,
        'Appointment Confirmed - HealthCore Clinic',
        `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is confirmed for ${appointmentDate} at ${formatTime12h(appointmentTime || '')}.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`
      );

      const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
      if (thirtyMinBefore > new Date()) {
        await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min');
      } else if (scheduledAt > new Date()) {
        await sendEmail(
          patient.email,
          'Upcoming Appointment Reminder - HealthCore Clinic',
          `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is approaching shortly. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`
        );
      }

      await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact');
    }
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
  revalidatePath('/admin');
}

export async function callPatient(appointmentId: number) {
  await requireAuth('doctor');
  await db
    .update(appointments)
    .set({ status: 'completed' })
    .where(eq(appointments.status, 'called'));
  await db.update(appointments).set({ status: 'called' }).where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function completeConsultation(appointmentId: number) {
  await requireAuth('doctor');
  await db
    .update(appointments)
    .set({ status: 'completed' })
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
  const scheduledAt = new Date(`${date}T${time}`);
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
    await sendEmail(
      patient.email,
      'Appointment Confirmed - HealthCore Clinic',
      `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is confirmed for ${date} at ${formatTime12h(time)}.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`
    );

    const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
    if (thirtyMinBefore > new Date()) {
      await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min');
    } else if (scheduledAt > new Date()) {
      await sendEmail(
        patient.email,
        'Upcoming Appointment Reminder - HealthCore Clinic',
        `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is approaching shortly. We look forward to seeing you!\n\nBest regards,\nHealthCore Team`
      );
    }

    await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact');
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
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
