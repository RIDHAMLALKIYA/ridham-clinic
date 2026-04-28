'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10 rounded-2xl"></div>;
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl transition-all shadow-md active:scale-95 border border-slate-300 dark:border-slate-600 ml-2 group"
            aria-label="Toggle dark mode"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
            ) : (
                <Moon className="w-5 h-5 group-hover:text-indigo-500 transition-colors" />
            )}
        </button>
    );
}
