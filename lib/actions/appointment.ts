'use server';

import { db } from '@/db';
import { patients, appointments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendEmail } from '@/lib/services/mail';
import { sendWhatsApp } from '@/lib/services/whatsapp';
import { getSession } from '@/lib/auth';
import { processQueueNotifications } from '@/lib/services/queueNotifications';
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
  const preferredLanguage = (formData.get('language') as string) || 'en';
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
        reasonForVisit,
        preferredLanguage
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
        preferredLanguage,
      })
      .returning({ id: patients.id });
    patientId = insertResult[0].id;
  }

  await db.insert(appointments).values({
    patientId,
    status: 'requested',
    emergencyFlag,
  });

  if (email) {
    try {
      if (preferredLanguage === 'gu') {
        const guSubject = 'મોકલવામાં આવેલી એપોઈન્ટમેન્ટ વિનંતી - હેલ્થકોર ક્લિનિક';
        const guMessage = `નમસ્તે ${name},\n\nહેલ્થકોર ક્લિનિક પસંદ કરવા બદલ આભાર. અમને તમારી એપોઈન્ટમેન્ટ વિનંતી મળી છે.\n\nઅમારી ટીમ અત્યારે તેની સમીક્ષા કરી રહી છે. એકવાર તમારો સ્લોટ સેટ થઈ ગયા પછી તમને તમારા કન્ફર્મ કરેલ સમય અને ચેક-ઇન QR કોડ સાથે બીજો ઈમેઈલ પ્રાપ્ત થશે.\n\n${atClinic ? 'નોંધ: તમે તમારી જાતને શારીરિક રીતે ક્લિનિકમાં હાજર તરીકે ચિહ્નિત કર્યા છે.' : 'અમે તમને ટૂંક સમયમાં જાણ કરીશું.'}\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`;
        await sendEmail(email, guSubject, guMessage);
      } else {
        await sendEmail(
          email,
          'Appointment Request Received - HealthCore Clinic',
          `Hello ${name},\n\nThank you for choosing HealthCore Clinic. We have received your appointment request.\n\nOur team is reviewing it now. You will receive another email with your confirmed time and check-in QR code once your slot is assigned.\n\n${atClinic ? 'Note: You have marked yourself as physically present at the clinic.' : 'We will notify you shortly.'}\n\nBest regards,\nHealthCore Team`
        );
      }
    } catch (err) {
      console.error('[Booking] Email notification failed:', err);
    }
  }

  // Send WhatsApp Notification
  try {
    await sendWhatsApp({
      to: phoneNumber,
      templateName: 'appointment_request_received',
      language: preferredLanguage as 'en' | 'gu',
      variables: {
        patient_name: name,
        clinic_name: 'HealthCore Clinic'
      }
    });
  } catch (err) {
    console.error('[Booking] WhatsApp notification failed:', err);
  }

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
  emergencyFlag: boolean = false,
  preferredLanguage?: string
) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(
      and(eq(patients.phoneNumber, phoneNumber), sql`LOWER(${patients.name}) = LOWER(${name})`)
    );
  if (!patient) return { success: false, error: 'Patient not found' };

  // Update preference if provided
  if (preferredLanguage) {
    await db.update(patients).set({ preferredLanguage }).where(eq(patients.id, patient.id));
  }

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

  processQueueNotifications().catch(err => console.error('[CheckInSync] Notification error:', err));

  // WhatsApp Check-in Confirmation
  /* 
  try {
    await sendWhatsApp({
      to: patient.phoneNumber,
      templateName: 'patient_checkin_success',
      language: (preferredLanguage || patient.preferredLanguage) as 'en' | 'gu',
      variables: {
        patient_name: patient.name,
        clinic_name: 'HealthCore Clinic'
      }
    });
  } catch (err) {
    console.error('[CheckInSync] WhatsApp notification failed:', err);
  }
  */

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
      const isScheduled = appt.status === 'scheduled' || appt.status === 'arrived';
      const isGu = patient.preferredLanguage === 'gu';

      const subject = isGu 
        ? (isScheduled ? 'એપોઈન્ટમેન્ટ રદ કરવામાં આવી - હેલ્થકોર ક્લિનિક' : 'એપોઈન્ટમેન્ટ વિનંતી નકારવામાં આવી - હેલ્થકોર ક્લિનિક')
        : (isScheduled ? 'Appointment Cancelled - HealthCore Clinic' : 'Appointment Request Declined - HealthCore Clinic');

      const message = isGu
        ? (isScheduled 
            ? `નમસ્તે ${patient.name},\n\nઅમે તમને જણાવવા માંગીએ છીએ કે તમારી હેલ્થકોર ક્લિનિકમાં નક્કી કરેલી એપોઈન્ટમેન્ટ રદ કરવામાં આવી છે. અગવડતા બદલ અમે દિલગીર છીએ.\n\nતમે ગમે ત્યારે નવી એપોઈન્ટમેન્ટ બુક કરી શકો છો.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`
            : `નમસ્તે ${patient.name},\n\nઅમે દિલગીરી સાથે જણાવીએ છીએ કે તમારી હેલ્થકોર ક્લિનિકમાં એપોઈન્ટમેન્ટની વિનંતી અત્યારે સ્વીકારી શકાય તેમ નથી. આ શિડ્યુલિંગ સંઘર્ષ અથવા અનુપલબ્ધતાને કારણે હોઈ શકે છે.\n\nતમે તમારા માટે અનુકૂળ બીજો સમય સ્લોટ બુક કરવાનો પ્રયાસ કરી શકો છો.\n\nશ્રેષ્ઠ શુભેચ્છાઓ,\nહેલ્થકોર ટીમ`)
        : (isScheduled 
            ? `Hello ${patient.name},\n\nWe are writing to inform you that your scheduled appointment at HealthCore Clinic has been cancelled. We apologize for any inconvenience this may cause.\n\nYou are welcome to book a new appointment at your earliest convenience.\n\nBest regards,\nHealthCore Team`
            : `Hello ${patient.name},\n\nWe regret to inform you that your appointment request at HealthCore Clinic could not be accommodated at this time. This might be due to a scheduling conflict or unavailability.\n\nYou are welcome to try booking another time slot that works for you.\n\nBest regards,\nHealthCore Team`);

      try {
        await sendEmail(patient.email, subject, message);
      } catch (err) {
        console.error('[RejectAppointment] Email notification failed:', err);
      }
    }

    // WhatsApp Cancellation Notification
    /*
    try {
      await sendWhatsApp({
        to: patient.phoneNumber,
        templateName: appt.status === 'requested' ? 'appointment_request_declined' : 'appointment_cancelled',
        language: (patient.preferredLanguage || 'en') as 'en' | 'gu',
        variables: {
          patient_name: patient.name,
          clinic_name: 'HealthCore Clinic'
        }
      });
    } catch (err) {
      console.error('[RejectAppointment] WhatsApp notification failed:', err);
    }
    */
  }

  await db.delete(appointments).where(eq(appointments.id, id));
  processQueueNotifications().catch(err => console.error('[RejectSync] Notification error:', err));
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

    processQueueNotifications().catch(err => console.error('[QRSync] Notification error:', err));

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
