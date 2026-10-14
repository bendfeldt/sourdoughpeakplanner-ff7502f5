import { useState, useEffect } from 'react';
import { Timer, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface PeakTimerProps {
  peakTime: Date;
  starterName: string;
  compact?: boolean;
}

export function PeakTimer({ peakTime, starterName, compact = false }: PeakTimerProps) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = peakTime.getTime() - now;
  const totalMs = Math.abs(diff);
  const timeRemaining = {
    hours: Math.floor(totalMs / (1000 * 60 * 60)),
    minutes: Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((totalMs % (1000 * 60)) / 1000),
    isPast: diff <= 0,
    totalMs,
  };

  const formatUnit = (val: number, unit: string) => (
    <div className="flex flex-col items-center">
      <span className={cn(
        "font-mono font-bold tabular-nums",
        compact ? "text-lg" : "text-2xl"
      )}>
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );

  // Near peak: within 30 minutes
  const isNearPeak = !timeRemaining.isPast && timeRemaining.totalMs < 30 * 60 * 1000;
  // At peak: within 10 minutes past
  const isAtPeak = timeRemaining.isPast && timeRemaining.totalMs < 10 * 60 * 1000;
  // Past peak: more than 10 minutes past
  const isPastPeak = timeRemaining.isPast && timeRemaining.totalMs >= 10 * 60 * 1000;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        isAtPeak && "bg-green-500/10 text-green-600 dark:text-green-400",
        isNearPeak && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        isPastPeak && "bg-red-500/10 text-red-600 dark:text-red-400",
        !isAtPeak && !isNearPeak && !isPastPeak && "bg-primary/10 text-primary"
      )}>
        <Timer className="h-4 w-4" />
        <span className="font-medium">{starterName}:</span>
        <span className="font-mono tabular-nums">
          {timeRemaining.isPast && '-'}
          {String(timeRemaining.hours).padStart(2, '0')}:
          {String(timeRemaining.minutes).padStart(2, '0')}:
          {String(timeRemaining.seconds).padStart(2, '0')}
        </span>
        {isAtPeak && <CheckCircle className="h-4 w-4" />}
        {isPastPeak && <AlertCircle className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-colors",
      isAtPeak && "bg-green-500/10 border-green-500/30",
      isNearPeak && "bg-yellow-500/10 border-yellow-500/30 animate-pulse",
      isPastPeak && "bg-red-500/10 border-red-500/30",
      !isAtPeak && !isNearPeak && !isPastPeak && "bg-primary/10 border-primary/20"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className={cn(
            "h-5 w-5",
            isAtPeak && "text-green-500",
            isNearPeak && "text-yellow-500",
            isPastPeak && "text-red-500",
            !isAtPeak && !isNearPeak && !isPastPeak && "text-primary"
          )} />
          <span className="font-medium text-sm">{starterName}</span>
        </div>
        {isAtPeak && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full uppercase">
            {t('atPeak')}
          </span>
        )}
        {isPastPeak && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full uppercase">
            {t('pastPeak')}
          </span>
        )}
        {isNearPeak && (
          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full uppercase">
            {t('almostReady')}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-2">
        {timeRemaining.isPast && (
          <span className="text-xl text-muted-foreground">-</span>
        )}
        {formatUnit(timeRemaining.hours, t('timerHours'))}
        <span className="text-xl text-muted-foreground">:</span>
        {formatUnit(timeRemaining.minutes, t('timerMinutes'))}
        <span className="text-xl text-muted-foreground">:</span>
        {formatUnit(timeRemaining.seconds, t('timerSeconds'))}
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        {timeRemaining.isPast ? t('sincePeak') : t('untilPeak')}
      </p>
    </div>
  );
}
