'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Stethoscope, Activity, Zap } from 'lucide-react';
import ScrollingName from './ScrollingName';
import QueueAudioAlert from './QueueAudioAlert';

interface Appointment {
  id: number;
  patientName: string;
  emergency?: boolean | null;
}

export default function QueueClient({
  arrivedAppointments,
  nowServing,
  isResting,
}: {
  arrivedAppointments: Appointment[];
  nowServing: Appointment | null;
  isResting: boolean;
}) {
  const showWait = isResting || !nowServing;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col lg:flex-row gap-0 items-stretch overflow-hidden dark">
      <QueueAudioAlert currentPatient={nowServing?.patientName || ''} />

      {/* MAIN DISPLAY: NOW SERVING */}
      <div className="flex-[2] min-w-0 order-2 lg:order-1 flex flex-col h-screen">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex-1 flex flex-col h-full"
        >
          <div className="bg-slate-900/60 backdrop-blur-3xl border-r border-white/10 flex-1 flex flex-col p-0 text-center relative overflow-hidden transition-all duration-1000 h-full">
            {/* Top Left Compact Status Header */}
            <div className="absolute top-6 md:top-10 left-6 md:left-10 z-50 flex items-center gap-4 md:gap-6 animate-bounce-slow">
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-3xl">
                {showWait ? (
                  <Clock size={24} className="text-amber-500/80 md:size-32 lg:w-10 lg:h-10" />
                ) : (
                  <Stethoscope
                    size={24}
                    className="text-emerald-500/80 md:size-32 lg:w-10 lg:h-10 animate-pulse"
                  />
                )}
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)] ${showWait ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  ></div>
                  <span className="text-[10px] md:text-xs lg:text-sm font-black text-emerald-400 uppercase tracking-[0.4em] md:tracking-[0.6em]">
                    {showWait ? 'Wait' : 'Now Consulting'}
                  </span>
                </div>
                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  HealthCor Node Active
                </p>
              </div>
            </div>

            {/* PERSISTENT CENTERED PATIENT NAME */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative px-10">
              <AnimatePresence mode="wait">
                {showWait ? (
                  <motion.div
                    key="standby"
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="space-y-10 w-full"
                  >
                    <div className="w-full px-4 overflow-hidden">
                      <ScrollingName
                        name="PLEASE WAIT"
                        className="text-6xl sm:text-8xl md:text-[14rem] lg:text-[22rem] xl:text-[28rem] font-black text-white/5 tracking-tighter leading-none italic uppercase"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={nowServing.patientName}
                    initial={{ opacity: 0, y: 150, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -150, scale: 0.7 }}
                    transition={{
                      duration: 1.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="space-y-12 w-full"
                  >
                    <div className="w-full px-4 lg:px-20">
                      <ScrollingName
                        name={nowServing.patientName}
                        className="text-6xl sm:text-[10rem] md:text-[14rem] lg:text-[22rem] xl:text-[28rem] font-black text-white tracking-tighter leading-none uppercase drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                    <div className="flex justify-center items-center gap-16 lg:gap-24 opacity-40">
                      <div className="h-[2px] w-48 lg:w-72 xl:w-[40rem] bg-gradient-to-r from-transparent to-emerald-500/60 rounded-full"></div>
                      <div className="h-[2px] w-48 lg:w-72 xl:w-[40rem] bg-gradient-to-l from-transparent to-emerald-500/60 rounded-full"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Decorative Corner Glow */}
            <div className="absolute -bottom-60 -right-60 w-[1000px] h-[1000px] bg-emerald-500/10 blur-[200px] rounded-full pointer-events-none"></div>
          </div>
        </motion.div>
      </div>

      {/* SIDEBAR: WAITING LIST */}
      <div className="flex-1 min-w-0 order-1 lg:order-2 flex flex-col h-screen">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex-1 flex flex-col h-full"
        >
          <div className="bg-black border-l border-white/5 p-10 lg:p-16 shadow-2xl flex flex-col h-full relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 relative z-20">
              <div className="flex items-center gap-6">
                <div className="bg-emerald-600 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)]">
                  <Users className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-1 text-white">
                    Queue
                  </h2>
                  <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em]">
                    {arrivedAppointments.length} Active
                  </p>
                </div>
              </div>
              <div className="hidden xl:block">
                <Zap className="w-8 h-8 text-white/20 animate-pulse" />
              </div>
            </div>

            <div className="flex-1 relative z-20 min-h-0">
              {/* Deeper Top & Bottom Gradient Masks */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950/95 dark:from-black to-transparent z-30 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/95 dark:from-black to-transparent z-30 pointer-events-none"></div>

              <div className="h-full overflow-y-auto overflow-x-hidden space-y-4 md:space-y-6 pr-2 md:pr-4 py-12 md:py-20 custom-scrollbar text-left relative scroll-smooth">
                <AnimatePresence mode="popLayout" initial={false}>
                  {arrivedAppointments.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center opacity-10 space-y-10 animate-pulse"
                    >
                      <Activity size={80} strokeWidth={0.5} className="text-white md:size-120" />
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-center px-8 text-white">
                        PLEASE WAIT
                      </p>
                    </motion.div>
                  ) : (
                    arrivedAppointments.map((appt, idx) => (
                      <motion.div
                        key={appt.id}
                        layout
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          x: -250,
                          scale: 0.8,
                          filter: 'blur(30px)',
                          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                        }}
                        transition={{
                          layout: { type: 'spring', stiffness: 350, damping: 35 },
                          opacity: { duration: 0.4 },
                          default: { type: 'spring', stiffness: 300, damping: 25 },
                        }}
                        className={`flex items-center gap-4 md:gap-8 p-6 md:p-8 lg:p-10 rounded-[1.8rem] md:rounded-[2.5rem] border transition-all duration-700 ${idx === 0 ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 border-white/20 shadow-[0_30px_60px_-15px_rgba(5,150,105,0.6)] scale-[1.03] z-40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div
                          className={`w-10 h-10 md:w-14 md:h-14 lg:w-18 lg:h-18 rounded-[0.8rem] md:rounded-[1.2rem] lg:rounded-[1.5rem] flex-shrink-0 flex items-center justify-center font-black text-lg md:text-2xl lg:text-3xl shadow-inner ${idx === 0 ? 'bg-white text-emerald-800' : 'bg-white/5 text-emerald-500'}`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <ScrollingName
                            name={appt.patientName}
                            className={`text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black uppercase tracking-tighter ${idx === 0 ? 'text-white' : 'text-slate-300'}`}
                          />
                          <div
                            className={`h-1 w-8 md:h-1.5 md:w-12 rounded-full mt-2 md:mt-3 ${idx === 0 ? 'bg-white/40' : 'bg-emerald-500/20'}`}
                          ></div>
                        </div>
                        {appt.emergency && (
                          <div className="flex-shrink-0 bg-red-500/20 p-2 md:p-3 rounded-full">
                            <Zap className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-red-500 animate-pulse" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-20 opacity-40">
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">
                Kindly be seated until your name is called
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
