'use client';

import { authenticate, seedAccounts } from '@/lib/actions';
import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import SubmitButton from '@/components/ui/SubmitButton';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
      <div className="w-full max-w-md">
        <AnimatedWrapper direction="up" tilt>
          <div className="glass-vip-polished rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden relative group/card border-beam">
            <div className="p-8 md:p-14 relative z-10">
              <div className="flex flex-col items-center mb-10 md:mb-12">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                  Protocol Entry
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em]">
                    Authorities Only
                  </p>
                </div>
              </div>

              <form
                action={async (formData) => {
                  try {
                    const res = await authenticate(formData);
                    if (res?.error) {
                      alert(res.error);
                    }
                  } catch (e) {
                    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
                    if (
                      typeof e === 'object' &&
                      e !== null &&
                      'digest' in e &&
                      (e as any).digest?.startsWith('NEXT_REDIRECT')
                    )
                      throw e;
                    throw e;
                  }
                }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block ml-2">
                    Neural Node Email
                  </label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full pl-14 pr-6 py-5 bg-slate-50/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.8rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-white font-bold transition-all text-sm"
                      placeholder="doctor@healthcor.vip"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block ml-2">
                    Authorization Secret
                  </label>
                  <div className="relative group/input">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full pl-14 pr-6 py-5 bg-slate-50/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.8rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-white font-bold transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <SubmitButton className="shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)]" />
                  <p className="mt-8 text-[9px] text-slate-400 font-black uppercase tracking-[0.5em] text-center opacity-40">
                    Encrypted Session ID: VIP-
                    {Math.random().toString(36).substring(7).toUpperCase()}
                  </p>
                </div>
              </form>

              {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
              <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5">
                <form
                  action={async () => {
                    const res = await seedAccounts();
                    alert(res.message);
                  }}
                >
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/5 hover:border-emerald-500/50 hover:text-emerald-500 transition-all group/btn"
                  >
                    <UserPlus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Initialize Protocol Accounts
                  </button>
                </form>
              </div>
              )}
            </div>
          </div>
        </AnimatedWrapper>
      </div>
    </div>
  );
}
