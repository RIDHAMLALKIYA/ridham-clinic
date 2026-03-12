import { db } from '@/db';
import { appointments, patients, settings } from '@/db/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import {
  updateAppointment,
  rejectAppointment,
  callPatient,
  setDoctorStatus,
  completeConsultation,
  scheduleReappointment,
  logoutUser,
  dismissFollowUp,
  markAsNotArrived,
} from '@/lib/actions';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  Calendar,
  RotateCcw,
  LogOut,
  Activity,
  Users,
  Timer,
  Coffee,
  BellRing,
  Stethoscope,
  X,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNotifier from '@/components/shared/DashboardNotifier';
import AutoRefresh from '@/components/shared/AutoRefresh';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';

export const dynamic = 'force-dynamic';

export default async function DoctorDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== 'doctor') {
    redirect('/login');
  }

  // Main Queries
  const today = new Date().toLocaleDateString('en-CA');
  const docStatusSetting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'doctor_status'));
  const currentStatus = (docStatusSetting[0]?.value || 'consulting') as 'consulting' | 'resting';

  const currentConsultation = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      phone: patients.phoneNumber,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'called'))
    .limit(1);

  const activePatient = currentConsultation[0];

  const reqAppointments = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'requested'))
    .orderBy(desc(appointments.emergencyFlag), desc(appointments.createdAt));

  const queueAppointments = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      reason: patients.reasonForVisit,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.status, 'arrived'))
    .orderBy(desc(appointments.emergencyFlag), appointments.id);

  const todaySchedule = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      time: appointments.appointmentTime,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(eq(appointments.status, 'scheduled'), eq(appointments.appointmentDate, today)))
    .orderBy(appointments.appointmentTime);

  const attendedToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        or(eq(appointments.status, 'completed'), eq(appointments.status, 'finalized')),
        eq(appointments.appointmentDate, today)
      )
    );
  const attendedCount = attendedToday[0]?.count || 0;

  const attendedList = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: patients.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(eq(appointments.status, 'completed'), eq(appointments.appointmentDate, today)))
    .orderBy(desc(appointments.id))
    .limit(5);

  return (
    <div className="space-y-12 pb-32 font-outfit max-w-7xl mx-auto px-6 lg:px-0 relative min-h-screen">
      <AutoRefresh interval={30000} />
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

          {/* Patients Attended Today Count */}
          <div className="flex md:flex-col items-center bg-emerald-600/10 border border-emerald-500/20 px-6 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-[2rem] gap-3 md:gap-1 w-full md:w-auto justify-between md:justify-center">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">
              Attended Today
            </span>
            <span className="text-2xl md:text-4xl font-black text-emerald-500 leading-none">
              {attendedCount}
            </span>
          </div>
        </div>
      </AnimatedWrapper>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* LEFT: ADMISSIONS */}
        <div className="xl:col-span-4 space-y-12">
          <AnimatedWrapper direction="right">
            <div className="glass-vip-polished rounded-[3.5rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10 text-left px-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                  New Requests
                </h2>
                <span className="bg-slate-100 dark:bg-white/10 px-4 py-1.5 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-inner">
                  {reqAppointments.length} Pending
                </span>
              </div>

              <div className="space-y-5 max-h-[650px] overflow-y-auto pr-3 custom-scrollbar">
                {reqAppointments.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <Users className="w-16 h-16 mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                      No New Requests
                    </p>
                  </div>
                ) : (
                  reqAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-8 bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-6 text-left transition-all duration-500 hover:border-emerald-500/40 hover:scale-[1.02] shadow-sm hover:shadow-xl group/card"
                    >
                      <div className="flex justify-between items-start">
                        <div className="overflow-hidden">
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg truncate group-hover/card:text-emerald-500 transition-colors">
                            {appt.patientName}
                          </h3>
                          <div className="max-h-24 overflow-y-auto custom-scrollbar mt-2 pr-2">
                            {appt.reason?.includes('[PHYSICALLY PRESENT AT CLINIC]') ? (
                              <div className="mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm">
                                  <ShieldAlert size={10} className="animate-pulse" />
                                  Physically Present
                                </span>
                              </div>
                            ) : null}
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed opacity-60 group-hover/card:opacity-100 transition-opacity break-words">
                              {appt.reason?.replace('[PHYSICALLY PRESENT AT CLINIC]', '').trim() || 'Routine Checkup'}
                            </p>
                          </div>
                        </div>
                        {appt.emergency && (
                          <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase tracking-[0.4em] animate-pulse shadow-lg shadow-red-500/20">
                            Urgent
                          </span>
                        )}
                      </div>

                      <form
                        action={async (formData) => {
                          'use server';
                          const date = formData.get('date') as string;
                          const hour = formData.get('hour') as string;
                          const ampm = formData.get('ampm') as string;
                          let h = parseInt(hour);
                          if (ampm === 'PM' && h < 12) h += 12;
                          if (ampm === 'AM' && h === 12) h = 0;
                          const finalTime = `${String(h).padStart(2, '0')}:00`;
                          await updateAppointment(appt.id, 'scheduled', date, finalTime);
                        }}
                        className="space-y-4 pt-2"
                      >
                        <div className="flex gap-3">
                          <input
                            type="date"
                            name="date"
                            required
                            defaultValue={today}
                            className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-[11px] font-black dark:text-white outline-none focus:border-emerald-500 transition-colors"
                          />
                          <div className="flex bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-colors">
                            <select
                              name="hour"
                              className="bg-transparent pl-4 pr-1 py-3 text-[11px] font-black dark:text-white outline-none cursor-pointer"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <select
                              name="ampm"
                              className="bg-transparent pl-1 pr-4 py-3 text-[11px] font-black dark:text-white outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-[2] py-4 bg-slate-900 dark:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            Accept
                          </button>
                        </div>
                      </form>
                      <form
                        action={async () => {
                          'use server';
                          await rejectAppointment(appt.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="w-full py-4 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all"
                        >
                          Cancel Request
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AnimatedWrapper>

          {/* TODAY'S SCHEDULE */}
          <AnimatedWrapper direction="right" delay={0.1}>
            <div className="glass-vip-polished rounded-[3.5rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8 text-left px-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                  <Timer className="w-6 h-6 text-emerald-600" />
                  Today&apos;s Schedule
                </h2>
                <span className="bg-slate-100 dark:bg-white/10 px-4 py-1.5 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-inner">
                  {todaySchedule.length} Left
                </span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {todaySchedule.length === 0 ? (
                  <div className="py-12 text-center opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                      Nothing else for today
                    </p>
                  </div>
                ) : (
                  todaySchedule.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all hover:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                          <Clock size={16} className="text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">
                            {appt.patientName}
                          </h3>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {appt.time || '--:--'}
                          </p>
                        </div>
                      </div>

                      <form
                        action={async () => {
                          'use server';
                          await markAsNotArrived(appt.id);
                        }}
                      >
                        <button
                          type="submit"
                          title="Mark as Missed & Send Email"
                          className="p-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all active:scale-90 group/mail"
                        >
                          <Mail size={14} className="group-hover/mail:animate-bounce" />
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AnimatedWrapper>
        </div>

        {/* RIGHT: LIVE INTERFACE */}
        <div className="xl:col-span-8 space-y-12">
          <AnimatedWrapper direction="left">
            {activePatient ? (
              <form
                action={async () => {
                  'use server';
                  await completeConsultation(activePatient.id);
                }}
              >
                <button
                  type="submit"
                  className="w-full glass-vip-polished rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 border border-white/20 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)] dark:shadow-none relative overflow-hidden group border-beam text-left transition-all hover:scale-[0.99] active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none group-hover:from-emerald-500/20 transition-all"></div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 relative z-10 w-full">
                    <div className="space-y-6 md:space-y-8 flex-1 w-full">
                      <div className="inline-flex items-center gap-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/30 animate-pulse">
                        <Activity size={16} />
                        Now Consulting
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-4xl sm:text-5xl md:text-[6rem] font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none drop-shadow-sm group-hover:text-emerald-500 transition-colors break-words">
                          {activePatient.patientName}
                        </h3>
                        <div className="flex flex-col gap-5 ml-2">
                          <div className="flex items-center gap-5">
                            <div className="h-1 w-20 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.5em] opacity-40">
                              Consultation Objective
                            </span>
                          </div>
                          <div className="max-h-64 overflow-y-auto custom-scrollbar pr-6">
                            <p className="text-emerald-500 font-bold text-2xl uppercase tracking-[0.2em] leading-snug break-words whitespace-pre-wrap">
                              {activePatient.reason || 'Standard Medical Audit'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-600 text-white font-black p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-2 group-hover:bg-emerald-500 transition-all min-w-[200px]">
                      <CheckCircle2 size={40} />
                      <span className="text-xs uppercase tracking-[0.3em]">Done / Finish</span>
                    </div>
                  </div>
                  <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">
                    Click anywhere on this card to finish consultation
                  </p>
                </button>
              </form>
            ) : (
              <div className="glass-vip-polished rounded-[4rem] p-12 md:p-16 border border-white/20 shadow-2xl relative overflow-hidden group border-beam text-center py-24">
                <h3 className="text-5xl font-black text-slate-300 dark:text-white/10 italic uppercase tracking-tighter leading-none">
                  Ready for Next Patient...
                </h3>
              </div>
            )}
          </AnimatedWrapper>

          <AnimatedWrapper delay={0.2} direction="left">
            <div className="glass-vip-polished rounded-[4rem] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full"></div>
              <div className="flex items-center justify-between mb-16 text-left px-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-6 uppercase tracking-tighter">
                  <Users className="w-10 h-10 text-emerald-600" />
                  The Lobby
                </h2>
                <span className="bg-emerald-600 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20">
                  {queueAppointments.length} Waiting
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 text-left">
                {queueAppointments.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-10">
                    <Activity size={80} className="mx-auto mb-8 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-[0.6em]">Lobby is Empty</p>
                  </div>
                ) : (
                  queueAppointments.map((appt, idx) => (
                    <form
                      key={appt.id}
                      action={async () => {
                        'use server';
                        await callPatient(appt.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full p-8 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2.8rem] flex items-center justify-between group/live transition-all duration-700 hover:bg-white dark:hover:bg-black hover:border-emerald-500/50 hover:shadow-2xl hover:scale-[1.02] text-left"
                      >
                        <div className="flex items-center gap-6 flex-1 overflow-hidden">
                          <div className="w-16 h-16 bg-slate-900 dark:bg-black text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl border border-white/5 transition-transform group-hover/live:scale-110">
                            {idx + 1}
                          </div>
                          <div className="overflow-hidden flex-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl truncate group-hover/live:text-emerald-500 transition-colors">
                              {appt.patientName}
                            </h3>
                            <div className="max-h-12 overflow-y-auto custom-scrollbar mt-1 pr-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed opacity-60 group-hover/live:opacity-100 transition-opacity break-words">
                                {appt.reason || 'Patient is waiting...'}
                              </p>
                            </div>
                            {appt.emergency && (
                              <div className="flex items-center gap-2 mt-2 animate-pulse">
                                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">
                                  Urgent Case
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl border-beam ${appt.emergency ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white group-hover/live:scale-110'}`}
                        >
                          <BellRing size={24} />
                        </div>
                      </button>
                    </form>
                  ))
                )}
              </div>
            </div>
          </AnimatedWrapper>

          {/* SECOND VISIT / FOLLOW-UP */}
          <AnimatedWrapper delay={0.3} direction="up">
            <div className="glass-vip-polished rounded-[4rem] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-12 text-left px-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-6 uppercase tracking-tighter">
                  <RotateCcw className="w-10 h-10 text-emerald-600" />
                  Second Visit / Follow-up
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  Recent Patients
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {attendedList.length === 0 ? (
                  <div className="col-span-full py-12 text-center opacity-20 italic">
                    No patients seen yet today
                  </div>
                ) : (
                  attendedList.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-8 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2.8rem] space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black">
                            <UserCheck size={20} />
                          </div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl">
                            {appt.patientName}
                          </h3>
                        </div>
                        <form
                          action={async () => {
                            'use server';
                            await dismissFollowUp(appt.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-90"
                          >
                            <X size={16} />
                          </button>
                        </form>
                      </div>

                      <form
                        action={async (formData) => {
                          'use server';
                          const date = formData.get('date') as string;
                          const hour = formData.get('hour') as string;
                          const ampm = formData.get('ampm') as string;
                          let h = parseInt(hour);
                          if (ampm === 'PM' && h < 12) h += 12;
                          if (ampm === 'AM' && h === 12) h = 0;
                          const finalTime = `${String(h).padStart(2, '0')}:00`;
                          await scheduleReappointment(appt.patientId, date, finalTime);
                        }}
                        className="space-y-4 bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem]"
                      >
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Schedule next visit
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="date"
                            name="date"
                            required
                            defaultValue={today}
                            className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-[10px] font-black dark:text-white outline-none focus:border-emerald-500"
                          />
                          <div className="flex bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-emerald-500">
                            <select
                              name="hour"
                              className="bg-transparent pl-3 pr-1 py-3 text-[10px] font-black dark:text-white outline-none"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <select
                              name="ampm"
                              className="bg-transparent pl-1 pr-3 py-3 text-[10px] font-black dark:text-white outline-none"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"
                        >
                          Book Re-visit
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    </div>
  );
}
