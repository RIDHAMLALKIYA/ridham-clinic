'use client';

import { patientCheckIn } from '@/lib/actions';
import {
  Clock,
  Users,
  ShieldCheck,
  User,
  Phone,
  CheckCircle2,
  Stethoscope,
  Heart,
  Activity,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import CheckInButton from '@/components/ui/CheckInButton';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function CheckInContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const handleAction = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const countryCode = (formData.get('countryCode') as string) || '+91';
    const rawPhone = formData.get('phoneNumber') as string;
    const phone = `${countryCode}${rawPhone}`;
    const emergencyFlag = formData.get('emergencyFlag') === 'on';
    const langPreference = formData.get('language') as string;
    
    const res = await patientCheckIn(name, phone, emergencyFlag, langPreference);

    if (!res.success) {
      if (res.error === 'Patient not found') {
        window.location.href = `/checkin?error=not_found`;
      } else if (res.error === 'No scheduled appointment found for today') {
        window.location.href = `/checkin?error=no_appointment`;
      } else {
        window.location.href = `/checkin?error=unknown`;
      }
    } else {
      window.location.href = `/checkin?success=1`;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 lg:px-8 relative min-h-[80vh]">
      {success === '1' ? (
        <AnimatedWrapper className="max-w-2xl mx-auto" tilt>
          <div className="glass-vip-polished rounded-[3.5rem] p-12 md:p-24 text-center relative group border-beam overflow-hidden">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
              {t('nav.checkin')} <span className="text-emerald-500">{t('checkin.success_verified')}</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
              {t('checkin.success_subtitle')}
            </p>
            <a
              href="/checkin"
              className="mt-12 inline-block px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-500 transition-all uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-emerald-500/30 active:scale-95 border border-emerald-400/20"
            >
              {t('checkin.another')}
            </a>
          </div>
        </AnimatedWrapper>
      ) : (
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-28 items-center justify-center min-h-[60vh]">
          <div className="w-full lg:w-5/12 text-left">
            <AnimatedWrapper direction="right">
              <div className="mb-12">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full mb-8 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-emerald-400 uppercase tracking-[0.3em]">
                    {t('checkin.authorized_node')}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-7xl lg:text-[6rem] font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] lg:leading-[0.85] mb-6 md:mb-10">
                  {t('nav.lobby')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    {t('checkin.portal')}
                  </span>
                  .
                </h1>
              </div>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-14 leading-relaxed max-w-md tracking-tight">
                {t('checkin.sync_subtitle')}
              </p>

              <div className="grid grid-cols-1 gap-6 max-w-sm">
                <div className="group flex items-center gap-6 p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95">
                  <div className="bg-emerald-500 p-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] group-hover:rotate-6 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                      {t('checkin.instant_sync')}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-black mt-1 uppercase tracking-[0.2em] opacity-60">
                      {t('checkin.verified_creds')}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedWrapper>
          </div>

          <div className="w-full lg:w-7/12">
            <AnimatedWrapper direction="left" delay={0.2} tilt>
              <div className="glass-vip-polished rounded-[4.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.15)] dark:shadow-none border border-white/40 dark:border-white/10 relative overflow-hidden transition-all duration-1000 border-beam">
                {success === 'registered' && (
                  <div className="mx-12 mt-12 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-start gap-5 backdrop-blur-xl animate-scale-in">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5" />
                    <div className="text-left">
                      <h4 className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em]">
                        {t('checkin.node_registered')}
                      </h4>
                      <p className="text-[10px] text-emerald-500/70 mt-1.5 font-bold uppercase tracking-widest leading-relaxed">
                        {t('checkin.identity_verified')}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mx-12 mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-start gap-5 backdrop-blur-xl animate-bounce-in">
                    <ShieldCheck className="w-6 h-6 text-red-500 mt-0.5" />
                    <div className="text-left">
                      <h4 className="text-red-500 font-black text-xs uppercase tracking-[0.2em]">
                        {t('checkin.sync_error')}
                      </h4>
                      <p className="text-[10px] text-red-500/70 mt-1.5 font-bold uppercase tracking-widest leading-relaxed">
                        {error === 'not_found'
                          ? t('checkin.error_not_found')
                          : error === 'no_appointment'
                            ? t('checkin.error_no_appointment')
                            : t('checkin.error_unknown')}
                      </p>
                    </div>
                  </div>
                )}

                <form
                  action={handleAction}
                  className="px-10 py-16 md:p-20 space-y-12"
                >
                  <input type="hidden" name="language" value={language} />
                  <div className="flex flex-col gap-12">
                    <div className="group/input text-left font-outfit">
                      <label
                        htmlFor="name"
                        className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                      >
                        {t('checkin.full_name')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 md:pl-8 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                          <User className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          className="block w-full pl-16 md:pl-20 pr-6 md:pr-10 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-700 text-lg md:text-2xl font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                          placeholder={t('checkin.name_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="group/input text-left font-outfit">
                      <label
                        htmlFor="phoneNumber"
                        className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 ml-2"
                      >
                        {t('checkin.mobile_number')}
                      </label>
                      <div className="relative flex flex-col md:flex-row gap-4">
                        <div className="relative w-full md:w-1/3 min-w-[140px]">
                          <select
                            name="countryCode"
                            className="block w-full px-6 py-5 md:py-7 text-slate-950 dark:text-white bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-[1.8rem] md:rounded-[2.5rem] appearance-none cursor-pointer text-lg md:text-xl font-bold outline-none"
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
                            placeholder={t('checkin.phone_placeholder')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Priority Toggle */}
                    <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 transition-all hover:bg-red-500/10 group/urgent">
                      <div className="flex items-center justify-between gap-6">
                        <div className="text-left">
                          <h4 className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-widest flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                            {t('checkin.emergency_priority')}
                          </h4>
                          <p className="text-[10px] text-red-500/60 font-bold mt-2 uppercase tracking-widest">
                            {t('checkin.emergency_sub')}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                          <input type="checkbox" name="emergencyFlag" className="sr-only peer" />
                          <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 md:pt-6 flex flex-col items-center gap-8 md:gap-10">
                    <CheckInButton className="w-full py-8 md:py-10 rounded-[1.8rem] md:rounded-[3rem] shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)]" />

                    <div className="w-full h-px bg-slate-200 dark:bg-white/10 relative">
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0d0d0d] px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {t('home.form.reason_sub') ? 'OR' : 'OR'}
                      </span>
                    </div>

                    <a
                      href="/checkin/qr"
                      className="w-full py-6 md:py-8 rounded-[1.8rem] md:rounded-[3rem] border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white flex items-center justify-center gap-4 text-sm md:text-lg font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-95 group/qr"
                    >
                      <Zap className="w-5 h-5 group-hover:animate-pulse" />
                      {t('checkin.scan_qr')}
                    </a>

                    <div className="w-full h-px bg-slate-200 dark:bg-white/10 relative">
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0d0d0d] px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {t('checkin.need_register')}
                      </span>
                    </div>

                    <a
                      href="/?redirect=/checkin&atClinic=true"
                      className="text-[11px] font-bold text-slate-400 hover:text-emerald-500 transition-all uppercase tracking-widest group/link"
                    >
                      {t('checkin.first_visit')}{' '}
                      <span className="text-emerald-500 underline decoration-emerald-500/30 group-hover:decoration-emerald-500 underline-offset-8">
                        {t('checkin.book_now')}
                      </span>
                    </a>
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

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <CheckInContent />
    </Suspense>
  );
}
