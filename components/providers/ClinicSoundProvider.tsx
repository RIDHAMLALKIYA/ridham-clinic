'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ClinicSoundContextType {
    isSoundEnabled: boolean;
    setIsSoundEnabled: (enabled: boolean) => void;
}

const ClinicSoundContext = createContext<ClinicSoundContextType | undefined>(undefined);

export function ClinicSoundProvider({ children }: { children: React.ReactNode }) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load preference from localStorage
        const saved = localStorage.getItem('clinic_sound_enabled');
        if (saved !== null) {
            setIsSoundEnabled(saved === 'true');
        }
        setMounted(true);

        // Silent unlock: Try to unlock audio on the very first click anywhere on the page
        const unlockAudio = () => {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            audio.play().then(() => {
                console.log('🔊 Audio system unlocked silently.');
                window.removeEventListener('click', unlockAudio);
            }).catch(() => { });
        };

        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    // Sync to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('clinic_sound_enabled', String(isSoundEnabled));
        }
    }, [isSoundEnabled, mounted]);

    return (
        <ClinicSoundContext.Provider value={{ isSoundEnabled, setIsSoundEnabled }}>
            {children}

            {/* Premium Floating Toggle */}
            {mounted && (
                <button
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className={`fixed bottom-8 right-8 z-[999] w-14 h-14 flex items-center justify-center backdrop-blur-2xl rounded-2xl border transition-all duration-500 shadow-2xl group ${
                        isSoundEnabled 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-emerald-500/20' 
                        : 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10'
                    }`}
                    title={isSoundEnabled ? "Disable Sound" : "Enable Sound"}
                >
                    <div className="relative flex flex-col items-center gap-1">
                        {isSoundEnabled ? (
                            <Volume2 className="w-6 h-6 animate-pulse" />
                        ) : (
                            <VolumeX className="w-6 h-6" />
                        )}
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
                            {isSoundEnabled ? 'Live' : 'Mute'}
                        </span>
                    </div>
                    
                    {/* Decorative scanning line if enabled */}
                    {isSoundEnabled && (
                        <div className="absolute inset-x-2 top-0 h-[1px] bg-emerald-500/40 animate-scan-line"></div>
                    )}
                </button>
            )}
        </ClinicSoundContext.Provider>
    );
}

export const useClinicSound = () => {
    const context = useContext(ClinicSoundContext);
    if (!context) throw new Error('useClinicSound must be used within a ClinicSoundProvider');
    return context;
};
