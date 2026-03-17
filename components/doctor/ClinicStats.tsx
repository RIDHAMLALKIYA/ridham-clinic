'use client';

import { Users, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import AnimatedWrapper from '@/components/layout/AnimatedWrapper';

interface StatsProps {
  stats: {
    totalPatients: number;
    weeklyAppts: number;
    emergencyToday: number;
    peakHour: string;
  };
}

export default function ClinicStats({ stats }: StatsProps) {
  const cards = [
    {
      label: 'Patient Reach',
      value: stats.totalPatients,
      icon: Users,
      color: 'emerald',
      desc: 'Total lifetime records'
    },
    {
      label: 'Weekly Momentum',
      value: `+${stats.weeklyAppts}`,
      icon: TrendingUp,
      color: 'blue',
      desc: 'Appointments last 7 days'
    },
    {
      label: 'Critical Today',
      value: stats.emergencyToday,
      icon: AlertTriangle,
      color: 'red',
      desc: 'Emergency cases handled'
    },
    {
      label: 'Peak Operation',
      value: stats.peakHour,
      icon: Zap,
      color: 'amber',
      desc: 'Busiest clinic hour detected'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <AnimatedWrapper key={card.label} direction="up" delay={i * 0.05}>
          <div className="glass-vip-polished rounded-[2.5rem] p-8 border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${card.color}-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className={`w-12 h-12 bg-${card.color}-500/10 rounded-2xl flex items-center justify-center border border-${card.color}-500/20 text-${card.color}-500`}>
                <card.icon size={22} />
              </div>
            </div>
            
            <div className="space-y-1 relative z-10">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{card.label}</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">
                {card.value}
              </div>
              <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">{card.desc}</p>
            </div>
          </div>
        </AnimatedWrapper>
      ))}
    </div>
  );
}
