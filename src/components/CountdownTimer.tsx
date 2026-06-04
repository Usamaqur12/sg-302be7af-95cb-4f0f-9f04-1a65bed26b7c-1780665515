"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[42px]">
      <div className="bg-accent/5 border-2 border-accent rounded-lg px-2 py-1.5 w-full flex items-center justify-center">
        <span className="text-sm lg:text-base font-bold font-mono text-accent tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-1.5">
      <TimeBox value={timeLeft.days} label="Days" />
      <span className="text-muted-foreground font-bold mb-4">:</span>
      <TimeBox value={timeLeft.hours} label="Hours" />
      <span className="text-muted-foreground font-bold mb-4">:</span>
      <TimeBox value={timeLeft.minutes} label="Mins" />
      <span className="text-muted-foreground font-bold mb-4">:</span>
      <TimeBox value={timeLeft.seconds} label="Secs" />
    </div>
  );
}