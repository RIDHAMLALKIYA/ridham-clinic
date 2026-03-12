import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { rejectAppointment, logoutUser } from '@/lib/actions';
import {
  ShieldCheck,
  Users,
  Trash2,
  LayoutDashboard,
  Database,
  LogOut,
  Activity,
  Zap,
} from 'lucide-react';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default async function AdminPanel() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-6 bg-transparent font-outfit">
        <AnimatedWrapper tilt>
          <div className="glass-vip-polished rounded-[3.5rem] p-16 max-w-md w-full text-center border-beam border border-red-500/20 shadow-2xl">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-500/20 shadow-inner">
              <ShieldCheck className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">
              Access Denied
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-12">
              Privileged clearance required for neural audit protocol.
            </p>
            <form action={logoutUser}>
              <button className="w-full py-6 bg-slate-900 dark:bg-red-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.3em] text-[11px] hover:shadow-[0_20px_40px_-5px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-4 active:scale-95 border border-white/10">
                <LogOut className="w-5 h-5" />
                Terminate Session
              </button>
            </form>
          </div>
        </AnimatedWrapper>
      </div>
    );
  }

  const allPatients = await db.select().from(patients).orderBy(desc(patients.id));
  const allAppointments = await db
    .select({
      id: appointments.id,
      patientName: patients.name,
      patientPhone: patients.phoneNumber,
      date: appointments.appointmentDate,
      time: appointments.appointmentTime,
      status: appointments.status,
      emergency: appointments.emergencyFlag,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .orderBy(desc(appointments.id));

  return (
    <div className="space-y-12 animate-fade-in pb-32 font-outfit max-w-[1600px] mx-auto px-6 lg:px-0 relative">
      <AnimatedWrapper direction="down">
        <div className="glass-vip-polished border-beam rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 overflow-hidden relative group">
          <div className="flex items-center gap-6 md:gap-10 relative z-10 text-left">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-950 dark:bg-indigo-600 rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all group-hover:rotate-[-6deg] duration-700 border border-white/10">
              <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-indigo-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full mb-3 shadow-inner">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <span className="text-[10px] font-black text-slate-500 dark:text-indigo-400 uppercase tracking-[0.4em]">
                  Root Access Node
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                Admin Control
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto relative z-10">
            <div className="bg-white/50 dark:bg-black/40 border border-slate-200 dark:border-white/10 px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-xl backdrop-blur-3xl min-w-[200px]">
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">
                  Network Layer
                </p>
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest leading-none">
                  Healthy | AES-256
                </p>
              </div>
              <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
            <form action={logoutUser}>
              <button className="p-6 bg-white/50 dark:bg-white/5 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-white/10 rounded-[2rem] transition-all shadow-xl hover:shadow-red-500/10 active:scale-90">
                <LogOut className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      </AnimatedWrapper>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 text-left">
        {/* TRANSACTION JOURNAL */}
        <div className="xl:col-span-8">
          <AnimatedWrapper direction="right">
            <div className="glass-vip-polished rounded-[4rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-10 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-center mb-16 px-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-6 uppercase tracking-tighter">
                  <LayoutDashboard className="w-10 h-10 text-slate-400 dark:text-indigo-400/50" />
                  The Journal
                </h2>
                <span className="bg-slate-950 dark:bg-black text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl border border-white/5">
                  {allAppointments.length} Records
                </span>
              </div>

              <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 custom-scrollbar">
                {allAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 md:p-10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-slate-200/50 dark:border-white/5 group transition-all duration-700 hover:bg-white dark:hover:bg-black hover:border-emerald-500/30 hover:shadow-2xl hover:scale-[1.01]"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-6 md:mb-10 pb-6 md:pb-10 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-5 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 dark:bg-black border border-white/10 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center font-black text-xl md:text-2xl text-slate-400 group-hover:text-emerald-500 transition-all shadow-2xl">
                          {appt.patientName[0]}
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none group-hover:text-emerald-500 transition-colors">
                            {appt.patientName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-5 mt-3 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] opacity-60">
                            <span>{appt.patientPhone}</span>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                            {appt.emergency && (
                              <span className="text-red-500 animate-pulse">Priority Override</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border shadow-sm ${appt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                          Registry Timestamp
                        </span>
                        <span className="text-sm font-black text-slate-600 dark:text-slate-400 opacity-80 uppercase tracking-widest">
                          {appt.date || 'Pending'} | {appt.time || '--:--'}
                        </span>
                      </div>
                      <form
                        action={async () => {
                          'use server';
                          await rejectAppointment(appt.id);
                        }}
                      >
                        <button className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all duration-500 active:scale-90">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedWrapper>
        </div>

        {/* MASTER INDEX */}
        <div className="xl:col-span-4">
          <AnimatedWrapper direction="left">
            <div className="glass-vip-polished rounded-[4rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-16 flex items-center gap-6 uppercase tracking-tighter">
                <Database className="w-8 h-8 text-indigo-500" />
                Node Index
              </h2>

              <div className="space-y-4 max-h-[850px] overflow-y-auto custom-scrollbar pr-2">
                {allPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-6 bg-white/40 dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/40 rounded-[2rem] transition-all duration-700 group/item hover:bg-white dark:hover:bg-black active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-950 dark:bg-black border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-sm shadow-2xl">
                        {patient.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter uppercase group-hover/item:text-indigo-400 transition-colors">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">
                          ID://{patient.id}
                        </span>
                      </div>
                    </div>
                    <Activity
                      size={12}
                      className="text-indigo-500 opacity-0 group-hover/item:opacity-40 transition-opacity"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-16 pt-10 border-t border-slate-100 dark:border-white/5 opacity-40">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">
                    <span>Security Protocol</span>
                    <span>Verified</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-1/2 h-full bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    </div>
  );
}
