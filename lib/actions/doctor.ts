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

      // Send confirmation synchronously
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

        const now = new Date();
        const thirtyMinBefore = new Date(scheduledAt.getTime() - 30 * 60 * 1000);

        if (thirtyMinBefore > now) {
          console.log(`[DoctorAction] 🗓️ Scheduling 30-min reminder (Delayed)`);
          await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min', patient.preferredLanguage || 'en');
        } else if (scheduledAt > now) {
          console.log(`[DoctorAction] ⚡ Appointment is very soon. Sending IMMEDIATE reminder email.`);
          const reminderSubject = isGu ? 'આગામી એપોઈન્ટમેન્ટ રીમાઇન્ડર - હેલ્થકોર ક્લિનિક' : 'Upcoming Appointment Reminder - HealthCore Clinic';
          const reminderText = isGu 
            ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી એપોઈન્ટમેન્ટ ટૂંક સમયમાં શરૂ થવા જઈ રહી છે (${formatTime12h(appointmentTime || '')} વાગ્યે). અમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
            : `Hello ${patient.name},\n\nYour appointment at HealthCore Clinic is approaching shortly (at ${formatTime12h(appointmentTime || '')}). We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
          
          await sendEmail(patient.email, reminderSubject, reminderText);
        }

        // Always schedule the "Starting Now" reminder if it's still in the future
        if (scheduledAt > now) {
          console.log(`[DoctorAction] 🗓️ Scheduling 'Starting Now' reminder`);
          await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact', patient.preferredLanguage || 'en');
        }
      } catch (err) {
        console.error('[DoctorAction] Email/Automation notification failed:', err);
      }
    }
  }

  revalidatePath('/doctor/dashboard');
  revalidatePath('/admin');
}

export async function callPatient(appointmentId: number) {
  await requireAuth('doctor');

  // Race Condition Guard: Verify the appointment is still in 'arrived' status
  const [targetAppt] = await db
    .select({ id: appointments.id, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!targetAppt || targetAppt.status !== 'arrived') {
    console.warn(`[CallPatient] ⚠️ Skipped: Appointment ${appointmentId} is not in 'arrived' status (current: ${targetAppt?.status}).`);
    return;
  }

  const today = new Date().toLocaleDateString('en-CA');
  await db
    .update(appointments)
    .set({
      status: 'completed',
      attendedAt: new Date(),
      appointmentDate: today,
    })
    .where(eq(appointments.status, 'called'));

  // Only update if still 'arrived' (database-level lock)
  await db
    .update(appointments)
    .set({ status: 'called' })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.status, 'arrived')));
  
  // Trigger Queue Position Notifications (Backgrounded to avoid UI delay)
  processQueueNotifications().catch(err => console.error('[QueueSync] Notification error:', err));

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
  
  if (status === 'consulting') {
    processQueueNotifications().catch(err => console.error('[StatusSync] Notification error:', err));
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
    const isGu = patient.preferredLanguage === 'gu';
    
    const emailText = isGu
      ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી ફોલો-અપ એપોઈન્ટમેન્ટ ${date} ના રોજ ${formatTime12h(time)} વાગ્યે કન્ફર્મ થઈ ગઈ છે.\n\nકૃપા કરીને નીચે આપેલ તમારો QR કોડ તપાસો.\n\nઅમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
      : `Hello ${patient.name},\n\nYour follow-up appointment at HealthCore Clinic is confirmed for ${date} at ${formatTime12h(time)}.\n\nPlease find your unique check-in QR code attached below.\n\nWe look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563eb;">${isGu ? 'ફોલો-અપ કન્ફર્મ થઈ ગયું છે!' : 'Follow-up Confirmed!'}</h2>
        <p>${isGu ? `નમસ્તે <strong>${patient.name}</strong>,` : `Hello <strong>${patient.name}</strong>,`}</p>
        <p>${isGu ? `<strong>હેલ્થકોર ક્લિનિક</strong> માં તમારી ફોલો-અપ એપોઈન્ટમેન્ટ કન્ફર્મ છે:` : `Your follow-up appointment at <strong>HealthCore Clinic</strong> is confirmed for:`}</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>${isGu ? 'તારીખ:' : 'Date:'}</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>${isGu ? 'સમય:' : 'Time:'}</strong> ${formatTime12h(time)}</p>
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
        isGu ? 'ફોલો-અપ એપોઈન્ટમેન્ટ કન્ફર્મ - હેલ્થકોર ક્લિનિક' : 'Follow-up Appointment Confirmed - HealthCore Clinic',
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

      if (thirtyMinBefore > now) {
        console.log(`[Reappointment] 🗓️ Scheduling 30-min reminder (Delayed)`);
        await scheduleReminder(id, patient.name, patient.email, thirtyMinBefore, '30min', patient.preferredLanguage || 'en');
      } else if (scheduledAt > now) {
        console.log(`[Reappointment] ⚡ Appointment is very soon. Sending IMMEDIATE reminder email.`);
        const reminderSubject = isGu ? 'આગામી એપોઈન્ટમેન્ટ રીમાઇન્ડર - હેલ્થકોર ક્લિનિક' : 'Upcoming Appointment Reminder - HealthCore Clinic';
        const reminderText = isGu
          ? `નમસ્તે ${patient.name},\n\nહેલ્થકોર ક્લિનિકમાં તમારી ફોલો-અપ એપોઈન્ટમેન્ટ ટૂંક સમયમાં શરૂ થવા જઈ રહી છે (${formatTime12h(time)} વાગ્યે). અમે તમને જોવા આતુર છીએ!\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
          : `Hello ${patient.name},\n\nYour follow-up appointment at HealthCore Clinic is approaching shortly (at ${formatTime12h(time)}). We look forward to seeing you!\n\nBest regards,\nHealthCore Team`;
        
        await sendEmail(patient.email, reminderSubject, reminderText);
      }

      if (scheduledAt > now) {
        console.log(`[Reappointment] 🗓️ Scheduling 'Starting Now' reminder`);
        await scheduleReminder(id, patient.name, patient.email, scheduledAt, 'exact', patient.preferredLanguage || 'en');
      }
    } catch (err) {
      console.error('[Reappointment] Automation/Email failed:', err);
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
    const subject = isGu ? 'ચૂકી ગયેલી એપોઈન્ટમેન્ટ - હેલ્થકોર ક્લિનિક' : 'Missed Appointment - HealthCore Clinic';
    const message = isGu
      ? `નમસ્તે ${patient.name},\n\nઅમે નોંધ્યું છે કે તમે આજે તમારી નક્કી કરેલી એપોઈન્ટમેન્ટમાં હાજર રહી શક્યા નથી.\n\nતમે નીચેની લિંક પર ક્લિક કરીને સરળતાથી તમારી મુલાકાત ફરીથી શિડ્યુલ કરી શકો છો:\n👉 [ફરીથી શિડ્યુલ કરો](${process.env.NEXT_PUBLIC_APP_URL || 'https://ridham-clinic-v1.vercel.app'})\n\nવૈકલ્પિક રીતે, તમે સીધો આ ઈમેઈલનો જવાબ આપી શકો છો અથવા અમારો સંપર્ક કરી શકો છો.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
      : `Hello ${patient.name},\n\nWe noticed that you were unable to attend your scheduled appointment today. \n\nYou can easily reschedule your visit by clicking the link below:\n👉 [Reschedule My Appointment](${process.env.NEXT_PUBLIC_APP_URL || 'https://ridham-clinic-v1.vercel.app'})\n\nAlternatively, you can reply directly to this email or contact us.\n\nBest regards,\nHealthCore Team`;

    await sendEmail(patient.email, subject, message);
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

export async function getAttendedPatientsByDate(date: string) {
  await requireAuth('doctor');
  
  return await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      phone: patients.phoneNumber,
      email: patients.email,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        or(eq(appointments.status, 'completed'), eq(appointments.status, 'finalized')),
        eq(appointments.appointmentDate, date)
      )
    )
    .orderBy(desc(appointments.id));
}
