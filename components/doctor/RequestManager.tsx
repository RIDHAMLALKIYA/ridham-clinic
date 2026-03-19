'use client';

import { useState, useTransition } from 'react';
import { Calendar, UserCheck, X, Activity, UserPlus, Clock } from 'lucide-react';
import { updateAppointment, rejectAppointment } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';
import { prefetchPatientData } from '@/lib/actions/prefetch';
import { formatDateTime } from '@/lib/utils';

interface RequestAppt {
    id: number;
    patientName: string;
    reason: string | null;
    phone: string;
    emergency: boolean | null;
    createdAt?: Date | string | null;
}

export default function RequestManager({ initialRequests }: { initialRequests: RequestAppt[] }) {
    const [requests, setRequests] = useState(initialRequests);
    const [isPending, startTransition] = useTransition();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [selectedTime, setSelectedTime] = useState('09:00');

    const handleAction = async (id: number, action: 'confirm' | 'reject') => {
        if (action === 'confirm' && expandedId !== id) {
            setExpandedId(id);
            return;
        }

        const original = [...requests];
        // OPTIMISTIC: remove from list instantly
        setRequests(prev => prev.filter(r => r.id !== id));
        setExpandedId(null);

        startTransition(async () => {
            try {
                if (action === 'confirm') {
                    await withRetry(() => updateAppointment(id, 'scheduled', selectedDate, selectedTime), { retries: 3 });
                } else {
                    await withRetry(() => rejectAppointment(id), { retries: 3 });
                }
            } catch (error) {
                setRequests(original);
                alert(`Action failed: ${action}. Please check your connection.`);
            }
        });
    };

    return (
        <div className="glass-vip-polished rounded-[3.5rem] p-10 border border-white/20 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10 text-left px-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                    New Requests
                </h2>
                <span className="bg-slate-100 dark:bg-white/10 px-4 py-1.5 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-inner">
                    {requests.length} Pending
                </span>
            </div>

            <div className="space-y-5 max-h-[650px] overflow-y-auto pr-3 custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                        <UserPlus className="w-16 h-16 mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                            No New Requests
                        </p>
                    </div>
                ) : (
                    requests.map((appt) => (
                        <div
                            key={appt.id}
                            onMouseEnter={() => prefetchPatientData(appt.id)}
                            className={`p-8 bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-6 text-left transition-all duration-500 hover:border-emerald-500/40 hover:scale-[1.02] shadow-sm hover:shadow-xl group/card ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg truncate group-hover/card:text-emerald-500 transition-colors">
                                        {appt.patientName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Activity size={10} className="text-emerald-500" />
                                        <p className="text-[10px] font-bold text-slate-400">{appt.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                        <Clock size={10} className="text-emerald-500" />
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                            {formatDateTime(appt.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                {appt.emergency && (
                                    <div className="bg-red-600/10 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse border border-red-500/20 shrink-0">
                                        Urgent
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[11px] text-slate-500 dark:text-white/40 leading-relaxed font-medium line-clamp-2 italic">
                                    "{appt.reason || 'Routine checkup requested'}"
                                </p>
                            </div>

                            {expandedId === appt.id ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                            <input 
                                                type="date" 
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                                            <input 
                                                type="time" 
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(appt.id, 'confirm')}
                                            className="flex-1 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95"
                                        >
                                            Schedule & Confirm
                                        </button>
                                        <button
                                            onClick={() => setExpandedId(null)}
                                            className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleAction(appt.id, 'confirm')}
                                        className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-90 shadow-xl shadow-emerald-500/20"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Confirm</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(appt.id, 'reject')}
                                        className="py-4 bg-white/50 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-slate-400 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-90 shadow-xl"
                                    >
                                        <X className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Decline</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
