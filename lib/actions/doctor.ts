'use server';

import { db } from '@/db';
import { patients, appointments, settings } from '@/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/services/mail';
import { scheduleReminder } from '@/lib/services/scheduler';
import { getSession } from '@/lib/auth';
import { formatTime12h } from '@/lib/utils';
import { generateAppointmentQRCode } from '@/lib/services/qr';
import { processQueueNotifications } from '@/lib/services/queueNotifications';
import { sendWhatsApp } from '@/lib/services/whatsapp';

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
      const isGu = patient.preferredLanguage === 'gu';
      
      const emailText = isGu
        ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી એપોઈન્ટમેન્ટ ${appointmentDate} ના રોજ ${formatTime12h(appointmentTime || '')} વાગ્યે કન્ફર્મ થઈ ગઈ છે.\n\nકૃપા કરીને નીચે આપેલ તમારો QR કોડ તપાસો. જ્યારે તમે ક્લિનિક પર આવો ત્યારે તમે આનો ઉપયોગ ચેક-ઇન કરવા માટે કરી શકો છો.\n\nઅમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
        : `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is confirmed for ${appointmentDate} at ${formatTime12h(appointmentTime || '')}.\n\nPlease find your unique check-in QR code attached below. You can use this to check-in when you arrive at the clinic.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb;">${isGu ? 'એપોઈન્ટમેન્ટ કન્ફર્મ થઈ ગઈ છે!' : 'Appointment Confirmed!'}</h2>
          <p>${isGu ? `નમસ્તે <strong>${patient.name}</strong>,` : `Hello <strong>${patient.name}</strong>,`}</p>
          <p>${isGu ? `<strong>હેલ્થકોર ક્લિનિક</strong> માં તમારી એપોઈન્ટમેન્ટ કન્ફર્મ છે:` : `Your appointment at <strong>HealthCore Clinic</strong> is confirmed for:`}</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>${isGu ? 'તારીખ:' : 'Date:'}</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>${isGu ? 'સમય:' : 'Time:'}</strong> ${formatTime12h(appointmentTime || '')}</p>
          </div>
          <p>${isGu ? 'તમારા આગમનને ઝડપી બનાવવા માટે, કૃપા કરીને નીચેનો QR કોડ બતાવો:' : 'To speed up your arrival, please present the QR code below for check-in:'}</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrcode" alt="Check-in QR Code" style="width: 200px; height: 200px; border: 2px solid #2563eb; padding: 10px; border-radius: 10px;" />
          </div>
          <p>${isGu ? 'અમે તમને જોવા આતુર છીએ!' : 'We look forward to seeing you!'}</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">${isGu ? 'શ્રેષ્ઠ શુભેચ્છાઓ,' : 'Best regards,'}<br>HealthCore Team</p>
        </div>
      `;

      try {
        await sendEmail(
          patient.email,
          isGu ? 'એપોઈન્ટમેન્ટ કન્ફર્મ - હેલ્થકોર ક્લિનિક' : 'Appointment Confirmed - HealthCore Clinic',
          emailText,
          emailHtml,
          [{
            filename: 'checkin-qr.png',
            path: qrCodeDataUrl,
            cid: 'qrcode'
          }]
        );

        // Send WhatsApp Confirmation
        /*
        await sendWhatsApp({
          to: patient.phoneNumber,
          templateName: 'appointment_confirmed',
          language: (patient.preferredLanguage || 'en') as 'en' | 'gu',
          variables: {
            patient_name: patient.name,
            date: appointmentDate || '',
            time: formatTime12h(appointmentTime || ''),
            clinic_name: 'HealthCore Clinic'
          }
        });
        */

        const now = new Date();
        const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);

        if (thirtyMinBefore > now) {
          await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min', patient.preferredLanguage || 'en');
        } else if (scheduledAt > now) {
          const reminderSubject = isGu ? 'આગામી એપોઈન્ટમેન્ટ રીમાઇન્ડર - હેલ્થકોર ક્લિનિક' : 'Upcoming Appointment Reminder - HealthCore Clinic';
          const reminderText = isGu 
            ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી એપોઈન્ટમેન્ટ ટૂંક સમયમાં શરૂ થવા જઈ રહી છે (${formatTime12h(appointmentTime || '')} વાગ્યે). અમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
            : `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is approaching shortly (at ${formatTime12h(appointmentTime || '')}). We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
          
          await sendEmail(patient.email, reminderSubject, reminderText);
        }

        if (scheduledAt > now) {
          await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact', patient.preferredLanguage || 'en');
        }
      } catch (err) {
        console.error('[DoctorAction] Notification failed:', err);
      }
    }
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/admin');
}

export async function callPatient(appointmentId: number) {
  await requireAuth('doctor');
  const [targetAppt] = await db
    .select({ id: appointments.id, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!targetAppt || targetAppt.status !== 'arrived') return;

  const today = new Date().toLocaleDateString('en-CA');
  await db.update(appointments).set({ status: 'completed', attendedAt: new Date(), appointmentDate: today }).where(eq(appointments.status, 'called'));
  await db.update(appointments).set({ status: 'called' }).where(and(eq(appointments.id, appointmentId), eq(appointments.status, 'arrived')));
  processQueueNotifications().catch(err => console.error('[QueueSync] Notification error:', err));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function completeConsultation(appointmentId: number) {
  await requireAuth('doctor');
  const today = new Date().toLocaleDateString('en-CA');
  await db.update(appointments).set({ status: 'completed', attendedAt: new Date(), appointmentDate: today }).where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function dismissFollowUp(appointmentId: number) {
  await requireAuth('doctor');
  await db.update(appointments).set({ status: 'finalized' }).where(eq(appointments.id, appointmentId));
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
  if (status === 'consulting') processQueueNotifications().catch(err => console.error('[StatusSync] Notification error:', err));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
}

export async function scheduleReappointment(patientId: number, date: string, time: string) {
  await requireAuth('doctor');
  const dateStr = `${date}T${time}:00+05:30`;
  const scheduledAt = new Date(dateStr);
  if (isNaN(scheduledAt.getTime())) throw new Error('Invalid date or time format');

  const result = await db.insert(appointments).values({ patientId, status: 'scheduled', appointmentDate: date, appointmentTime: time, scheduledAt }).returning({ id: appointments.id });
  const id = result[0].id;
  const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));

  if (patient?.email) {
    const qrCodeDataUrl = await generateAppointmentQRCode(id, patient.email);
    const isGu = patient.preferredLanguage === 'gu';
    const emailText = isGu
      ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી ફોલો-અપ એપોઈન્ટમેન્ટ ${date} ના રોજ ${formatTime12h(time)} વાગ્યે કન્ફર્મ થઈ ગઈ છે.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
      : `Hello ${patient.name},\n\nYour follow-up appointment at HealthCore Clinic is confirmed for ${date} at ${formatTime12h(time)}.\n\nBest regards,\nHealthCore Team`;

    try {
      await sendEmail(patient.email, isGu ? 'ફોલો-અપ કન્ફર્મ' : 'Follow-up Confirmed', emailText);
      /*
      await sendWhatsApp({
        to: patient.phoneNumber,
        templateName: 'appointment_confirmed',
        language: (patient.preferredLanguage || 'en') as 'en' | 'gu',
        variables: { patient_name: patient.name, date, time: formatTime12h(time), clinic_name: 'HealthCore Clinic' }
      });
      */
      const now = new Date();
      if (scheduledAt > now) {
        await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact', patient.preferredLanguage || 'en');
      }
    } catch (err) {
      console.error('[Reappointment] Notification failed:', err);
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
    const isGu = patient.preferredLanguage === 'gu';
    const subject = isGu ? 'ચૂકી ગયેલી એપોઈન્ટમેન્ટ' : 'Missed Appointment';
    const message = isGu ? `નમસ્તે ${patient.name}, તમે એપોઈન્ટમેન્ટ ચૂકી ગયા છો.` : `Hello ${patient.name}, you missed your appointment.`;
    await sendEmail(patient.email, subject, message);

    try {
      /*
      await sendWhatsApp({
        to: patient.phoneNumber,
        templateName: 'missed_appointment',
        language: (patient.preferredLanguage || 'en') as 'en' | 'gu',
        variables: { patient_name: patient.name, clinic_name: 'HealthCore Clinic', clinic_link: 'https://ridham-clinic-v1.vercel.app' }
      });
      */
    } catch (err) {
      console.error('[Missed] WhatsApp failed:', err);
    }
  }
  await db.update(appointments).set({ status: 'missed' }).where(eq(appointments.id, appointmentId));
  revalidatePath('/doctor/dashboard');
}

export async function getNotificationCounts() {
  await requireAuth('doctor');
  const reqData = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.status, 'requested'));
  const queueData = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.status, 'arrived'));
  return { requests: Number(reqData[0]?.count || 0), queue: Number(queueData[0]?.count || 0) };
}

export async function getAttendedPatientsByDate(date: string) {
  await requireAuth('doctor');
  return await db.select({ id: appointments.id, patientName: patients.name, phone: patients.phoneNumber, email: patients.email }).from(appointments).innerJoin(patients, eq(appointments.patientId, patients.id)).where(and(or(eq(appointments.status, 'completed'), eq(appointments.status, 'finalized')), eq(appointments.appointmentDate, date))).orderBy(desc(appointments.id));
}
