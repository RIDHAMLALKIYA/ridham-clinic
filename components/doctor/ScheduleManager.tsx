'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Clock, Mail, CheckCircle2, X } from 'lucide-react';
import { markAsNotArrived, rejectAppointment, sendManualReminder } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';
import { formatTime12h } from '@/lib/utils';

interface ScheduleAppt {
    id: number;
    patientName: string;
    time: string | null;
}

export default function ScheduleManager({ initialSchedule }: { initialSchedule: ScheduleAppt[] }) {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [isPending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    const handleReminder = async (id: number) => {
        setBusyId(id);
        startTransition(async () => {
            try {
                await withRetry(() => sendManualReminder(id), { retries: 2 });
                alert('Reminder email sent successfully!');
            } catch (error) {
                alert('Failed to send reminder. Check server logs.');
            } finally {
                setBusyId(null);
            }
        });
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm('Are you sure you want to cancel this scheduled appointment? An email notification will be sent to the patient.')) {
            return;
        }

        const original = [...schedule];
        setSchedule(prev => prev.filter(s => s.id !== id));
        setBusyId(id);

        startTransition(async () => {
            try {
                await withRetry(() => rejectAppointment(id), { retries: 3 });
                router.refresh();
            } catch (error) {
                setSchedule(original);
                alert('Action failed. Please try again.');
            } finally {
                setBusyId(null);
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
                    {schedule.length} Slots
                </span>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar relative z-10">
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
                            className={`flex items-center justify-between p-6 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all hover:border-emerald-500/30 ${busyId === appt.id ? 'opacity-50 blur-[1px]' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock size={16} className="text-emerald-500" />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm truncate">
                                        {appt.patientName}
                                    </h3>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                                        {formatTime12h(appt.time || '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCancel(appt.id); }}
                                    disabled={busyId !== null}
                                    title="Cancel Appointment"
                                    className="p-3 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-90 group/cancel border border-red-500/10 disabled:opacity-30"
                                >
                                    <X size={16} className="group-hover/cancel:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleReminder(appt.id); }}
                                    disabled={busyId !== null}
                                    title="Send Quick Email Reminder"
                                    className="p-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all active:scale-90 group/mail border border-amber-500/10 disabled:opacity-30"
                                >
                                    <Mail size={16} className="group-hover/mail:animate-pulse" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
