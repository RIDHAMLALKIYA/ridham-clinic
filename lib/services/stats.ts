import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function getClinicInsights() {
  const today = new Date().toLocaleDateString('en-CA');
  
  // 1. Total Unique Patients
  const totalPatientsRes = await db.select({ count: sql<number>`count(*)` }).from(patients);
  const totalPatients = Number(totalPatientsRes[0]?.count || 0);

  // 2. This Week's Appointments
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const weeklyApptsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(gte(appointments.createdAt, last7Days));
  const weeklyAppts = Number(weeklyApptsRes[0]?.count || 0);

  // 3. Emergency Ratio (Today)
  const emergencyRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(eq(appointments.appointmentDate, today), eq(appointments.emergencyFlag, true)));
  const emergencyCount = Number(emergencyRes[0]?.count || 0);

  // 4. Busy Hours (Most common hours for appointments)
  const busyHoursRes = await db
    .select({ 
      hour: appointments.appointmentTime,
      count: sql<number>`count(*)` 
    })
    .from(appointments)
    .groupBy(appointments.appointmentTime)
    .orderBy(sql`count(*) DESC`)
    .limit(1);
  const peakHour = busyHoursRes[0]?.hour || 'N/A';

  return {
    totalPatients,
    weeklyAppts,
    emergencyToday: emergencyCount,
    peakHour
  };
}
