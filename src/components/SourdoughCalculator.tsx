import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Thermometer, Wheat, Scale, CheckCircle, AlertCircle, Lightbulb, Plus, Trash2, Globe, Cookie, Zap, Beaker } from 'lucide-react';
import { 
  FlourType, 
  FLOUR_DATA, 
  calculateFeedingSchedule, 
  formatDateTime,
  generateId,
  type FeedingRatio,
  type FlourBlendItem 
} from '@/lib/sourdough-calculator';
import { useI18n, Language } from '@/lib/i18n';

export function SourdoughCalculator() {
  const { t, language, setLanguage } = useI18n();
  
  const [flourBlend, setFlourBlend] = useState<FlourBlendItem[]>([
    { id: generateId(), flourType: 'bread-flour', percentage: 100, proteinContent: FLOUR_DATA['bread-flour'].baseProtein }
  ]);
  const [feedingRatio, setFeedingRatio] = useState<FeedingRatio>({ starter: 1, flour: 1, water: 1 });
  const [ratioInputs, setRatioInputs] = useState({ starter: '1', flour: '1', water: '1' });
  const [temperature, setTemperature] = useState(24);
  const [useTargetWindow, setUseTargetWindow] = useState(false);
  const [targetPeakStart, setTargetPeakStart] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    d.setMinutes(0);
    return d;
  });
  const [targetPeakEnd, setTargetPeakEnd] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 10);
    d.setMinutes(0);
    return d;
  });
  const [oldSourdoughAmount, setOldSourdoughAmount] = useState(50);
  const [isSweetMode, setIsSweetMode] = useState(false);
  const [sugarPercentage, setSugarPercentage] = useState(10);
  const [isAlwaysOn, setIsAlwaysOn] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const totalPercentage = useMemo(() => {
    return flourBlend.reduce((sum, item) => sum + item.percentage, 0);
  }, [flourBlend]);

  const result = useMemo(() => {
    return calculateFeedingSchedule({
      flourBlend,
      feedingRatio,
      temperature,
      targetPeakStart,
      targetPeakEnd,
      useTargetWindow,
      oldSourdoughAmount,
      isSweetMode,
      sugarPercentage,
      isAlwaysOn,
    });
  }, [flourBlend, feedingRatio, temperature, targetPeakStart, targetPeakEnd, useTargetWindow, oldSourdoughAmount, isSweetMode, sugarPercentage, isAlwaysOn]);

  const addFlour = () => {
    setFlourBlend([
      ...flourBlend,
      { id: generateId(), flourType: 'all-purpose', percentage: 0, proteinContent: FLOUR_DATA['all-purpose'].baseProtein }
    ]);
  };

  const removeFlour = (id: string) => {
    if (flourBlend.length > 1) {
      setFlourBlend(flourBlend.filter(f => f.id !== id));
    }
  };

  const updateFlour = (id: string, updates: Partial<FlourBlendItem>) => {
    setFlourBlend(flourBlend.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, ...updates };
      if (updates.flourType && !updates.proteinContent) {
        updated.proteinContent = FLOUR_DATA[updates.flourType].baseProtein;
      }
      return updated;
    }));
  };

  const formatTimeForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toTimeString().slice(0, 5);
  };

  const handleTimeChange = (timeStr: string, setter: (d: Date | null) => void) => {
    if (!timeStr) {
      setter(null);
      return;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date();
    newDate.setHours(hours, minutes, 0, 0);
    if (newDate < new Date()) {
      newDate.setDate(newDate.getDate() + 1);
    }
    setter(newDate);
  };

  const getFlourName = (flourType: FlourType): string => {
    return t(flourType as any) || FLOUR_DATA[flourType].name;
  };

  const getFlourDescription = (flourType: FlourType): string => {
    return t(`${flourType}-desc` as any) || FLOUR_DATA[flourType].description;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Language Selector */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('english')}</SelectItem>
              <SelectItem value="da">{t('danish')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Flour Blend */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Wheat className="h-5 w-5 text-primary" />
                  {t('flourBlend')}
                </CardTitle>
                <Badge 
                  variant={totalPercentage === 100 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {totalPercentage}%
                </Badge>
              </div>
              <CardDescription>{t('flourBlendDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flourBlend.map((flour) => (
                <div key={flour.id} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Select 
                      value={flour.flourType} 
                      onValueChange={(v) => updateFlour(flour.id, { flourType: v as FlourType })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(FLOUR_DATA).map((key) => (
                          <SelectItem key={key} value={key}>
                            {getFlourName(key as FlourType)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {flourBlend.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFlour(flour.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {getFlourDescription(flour.flourType)}
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">{t('percentage')}</Label>
                        <span className="text-xs font-medium">{flour.percentage}%</span>
                      </div>
                      <Slider
                        value={[flour.percentage]}
                        onValueChange={([v]) => updateFlour(flour.id, { percentage: v })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('protein')} (%)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={flour.proteinContent}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-') {
                            updateFlour(flour.id, { proteinContent: 0 });
                            return;
                          }
                          const num = parseFloat(val);
                          if (!isNaN(num)) {
                            updateFlour(flour.id, { proteinContent: num });
                          }
                        }}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addFlour}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addFlour')}
              </Button>

              {totalPercentage !== 100 && (
                <p className="text-xs text-destructive">
                  {t('flourPercentageWarning')} ({totalPercentage}%)
                </p>
              )}

              {flourBlend.length > 1 && (
                <div className="pt-2 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('blendedProtein')}</span>
                    <span className="font-medium text-primary">{result.blendedProtein.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Old Sourdough Amount */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Beaker className="h-5 w-5 text-primary" />
                {t('oldSourdough')}
              </CardTitle>
              <CardDescription>{t('oldSourdoughDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('grams')}</span>
                <span className="text-sm font-medium text-primary">{oldSourdoughAmount}g</span>
              </div>
              <Slider
                value={[oldSourdoughAmount]}
                onValueChange={([v]) => setOldSourdoughAmount(v)}
                min={10}
                max={200}
                step={5}
                className="py-2"
              />
            </CardContent>
          </Card>

          {/* Feeding Ratio */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Scale className="h-5 w-5 text-primary" />
                {t('feedingRatio')}
              </CardTitle>
              <CardDescription>{t('feedingRatioDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t('starter')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ratioInputs.starter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioInputs({ ...ratioInputs, starter: val });
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 0) {
                        setFeedingRatio({ ...feedingRatio, starter: num });
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(ratioInputs.starter);
                      if (isNaN(num) || num <= 0) {
                        setRatioInputs({ ...ratioInputs, starter: String(feedingRatio.starter) });
                      }
                    }}
                    className="text-center"
                  />
                </div>
                <span className="text-2xl text-muted-foreground font-light mt-5">:</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t('flour')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ratioInputs.flour}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioInputs({ ...ratioInputs, flour: val });
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 0) {
                        setFeedingRatio({ ...feedingRatio, flour: num });
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(ratioInputs.flour);
                      if (isNaN(num) || num <= 0) {
                        setRatioInputs({ ...ratioInputs, flour: String(feedingRatio.flour) });
                      }
                    }}
                    className="text-center"
                  />
                </div>
                <span className="text-2xl text-muted-foreground font-light mt-5">:</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{t('water')}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ratioInputs.water}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioInputs({ ...ratioInputs, water: val });
                      const num = parseFloat(val);
                      if (!isNaN(num) && num > 0) {
                        setFeedingRatio({ ...feedingRatio, water: num });
                      }
                    }}
                    onBlur={() => {
                      const num = parseFloat(ratioInputs.water);
                      if (isNaN(num) || num <= 0) {
                        setRatioInputs({ ...ratioInputs, water: String(feedingRatio.water) });
                      }
                    }}
                    className="text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {t('commonRatios')}
              </p>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Thermometer className="h-5 w-5 text-primary" />
                {t('ambientTemperature')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('roomTemperature')}</span>
                <span className="text-sm font-medium text-primary">{temperature}°C</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
                min={15}
                max={35}
                step={1}
                className="py-2"
              />
            </CardContent>
          </Card>

          {/* Target Peak Window */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('targetPeakWindow')}
                </CardTitle>
                <Switch
                  checked={useTargetWindow}
                  onCheckedChange={setUseTargetWindow}
                />
              </div>
              <CardDescription>{t('targetWindowDesc')}</CardDescription>
            </CardHeader>
            {useTargetWindow && (
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('from')}</Label>
                    <Input
                      type="time"
                      value={formatTimeForInput(targetPeakStart)}
                      onChange={(e) => handleTimeChange(e.target.value, setTargetPeakStart)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('to')}</Label>
                    <Input
                      type="time"
                      value={formatTimeForInput(targetPeakEnd)}
                      onChange={(e) => handleTimeChange(e.target.value, setTargetPeakEnd)}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Sweet Sourdough */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Cookie className="h-5 w-5 text-primary" />
                  {t('sweetSourdough')}
                </CardTitle>
                <Switch
                  checked={isSweetMode}
                  onCheckedChange={setIsSweetMode}
                />
              </div>
              <CardDescription>{t('sweetSourdoughDesc')}</CardDescription>
            </CardHeader>
            {isSweetMode && (
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('sugarAmount')}</span>
                  <span className="text-sm font-medium text-primary">{sugarPercentage}%</span>
                </div>
                <Slider
                  value={[sugarPercentage]}
                  onValueChange={([v]) => setSugarPercentage(v)}
                  min={5}
                  max={30}
                  step={1}
                  className="py-2"
                />
              </CardContent>
            )}
          </Card>

          {/* Always On */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('alwaysOn')}
                </CardTitle>
                <Switch
                  checked={isAlwaysOn}
                  onCheckedChange={setIsAlwaysOn}
                />
              </div>
              <CardDescription>{t('alwaysOnDesc')}</CardDescription>
            </CardHeader>
          </Card>

          <Button 
            onClick={() => setShowResults(true)} 
            className="w-full h-12 text-lg font-medium"
            size="lg"
            disabled={totalPercentage !== 100}
          >
            {t('calculateSchedule')}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {showResults ? (
            <>
              {/* Main Result Card */}
              <Card className="border-2 border-primary/20 bg-card shadow-lg overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {t('yourFeedingSchedule')}
                  </h3>
                </div>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center p-6 rounded-xl bg-secondary/50 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">{t('feedStarterAt')}</p>
                    <p className="text-3xl font-display font-bold text-primary">
                      {formatDateTime(result.feedingTime, language)}
                    </p>
                  </div>

                  <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">{t('estimatedPeak')}</p>
                    <p className="text-3xl font-display font-bold text-primary">
                      {formatDateTime(result.estimatedPeakTime, language)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.starterAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('starter')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.flourAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('flour')}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.waterAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('water')}</p>
                    </div>
                  </div>

                  {isSweetMode && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">{result.sugarAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('powderedSugar')}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">{t('timeToPeak')}</span>
                      <span className="font-medium">{result.hoursToReachPeak.toFixed(1)} {t('hours')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">{t('peakWindow')}</span>
                      <span className="font-medium text-sm">
                        {formatDateTime(result.peakWindowStart, language)} — {formatDateTime(result.peakWindowEnd, language)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">{t('totalSourdough')}</span>
                      <span className="font-medium text-primary text-lg">{result.totalSourdoughAmount}g</span>
                    </div>
                    {flourBlend.length > 1 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">{t('blendedProtein')}</span>
                        <span className="font-medium">{result.blendedProtein.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Flour Breakdown */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-display">
                    <Wheat className="h-5 w-5 text-primary" />
                    {t('flourBreakdown')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.flourBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                        <div>
                          <span className="font-medium">{getFlourName(item.flourType)}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.proteinContent}% {t('protein')})</span>
                        </div>
                        <span className="font-bold text-primary">{item.amountGrams}g</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Badge */}
              {useTargetWindow && (
                <Card className={`border-2 ${result.isWithinTargetWindow ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {result.isWithinTargetWindow ? (
                        <CheckCircle className="h-6 w-6 text-success shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-warning shrink-0 mt-0.5" />
                      )}
                      <div>
                        <Badge 
                          variant="outline" 
                          className={result.isWithinTargetWindow ? 'border-success text-success' : 'border-warning text-warning'}
                        >
                          {result.isWithinTargetWindow ? t('perfectTiming') : t('timingAdjustmentNeeded')}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          {result.isWithinTargetWindow 
                            ? t('starterWillPeak')
                            : t('peakOutsideWindow')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      {t('tips')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestionKey, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {t(suggestionKey as any)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed border-2 border-border/50 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="font-display text-lg font-medium text-foreground mb-2">
                  {t('readyToCalculate')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('configureSettings')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
