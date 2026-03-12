'use client';

import { useFormStatus } from 'react-dom';
import { CalendarCheck, Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  className?: string;
}

export default function SubmitButton({ className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`group/btn relative w-full flex justify-center items-center gap-3 py-5 px-6 border border-transparent rounded-[1.25rem] shadow-lg shadow-teal-500/20 text-xl font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 focus:outline-none focus:ring-4 focus:ring-teal-500/30 transition-all duration-300 transform overflow-hidden ${
        pending
          ? 'opacity-70 cursor-not-allowed'
          : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/40'
      } ${className}`}
    >
      <div
        className={`absolute inset-0 w-full h-full bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 transition-opacity duration-300 z-0 ${!pending && 'group-hover/btn:opacity-100'}`}
      ></div>

      {pending ? (
        <Loader2 className="w-6 h-6 relative z-10 animate-spin" />
      ) : (
        <CalendarCheck className="w-6 h-6 relative z-10 group-hover/btn:scale-110 transition-transform duration-300" />
      )}

      <span className="relative z-10 tracking-wide">
        {pending ? 'Requesting...' : 'Request Appointment'}
      </span>
    </button>
  );
}
