'use client';

import { useState, useTransition } from 'react';
import { Timer, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { markAsNotArrived } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';

interface ScheduleAppt {
    id: number;
    patientName: string;
    time: string | null;
}

export default function ScheduleManager({ initialSchedule }: { initialSchedule: ScheduleAppt[] }) {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [isPending, startTransition] = useTransition();

    const handleMissed = async (id: number) => {
        const original = [...schedule];
        setSchedule(prev => prev.filter(s => s.id !== id));

        startTransition(async () => {
            try {
                await withRetry(() => markAsNotArrived(id), { retries: 3 });
            } catch (error) {
                setSchedule(original);
                alert('Action failed. Please try again.');
            }
        });
    };

    return (
        <div className="glass-vip-polished rounded-[3.5rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 text-left px-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                    <Timer className="w-6 h-6 text-emerald-600" />
                    Today's Schedule
                </h2>
                <span className="bg-slate-100 dark:bg-white/10 px-4 py-1.5 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-inner">
                    {schedule.length} Left
                </span>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {schedule.length === 0 ? (
                    <div className="py-12 text-center opacity-20">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                            Nothing else for today
                        </p>
                    </div>
                ) : (
                    schedule.map((appt) => (
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

                            <button
                                onClick={() => handleMissed(appt.id)}
                                title="Mark as Missed & Send Email"
                                className="p-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all active:scale-90 group/mail"
                            >
                                <Mail size={14} className="group-hover/mail:animate-bounce" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
