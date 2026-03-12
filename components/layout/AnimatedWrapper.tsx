'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  tilt?: boolean;
}

const AnimatedWrapper = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  tilt = false,
}: AnimatedWrapperProps) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
      scale: 0.95,
      rotateX: tilt ? 15 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.16, 1, 0.3, 1] as any,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={variants}
      className={className}
      whileHover={
        tilt
          ? {
              scale: 1.02,
              rotateY: 5,
              rotateX: -5,
              transition: { duration: 0.3 },
            }
          : {}
      }
      style={tilt ? { perspective: '1000px' } : {}}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedWrapper;
