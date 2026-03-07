'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ClinicSoundContextType {
    isSoundEnabled: boolean;
    setIsSoundEnabled: (enabled: boolean) => void;
}

const ClinicSoundContext = createContext<ClinicSoundContextType | undefined>(undefined);

export function ClinicSoundProvider({ children }: { children: React.ReactNode }) {
    // Sound is now enabled by default without a pop-up prompt
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);

    useEffect(() => {
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

    return (
        <ClinicSoundContext.Provider value={{ isSoundEnabled, setIsSoundEnabled }}>
            {children}

            {/* Minimalist Floating Toggle - much smaller and cleaner */}
            <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="fixed bottom-6 right-6 z-[200] w-12 h-12 flex items-center justify-center bg-slate-900/10 hover:bg-slate-900/20 backdrop-blur-md rounded-full border border-slate-900/10 transition-all group"
                title={isSoundEnabled ? "Disable Sound" : "Enable Sound"}
            >
                {isSoundEnabled ? (
                    <Volume2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                ) : (
                    <VolumeX className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                )}
            </button>
        </ClinicSoundContext.Provider>
    );
}

export const useClinicSound = () => {
    const context = useContext(ClinicSoundContext);
    if (!context) throw new Error('useClinicSound must be used within a ClinicSoundProvider');
    return context;
};
