import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { generateAppointmentQRCode } from '@/lib/services/qr';
import Image from 'next/image';
import { QrCode, ShieldCheck, MapPin, Calendar, Clock, User } from 'lucide-react';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { formatTime12h } from '@/lib/utils';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DigitalPassPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appointmentId = parseInt(id);
    if (isNaN(appointmentId)) notFound();

    const [appt] = await db
        .select({
            id: appointments.id,
            status: appointments.status,
            date: appointments.appointmentDate,
            time: appointments.appointmentTime,
            patientName: patients.name,
            patientEmail: patients.email,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(eq(appointments.id, appointmentId));

    if (!appt) notFound();

    const qrCodeDataUrl = await generateAppointmentQRCode(appt.id, appt.patientEmail || '');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black py-12 px-4 font-outfit">
            <div className="max-w-md mx-auto">
                <AnimatedWrapper direction="up" tilt>
                    <div className="glass-vip-polished rounded-[3rem] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl relative group">
                        {/* Header */}
                        <div className="p-10 text-center bg-gradient-to-b from-blue-600 to-indigo-700 text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">HealthCor Pass</h1>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 decoration-white/30 underline-offset-4 underline">Elite Clinical Node Access</p>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="p-10 bg-white dark:bg-black/40 text-center">
                            <div className="inline-block p-6 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)] border border-slate-100 mb-8 relative group/qr">
                                <div className="absolute -inset-2 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative z-10 bg-white p-2 rounded-2xl">
                                    <Image 
                                        src={qrCodeDataUrl} 
                                        alt="Check-in QR" 
                                        width={240} 
                                        height={240}
                                        className="h-auto w-full object-contain"
                                    />
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl border-4 border-white">
                                    <QrCode className="w-6 h-6" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">SCAN FOR CHECK-IN</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-[200px] mx-auto leading-relaxed opacity-60">Please show this QR to the scanner at the clinic reception</p>
                        </div>

                        {/* Details */}
                        <div className="px-10 pb-10 space-y-8 bg-white dark:bg-black/40">
                             <div className="h-px w-full bg-slate-100 dark:bg-white/5 mx-auto"></div>
                            
                            <div className="grid grid-cols-1 gap-8">
                                <div className="flex items-center gap-6 group/item">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{appt.patientName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group/item">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Appointment Date</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'PENDING'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group/item">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Arrival Window</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            {appt.time ? formatTime12h(appt.time) : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                                <Link 
                                    href="/" 
                                    className="block w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center font-black rounded-2xl uppercase text-[10px] tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </AnimatedWrapper>
            </div>
        </div>
    );
}
