'use client';

import { useState, useTransition } from 'react';
import { UserCheck, X, Calendar, RotateCcw, Clock, Send } from 'lucide-react';
import { dismissFollowUp, scheduleReappointment } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';

interface FollowUpAppt {
    id: number;
    patientId: number;
    patientName: string;
    phone: string;
    email: string | null;
}

export default function FollowupManager({ initialList }: { initialList: FollowUpAppt[] }) {
    const [list, setList] = useState(initialList);
    const [isPending, startTransition] = useTransition();

    const handleDismiss = async (id: number) => {
        const original = [...list];
        // Optimistic UI: remove from list
        setList(prev => prev.filter(item => item.id !== id));

        startTransition(async () => {
            try {
                await withRetry(() => dismissFollowUp(id), { retries: 2 });
            } catch (error) {
                setList(original);
                alert('Dismiss failed. Please check your network.');
            }
        });
    };

    const handleReappointment = async (formData: FormData, patientId: number, name: string) => {
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        
        if (!date || !time) {
            alert('Please select both date and time');
            return;
        }

        try {
            await scheduleReappointment(patientId, date, time);
            alert(`Follow-up scheduled for ${name} on ${date} at ${time}`);
        } catch (error) {
            alert('Failed to schedule follow-up');
        }
    };

    return (
        <div className="space-y-10 mt-12 bg-white/5 p-8 md:p-12 rounded-[4rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
               <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-6 tracking-tighter uppercase">
                     <RotateCcw className="w-10 h-10 text-emerald-600 animate-spin-slow" />
                     Follow-up / Re-visits
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
                     Recent Completed Cases • Dismissed cases are hidden
                  </p>
               </div>
               <span className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {list.length} History
               </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {list.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-20 italic">
                        No active records awaiting follow-up action
                    </div>
                ) : (
                    list.map((appt) => (
                        <div
                            key={appt.id}
                            className={`p-10 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[3.5rem] space-y-8 transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:border-emerald-500/30 group ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-emerald-600/10 rounded-[1.5rem] flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 border border-emerald-500/20 shadow-inner">
                                        <UserCheck size={28} />
                                    </div>
                                    <div>
                                       <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-2xl group-hover:translate-x-1 transition-transform">
                                          {appt.patientName}
                                       </h3>
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">Verified Patient Record</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDismiss(appt.id)}
                                    title="Dismiss from list"
                                    className="p-4 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-500/20 group/close"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent"></div>

                            {/* REAPPOINTMENT FORM */}
                            <form
                                action={(formData) => handleReappointment(formData, appt.patientId, appt.patientName)}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Session Date</label>
                                       <input
                                          required
                                          type="date"
                                          name="date"
                                          min={new Date().toLocaleDateString('en-CA')}
                                          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                       />
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Session Time</label>
                                       <input
                                          required
                                          type="time"
                                          name="time"
                                          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                       />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] flex items-center justify-center gap-4 transition-all hover:opacity-90 active:scale-95 shadow-xl group/btn"
                                >
                                    <Clock size={16} className="group-hover:animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Schedule Follow-up</span>
                                    <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform opacity-30" />
                                </button>
                            </form>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
