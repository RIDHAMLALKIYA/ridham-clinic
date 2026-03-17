'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle2, Loader2, X } from 'lucide-react';
import { completeConsultation, rejectAppointment } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';

interface ActivePatient {
    id: number;
    patientName: string;
    reason: string | null;
    phone: string;
}

export default function ConsultationManager({ initialPatient }: { initialPatient: ActivePatient | null }) {
    const [patient, setPatient] = useState(initialPatient);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        setPatient(initialPatient);
    }, [initialPatient]);

    const handleComplete = async () => {
        if (!patient) return;
        
        const original = patient;
        // OPTIMISTIC: remove patient from view instantly
        setPatient(null);

        startTransition(async () => {
            try {
                await withRetry(() => completeConsultation(original.id), { retries: 3 });
                router.refresh();
            } catch (error) {
                setPatient(original);
                alert('Failed to complete consultation. Please check your internet connection.');
            }
        });
    };

    const handleCancelConsultation = async () => {
        if (!patient) return;
        if (!window.confirm('Abort this consultation? This will remove the patient from the active session and cancel their appointment record.')) {
            return;
        }

        const original = patient;
        setPatient(null);

        startTransition(async () => {
            try {
                await withRetry(() => rejectAppointment(original.id), { retries: 3 });
                router.refresh();
            } catch (error) {
                setPatient(original);
                alert('Failed to abort consultation.');
            }
        });
    };

    if (!patient) {
        return (
            <div className="glass-vip-polished rounded-[4rem] p-16 border border-white/10 opacity-40 flex flex-col items-center justify-center text-center space-y-6">
                <Activity size={48} className="text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                    No active consultation in progress
                </p>
            </div>
        );
    }

    return (
        <button
            disabled={isPending}
            onClick={handleComplete}
            className="w-full glass-vip-polished rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 border border-white/20 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)] dark:shadow-none relative overflow-hidden group border-beam text-left transition-all hover:scale-[0.99] active:scale-95 disabled:opacity-50"
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
                            {patient.patientName}
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
                                    {patient.reason || 'Standard Medical Audit'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/40 transition-all"></div>
                        <div 
                            onClick={(e) => { e.stopPropagation(); handleComplete(); }}
                            className="w-32 h-32 md:w-48 md:h-48 bg-emerald-600 rounded-[2.5rem] md:rounded-[4rem] flex flex-col items-center justify-center text-white shadow-2xl relative z-10 border border-white/20 group-hover:rotate-6 transition-transform group-hover:scale-110 cursor-pointer"
                        >
                            {isPending ? (
                                <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16" />
                            )}
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest mt-4">
                                {isPending ? 'Syncing...' : 'Complete'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleCancelConsultation(); }}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-all flex items-center gap-2"
                    >
                        <X size={12} />
                        Abort Session
                    </button>
                </div>
            </div>
        </button>
    );
}
