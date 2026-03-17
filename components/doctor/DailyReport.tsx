'use client';

import { useState, useEffect } from 'react';
import { FileText, X, Copy, Check, Download, Users, Mail, Phone, Calendar as CalendarIcon, Loader2, Search } from 'lucide-react';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { getAttendedPatientsByDate } from '@/lib/actions/doctor';

interface CompletedPatient {
  id: number;
  patientName: string;
  phone: string;
  email: string | null;
}

export default function DailyReport({ initialPatients }: { initialPatients: CompletedPatient[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [patientList, setPatientList] = useState<CompletedPatient[]>(initialPatients);
  const [isLoading, setIsLoading] = useState(false);

  // Re-sync with initialPatients if it changes from parent
  useEffect(() => {
    if (selectedDate === new Date().toLocaleDateString('en-CA')) {
      setPatientList(initialPatients);
    }
  }, [initialPatients, selectedDate]);

  const fetchPatients = async (date: string) => {
    setIsLoading(true);
    try {
      const data = await getAttendedPatientsByDate(date);
      setPatientList(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchPatients(newDate);
  };

  const copyToClipboard = () => {
    // We use Tabs (\t) so when they PASTE into Excel/Google Sheets, it automatically puts data into separate columns
    const text = patientList
      .map((p) => `${p.patientName}\t${p.phone}\t${p.email || 'No Email'}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Email'];
    const rows = patientList.map(p => [p.patientName, p.phone, p.email || 'N/A']);
    // Adding BOM (\ufeff) and CRLF (\r\n) so Excel opens it automatically in the correct format
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clinic_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group/report relative flex items-center justify-between px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-500 rounded-[2rem] gap-8 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all text-left"
      >
        <div className="flex flex-col gap-1 pr-4">
          <span className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] opacity-80">
             Audit System
          </span>
          <div className="flex items-center gap-3">
             <span className="text-2xl md:text-3xl font-black text-white leading-none whitespace-nowrap">
                {initialPatients.length} Attended
             </span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white group-hover/report:rotate-12 transition-transform shrink-0">
           <Download size={22} />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setIsOpen(false)}></div>
          
          <AnimatedWrapper direction="up" className="w-full max-w-5xl relative z-10">
            <div className="glass-vip-polished rounded-[3rem] md:rounded-[4rem] border border-white/20 shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* HEADER: MASSIVE DATE SEARCH */}
              <div className="p-8 md:p-12 border-b border-white/10 bg-white/5 space-y-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <FileText className="text-white" size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter line-clamp-1">Patient Audit History</h2>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] opacity-60">Verified Records Storage</p>
                      </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-5 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-slate-900/60 border border-emerald-500/30 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                           <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.5em]">Step 1: Pick a Date</h3>
                        </div>
                        <div className="relative group/date w-full">
                            <CalendarIcon size={32} className="absolute left-12 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none group-focus-within/date:scale-110 transition-transform opacity-80" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="bg-black/60 border-2 border-white/10 rounded-[2.5rem] pl-28 pr-12 py-10 text-3xl font-black text-white outline-none focus:border-emerald-500 transition-all w-full cursor-pointer hover:bg-black/80 shadow-inner ring-offset-black focus:ring-4 ring-emerald-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 px-12 bg-white/5 rounded-[2.5rem] border border-white/5 gap-3 min-w-[220px]">
                        <span className="text-6xl font-black text-white tracking-tighter">{patientList.length}</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] opacity-80">Total Patients</span>
                    </div>
                </div>
              </div>

              {/* AUDIT LIST */}
              <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar space-y-4">
                {isLoading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-6">
                    <Loader2 size={60} className="text-emerald-500 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Synchronizing Ledger with Cloud...</p>
                  </div>
                ) : patientList.length === 0 ? (
                  <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                    <Search size={80} className="text-white" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">No History Spotted</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">No patients matched this date in our database</p>
                  </div>
                ) : (
                  patientList.map((p, idx) => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-7 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 transition-all gap-6 group/item">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xs font-black text-emerald-500 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all">
                           {String(idx + 1).padStart(2, '0')}
                        </div>
                        <h3 className="font-black text-white uppercase tracking-tight text-2xl line-clamp-1">{p.patientName}</h3>
                      </div>
                      <div className="flex items-center gap-10 w-full sm:w-auto overflow-hidden">
                        <div className="flex items-center gap-3 shrink-0">
                          <Phone size={16} className="text-emerald-500 opacity-40" />
                          <span className="text-sm font-black text-white/60 tracking-widest">{p.phone}</span>
                        </div>
                        {p.email && (
                          <div className="hidden lg:flex items-center gap-3">
                            <Mail size={16} className="text-emerald-500 opacity-40 shrink-0" />
                            <span className="text-sm font-black text-white/60 tracking-widest line-clamp-1 max-w-[200px]">{p.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="p-10 md:p-14 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center gap-8">
                 <button 
                  onClick={copyToClipboard}
                  disabled={isLoading || patientList.length === 0}
                  className="w-full sm:w-auto px-12 py-7 bg-white text-black disabled:opacity-20 rounded-[2.2rem] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy All'}
                </button>
                <button 
                  onClick={downloadCSV}
                  disabled={isLoading || patientList.length === 0}
                  className="w-full sm:w-auto px-12 py-7 bg-emerald-600 text-white disabled:opacity-20 rounded-[2.2rem] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/30"
                >
                  <Download size={18} />
                  Download for Excel / Google Sheets
                </button>
                <div className="hidden sm:flex flex-1 flex-col items-end gap-1">
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">HealthCore Secure Audit</p>
                   <p className="text-[8px] font-black text-emerald-500/40 uppercase tracking-[0.5em]">Verified Clinical Ledger v1.8.2</p>
                </div>
              </div>
            </div>
          </AnimatedWrapper>
        </div>
      )}
    </>
  );
}
