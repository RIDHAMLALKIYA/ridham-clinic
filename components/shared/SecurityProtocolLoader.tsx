'use client';

import { motion } from 'framer-motion';

export default function SecurityProtocolLoader() {
  return (
    <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="w-1/2 h-full bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"
      />
    </div>
  );
}
