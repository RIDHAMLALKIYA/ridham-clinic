'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BellRing } from 'lucide-react';
import { useClinicSound } from '../providers/ClinicSoundProvider';
import { getNotificationCounts } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface DashboardNotifierProps {
    requestCount: number;
    queueCount: number;
}

export default function DashboardNotifier({ requestCount: initialRequestCount, queueCount: initialQueueCount }: DashboardNotifierProps) {
    const router = useRouter();
    const prevRequestCount = useRef(initialRequestCount);
    const prevQueueCount = useRef(initialQueueCount);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { isSoundEnabled } = useClinicSound();

    const checkUpdates = useCallback(async (currentReqCount?: number, currentQueueCount?: number) => {
        let reqs = currentReqCount;
        let queue = currentQueueCount;

        // If counts aren't provided (from polling), fetch them
        if (reqs === undefined || queue === undefined) {
            try {
                const data = await getNotificationCounts();
                reqs = data.requests;
                queue = data.queue;
            } catch (error) {
                console.error('Failed to fetch notification counts:', error);
                return;
            }
        }

        let notify = false;
        let message = '';

        if (reqs > prevRequestCount.current) {
            notify = true;
            message = 'New Admission Request!';
            prevRequestCount.current = reqs;
        } else if (reqs < prevRequestCount.current) {
            // Update ref even if count decreased to stay in sync
            prevRequestCount.current = reqs;
        }

        if (queue > prevQueueCount.current) {
            notify = true;
            message = 'New Patient in Queue!';
            prevQueueCount.current = queue;
        } else if (queue < prevQueueCount.current) {
            // Update ref even if count decreased to stay in sync
            prevQueueCount.current = queue;
        }

        if (notify) {
            // Play Sound only if enabled
            if (isSoundEnabled) {
                if (!audioRef.current) {
                    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                }
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }

            // Show Animation/Toast
            setToastMessage(message);
            setShowToast(true);
            
            // Trigger a refresh of the dashboard data
            router.refresh();

            // Auto-hide toast
            setTimeout(() => setShowToast(false), 5000);
        }
    }, [isSoundEnabled, router]);

    // Initial check and effect when props change (from parent SSR refresh)
    useEffect(() => {
        // Sync refs if parent passed new props
        if (initialRequestCount !== prevRequestCount.current || initialQueueCount !== prevQueueCount.current) {
            checkUpdates(initialRequestCount, initialQueueCount);
        }
    }, [initialRequestCount, initialQueueCount, checkUpdates]);

    // Fast Polling for Notifications (Every 3 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            checkUpdates();
        }, 3000);

        return () => clearInterval(interval);
    }, [checkUpdates]);

    if (!showToast) return null;

    return (
        <div className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in w-[90%] md:w-auto">
            <div className="bg-slate-900/90 backdrop-blur-2xl border-2 border-emerald-500/50 px-6 md:px-10 py-4 md:py-6 rounded-[1.8rem] md:rounded-[2.5rem] shadow-2xl shadow-emerald-500/40 flex items-center gap-4 md:gap-6 ring-4 ring-emerald-500/20">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center animate-pulse shadow-lg flex-shrink-0">
                    <BellRing className="text-white w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-[8px] md:text-xs font-black text-emerald-400 uppercase tracking-[.3em] mb-0.5 md:mb-1">Clinic Alert</p>
                    <p className="text-base md:text-xl font-black text-white tracking-tight truncate">{toastMessage}</p>
                </div>
                <div className="ml-2 md:ml-4 w-1 flex h-8 md:h-10 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-full bg-emerald-500 animate-progress-bar"></div>
                </div>
            </div>

            {/* SCREEN FLASH EFFECT */}
            <div className="fixed inset-0 pointer-events-none border-[12px] border-emerald-500/20 animate-screen-pulse rounded-[4rem] z-[99]"></div>
        </div>
    );
}
