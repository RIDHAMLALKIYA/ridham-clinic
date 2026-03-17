import { Stethoscope, ShieldAlert } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-12 pb-32 font-outfit max-w-7xl mx-auto px-6 lg:px-0 relative min-h-screen animate-pulse">
      {/* TOP BAR SKELETON */}
      <div className="glass-vip-polished rounded-[3rem] p-12 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-10 opacity-50">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-slate-200 dark:bg-white/5 rounded-[1.8rem] flex items-center justify-center">
            <Stethoscope className="w-10 h-10 text-slate-300 dark:text-white/10" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded-full"></div>
            <div className="h-10 w-64 bg-slate-300 dark:bg-white/10 rounded-xl"></div>
          </div>
        </div>
        <div className="flex gap-5">
           <div className="w-48 h-16 bg-slate-200 dark:bg-white/5 rounded-[1.8rem]"></div>
           <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-[1.8rem]"></div>
        </div>
      </div>

      {/* ADMIN SKELETON */}
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 flex items-center justify-between opacity-30">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-200 dark:bg-white/10 rounded-2xl flex items-center justify-center">
             <ShieldAlert className="text-slate-300 dark:text-white/10" size={28} />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded-lg"></div>
            <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded-lg"></div>
          </div>
        </div>
        <div className="w-48 h-14 bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* LEFT COMPACT SECTION */}
        <div className="xl:col-span-4 space-y-12">
            <div className="glass-vip-polished rounded-[3.5rem] p-10 border border-white/10 h-[700px] opacity-20">
              <div className="h-8 w-40 bg-slate-200 dark:bg-white/10 rounded-full mb-10"></div>
              <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]"></div>
                  ))}
              </div>
            </div>
        </div>

        {/* CENTER MAIN SECTION */}
        <div className="xl:col-span-8 space-y-12">
            <div className="glass-vip-polished rounded-[4rem] p-14 border border-white/20 h-[800px] opacity-40">
                <div className="flex justify-between mb-16">
                    <div className="h-12 w-64 bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
                    <div className="flex gap-4">
                        <div className="h-14 w-14 bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
                        <div className="h-14 w-48 bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-slate-100 dark:bg-white/5 rounded-[2.8rem]"></div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
