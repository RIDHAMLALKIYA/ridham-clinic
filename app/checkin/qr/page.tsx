'use client';

import QRScanner from '@/components/QRScanner';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';
import { QrCode, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function QRCheckInPage() {
    const { t } = useLanguage();
    
    return (
        <div className="w-full max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 lg:px-8 relative min-h-[80vh]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>

            <div className="flex flex-col items-center justify-center text-center space-y-16">
                <AnimatedWrapper direction="up">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-full mb-8 shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                            {t('qr.fast_track')}
                        </span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-8">
                        {t('qr.instant')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                            {t('qr.checkin')}
                        </span>
                        .
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed px-4">
                        {t('qr.subtitle')}
                    </p>
                </AnimatedWrapper>

                <QRScanner />

                <AnimatedWrapper direction="up" delay={0.4}>
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 pt-12">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                                <QrCode className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left max-w-[150px]">
                                {t('qr.unique')}
                            </p>
                        </div>

                        <div className="w-px h-10 bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                                <ShieldCheck className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left max-w-[150px]">
                                {t('qr.encrypted')}
                            </p>
                        </div>
                    </div>
                </AnimatedWrapper>
            </div>
        </div>
    );
}
