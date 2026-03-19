import { db } from '@/db';
import { appointments, patients, settings } from '@/db/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import {
  setDoctorStatus,
  scheduleReappointment,
  logoutUser,
  dismissFollowUp,
} from '@/lib/actions';
import FollowupManager from '@/components/doctor/FollowupManager';
import {
  RotateCcw,
  LogOut,
  Activity,
  Coffee,
  Stethoscope,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNotifier from '@/components/shared/DashboardNotifier';
import AutoRefresh from '@/components/shared/AutoRefresh';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import LobbyManager from '@/components/doctor/LobbyManager';
import DailyReport from '@/components/doctor/DailyReport';
import RequestManager from '@/components/doctor/RequestManager';
import ScheduleManager from '@/components/doctor/ScheduleManager';
import ConsultationManager from '@/components/doctor/ConsultationManager';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== 'doctor') {
    redirect('/login');
  }

  // Main Queries
  // Main Queries - Force IST (+05:30) for midnight reset consistency
  const today = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  // Parallelized Queries for performance (Parallel loading)
  const [
    docStatusSetting,
    currentConsultation,
    reqAppointments,
    queueAppointments,
    todaySchedule,
    attendedToday,
    attendedList
  ] = await Promise.all([
    db.select().from(settings).where(eq(settings.key, 'doctor_status')),
    db.select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      phone: patients.phoneNumber,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'called'))
    .limit(1),
    db.select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      phone: patients.phoneNumber,
      emergency: appointments.emergencyFlag,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'requested'))
    .orderBy(desc(appointments.emergencyFlag), desc(appointments.createdAt)),
    db.select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      phone: patients.phoneNumber,
      emergency: appointments.emergencyFlag,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'arrived'))
    .orderBy(desc(appointments.emergencyFlag), appointments.id),
    db.select({
      id: appointments.id,
      patientName: patients.name,
      time: appointments.appointmentTime,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(eq(appointments.status, 'scheduled'), eq(appointments.appointmentDate, today)))
    .orderBy(appointments.appointmentTime),
    db.select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        or(eq(appointments.status, 'completed'), eq(appointments.status, 'called')),
        eq(appointments.appointmentDate, today)
      )
    ),
    db.select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: patients.name,
      phone: patients.phoneNumber,
      email: patients.email,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        eq(appointments.status, 'completed'),
        eq(appointments.appointmentDate, today)
      )
    )
    .orderBy(desc(appointments.id))
    .limit(10)
  ]);

  const currentStatus = (docStatusSetting[0]?.value || 'consulting') as 'consulting' | 'resting';
  const activePatient = currentConsultation[0];
  const attendedCount = attendedToday[0]?.count || 0;
  const recentAttended = attendedList.slice(0, 4);

  return (
    <div className="space-y-12 pb-32 font-outfit max-w-7xl mx-auto px-6 lg:px-0 relative min-h-screen">
      <AutoRefresh interval={3000} />
      <DashboardNotifier
        requestCount={reqAppointments.length}
        queueCount={queueAppointments.length}
      />

      {/* TOP BAR */}
      <AnimatedWrapper direction="down">
        <div className="glass-vip-polished rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border-beam relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none">
          <div className="flex items-center gap-4 md:gap-8 relative z-10 text-left">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 dark:bg-emerald-600 rounded-[1.2rem] md:rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl transition-transform hover:rotate-12 duration-500 border border-white/10">
              <Stethoscope className="w-8 h-8 md:w-10 md:h-10 animate-pulse text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full mb-3 shadow-inner">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black text-slate-500 dark:text-emerald-400 uppercase tracking-[0.4em]">
                  Clinic Management
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                Doctor Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
            <form
              action={async () => {
                'use server';
                await setDoctorStatus(currentStatus === 'consulting' ? 'resting' : 'consulting');
              }}
              className="flex-1 md:flex-none"
            >
              <button
                type="submit"
                className={`w-full md:w-auto px-10 py-5 rounded-[1.8rem] font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 transition-all border shadow-2xl active:scale-95 ${currentStatus === 'consulting' ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 text-white border-amber-400 hover:bg-amber-400'}`}
              >
                {currentStatus === 'consulting' ? (
                  <>
                    <Activity className="w-4 h-4" /> I am Working
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4" /> Taking a Break
                  </>
                )}
              </button>
            </form>
            <form action={logoutUser}>
              <button className="p-5 bg-white/50 dark:bg-white/5 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-white/10 rounded-[1.8rem] transition-all shadow-xl hover:shadow-red-500/10 active:scale-90">
                <LogOut className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      </AnimatedWrapper>

      {/* ADMINISTRATION & AUDITS SECTION - FIXED UI */}
      <AnimatedWrapper direction="up" delay={0.1}>
        <div className="mb-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-6 lg:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
               <ShieldAlert size={28} />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                Administration & Audits
              </h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-emerald-500/40 uppercase tracking-[0.3em] mt-1">
                Secure Data Control Center
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex justify-center md:justify-end">
             <DailyReport initialPatients={attendedList} totalCount={attendedCount} />
          </div>
        </div>
      </AnimatedWrapper>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* LEFT: ADMISSIONS */}
        <div className="xl:col-span-4 space-y-12">
          <AnimatedWrapper direction="right">
            <RequestManager initialRequests={reqAppointments} />
          </AnimatedWrapper>

          {/* TODAY'S SCHEDULE */}
          <AnimatedWrapper direction="right" delay={0.1}>
            <ScheduleManager initialSchedule={todaySchedule} />
          </AnimatedWrapper>
        </div>

        {/* RIGHT: LIVE INTERFACE */}
        <div className="xl:col-span-8 space-y-12">
          <AnimatedWrapper direction="left">
            <ConsultationManager initialPatient={activePatient} />
          </AnimatedWrapper>

          <AnimatedWrapper delay={0.2} direction="left">
            <div className="mb-12 text-left space-y-2 px-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                  <Activity size={28} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                    Priority Lobby
                  </h2>
                  <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.5em] mt-2 ml-1">
                    Patients Arrived & Ready for Clinical Audit
                  </p>
                </div>
              </div>
            </div>
            <LobbyManager initialAppointments={queueAppointments} />
          </AnimatedWrapper>

          {/* SECOND VISIT / FOLLOW-UP */}
          <AnimatedWrapper delay={0.3} direction="up">
            <FollowupManager initialList={recentAttended} />
          </AnimatedWrapper>
        </div>
      </div>
    </div>
  );
}
