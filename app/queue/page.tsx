import { db } from '@/db';
import { appointments, patients, settings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AutoRefresh from '@/components/AutoRefresh';
import QueueAudioAlert from './QueueAudioAlert';
import ScrollingName from './ScrollingName';
import {
  Bell,
  Users,
  Clock,
  CheckCircle2,
  ArrowRightCircle,
  Sparkles,
  Coffee,
  Heart,
  AlertCircle,
  Stethoscope,
  Activity,
  Zap,
} from 'lucide-react';
import AnimatedWrapper from '@/components/AnimatedWrapper';

import QueueClient from './QueueClient';

export const dynamic = 'force-dynamic';

export default async function QueueDisplayPage() {
  const statusSetting = await db.select().from(settings).where(eq(settings.key, 'doctor_status'));
  const isResting = statusSetting[0]?.value === 'resting';

  const arrivedAppointments = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'arrived'))
    .orderBy(appointments.id);

  const recentlyCalled = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      status: appointments.status,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'called'))
    .orderBy(desc(appointments.id))
    .limit(1);

  const nowServing = recentlyCalled[0] || null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center font-outfit relative overflow-hidden bg-black dark:bg-black p-0">
      <AutoRefresh interval={4000} />

      <QueueClient
        arrivedAppointments={arrivedAppointments}
        nowServing={nowServing}
        isResting={isResting}
      />
    </div>
  );
}
