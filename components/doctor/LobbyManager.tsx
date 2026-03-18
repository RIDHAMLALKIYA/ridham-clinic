'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BellRing, Activity, Search, ShieldAlert, Zap, Filter, CheckCircle2, X as CloseIcon, Loader2 } from 'lucide-react';
import { callPatient, rejectAppointment } from '@/lib/actions';
import { withRetry } from '@/lib/utils/retry';
import { prefetchPatientData } from '@/lib/actions/prefetch';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Appointment {
  id: number;
  patientName: string;
  phone: string;
  reason: string | null;
  emergency: boolean | null;
}

export default function LobbyManager({ initialAppointments }: { initialAppointments: Appointment[] }) {
  const { t, language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'emergency'>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // FIX: Use useEffect for reliable sync
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const handleCallPatient = async (apptId: number) => {
    const originalAppointments = [...appointments];
    
    // OPTIMISTIC UPDATE: Remove instantly
    setAppointments(prev => prev.filter(a => a.id !== apptId));

    startTransition(async () => {
        try {
            await withRetry(() => callPatient(apptId), { retries: 3 });
            router.refresh();
        } catch (error) {
            console.error('Failed to call patient after retries:', error);
            // ROLLBACK if failed
            setAppointments(originalAppointments);
            alert(language === 'en' ? 'Consultation call failed due to network issues. Please try again.' : 'નેટવર્ક સમસ્યાને કારણે કોલ નિષ્ફળ ગયો. ફરીથી પ્રયાસ કરો.');
        }
    });
  };

  const handleCancelLobby = async (id: number) => {
    if (!window.confirm(language === 'en' ? 'Remove this patient from the lobby?' : 'શું તમે આ દર્દીને લોબીમાંથી કાઢી નાખવા માંગો છો?')) {
        return;
    }
    const original = [...appointments];
    setAppointments(prev => prev.filter(a => a.id !== id));

    startTransition(async () => {
        try {
            await withRetry(() => rejectAppointment(id), { retries: 3 });
        } catch (error) {
            setAppointments(original);
            alert('Failed to remove patient.');
        }
    });
  };

  // SECURE FILTER LOGIC
  const filtered = appointments.filter((appt) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      appt.patientName.toLowerCase().includes(s) ||
      appt.phone.toLowerCase().includes(s) ||
      (appt.reason && appt.reason.toLowerCase().includes(s));
    
    if (filterMode === 'emergency') {
      return matchesSearch && (appt.emergency === true || appt.emergency === Boolean(true));
    }
    return matchesSearch;
  });

  return (
    <div className="glass-vip-polished rounded-[4rem] p-10 md:p-14 border border-white/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full"></div>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16 px-4">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-4 rounded-3xl shadow-2xl shadow-emerald-500/30">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {t('nav.lobby')}
            </h2>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-60">
                  {appointments.length} {t('queue.active_count')}
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className={`p-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 ${isSearchActive ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50'}`}
          >
            <Search size={24} />
            {isSearchActive && <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Active' : 'સક્રિય'}</span>}
          </button>
          
          <button
            onClick={() => setFilterMode(filterMode === 'all' ? 'emergency' : 'all')}
            className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border shadow-xl active:scale-95 ${
              filterMode === 'emergency' 
                ? 'bg-red-600 text-white border-red-500 shadow-red-500/30 scale-105' 
                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/20 border-slate-200 dark:border-white/10 hover:bg-slate-50'
            }`}
          >
            <Zap size={18} className={filterMode === 'emergency' ? 'animate-pulse' : ''} />
            {filterMode === 'emergency' ? (language === 'en' ? 'Urgent Mode ON' : 'ઇમરજન્સી ચાલુ') : (language === 'en' ? 'Show Urgent Only' : 'માત્ર ઇમરજન્સી')}
          </button>
        </div>
      </div>

      {/* POPUP GOOGLE-STYLE SEARCH CENTERED */}
      {isSearchActive && (
        <div className="mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col items-center justify-center gap-8 bg-slate-100/50 dark:bg-white/5 p-10 py-16 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px]"></div>
                
                <div className="w-full max-w-2xl space-y-6 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-6">{language === 'en' ? 'Patient Database Search' : 'દર્દી ડેટાબેઝ શોધો'}</span>
                        <div className="flex items-center gap-4">
                           {filterMode === 'emergency' && (
                              <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                 {language === 'en' ? 'Urgent Only Mode' : 'માત્ર ઇમરજન્સી મોડ'}
                              </div>
                           )}
                           <button onClick={() => { setIsSearchActive(false); setSearchTerm(''); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white/5 rounded-full">
                               <CloseIcon size={20} />
                           </button>
                        </div>
                    </div>
                    {/* GOOGLE SEARCH BAR STYLE */}
                    <div className="relative group/search">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within/search:text-emerald-500 transition-colors z-10" />
                        <input
                            autoFocus
                            type="text"
                            placeholder={language === 'en' ? "Type Patient Name or Phone Number..." : "દર્દીનું નામ અથવા ફોન નંબર લખો..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-20 pr-16 py-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-full text-2xl font-bold text-slate-950 dark:text-white shadow-2xl focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200 dark:placeholder:text-white/5"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon size={24} />
                            </button>
                        )}
                    </div>
                    
                    {/* QUICK TOGGLE & NO RESULTS STATUS */}
                    <div className="flex flex-col items-center gap-4 pt-2">
                       {searchTerm && filtered.length === 0 && (
                          <div className="py-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                {language === 'en' ? "No matching records found in today's entry" : "આજના રેકોર્ડમાં કોઈ મેચ મળી નથી"}
                             </p>
                          </div>
                       )}
                       <button 
                          onClick={() => setFilterMode(filterMode === 'all' ? 'emergency' : 'all')}
                          className={`text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full border transition-all ${filterMode === 'emergency' ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-500 border-transparent bg-white/5'}`}
                       >
                          {filterMode === 'emergency' ? (language === 'en' ? '✓ Urgent Filter Active' : '✓ ઇમરજન્સી ફિલ્ટર ચાલુ') : (language === 'en' ? 'Switch to Urgent Only' : 'માત્ર ઇમરજન્સી જુઓ')}
                       </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* LOBBY LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center opacity-20 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
               <Search size={40} className="text-white" />
            </div>
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter">{language === 'en' ? 'Patient Not Available' : 'દર્દી ઉપલબ્ધ નથી'}</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mt-2">
                  {language === 'en' ? "No matching records found in today's queue" : "આજના વેટિંગ લિસ્ટમાં કોઈ મેચ મળી નથી"}
               </p>
            </div>
            {filterMode === 'emergency' && (
               <button onClick={() => setFilterMode('all')} className="mt-4 text-[10px] font-black uppercase text-emerald-500 underline underline-offset-4">
                  {language === 'en' ? 'Show All Patients Instead' : 'બધા દર્દીઓ જુઓ'}
               </button>
            )}
          </div>
        ) : (
          filtered.map((appt, idx) => (
            <button
              key={appt.id}
              disabled={isPending}
              onMouseEnter={() => prefetchPatientData(appt.id)}
              onClick={() => handleCallPatient(appt.id)}
              className={`w-full p-8 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border ${idx === 0 ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02]' : appt.emergency ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-slate-200/50 dark:border-white/10'} rounded-[2.8rem] flex flex-col justify-between group/live transition-all duration-700 hover:bg-white dark:hover:bg-black hover:border-emerald-500 hover:shadow-2xl hover:scale-[1.03] text-left h-full relative overflow-hidden disabled:opacity-50`}
            >
              {/* RANK & NEXT BADGE */}
              <div className="flex items-start justify-between w-full mb-8 relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-black text-white rounded-2xl flex items-center justify-center font-black text-slate-300 dark:text-white/10 transition-transform group-hover/live:scale-110 shadow-xl border border-white/5">
                    {idx + 1}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{language === 'en' ? 'Rank' : 'ક્રમ'}</span>
                </div>

                {idx === 0 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 animate-bounce">
                    <Zap size={10} fill="currentColor" />
                    {language === 'en' ? 'Consult Next' : 'આગળની તપાસ'}
                  </div>
                )}

                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${appt.emergency ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white group-hover/live:rotate-12'}`}
                  >
                    <BellRing size={24} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelLobby(appt.id);
                    }}
                    title="Remove/Cancel Patient"
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/live:opacity-100"
                  >
                    <CloseIcon size={14} />
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${appt.emergency ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                    {appt.emergency ? t('dash.urgent') : (language === 'en' ? 'Priority' : 'પ્રાથમિકતા')}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-2xl truncate group-hover/live:text-emerald-500 transition-colors">
                  {appt.patientName}
                </h3>
                <div className="flex items-center gap-3">
                   <Activity size={12} className="text-emerald-500 opacity-40" />
                   <p className="text-sm font-bold text-slate-500 dark:text-white/40">{appt.phone}</p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {appt.emergency && (
                    <div className="flex items-center gap-2 bg-red-600/10 px-4 py-1.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></div>
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{t('dash.urgent')}</span>
                    </div>
                  )}
                  {appt.reason?.includes('[PHYSICALLY PRESENT AT CLINIC]') && (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full">
                      <ShieldAlert size={12} className="text-amber-500" />
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{language === 'en' ? 'Present' : 'હાજર'}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
