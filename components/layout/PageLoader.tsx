'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MESSAGES = [
  "Initializing...",
  "Syncing...",
  "Readying...",
];

const PageLoader = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    // Shorter duration: 1.8s total
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    // Faster progress bar
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 2 : 100)); // Fills twice as fast
    }, 25);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0a0a0b] overflow-hidden"
        >
          {/* Softer Background Glows */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#059669_0%,transparent_40%)] blur-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#4f46e5_0%,transparent_40%)] blur-2xl" />
          </div>

          <div className="relative flex flex-col items-center">
            {/* Simplified Core */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-10">
              {/* Single Soft Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-emerald-500/10 rounded-full"
              />

              {/* Subtle Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.2],
                  opacity: [0.1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 border border-emerald-500/20 rounded-full"
              />

              {/* Main Icon */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-20 h-20 bg-[#111112] rounded-[2rem] flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#gradient-soft)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient id="gradient-soft" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>

            {/* Title */}
            <div className="flex space-x-1.5 mb-6">
              {"HEALTHCOR".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="text-4xl font-black text-white tracking-widest"
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="h-4 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="text-[9px] uppercase font-bold tracking-[0.3em] text-emerald-500/60"
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-56 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Vignette & Grain */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
          <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
