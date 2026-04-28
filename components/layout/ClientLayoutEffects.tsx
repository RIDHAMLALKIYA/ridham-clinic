'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PageLoader from './PageLoader';
import { Heart, Stethoscope, Activity } from 'lucide-react';

const ClientLayoutEffects = () => {
  return (
    <>
      <PageLoader />

      {/* 🎬 CLASSIC HEART & STETHOSCOPE BACKGROUND THEME */}
      <div className="fixed inset-0 z-[-5] pointer-events-none overflow-hidden bg-[#fafafa] dark:bg-[#080808] transition-colors duration-1000">
        {/* Large Heart Icon (Top Right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-[5%] -right-32 text-emerald-500/20 dark:text-emerald-500/10 select-none"
        >
          <Heart size={900} strokeWidth={0.5} />
        </motion.div>

        {/* Large Stethoscope Icon (Bottom Left) */}
        <motion.div
          initial={{ opacity: 0, rotate: -20 }}
          animate={{ opacity: 1, rotate: 15 }}
          transition={{ duration: 2 }}
          className="absolute -bottom-32 -left-32 text-indigo-500/15 dark:text-indigo-500/10 select-none"
        >
          <Stethoscope size={800} strokeWidth={0.5} />
        </motion.div>

        {/* Floating Health Activity Line (Center Mid) */}
        <motion.div
          animate={{
            opacity: [0.05, 0.1, 0.05],
            x: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 right-[5%] text-emerald-500/10"
        >
          <Activity size={600} strokeWidth={0.5} />
        </motion.div>

        {/* Modern Gradient Blobs for Depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[60rem] h-[60rem] bg-emerald-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70rem] h-[70rem] bg-indigo-500/10 rounded-full blur-[140px] animate-blob" style={{ animationDelay: '4s' }} />

        {/* Subtle VIP Grain/Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none contrast-150"></div>
      </div>
    </>
  );
};

export default ClientLayoutEffects;
