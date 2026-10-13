import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { History, Clock, CheckCircle, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useFeedingHistory, FeedingHistoryEntry } from '@/hooks/use-feeding-history';
import { useI18n } from '@/lib/i18n';
import { formatDateTime } from '@/lib/sourdough-calculator';
import { format } from 'date-fns';

interface FeedingHistoryProps {
  personaId: string;
  personaName: string;
  onRecordPeak?: (entryId: string) => void;
}

export function FeedingHistory({ personaId, personaName }: FeedingHistoryProps) {
  const { t, language } = useI18n();
  const { history, recordActualPeak, deleteEntry, getAccuracyStats } = useFeedingHistory();
  const [expanded, setExpanded] = useState(false);
  const [recordingPeakFor, setRecordingPeakFor] = useState<string | null>(null);
  const [peakTimeInput, setPeakTimeInput] = useState('');
  const [peakDateInput, setPeakDateInput] = useState('');

  const personaHistory = history.filter(e => e.personaId === personaId);
  const stats = getAccuracyStats(personaId);

  const handleRecordPeak = (entryId: string) => {
    if (!peakDateInput || !peakTimeInput) return;
    const peakTime = new Date(`${peakDateInput}T${peakTimeInput}`);
    if (!isNaN(peakTime.getTime())) {
      recordActualPeak(entryId, peakTime);
      setRecordingPeakFor(null);
      setPeakTimeInput('');
      setPeakDateInput('');
    }
  };

  const formatDifference = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const sign = minutes > 0 ? '+' : '-';
    if (hours === 0) return `${sign}${mins}m`;
    if (mins === 0) return `${sign}${hours}h`;
    return `${sign}${hours}h ${mins}m`;
  };

  if (personaHistory.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <History className="h-5 w-5 text-primary" />
            {t('feedingHistory')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {stats && (
          <CardDescription className="flex items-center gap-2">
            <Badge variant={Math.abs(stats.tendencyMinutes) < 30 ? 'default' : 'secondary'}>
              {stats.count} {t('recorded')}
            </Badge>
            {stats.tendencyMinutes !== 0 && (
              <span className="text-xs">
                {t('avgTendency')} {formatDifference(stats.tendencyMinutes)}
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-3">
          {personaHistory.slice(0, 10).map((entry) => (
            <div key={entry.id} className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatDateTime(new Date(entry.feedingTime), language)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {entry.starterAmount}g : {entry.flourAmount}g : {entry.waterAmount}g @ {entry.temperature}°C
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t('predictedPeak')}:</span>
                <span>{formatDateTime(new Date(entry.predictedPeakTime), language)}</span>
              </div>

              {entry.actualPeakTime ? (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-muted-foreground">{t('actualPeak')}:</span>
                  <span>{formatDateTime(new Date(entry.actualPeakTime), language)}</span>
                  {entry.peakTimeDifferenceMinutes !== null && (
                    <Badge 
                      variant={Math.abs(entry.peakTimeDifferenceMinutes) < 30 ? 'default' : 'secondary'}
                      className="text-xs px-1 py-0"
                    >
                      {formatDifference(entry.peakTimeDifferenceMinutes)}
                    </Badge>
                  )}
                </div>
              ) : (
                <>
                  {recordingPeakFor === entry.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={peakDateInput}
                        onChange={(e) => setPeakDateInput(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Input
                        type="time"
                        value={peakTimeInput}
                        onChange={(e) => setPeakTimeInput(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRecordPeak(entry.id)}
                      >
                        {t('save')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setRecordingPeakFor(null)}
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        setRecordingPeakFor(entry.id);
                        const now = new Date();
                        setPeakDateInput(format(now, 'yyyy-MM-dd'));
                        setPeakTimeInput(now.toTimeString().slice(0, 5));
                      }}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('recordActualPeak')}
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
