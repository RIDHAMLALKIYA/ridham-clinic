'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';

const FloatingStethoscope = () => {
  return (
    <motion.div
      animate={{
        rotate: 360,
        y: [0, 20, 0],
      }}
      transition={{
        rotate: { duration: 60, repeat: Infinity, ease: 'linear' },
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute -z-10 -left-10 top-0 opacity-10 filter blur-2xl text-teal-200 pointer-events-none"
    >
      <Stethoscope size={400} />
    </motion.div>
  );
};

export default FloatingStethoscope;
