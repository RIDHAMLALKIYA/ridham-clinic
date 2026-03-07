'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, BellRing, Activity } from 'lucide-react';
import { useClinicSound } from '@/components/ClinicSoundProvider';

export default function QueueAudioAlert({ currentPatient }: { currentPatient: string }) {
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayName, setOverlayName] = useState('');
    const [mounted, setMounted] = useState(false);
    const { isSoundEnabled } = useClinicSound();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);

        const lastCalled = sessionStorage.getItem('lastCalledPatient');

        if (currentPatient && currentPatient !== lastCalled) {
            sessionStorage.setItem('lastCalledPatient', currentPatient);
            setOverlayName(currentPatient);
            setShowOverlay(true);

            // Force hide body overflow to prevent background scrolling
            document.body.style.overflow = 'hidden';

            if (isSoundEnabled) {
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.volume = 0.8;
                    audio.play().then(() => {
                        setTimeout(() => {
                            if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const msg = new SpeechSynthesisUtterance(`${currentPatient}, please proceed to the consultation room.`);
                                msg.rate = 0.9;
                                msg.pitch = 1.0;
                                msg.volume = 1.0;
                                window.speechSynthesis.speak(msg);
                            }
                        }, 500);
                    }).catch(e => {
                        console.log('Audio blocked - user interaction required first');
                    });
                } catch (error) {
                    console.error('Audio alert failed:', error);
                }
            }

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setShowOverlay(false);
                document.body.style.overflow = '';
            }, 6000);
        }
    }, [currentPatient, isSoundEnabled]);

    // Ensure we un-hide overflow when component completely unmounts
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            document.body.style.overflow = '';
        };
    }, []);

    if (!mounted || !showOverlay) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483647,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(2, 6, 23, 0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                padding: '20px',
                pointerEvents: 'auto',
                margin: 0,
                boxSizing: 'border-box'
            }}
            className="animate-fade-in"
        >
            {/* THE CONTENT CARD */}
            <div
                style={{
                    position: 'relative',
                    width: 'min(700px, 90vw)',
                    minHeight: '400px',
                    backgroundColor: '#0f172a',
                    border: '8px solid #10b981',
                    borderRadius: '3.5rem',
                    boxShadow: '0 0 80px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '60px 30px',
                    margin: 'auto',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}
                className="animate-bounce-in"
            >
                <Sparkles size={40} className="absolute top-8 right-8 text-emerald-500/10 animate-pulse" />
                <Activity size={40} className="absolute bottom-8 left-8 text-indigo-500/10 animate-pulse delay-700" />

                <div className="w-full flex flex-col items-center gap-8">
                    <div className="inline-flex items-center gap-3 px-8 py-3 bg-emerald-500 text-slate-900 font-black text-sm md:text-xl uppercase tracking-[0.3em] rounded-full shadow-lg">
                        <BellRing size={24} />
                        Next Patient
                    </div>

                    <div className="space-y-2 w-full px-4 overflow-hidden">
                        <p className="text-slate-500 text-lg md:text-2xl font-black uppercase tracking-[0.2em] opacity-80">Calling Now</p>
                        <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-[7rem] font-black text-white leading-[1.1] tracking-tighter drop-shadow-2xl animate-name-change-slow break-words line-clamp-3">
                            {overlayName}
                        </h2>
                    </div>

                    <div className="bg-white/5 border border-white/10 px-10 py-5 rounded-[2.5rem] shadow-xl animate-slide-in-up">
                        <div className="flex items-center gap-5 text-emerald-400">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="text-xl md:text-4xl font-black uppercase tracking-widest leading-none">ROOM 01</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    className="absolute bottom-0 left-0 h-2 bg-emerald-500 animate-progress-bar rounded-full w-full"
                    style={{ animationDuration: '6s', animationFillMode: 'forwards' }}
                ></div>
            </div>
        </div>,
        document.body
    );
}
