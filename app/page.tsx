'use client';

import { createBooking } from '@/lib/actions';
import { Clock, Zap, User, Mail, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import SubmitButton from '@/components/ui/SubmitButton';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// export const dynamic = 'force-dynamic';

function BookingContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === '1';
  const atClinic = searchParams.get('atClinic') === 'true';
  const redirectParam = searchParams.get('redirect') || '';

  return (
    <div className="w-full max-w-7xl mx-auto py-8 md:py-20 px-4 sm:px-6 lg:px-8 relative min-h-screen">
      {isSuccess ? (
        <AnimatedWrapper className="max-w-2xl mx-auto" tilt>
          <div className="glass-vip-polished rounded-[3.5rem] p-12 md:p-24 text-center relative group border-beam overflow-hidden">
            <div className="relative z-10">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                {t('home.success.title')}
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                {t('home.success.subtitle')}
              </p>
              
              <div className="mt-10 py-6 border-y border-slate-100 dark:border-white/5 mx-auto max-w-[200px]">
                <span className="text-3xl font-black text-emerald-500 italic block mb-2">
                  {t('queue.namaste')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  See you soon
                </span>
              </div>

              <Link
                href="/"
                className="mt-12 inline-block px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
              >
                {t('home.success.return')}
              </Link>
            </div>
          </div>
        </AnimatedWrapper>
      ) : (
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center lg:items-start text-left">
          {/* Left Column: Branding & Info */}
          <div className="w-full lg:w-5/12 pt-6">
            <AnimatedWrapper direction="right">
              <div className="mb-12 text-left">
                <div className="inline-flex flex-col gap-3 mb-8">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full shadow-sm w-fit">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-emerald-400 uppercase tracking-[0.3em]">
                      {t('nav.branding')}
                    </span>
                  </div>
                </div>
                <h1 className="text-5xl sm:text-7xl lg:text-[7rem] font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] lg:leading-[0.8] mb-8 lg:mb-12">
                  {t('home.title_prefix')} <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    {t('home.title_suffix')}
                  </span>
                  .
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium mb-12 leading-relaxed max-w-lg tracking-tight">
                {t('home.subtitle')}
              </p>

              <div className="space-y-4 md:space-y-6">
                <div className="group flex items-center gap-6 md:gap-8 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl transition-all duration-700 hover:scale-[1.02] active:scale-95">
                  <div className="bg-emerald-500 p-4 md:p-5 rounded-2xl flex-shrink-0 shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)] transition-transform group-hover:rotate-12">
                    <Clock className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg md:text-xl tracking-tight uppercase">
                      {t('home.vip_scheduling')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] md:text-[10px] mt-1 uppercase tracking-[0.3em]">
                      {t('home.authority_access')}
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-6 md:gap-8 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl transition-all duration-700 hover:scale-[1.02] active:scale-95">
                  <div className="bg-teal-500 p-4 md:p-5 rounded-2xl flex-shrink-0 shadow-[0_15px_30px_-10px_rgba(20,184,166,0.4)] transition-transform group-hover:scale-110">
                    <Zap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg md:text-xl tracking-tight uppercase">
                      {t('home.instant_sync')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] md:text-[10px] mt-1 uppercase tracking-[0.3em]">
                      {t('home.realtime_queue')}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedWrapper>
          </div>

          {/* Right Column: Appointment Form */}
          <div className="w-full lg:w-7/12">
            <AnimatedWrapper direction="left" delay={0.4} tilt>
              <div className="glass-vip-polished rounded-[4.5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] dark:shadow-none border border-white/40 dark:border-white/10 relative group transition-all duration-1000 border-beam overflow-hidden">
                <form
                  action={createBooking}
                  className="px-10 py-12 md:p-20 space-y-12 relative z-20"
                >
                  <input type="hidden" name="language" value={language} />
                  <div className="flex flex-col gap-12">
                    {/* Patient Name */}
                    <div className="group/input text-left">
                      <label
                        htmlFor="name"
                        className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                      >
                        {t('home.form.name')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 md:pl-8 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-500">
                          <User className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          className="block w-full pl-16 md:pl-20 pr-6 md:pr-10 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-700 text-lg md:text-2xl font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                          placeholder={t('home.form.name_placeholder')}
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="group/input text-left">
                      <label
                        htmlFor="phoneNumber"
                        className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                      >
                        {t('home.form.phone')}
                      </label>
                      <div className="relative flex flex-col md:flex-row gap-4">
                        <div className="relative w-full md:w-1/3 min-w-[140px]">
                          <select
                            name="countryCode"
                            className="block w-full px-6 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] appearance-none cursor-pointer text-lg md:text-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                            defaultValue="+91"
                          >
                            <option value="+91">IN +91</option>
                            <option value="+1">US +1</option>
                            <option value="+44">UK +44</option>
                          </select>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            name="phoneNumber"
                            id="phoneNumber"
                            required
                            pattern="[0-9]{10}"
                            inputMode="numeric"
                            className="block w-full px-8 md:px-10 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-700 text-lg md:text-2xl font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                            placeholder={t('home.form.phone_placeholder')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="group/input text-left">
                      <label
                        htmlFor="email"
                        className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                      >
                        {t('home.form.email')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 md:pl-10 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                          <Mail className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          className="block w-full pl-16 md:pl-22 pr-6 md:pr-10 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-700 text-lg md:text-2xl font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                          placeholder={t('home.form.email_placeholder')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="group/input text-left">
                    <label
                      htmlFor="reasonForVisit"
                      className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                    >
                      {t('home.form.reason')}
                    </label>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2 opacity-60">
                      {t('home.form.reason_sub')}
                    </p>
                    <div className="relative">
                      <div className="absolute top-6 md:top-8 left-6 md:left-10 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                        <FileText className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <textarea
                        name="reasonForVisit"
                        id="reasonForVisit"
                        rows={3}
                        defaultValue={atClinic ? "I AM IN THE CLINIC. " : ""}
                        className="block w-full pl-16 md:pl-22 pr-6 md:pr-10 py-6 md:py-8 text-slate-950 dark:text-white bg-white/80 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[3rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-700 text-base md:text-xl font-bold resize-none min-h-[120px] md:min-h-[160px] placeholder:text-slate-400 dark:placeholder:text-slate-700"
                        placeholder={t('home.form.reason_placeholder')}
                      />
                    </div>
                  </div>

                  <input
                    type="hidden"
                    name="redirectTo"
                    value={redirectParam}
                  />
                  <input
                    type="hidden"
                    name="atClinic"
                    value={atClinic ? 'on' : 'off'}
                  />

                  <div className="pt-4 md:pt-8 group/btn relative">
                    <SubmitButton 
                      className="w-full text-lg md:text-xl py-8 md:py-10 rounded-[1.8rem] md:rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_30px_70px_-10px_rgba(16,185,129,0.7)]" 
                      text={t('home.form.submit')}
                    />
                  </div>
                </form>
              </div>
            </AnimatedWrapper>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <BookingContent />
    </Suspense>
  );
}
