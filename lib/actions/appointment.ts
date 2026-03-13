'use server';

import { db } from '@/db';
import { patients, appointments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendEmail } from '@/lib/services/mail';
import { getSession } from '@/lib/auth';
import { validatePhoneNumber } from '@/lib/validations/appointment.validation';

// Security Helper
async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function createBooking(formData: FormData) {
  const name = formData.get('name') as string;
  const countryCode = (formData.get('countryCode') as string) || '+91';
  const rawPhoneNumber = formData.get('phoneNumber') as string;

  if (!validatePhoneNumber(rawPhoneNumber)) {
    throw new Error('Invalid phone number. Please provide a 10-digit numeric number.');
  }

  const phoneNumber = `${countryCode}${rawPhoneNumber}`;
  const email = formData.get('email') as string;
  const atClinic = formData.get('atClinic') === 'on';
  let reasonForVisit = formData.get('reasonForVisit') as string;
  
  if (atClinic) {
    reasonForVisit = `[PHYSICALLY PRESENT AT CLINIC] ${reasonForVisit}`;
  }

  const emergencyFlag = formData.get('emergencyFlag') === 'on';
  const redirectTo = formData.get('redirectTo') as string;

  let patientId: number;
  const patientResult = await db
    .select()
    .from(patients)
    .where(eq(patients.phoneNumber, phoneNumber));

  if (patientResult.length > 0) {
    patientId = patientResult[0].id;
    // Sync the name, email, and reason if they have changed
    await db
      .update(patients)
      .set({ 
        name, 
        email,
        reasonForVisit 
      })
      .where(eq(patients.id, patientId));
  } else {
    const insertResult = await db
      .insert(patients)
      .values({
        name,
        phoneNumber,
        email,
        reasonForVisit,
      })
      .returning({ id: patients.id });
    patientId = insertResult[0].id;
  }

  await db.insert(appointments).values({
    patientId,
    status: 'requested',
    emergencyFlag,
  });

  revalidatePath('/doctor/dashboard');
  revalidatePath('/admin');

  if (redirectTo) {
    redirect(`${redirectTo}?success=registered`);
  }

  redirect(`/?success=1`);
}

export async function patientCheckIn(
  name: string,
  phoneNumber: string,
  emergencyFlag: boolean = false
) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(
      and(eq(patients.phoneNumber, phoneNumber), sql`LOWER(${patients.name}) = LOWER(${name})`)
    );
  if (!patient) return { success: false, error: 'Patient not found' };

  const [appt] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.patientId, patient.id), eq(appointments.status, 'scheduled')));
  if (!appt) return { success: false, error: 'No scheduled appointment found for today' };

  await db
    .update(appointments)
    .set({
      status: 'arrived',
      emergencyFlag: emergencyFlag || appt.emergencyFlag,
    })
    .where(eq(appointments.id, appt.id));

  revalidatePath('/doctor/dashboard');
  revalidatePath('/queue');
  revalidatePath('/admin');
  return { success: true };
}

export async function rejectAppointment(id: number) {
  await requireAuth();

  const [appt] = await db.select().from(appointments).where(eq(appointments.id, id));
  if (appt) {
    const [patient] = await db.select().from(patients).where(eq(patients.id, appt.patientId));
    if (patient?.email) {
      await sendEmail(
        patient.email,
        'Appointment Cancelled - HealthCore Clinic',
        `Hello ${patient.name},\n\nWe regret to inform you that your appointment request at HealthCore Clinic has been cancelled. This might be due to a scheduling conflict or unavailability.\n\nYou are welcome to try booking another time slot that works for you.\n\nBest regards,\nHealthCore Team`
      );
    }
  }

  await db.delete(appointments).where(eq(appointments.id, id));
  revalidatePath('/doctor/dashboard');
  revalidatePath('/admin');
}
export async function qrCheckIn(qrData: string) {
  try {
    const { appointmentId, patientEmail } = JSON.parse(qrData);

    if (!appointmentId || !patientEmail) {
      return { success: false, error: 'Invalid QR Code data.' };
    }

    const [appt] = await db
      .select({
        id: appointments.id,
        status: appointments.status,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        patientName: patients.name,
        patientEmail: patients.email,
        emergencyFlag: appointments.emergencyFlag,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.id, appointmentId));

    if (!appt) {
      return { success: false, error: 'Appointment not found.' };
    }

    if (appt.patientEmail !== patientEmail) {
      return { success: false, error: 'Invalid patient record for this appointment.' };
    }

    // Check if the appointment is for today
    const today = new Date().toLocaleDateString('en-CA');
    if (appt.appointmentDate && appt.appointmentDate !== today) {
      return { success: false, error: 'This appointment is not scheduled for today.' };
    }

    if (appt.status === 'arrived' || appt.status === 'called' || appt.status === 'completed') {
      return { success: false, error: 'Patient is already checked-in or appointment is finished.' };
    }

    // Mark as arrived
    await db
      .update(appointments)
      .set({
        status: 'arrived',
      })
      .where(eq(appointments.id, appointmentId));

    revalidatePath('/doctor/dashboard');
    revalidatePath('/queue');
    revalidatePath('/admin');

    return {
      success: true,
      data: {
        patientName: appt.patientName,
        appointmentTime: appt.appointmentTime,
      },
    };
  } catch (err) {
    console.error('QR Check-In error:', err);
    return { success: false, error: 'Failed to process QR code. Please try again.' };
  }
}
