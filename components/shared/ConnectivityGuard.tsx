'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Globe } from 'lucide-react';

export default function ConnectivityGuard() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    if (isOnline) {
        return (
            <div className="fixed bottom-10 right-10 z-[1000] flex items-center gap-3 px-6 py-3 bg-emerald-600/10 border border-emerald-500/20 rounded-full backdrop-blur-xl group hover:bg-emerald-600/20 transition-all cursor-default scale-75 md:scale-100 origin-bottom-right">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] opacity-80">System Live</span>
                <Globe size={14} className="text-emerald-500/40 group-hover:rotate-180 transition-transform duration-1000" />
            </div>
        );
    }

    return (
        <div className="fixed inset-x-0 top-0 z-[2000] bg-red-600 text-white py-3 flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[10px] animate-bounce shadow-2xl">
            <WifiOff size={16} />
            Network Connection Lost - Patient Data May Not Be Syncing
        </div>
    );
}
