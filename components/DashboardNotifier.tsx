'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Volume2 } from 'lucide-react';
import { useClinicSound } from './ClinicSoundProvider';

interface DashboardNotifierProps {
    requestCount: number;
    queueCount: number;
}

export default function DashboardNotifier({ requestCount, queueCount }: DashboardNotifierProps) {
    const prevRequestCount = useRef(requestCount);
    const prevQueueCount = useRef(queueCount);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { isSoundEnabled } = useClinicSound();

    useEffect(() => {
        // Initialize audio on first client-side load
        if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }

        let notify = false;
        let message = '';

        if (requestCount > prevRequestCount.current) {
            notify = true;
            message = 'New Admission Request!';
        } else if (queueCount > prevQueueCount.current) {
            notify = true;
            message = 'New Patient in Queue!';
        }

        if (notify) {
            // Play Sound only if enabled
            if (isSoundEnabled) {
                audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
            }

            // Show Animation/Toast
            setToastMessage(message);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        }

        // Update refs for next change
        prevRequestCount.current = requestCount;
        prevQueueCount.current = queueCount;
    }, [requestCount, queueCount, isSoundEnabled]);

    if (!showToast) return null;

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
            <div className="bg-slate-900/90 backdrop-blur-2xl border-2 border-indigo-500/50 px-10 py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-500/40 flex items-center gap-6 ring-4 ring-indigo-500/20">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
                    <BellRing className="text-white w-7 h-7" />
                </div>
                <div>
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-[.3em] mb-1">Clinic Alert</p>
                    <p className="text-xl font-black text-white tracking-tight">{toastMessage}</p>
                </div>
                <div className="ml-4 w-1 flex h-10 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-full bg-indigo-500 animate-progress-bar"></div>
                </div>
            </div>

            {/* SCREEN FLASH EFFECT */}
            <div className="fixed inset-0 pointer-events-none border-[12px] border-indigo-500/20 animate-screen-pulse rounded-[4rem] z-[99]"></div>
        </div>
    );
}
