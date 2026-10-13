import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Wheat } from 'lucide-react';
import { PeakTimer } from './PeakTimer';
import { calculateFeedingSchedule, calibrationFactorFor, FLOUR_DATA, type CalibrationEntry } from '@/lib/sourdough-calculator';
import type { SourdoughPersona } from '@/types/sourdough';
import { useI18n } from '@/lib/i18n';

interface StarterOverviewProps {
  personas: SourdoughPersona[];
  history: CalibrationEntry[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function StarterOverview({
  personas,
  history,
  activePersonaId,
  onSelectPersona,
  isVisible,
  onToggleVisibility,
}: StarterOverviewProps) {
  const { t } = useI18n();

  const parseDateTimeToDate = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    const date = new Date(`${dateStr}T${timeStr}`);
    return isNaN(date.getTime()) ? null : date;
  };

  const startersWithPeakTimes = useMemo(() => {
    return personas.map((persona) => {
      const ts = persona.timeSettings;
      const result = calculateFeedingSchedule({
        flourBlend: persona.flourBlend,
        feedingRatio: persona.feedingRatio,
        temperature: persona.temperature,
        targetStartTime: ts ? parseDateTimeToDate(ts.targetStartDate, ts.targetStartTime) : null,
        targetPeakStart: ts ? parseDateTimeToDate(ts.targetPeakStartDate, ts.targetPeakStartTime) : null,
        targetPeakEnd: ts ? parseDateTimeToDate(ts.targetPeakEndDate, ts.targetPeakEndTime) : null,
        useTargetWindow: ts?.inputMode === 'target-window',
        oldSourdoughAmount: persona.oldSourdoughAmount,
        isSweetMode: persona.isSweetMode,
        sugarPercentage: persona.sugarPercentage,
        sugarType: persona.sugarType || 'white-sugar',
        inputMode: ts?.inputMode || 'basic',
        targetTotalSourdough: ts?.targetTotalSourdough || 0,
        targetPeakTime: ts ? parseDateTimeToDate(ts.targetPeakDate, ts.targetPeakTime) : null,
        calibrationFactor: calibrationFactorFor(history, persona.id, persona.isSweetMode && persona.sugarPercentage > 0),
      });

      const primaryFlour = persona.flourBlend.reduce((max, curr) => 
        curr.percentage > max.percentage ? curr : max, persona.flourBlend[0]
      );

      return {
        ...persona,
        estimatedPeakTime: result.estimatedPeakTime,
        totalSourdoughAmount: result.totalSourdoughAmount,
        primaryFlourType: primaryFlour?.flourType || 'bread-flour',
      };
    });
  }, [personas, history]);

  if (personas.length <= 1) return null;

  return (
    <Card className="border-border/50 shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Wheat className="h-5 w-5 text-primary" />
            {t('allStarters')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggleVisibility} className="h-8 px-2">
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isVisible && (
        <CardContent className="space-y-2">
          {startersWithPeakTimes.map((starter) => (
            <div
              key={starter.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                starter.id === activePersonaId
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-muted/30 border-border/30 hover:bg-muted/50'
              }`}
              onClick={() => onSelectPersona(starter.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{starter.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {FLOUR_DATA[starter.primaryFlourType]?.name || starter.primaryFlourType}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{starter.totalSourdoughAmount}g</span>
              </div>
              <PeakTimer peakTime={starter.estimatedPeakTime} starterName={starter.name} compact />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
