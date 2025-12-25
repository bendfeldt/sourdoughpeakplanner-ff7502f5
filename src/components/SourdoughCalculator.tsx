import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Thermometer, Wheat, Scale, CheckCircle, AlertCircle, Lightbulb, Plus, Trash2, Cookie, Moon, Sun, Timer, Smartphone, Copy, Edit2, Check, X } from 'lucide-react';
import { 
  FLOUR_DATA, 
  calculateFeedingSchedule, 
  formatDateTime,
  formatTime,
  generateId,
  parseDecimalInput,
} from '@/lib/sourdough-calculator';
import type { FlourType, FlourBlendItem, FeedingRatio } from '@/types/sourdough';
import { useI18n, Language } from '@/lib/i18n';
import { useCalculatorSettings } from '@/hooks/use-calculator-cache';
import { usePersonas } from '@/hooks/use-personas';
import { useWakeLock } from '@/hooks/use-wake-lock';

export function SourdoughCalculator() {
  const { t, language, setLanguage } = useI18n();
  const { settings, updateSettings } = useCalculatorSettings();
  const { personas, activePersona, activePersonaId, setActivePersonaId, addPersona, deletePersona, renamePersona, autoSavePersona, duplicatePersona } = usePersonas();
  const { isActive: wakeLockActive, isSupported: wakeLockSupported, toggleWakeLock } = useWakeLock();
  
  // Local state from active persona
  const [flourBlend, setFlourBlend] = useState<FlourBlendItem[]>(activePersona.flourBlend);
  const [feedingRatio, setFeedingRatio] = useState<FeedingRatio>(activePersona.feedingRatio);
  const [ratioInputs, setRatioInputs] = useState(activePersona.ratioInputs);
  const [temperature, setTemperature] = useState(activePersona.temperature);
  const [oldSourdoughAmount, setOldSourdoughAmount] = useState(activePersona.oldSourdoughAmount);
  const [oldSourdoughInput, setOldSourdoughInput] = useState(activePersona.oldSourdoughInput);
  const [isSweetMode, setIsSweetMode] = useState(activePersona.isSweetMode);
  const [sugarPercentage, setSugarPercentage] = useState(activePersona.sugarPercentage);
  const [showResults, setShowResults] = useState(false);
  
  // Raw protein input strings (for comma support)
  const [proteinInputs, setProteinInputs] = useState<Record<string, string>>(() => {
    const inputs: Record<string, string> = {};
    activePersona.flourBlend.forEach(f => {
      inputs[f.id] = f.proteinContent.toString().replace('.', ',');
    });
    return inputs;
  });
  
  // Rename state
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Sync from active persona when switching
  useEffect(() => {
    setFlourBlend(activePersona.flourBlend);
    setFeedingRatio(activePersona.feedingRatio);
    setRatioInputs(activePersona.ratioInputs);
    setTemperature(activePersona.temperature);
    setOldSourdoughAmount(activePersona.oldSourdoughAmount);
    setOldSourdoughInput(activePersona.oldSourdoughInput);
    setIsSweetMode(activePersona.isSweetMode);
    setSugarPercentage(activePersona.sugarPercentage);
    setShowResults(false);
    // Reset protein inputs
    const inputs: Record<string, string> = {};
    activePersona.flourBlend.forEach(f => {
      inputs[f.id] = f.proteinContent.toString().replace('.', ',');
    });
    setProteinInputs(inputs);
  }, [activePersonaId, activePersona]);

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
    });
  }, [autoSavePersona, activePersonaId, flourBlend, feedingRatio, ratioInputs, temperature, oldSourdoughAmount, oldSourdoughInput, isSweetMode, sugarPercentage]);

  // Debounced auto-save
  useEffect(() => {
    const timeout = setTimeout(saveCurrentState, 500);
    return () => clearTimeout(timeout);
  }, [saveCurrentState]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.isDarkMode);
  }, [settings.isDarkMode]);

  const parseDateTimeToDate = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    const date = new Date(`${dateStr}T${timeStr}`);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDateString = (date: Date): string => date.toISOString().split('T')[0];
  const formatTimeString = (date: Date): string => date.toTimeString().slice(0, 5);

  const shiftTargetWindowFromStart = useCallback((nextStartDate: string, nextStartTime: string) => {
    const prevStart = parseDateTimeToDate(settings.targetStartDate, settings.targetStartTime);
    const nextStart = parseDateTimeToDate(nextStartDate, nextStartTime);

    // If we can't compute a delta, just set start
    if (!prevStart || !nextStart) {
      updateSettings({ targetStartDate: nextStartDate, targetStartTime: nextStartTime });
      return;
    }

    const deltaMs = nextStart.getTime() - prevStart.getTime();

    const prevPeakStart = parseDateTimeToDate(settings.targetPeakStartDate, settings.targetPeakStartTime);
    const prevPeakEnd = parseDateTimeToDate(settings.targetPeakEndDate, settings.targetPeakEndTime);

    // If window exists, shift it by the same delta so it stays correlated to start
    if (prevPeakStart && prevPeakEnd) {
      const nextPeakStart = new Date(prevPeakStart.getTime() + deltaMs);
      const nextPeakEnd = new Date(prevPeakEnd.getTime() + deltaMs);

      updateSettings({
        targetStartDate: nextStartDate,
        targetStartTime: nextStartTime,
        targetPeakStartDate: formatDateString(nextPeakStart),
        targetPeakStartTime: formatTimeString(nextPeakStart),
        targetPeakEndDate: formatDateString(nextPeakEnd),
        targetPeakEndTime: formatTimeString(nextPeakEnd),
      });
      return;
    }

    updateSettings({ targetStartDate: nextStartDate, targetStartTime: nextStartTime });
  }, [settings.targetStartDate, settings.targetStartTime, settings.targetPeakStartDate, settings.targetPeakStartTime, settings.targetPeakEndDate, settings.targetPeakEndTime, updateSettings]);

  // Validation: check if end time is after start time
  const isValidTimeWindow = useMemo(() => {
    if (!settings.useTargetWindow) return true;
    
    const peakStart = parseDateTimeToDate(settings.targetPeakStartDate, settings.targetPeakStartTime);
    const peakEnd = parseDateTimeToDate(settings.targetPeakEndDate, settings.targetPeakEndTime);
    const startTime = parseDateTimeToDate(settings.targetStartDate, settings.targetStartTime);
    
    if (!peakStart || !peakEnd) return false;
    if (peakEnd <= peakStart) return false;
    if (startTime && peakStart <= startTime) return false;
    
    return true;
  }, [settings]);

  const totalPercentage = useMemo(() => flourBlend.reduce((sum, item) => sum + item.percentage, 0), [flourBlend]);

  const result = useMemo(() => {
    return calculateFeedingSchedule({
      flourBlend,
      feedingRatio,
      temperature,
      targetStartTime: parseDateTimeToDate(settings.targetStartDate, settings.targetStartTime),
      targetPeakStart: parseDateTimeToDate(settings.targetPeakStartDate, settings.targetPeakStartTime),
      targetPeakEnd: parseDateTimeToDate(settings.targetPeakEndDate, settings.targetPeakEndTime),
      useTargetWindow: settings.useTargetWindow,
      oldSourdoughAmount,
      isSweetMode,
      sugarPercentage,
    });
  }, [flourBlend, feedingRatio, temperature, settings, oldSourdoughAmount, isSweetMode, sugarPercentage]);

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
    // Allow empty, digits, and one comma or dot (Danish keyboard support)
    if (value === '' || /^-?\d*[.,]?\d*$/.test(value)) {
      setProteinInputs(prev => ({ ...prev, [id]: value }));

      // Don't commit to numeric model while user is mid-typing a decimal separator (e.g. "9,")
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
      // Keep comma in UI for da keyboards
      setProteinInputs(prev => ({ ...prev, [id]: cleaned.replace('.', ',') }));
    }
  };

  const handleAddPersona = () => {
    const name = `Starter ${personas.length + 1}`;
    addPersona(name);
  };

  const handleStartRename = () => {
    setEditNameValue(activePersona.name);
    setEditingName(true);
  };

  const handleConfirmRename = () => {
    if (editNameValue.trim()) {
      renamePersona(activePersonaId, editNameValue.trim());
    }
    setEditingName(false);
  };

  const handleCancelRename = () => {
    setEditingName(false);
  };

  const getFlourName = (flourType: FlourType): string => t(flourType as any) || FLOUR_DATA[flourType].name;
  const getFlourDescription = (flourType: FlourType): string => t(`${flourType}-desc` as any) || FLOUR_DATA[flourType].description;

  const getTodayString = () => new Date().toISOString().split('T')[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {editingName ? (
            <div className="flex items-center gap-1">
              <Input 
                value={editNameValue} 
                onChange={(e) => setEditNameValue(e.target.value)}
                className="w-40 h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') handleCancelRename();
                }}
              />
              <Button variant="ghost" size="icon" onClick={handleConfirmRename}><Check className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={handleCancelRename}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <>
              <Select value={activePersonaId} onValueChange={setActivePersonaId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select starter" /></SelectTrigger>
                <SelectContent>
                  {personas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleStartRename} title="Rename"><Edit2 className="h-4 w-4" /></Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={handleAddPersona} title="Add new starter"><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => duplicatePersona(activePersonaId, `${activePersona.name} (copy)`)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
          {personas.length > 1 && <Button variant="ghost" size="icon" onClick={() => deletePersona(activePersonaId)} title="Delete"><Trash2 className="h-4 w-4" /></Button>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => updateSettings({ isDarkMode: !settings.isDarkMode })}>
            {settings.isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Flour Blend */}
          <Card className="border-border/50 shadow-sm">
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

          {/* Old Sourdough */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('oldSourdough')}</CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><Input type="number" value={oldSourdoughInput} onChange={(e) => { setOldSourdoughInput(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n > 0) setOldSourdoughAmount(n); }} className="text-center text-lg font-medium" /><span className="text-muted-foreground font-medium">g</span></div></CardContent>
          </Card>

          {/* Feeding Ratio */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('feedingRatio')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {(['starter', 'flour', 'water'] as const).map((key, i) => (<div key={key} className="flex items-center gap-2">
                  {i > 0 && <span className="text-2xl text-muted-foreground font-light">:</span>}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{t(key)}</Label>
                    <Input type="number" step="0.1" value={ratioInputs[key]} onChange={(e) => { setRatioInputs({ ...ratioInputs, [key]: e.target.value }); const n = parseFloat(e.target.value); if (!isNaN(n) && n > 0) setFeedingRatio({ ...feedingRatio, [key]: n }); }} className="text-center" />
                  </div>
                </div>))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t('commonRatios')}</p>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Thermometer className="h-5 w-5 text-primary" />{t('ambientTemperature')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t('roomTemperature')}</span><span className="text-sm font-medium text-primary">{temperature}°C</span></div>
              <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={15} max={35} step={0.5} className="py-2" />
            </CardContent>
          </Card>

          {/* Target Window */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-display"><Clock className="h-5 w-5 text-primary" />{t('targetPeakWindow')}</CardTitle><Switch checked={settings.useTargetWindow} onCheckedChange={(v) => updateSettings({ useTargetWindow: v })} /></div>
              <CardDescription>{t('targetWindowDesc')}</CardDescription>
            </CardHeader>
            {settings.useTargetWindow && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('startTime')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={settings.targetStartDate}
                      min={getTodayString()}
                      onChange={(e) => shiftTargetWindowFromStart(e.target.value, settings.targetStartTime)}
                    />
                    <Input
                      type="time"
                      value={settings.targetStartTime}
                      onChange={(e) => shiftTargetWindowFromStart(settings.targetStartDate, e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('from')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={settings.targetPeakStartDate} min={settings.targetStartDate || getTodayString()} onChange={(e) => updateSettings({ targetPeakStartDate: e.target.value })} />
                    <Input type="time" value={settings.targetPeakStartTime} onChange={(e) => updateSettings({ targetPeakStartTime: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('to')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={settings.targetPeakEndDate} min={settings.targetPeakStartDate || getTodayString()} onChange={(e) => updateSettings({ targetPeakEndDate: e.target.value })} />
                    <Input type="time" value={settings.targetPeakEndTime} onChange={(e) => updateSettings({ targetPeakEndTime: e.target.value })} />
                  </div>
                </div>
                {!isValidTimeWindow && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('invalidTimeWindow')}
                  </p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Sweet Sourdough */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-display"><Cookie className="h-5 w-5 text-primary" />{t('sweetSourdough')}</CardTitle><Switch checked={isSweetMode} onCheckedChange={setIsSweetMode} /></div>
            </CardHeader>
            {isSweetMode && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">{t('sugarAmount')}</span><span className="text-sm font-medium text-primary">{sugarPercentage}%</span></div>
                  <Slider value={[sugarPercentage]} onValueChange={([v]) => setSugarPercentage(v)} min={1} max={10} step={1} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Keep Screen On */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg font-display"><Smartphone className="h-5 w-5 text-primary" />{t('keepScreenOn')}</CardTitle><Switch checked={wakeLockActive} onCheckedChange={toggleWakeLock} disabled={!wakeLockSupported} /></div>
              <CardDescription>{t('keepScreenOnDesc')}</CardDescription>
            </CardHeader>
          </Card>

          <Button onClick={() => setShowResults(true)} className="w-full h-12 text-lg font-medium" size="lg" disabled={totalPercentage !== 100 || (settings.useTargetWindow && !isValidTimeWindow)}>{t('calculateSchedule')}</Button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {showResults ? (
            <>
              <Card className="border-2 border-primary/20 bg-card shadow-lg overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/50"><h3 className="font-display text-xl font-semibold text-foreground">{t('yourFeedingSchedule')}</h3></div>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center p-6 rounded-xl bg-secondary/50 border border-border/50"><p className="text-sm text-muted-foreground mb-1">{t('feedStarterAt')}</p><p className="text-3xl font-display font-bold text-primary">{formatDateTime(result.feedingTime, language)}</p></div>
                  <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20"><p className="text-sm text-muted-foreground mb-1">{t('estimatedPeak')}</p><p className="text-3xl font-display font-bold text-primary">{formatDateTime(result.estimatedPeakTime, language)}</p></div>
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
                  {isSweetMode && <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-lg font-bold text-foreground">{result.sugarAmount}g</p><p className="text-xs text-muted-foreground mt-1">{t('powderedSugar')}</p></div>}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/30"><span className="text-muted-foreground">{t('timeToPeak')}</span><span className="font-medium">{result.hoursToReachPeak.toFixed(1)} {t('hours')}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30"><span className="text-muted-foreground">{t('totalSourdough')}</span><span className="font-medium text-primary text-lg">{result.totalSourdoughAmount}g</span></div>
                  </div>
                </CardContent>
              </Card>

              {result.recommendedRatio && (
                <Card className="border-primary/30 bg-primary/5 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Scale className="h-5 w-5 text-primary" />{t('recommendedRatio')}</CardTitle><CardDescription>{t('recommendedRatioDesc')}</CardDescription></CardHeader>
                  <CardContent><div className="flex items-center justify-center gap-2 text-2xl font-bold"><span>{result.recommendedRatio.starter}</span><span className="text-muted-foreground">:</span><span className="text-primary">{result.recommendedRatio.flour}</span><span className="text-muted-foreground">:</span><span>{result.recommendedRatio.water}</span></div></CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Timer className="h-5 w-5 text-primary" />{t('fermentationTimeline')}</CardTitle></CardHeader>
                <CardContent><div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" /><div className="space-y-4">{result.fermentationPhases.map((phase, i) => (<div key={i} className="relative pl-10"><div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-background ${i === 2 ? 'bg-accent' : i === 1 ? 'bg-primary' : 'bg-muted-foreground'}`} /><div className={`p-3 rounded-lg ${i === 2 ? 'bg-accent/20 text-accent' : i === 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}><div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{t(phase.nameKey as any)}</span><span className="text-xs">{formatTime(phase.startTime)} — {formatTime(phase.endTime)}</span></div><p className="text-xs opacity-80">{t(phase.descriptionKey as any)}</p></div></div>))}</div></div></CardContent>
              </Card>

              {settings.useTargetWindow && (
                <Card className={`border-2 ${result.isWithinTargetWindow ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                  <CardContent className="pt-6"><div className="flex items-start gap-3">{result.isWithinTargetWindow ? <CheckCircle className="h-6 w-6 text-green-500 shrink-0" /> : <AlertCircle className="h-6 w-6 text-yellow-500 shrink-0" />}<div><Badge variant="outline" className={result.isWithinTargetWindow ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}>{result.isWithinTargetWindow ? t('perfectTiming') : t('timingAdjustmentNeeded')}</Badge><p className="text-sm text-muted-foreground mt-2">{result.isWithinTargetWindow ? t('starterWillPeak') : t('peakOutsideWindow')}</p></div></div></CardContent>
                </Card>
              )}

              {result.suggestions.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg font-display"><Lightbulb className="h-5 w-5 text-primary" />{t('tips')}</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{result.suggestions.map((key, i) => (<li key={i} className="flex gap-2 text-sm text-muted-foreground"><span className="text-primary">•</span>{t(key as any)}</li>))}</ul></CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Clock className="h-8 w-8 text-primary/60" /></div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">{t('readyToCalculate')}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{t('configureSettings')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
