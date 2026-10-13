import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router';
import { Clock, Thermometer, Wheat, Scale, CheckCircle, AlertCircle, Lightbulb, Plus, Trash2, Cookie, Moon, Sun, Timer, Smartphone, HelpCircle, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  FLOUR_DATA, 
  SUGAR_DATA,
  calculateFeedingSchedule, 
  formatDateTime,
  formatTime,
  generateId,
  parseDecimalInput,
  calibrationFactorFor,
} from '@/lib/sourdough-calculator';
import type { FlourType, FlourBlendItem, FeedingRatio, SugarType, InputMode, PersonaTimeSettings } from '@/types/sourdough';
import { useI18n, Language } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import { usePersonas, createDefaultTimeSettings } from '@/hooks/use-personas';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useFeedingHistory } from '@/hooks/use-feeding-history';
import { PeakTimer } from './PeakTimer';
import { StarterOverview } from './StarterOverview';
import { FeedingRatioInput } from './FeedingRatioInput';
import { FeedingHistory } from './FeedingHistory';
import { AppMenu } from './AppMenu';

export function SourdoughCalculator() {
  const { t, language, setLanguage } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const { personas, activePersona, activePersonaId, setActivePersonaId, autoSavePersona } = usePersonas();
  const { isActive: wakeLockActive, isSupported: wakeLockSupported, toggleWakeLock } = useWakeLock();
  const { addEntry: addHistoryEntry, history } = useFeedingHistory();
  
  // Local state from active persona
  const [flourBlend, setFlourBlend] = useState<FlourBlendItem[]>(activePersona.flourBlend);
  const [feedingRatio, setFeedingRatio] = useState<FeedingRatio>(activePersona.feedingRatio);
  const [ratioInputs, setRatioInputs] = useState(activePersona.ratioInputs);
  const [temperature, setTemperature] = useState(activePersona.temperature);
  const [oldSourdoughAmount, setOldSourdoughAmount] = useState(activePersona.oldSourdoughAmount);
  const [oldSourdoughInput, setOldSourdoughInput] = useState(activePersona.oldSourdoughInput);
  const [isSweetMode, setIsSweetMode] = useState(activePersona.isSweetMode);
  const [sugarPercentage, setSugarPercentage] = useState(activePersona.sugarPercentage);
  const [sugarType, setSugarType] = useState<SugarType>(activePersona.sugarType || 'white-sugar');
  const [showResults, setShowResults] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  
  // Per-persona time settings
  const [timeSettings, setTimeSettings] = useState<PersonaTimeSettings>(
    activePersona.timeSettings || createDefaultTimeSettings()
  );
  
  // Raw protein input strings (for comma support)
  const [proteinInputs, setProteinInputs] = useState<Record<string, string>>(() => {
    const inputs: Record<string, string> = {};
    activePersona.flourBlend.forEach(f => {
      inputs[f.id] = f.proteinContent.toString().replace('.', ',');
    });
    return inputs;
  });
  

  // Load the form from the starter when switching starters. Done during render (React's
  // "adjust state when a prop changes" pattern), and only on switching: auto-save also
  // changes activePersona, and re-syncing then would hide the results and overwrite
  // half-typed inputs such as "11,".
  const [loadedPersonaId, setLoadedPersonaId] = useState(activePersonaId);
  if (loadedPersonaId !== activePersonaId) {
    setLoadedPersonaId(activePersonaId);
    setFlourBlend(activePersona.flourBlend);
    setFeedingRatio(activePersona.feedingRatio);
    setRatioInputs(activePersona.ratioInputs);
    setTemperature(activePersona.temperature);
    setOldSourdoughAmount(activePersona.oldSourdoughAmount);
    setOldSourdoughInput(activePersona.oldSourdoughInput);
    setIsSweetMode(activePersona.isSweetMode);
    setSugarPercentage(activePersona.sugarPercentage);
    setSugarType(activePersona.sugarType || 'white-sugar');
    setTimeSettings(activePersona.timeSettings || createDefaultTimeSettings());
    setShowResults(false);
    // Reset protein inputs
    const inputs: Record<string, string> = {};
    activePersona.flourBlend.forEach(f => {
      inputs[f.id] = f.proteinContent.toString().replace('.', ',');
    });
    setProteinInputs(inputs);
  }

  // Auto-save persona data when it changes
  const saveCurrentState = useCallback(() => {
    autoSavePersona(activePersonaId, {
      flourBlend,
      feedingRatio,
      ratioInputs,
      temperature,
      oldSourdoughAmount,
      oldSourdoughInput,
      isSweetMode,
      sugarPercentage,
      sugarType,
      timeSettings,
    });
  }, [autoSavePersona, activePersonaId, flourBlend, feedingRatio, ratioInputs, temperature, oldSourdoughAmount, oldSourdoughInput, isSweetMode, sugarPercentage, sugarType, timeSettings]);

  // Debounced auto-save
  useEffect(() => {
    const timeout = setTimeout(saveCurrentState, 500);
    return () => clearTimeout(timeout);
  }, [saveCurrentState]);

  const parseDateTimeToDate = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    const date = new Date(`${dateStr}T${timeStr}`);
    return isNaN(date.getTime()) ? null : date;
  };

  // Local date; toISOString() would give the UTC date, a day early just after midnight in Denmark
  const formatDateString = (date: Date): string => format(date, 'yyyy-MM-dd');
  const formatTimeStr = (date: Date): string => date.toTimeString().slice(0, 5);

  const updateTimeSettings = useCallback((updates: Partial<PersonaTimeSettings>) => {
    setTimeSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const shiftTargetWindowFromStart = useCallback((nextStartDate: string, nextStartTime: string) => {
    const prevStart = parseDateTimeToDate(timeSettings.targetStartDate, timeSettings.targetStartTime);
    const nextStart = parseDateTimeToDate(nextStartDate, nextStartTime);

    if (!prevStart || !nextStart) {
      updateTimeSettings({ targetStartDate: nextStartDate, targetStartTime: nextStartTime });
      return;
    }

    const deltaMs = nextStart.getTime() - prevStart.getTime();

    const prevPeakStart = parseDateTimeToDate(timeSettings.targetPeakStartDate, timeSettings.targetPeakStartTime);
    const prevPeakEnd = parseDateTimeToDate(timeSettings.targetPeakEndDate, timeSettings.targetPeakEndTime);

    if (prevPeakStart && prevPeakEnd) {
      const nextPeakStart = new Date(prevPeakStart.getTime() + deltaMs);
      const nextPeakEnd = new Date(prevPeakEnd.getTime() + deltaMs);

      updateTimeSettings({
        targetStartDate: nextStartDate,
        targetStartTime: nextStartTime,
        targetPeakStartDate: formatDateString(nextPeakStart),
        targetPeakStartTime: formatTimeStr(nextPeakStart),
        targetPeakEndDate: formatDateString(nextPeakEnd),
        targetPeakEndTime: formatTimeStr(nextPeakEnd),
      });
      return;
    }

    updateTimeSettings({ targetStartDate: nextStartDate, targetStartTime: nextStartTime });
  }, [timeSettings, updateTimeSettings]);

  // Validation: check if end time is after start time
  const isValidTimeWindow = useMemo(() => {
    if (timeSettings.inputMode !== 'target-window') return true;
    
    const peakStart = parseDateTimeToDate(timeSettings.targetPeakStartDate, timeSettings.targetPeakStartTime);
    const peakEnd = parseDateTimeToDate(timeSettings.targetPeakEndDate, timeSettings.targetPeakEndTime);
    const startTime = parseDateTimeToDate(timeSettings.targetStartDate, timeSettings.targetStartTime);
    
    if (!peakStart || !peakEnd) return false;
    if (peakEnd <= peakStart) return false;
    if (startTime && peakStart <= startTime) return false;
    
    return true;
  }, [timeSettings]);

  const totalPercentage = useMemo(() => flourBlend.reduce((sum, item) => sum + item.percentage, 0), [flourBlend]);

  const calibrationFactor = useMemo(
    () => calibrationFactorFor(history, activePersonaId, isSweetMode && sugarPercentage > 0),
    [history, activePersonaId, isSweetMode, sugarPercentage],
  );

  const result = useMemo(() => {
    return calculateFeedingSchedule({
      flourBlend,
      feedingRatio,
      temperature,
      targetStartTime: parseDateTimeToDate(timeSettings.targetStartDate, timeSettings.targetStartTime),
      targetPeakStart: parseDateTimeToDate(timeSettings.targetPeakStartDate, timeSettings.targetPeakStartTime),
      targetPeakEnd: parseDateTimeToDate(timeSettings.targetPeakEndDate, timeSettings.targetPeakEndTime),
      useTargetWindow: timeSettings.inputMode === 'target-window',
      oldSourdoughAmount,
      isSweetMode,
      sugarPercentage,
      sugarType,
      inputMode: timeSettings.inputMode,
      targetTotalSourdough: timeSettings.targetTotalSourdough,
      targetPeakTime: parseDateTimeToDate(timeSettings.targetPeakDate, timeSettings.targetPeakTime),
      calibrationFactor,
    });
  }, [flourBlend, feedingRatio, temperature, timeSettings, oldSourdoughAmount, isSweetMode, sugarPercentage, sugarType, calibrationFactor]);

  const addFlour = () => {
    const newId = generateId();
    const newFlour = { id: newId, flourType: 'all-purpose' as FlourType, percentage: 0, proteinContent: FLOUR_DATA['all-purpose'].baseProtein };
    setFlourBlend([...flourBlend, newFlour]);
    setProteinInputs(prev => ({ ...prev, [newId]: FLOUR_DATA['all-purpose'].baseProtein.toString().replace('.', ',') }));
  };
  
  const removeFlour = (id: string) => { 
    if (flourBlend.length > 1) {
      setFlourBlend(flourBlend.filter(f => f.id !== id));
      setProteinInputs(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };
  
  const updateFlour = (id: string, updates: Partial<FlourBlendItem>) => {
    setFlourBlend(flourBlend.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (updates.flourType && updates.proteinContent === undefined) {
        updated.proteinContent = FLOUR_DATA[updates.flourType].baseProtein;
        setProteinInputs(prev => ({ ...prev, [id]: FLOUR_DATA[updates.flourType!].baseProtein.toString().replace('.', ',') }));
      }
      return updated;
    }));
  };

  const handleProteinInput = (id: string, value: string) => {
    if (value === '' || /^-?\d*[.,]?\d*$/.test(value)) {
      setProteinInputs(prev => ({ ...prev, [id]: value }));

      if (value === '' || value.endsWith(',') || value.endsWith('.')) return;

      const parsed = parseDecimalInput(value);
      if (!Number.isNaN(parsed)) {
        updateFlour(id, { proteinContent: parsed });
      }
    }
  };

  const handleProteinBlur = (id: string) => {
    const raw = (proteinInputs[id] ?? '').trim();
    if (!raw) return;

    const cleaned = raw.replace(/[.,]$/, '');
    if (!cleaned) {
      setProteinInputs(prev => ({ ...prev, [id]: '' }));
      return;
    }

    const parsed = parseDecimalInput(cleaned);
    if (!Number.isNaN(parsed)) {
      updateFlour(id, { proteinContent: parsed });
      setProteinInputs(prev => ({ ...prev, [id]: cleaned.replace('.', ',') }));
    }
  };

  const handleOldSourdoughChange = (value: string) => {
    setOldSourdoughInput(value);
    const parsed = parseDecimalInput(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setOldSourdoughAmount(parsed);
    }
  };

  const getFlourName = (flourType: FlourType): string => t(flourType);
  const getFlourDescription = (flourType: FlourType): string => t(`${flourType}-desc`);
  const getSugarName = (sugar: SugarType): string => t(sugar);

  const formatDuration = (minutes: number) =>
    minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;

  const getTodayString = () => formatDateString(new Date());

  const inputModeOptions: { value: InputMode; label: string }[] = [
    { value: 'basic', label: t('basicMode') },
    { value: 'target-window', label: t('targetWindowMode') },
    { value: 'total-sourdough', label: t('totalSourdoughMode') },
  ];

  // Shown in both modes that aim for a target peak time
  const achievabilityWarning = result.achievabilityWarning && (
    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-destructive">{t('peakNotAchievable')}</p>
        <p className="text-muted-foreground text-xs mt-1">
          {t(result.achievabilityWarning)}{' '}
          {result.achievabilityWarning === 'targetPeakTooSoon' 
            ? `${result.minAchievableHours.toFixed(1)} ${t('hoursFromStart')}`
            : `${result.maxAchievableHours.toFixed(1)} ${t('hoursFromStart')}`
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <AppMenu />
          <span className="flex items-center gap-1.5 text-sm font-medium truncate">
            <Wheat className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{activePersona.name}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guidance">
            <Button variant="ghost" size="icon" title={t('viewGuidance')}>
              <HelpCircle className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('english')}</SelectItem>
              <SelectItem value="da">{t('danish')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">{t('title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Multi-starter overview */}
      <StarterOverview
        personas={personas}
        history={history}
        activePersonaId={activePersonaId}
        onSelectPersona={setActivePersonaId}
        isVisible={showOverview}
        onToggleVisibility={() => setShowOverview(!showOverview)}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Flour Blend */}
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display"><Wheat className="h-5 w-5 text-primary" />{t('flourBlend')}</CardTitle>
                <Badge variant={totalPercentage === 100 ? "default" : "destructive"} className="text-xs">{totalPercentage}%</Badge>
              </div>
              <CardDescription>{t('flourBlendDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flourBlend.map((flour) => (
                <div key={flour.id} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Select value={flour.flourType} onValueChange={(v) => updateFlour(flour.id, { flourType: v as FlourType })}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.keys(FLOUR_DATA).map((key) => (<SelectItem key={key} value={key}>{getFlourName(key as FlourType)}</SelectItem>))}</SelectContent>
                    </Select>
                    {flourBlend.length > 1 && (<Button variant="ghost" size="icon" onClick={() => removeFlour(flour.id)} className="shrink-0"><Trash2 className="h-4 w-4" /></Button>)}
                  </div>
                  <p className="text-xs text-muted-foreground">{getFlourDescription(flour.flourType)}</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-xs text-muted-foreground">{t('percentage')}</Label><span className="text-xs font-medium">{flour.percentage}%</span></div>
                      <Slider value={[flour.percentage]} onValueChange={([v]) => updateFlour(flour.id, { percentage: v })} min={0} max={100} step={1} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('protein')} (%)</Label>
                      <Input 
                        type="text" 
                        inputMode="decimal"
                        value={proteinInputs[flour.id] ?? ''} 
                        onChange={(e) => handleProteinInput(flour.id, e.target.value)}
                        onBlur={() => handleProteinBlur(flour.id)}
                        className="text-center" 
                        placeholder="e.g. 11,5"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addFlour} className="w-full"><Plus className="h-4 w-4 mr-2" />{t('addFlour')}</Button>
              {totalPercentage !== 100 && <p className="text-xs text-destructive">{t('flourPercentageWarning')} ({totalPercentage}%)</p>}
            </CardContent>
          </Card>

          {/* Input Mode Toggle */}
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Clock className="h-5 w-5 text-primary" />
                {t('calculationMode')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {inputModeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={timeSettings.inputMode === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateTimeSettings({ inputMode: opt.value })}
                    className="flex-1"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start Time - for Normal (basic) mode */}
          {timeSettings.inputMode === 'basic' && (
            <Card className="border-border/50 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-display"><Clock className="h-5 w-5 text-primary" />{t('startTime')}</CardTitle>
                <CardDescription>{t('startTimeDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={timeSettings.targetStartDate}
                    min={getTodayString()}
                    onChange={(e) => updateTimeSettings({ targetStartDate: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={timeSettings.targetStartTime}
                    onChange={(e) => updateTimeSettings({ targetStartTime: e.target.value })}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const now = new Date();
                    updateTimeSettings({
                      targetStartDate: formatDateString(now),
                      targetStartTime: now.toTimeString().slice(0, 5)
                    });
                  }}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {t('useCurrentTime')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Old Sourdough - only for basic and target-window modes */}
          {timeSettings.inputMode !== 'total-sourdough' && (
            <Card className="border-border/50 shadow-xs">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('oldSourdough')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    value={oldSourdoughInput} 
                    onChange={(e) => handleOldSourdoughChange(e.target.value)}
                    className="text-center text-lg font-medium" 
                  />
                  <span className="text-muted-foreground font-medium">g</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Sourdough mode inputs */}
          {timeSettings.inputMode === 'total-sourdough' && (
            <Card className="border-border/50 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Scale className="h-5 w-5 text-primary" />
                  {t('targetTotalSourdough')}
                </CardTitle>
                <CardDescription>{t('targetTotalSourdoughDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    value={timeSettings.targetTotalSourdoughInput} 
                    onChange={(e) => {
                      const input = e.target.value;
                      const parsed = parseDecimalInput(input);
                      updateTimeSettings({ 
                        targetTotalSourdoughInput: input,
                        targetTotalSourdough: !Number.isNaN(parsed) && parsed > 0 ? parsed : timeSettings.targetTotalSourdough
                      });
                    }}
                    className="text-center text-lg font-medium" 
                  />
                  <span className="text-muted-foreground font-medium">g</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('startTime')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={timeSettings.targetStartDate} min={getTodayString()} onChange={(e) => updateTimeSettings({ targetStartDate: e.target.value })} />
                    <Input type="time" value={timeSettings.targetStartTime} onChange={(e) => updateTimeSettings({ targetStartTime: e.target.value })} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const now = new Date();
                      updateTimeSettings({
                        targetStartDate: formatDateString(now),
                        targetStartTime: now.toTimeString().slice(0, 5)
                      });
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {t('useCurrentTime')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('desiredPeakTime')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={timeSettings.targetPeakDate} min={getTodayString()} onChange={(e) => updateTimeSettings({ targetPeakDate: e.target.value })} />
                    <Input type="time" value={timeSettings.targetPeakTime} onChange={(e) => updateTimeSettings({ targetPeakTime: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('oldSourdough')}</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="text" 
                      inputMode="decimal"
                      value={oldSourdoughInput} 
                      onChange={(e) => handleOldSourdoughChange(e.target.value)}
                      className="text-center font-medium" 
                    />
                    <span className="text-muted-foreground font-medium">g</span>
                  </div>
                </div>
                {achievabilityWarning}
              </CardContent>
            </Card>
          )}

          {/* Feeding Ratio - only for Normal (basic) mode */}
          {timeSettings.inputMode === 'basic' && (
            <Card className="border-border/50 shadow-xs">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('feedingRatio')}</CardTitle></CardHeader>
              <CardContent>
                <FeedingRatioInput
                  feedingRatio={feedingRatio}
                  ratioInputs={ratioInputs}
                  oldSourdoughAmount={oldSourdoughAmount}
                  onRatioChange={(ratio, inputs) => {
                    setFeedingRatio(ratio);
                    setRatioInputs(inputs);
                  }}
                  onOldSourdoughChange={(amount, input) => {
                    setOldSourdoughAmount(amount);
                    setOldSourdoughInput(input);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Temperature */}
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Thermometer className="h-5 w-5 text-primary" />{t('ambientTemperature')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t('roomTemperature')}</span><span className="text-sm font-medium text-primary">{temperature}°C</span></div>
              <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={10} max={40} step={0.5} className="py-2" />
            </CardContent>
          </Card>

          {/* Target Window - only for target-window mode */}
          {timeSettings.inputMode === 'target-window' && (
            <Card className="border-border/50 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-display"><Clock className="h-5 w-5 text-primary" />{t('targetPeakWindow')}</CardTitle>
                <CardDescription>{t('targetWindowDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('startTime')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={timeSettings.targetStartDate}
                      min={getTodayString()}
                      onChange={(e) => shiftTargetWindowFromStart(e.target.value, timeSettings.targetStartTime)}
                    />
                    <Input
                      type="time"
                      value={timeSettings.targetStartTime}
                      onChange={(e) => shiftTargetWindowFromStart(timeSettings.targetStartDate, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const now = new Date();
                      shiftTargetWindowFromStart(formatDateString(now), now.toTimeString().slice(0, 5));
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {t('useCurrentTime')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('from')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={timeSettings.targetPeakStartDate} min={timeSettings.targetStartDate || getTodayString()} onChange={(e) => updateTimeSettings({ targetPeakStartDate: e.target.value })} />
                    <Input type="time" value={timeSettings.targetPeakStartTime} onChange={(e) => updateTimeSettings({ targetPeakStartTime: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('to')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={timeSettings.targetPeakEndDate} min={timeSettings.targetPeakStartDate || getTodayString()} onChange={(e) => updateTimeSettings({ targetPeakEndDate: e.target.value })} />
                    <Input type="time" value={timeSettings.targetPeakEndTime} onChange={(e) => updateTimeSettings({ targetPeakEndTime: e.target.value })} />
                  </div>
                </div>
                {!isValidTimeWindow && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('invalidTimeWindow')}
                  </p>
                )}
                {isValidTimeWindow && achievabilityWarning}
              </CardContent>
            </Card>
          )}

          {/* Sweet Sourdough */}
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-display"><Cookie className="h-5 w-5 text-primary" />{t('sweetSourdough')}</CardTitle><Switch checked={isSweetMode} onCheckedChange={setIsSweetMode} /></div>
            </CardHeader>
            {isSweetMode && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('sugarType')}</Label>
                  <Select value={sugarType} onValueChange={(v) => setSugarType(v as SugarType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(SUGAR_DATA).map((key) => (
                        <SelectItem key={key} value={key}>{getSugarName(key as SugarType)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{SUGAR_DATA[sugarType]?.description}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t('sugarAmount')}</span><span className="text-sm font-medium text-primary">{sugarPercentage}%</span></div>
                  <Slider value={[sugarPercentage]} onValueChange={([v]) => setSugarPercentage(v)} min={1} max={100} step={1} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Keep Screen On */}
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-display"><Smartphone className="h-5 w-5 text-primary" />{t('keepScreenOn')}</CardTitle><Switch checked={wakeLockActive} onCheckedChange={toggleWakeLock} disabled={!wakeLockSupported} /></div>
              <CardDescription>{t('keepScreenOnDesc')}</CardDescription>
            </CardHeader>
          </Card>

          <Button onClick={() => setShowResults(true)} className="w-full h-12 text-lg font-medium" size="lg" disabled={totalPercentage !== 100 || (timeSettings.inputMode === 'target-window' && !isValidTimeWindow)}>{t('calculateSchedule')}</Button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {showResults ? (
            <>
              {/* Peak Timer Card */}
              {!result.exceedsMaxHours && <PeakTimer peakTime={result.estimatedPeakTime} starterName={activePersona.name} />}

              <Card className="border-2 border-primary/20 bg-card shadow-lg overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/50"><h3 className="font-display text-xl font-semibold text-foreground">{t('yourFeedingSchedule')}</h3></div>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center p-6 rounded-xl bg-secondary/50 border border-border/50"><p className="text-sm text-muted-foreground mb-1">{t('feedStarterAt')}</p><p className="text-3xl font-display font-bold text-primary">{formatDateTime(result.feedingTime, language)}</p></div>
                  <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">{t('estimatedPeak')}</p>
                    {result.exceedsMaxHours
                      ? <p className="text-lg font-display font-bold text-destructive flex items-center justify-center gap-2"><AlertTriangle className="h-5 w-5" />{t('noPeakExpected')}</p>
                      : <p className="text-3xl font-display font-bold text-primary">{formatDateTime(result.estimatedPeakTime, language)}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{result.starterAmount}g</p><p className="text-xs text-muted-foreground mt-1">{t('starter')}</p></div>
                    <div className="p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{result.flourAmount}g</p><p className="text-xs text-muted-foreground mt-1">{t('flour')}</p></div>
                    <div className="p-4 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{result.waterAmount}g</p><p className="text-xs text-muted-foreground mt-1">{t('water')}</p></div>
                  </div>
                  {/* Flour breakdown */}
                  <div className="space-y-2 border-t border-border/30 pt-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('flourBreakdown')}</p>
                    {result.flourBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="text-sm">{getFlourName(item.flourType)} <span className="text-xs text-muted-foreground">({item.proteinContent.toString().replace('.', ',')}%)</span></span>
                        <span className="font-bold text-primary">{item.amountGrams}g</span>
                      </div>
                    ))}
                  </div>
                  {isSweetMode && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">{result.sugarAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">{getSugarName(sugarType)}</p>
                      {!result.exceedsMaxHours && <p className="text-xs text-muted-foreground mt-1">{result.sugarDelayMinutes > 0 ? `+${formatDuration(result.sugarDelayMinutes)} ${t('fromSugar')}` : t('sugarBelowThreshold')}</p>}
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/30"><span className="text-muted-foreground">{t('timeToPeak')}</span><span className="font-medium">{result.exceedsMaxHours ? '> 48' : result.hoursToReachPeak.toFixed(1)} {t('hours')}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30"><span className="text-muted-foreground">{t('totalSourdough')}</span><span className="font-medium text-primary text-lg">{result.totalSourdoughAmount}g</span></div>
                  </div>
                  {/* Log feeding button */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      addHistoryEntry({
                        personaId: activePersonaId,
                        personaName: activePersona.name,
                        feedingTime: result.feedingTime.toISOString(),
                        predictedPeakTime: result.estimatedPeakTime.toISOString(),
                        actualPeakTime: null,
                        temperature,
                        feedingRatio: result.recommendedRatio || feedingRatio,
                        flourBlend,
                        starterAmount: result.starterAmount,
                        flourAmount: result.flourAmount,
                        waterAmount: result.waterAmount,
                        sugarAmount: result.sugarAmount,
                        calibrationFactor,
                      });
                      toast.success(t('feedingLogged'));
                    }}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {t('logFeeding')}
                  </Button>
                </CardContent>
              </Card>

              {result.recommendedRatio && (
                <Card className="border-primary/30 bg-primary/5 shadow-xs">
                  <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('recommendedRatio')}</CardTitle><CardDescription>{t('recommendedRatioDesc')}</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xl font-bold text-primary">{result.recommendedRatio.starter}</p><p className="text-xs text-muted-foreground">{t('starter')}</p></div>
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xl font-bold text-primary">{result.recommendedRatio.flour}</p><p className="text-xs text-muted-foreground">{t('flour')}</p></div>
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xl font-bold text-primary">{result.recommendedRatio.water}</p><p className="text-xs text-muted-foreground">{t('water')}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fermentation Timeline */}
              {!result.exceedsMaxHours && <Card className="border-border/50 shadow-xs">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Timer className="h-5 w-5 text-primary" />{t('fermentationTimeline')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {result.fermentationPhases.map((phase, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === 2 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {i < result.fermentationPhases.length - 1 && <div className="w-0.5 h-8 bg-muted-foreground/20" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-baseline"><span className="font-medium text-sm">{t(phase.nameKey)}</span><span className="text-xs text-muted-foreground">{formatTime(phase.startTime)} - {formatTime(phase.endTime)}</span></div>
                        <p className="text-xs text-muted-foreground">{t(phase.descriptionKey)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <Card className="border-border/50 shadow-xs">
                  <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Lightbulb className="h-5 w-5 text-primary" />{t('suggestions')}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{t(s)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {/* Feeding History */}
              <FeedingHistory 
                personaId={activePersonaId}
                personaName={activePersona.name}
              />
            </>
          ) : (
            <Card className="border-border/50 shadow-xs h-full flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center space-y-4 py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"><Wheat className="h-8 w-8 text-primary" /></div>
                <div><h3 className="font-display text-lg font-semibold text-foreground mb-2">{t('readyToCalculate')}</h3><p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('readyToCalculate')}</p></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
