import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DigitalClockProps {
  theme?: 'dark' | 'light';
  className?: string;
}

export default function DigitalClock({ theme = 'dark', className = '' }: DigitalClockProps) {
  const [time, setTime] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        hours: String(now.getHours()).padStart(2, '0'),
        minutes: String(now.getMinutes()).padStart(2, '0'),
        seconds: String(now.getSeconds()).padStart(2, '0')
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 select-none px-3 py-1.5 rounded-xl border transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-zinc-900/80 border-white/10 text-white shadow-inner'
        : 'bg-zinc-100 border-zinc-200 text-zinc-900 shadow-xs'
    } ${className}`}>
      <div className="relative flex items-center justify-center">
        <Clock className="w-4 h-4 text-red-500" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
      </div>
      <div className="font-mono text-sm font-bold tracking-wider flex items-center gap-0.5">
        <span className="text-red-500">{time.hours}</span>
        <span className="text-zinc-400 animate-pulse">:</span>
        <span>{time.minutes}</span>
        <span className="text-zinc-400 animate-pulse">:</span>
        <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>{time.seconds}</span>
      </div>
    </div>
  );
}
