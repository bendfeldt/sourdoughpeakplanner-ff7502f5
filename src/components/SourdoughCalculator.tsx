import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Thermometer, Wheat, Scale, CheckCircle, AlertCircle, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { 
  FlourType, 
  FLOUR_DATA, 
  calculateFeedingSchedule, 
  formatDateTime,
  generateId,
  type FeedingRatio,
  type FlourBlendItem 
} from '@/lib/sourdough-calculator';

export function SourdoughCalculator() {
  const [flourBlend, setFlourBlend] = useState<FlourBlendItem[]>([
    { id: generateId(), flourType: 'bread-flour', percentage: 100, proteinContent: FLOUR_DATA['bread-flour'].baseProtein }
  ]);
  const [feedingRatio, setFeedingRatio] = useState<FeedingRatio>({ starter: 1, flour: 1, water: 1 });
  const [temperature, setTemperature] = useState(24);
  const [targetPeakStart, setTargetPeakStart] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    d.setMinutes(0);
    return d;
  });
  const [targetPeakEnd, setTargetPeakEnd] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 10);
    d.setMinutes(0);
    return d;
  });
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
    });
  }, [flourBlend, feedingRatio, temperature, targetPeakStart, targetPeakEnd]);

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
      // If flour type changed, update protein to default for that flour
      if (updates.flourType && !updates.proteinContent) {
        updated.proteinContent = FLOUR_DATA[updates.flourType].baseProtein;
      }
      return updated;
    }));
  };

  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const handleTimeChange = (timeStr: string, setter: (d: Date) => void) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date();
    newDate.setHours(hours, minutes, 0, 0);
    if (newDate < new Date()) {
      newDate.setDate(newDate.getDate() + 1);
    }
    setter(newDate);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Sourdough Peak Calculator
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Calculate the perfect feeding time for your sourdough starter to peak exactly when you need it.
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
                  Flour Blend
                </CardTitle>
                <Badge 
                  variant={totalPercentage === 100 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {totalPercentage}%
                </Badge>
              </div>
              <CardDescription>Add multiple flours with their percentages and protein levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flourBlend.map((flour, index) => (
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
                        {Object.entries(FLOUR_DATA).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.name}
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
                    {FLOUR_DATA[flour.flourType].description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={flour.percentage}
                        onChange={(e) => updateFlour(flour.id, { percentage: Number(e.target.value) || 0 })}
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Protein (%)</Label>
                      <Input
                        type="number"
                        min={6}
                        max={18}
                        step={0.1}
                        value={flour.proteinContent}
                        onChange={(e) => updateFlour(flour.id, { proteinContent: Number(e.target.value) || 10 })}
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
                Add Flour
              </Button>

              {totalPercentage !== 100 && (
                <p className="text-xs text-destructive">
                  Flour percentages should total 100% (currently {totalPercentage}%)
                </p>
              )}

              {flourBlend.length > 1 && (
                <div className="pt-2 border-t border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Blended protein</span>
                    <span className="font-medium text-primary">{result.blendedProtein.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feeding Ratio */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Scale className="h-5 w-5 text-primary" />
                Feeding Ratio
              </CardTitle>
              <CardDescription>Starter : Flour : Water (in grams)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Starter</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={feedingRatio.starter}
                    onChange={(e) => setFeedingRatio({ ...feedingRatio, starter: Number(e.target.value) || 1 })}
                    className="text-center"
                  />
                </div>
                <span className="text-2xl text-muted-foreground font-light mt-5">:</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Flour</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={feedingRatio.flour}
                    onChange={(e) => setFeedingRatio({ ...feedingRatio, flour: Number(e.target.value) || 1 })}
                    className="text-center"
                  />
                </div>
                <span className="text-2xl text-muted-foreground font-light mt-5">:</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Water</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={feedingRatio.water}
                    onChange={(e) => setFeedingRatio({ ...feedingRatio, water: Number(e.target.value) || 1 })}
                    className="text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Common ratios: 1:1:1 (quick), 1:2:2 (moderate), 1:5:5 (slow)
              </p>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Thermometer className="h-5 w-5 text-primary" />
                Ambient Temperature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Room temperature</span>
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
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Clock className="h-5 w-5 text-primary" />
                Target Peak Window
              </CardTitle>
              <CardDescription>When do you need your starter to be at peak?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(targetPeakStart)}
                    onChange={(e) => handleTimeChange(e.target.value, setTargetPeakStart)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(targetPeakEnd)}
                    onChange={(e) => handleTimeChange(e.target.value, setTargetPeakEnd)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => setShowResults(true)} 
            className="w-full h-12 text-lg font-medium"
            size="lg"
            disabled={totalPercentage !== 100}
          >
            Calculate Feeding Schedule
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
                    Your Feeding Schedule
                  </h3>
                </div>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center p-6 rounded-xl bg-secondary/50 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1">Feed your starter at</p>
                    <p className="text-3xl font-display font-bold text-primary">
                      {formatDateTime(result.feedingTime)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.starterAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Starter</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.flourAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Flour</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">{result.waterAmount}g</p>
                      <p className="text-xs text-muted-foreground mt-1">Water</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Time to peak</span>
                      <span className="font-medium">{result.hoursToReachPeak.toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Estimated peak</span>
                      <span className="font-medium">{formatDateTime(result.estimatedPeakTime)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Peak window</span>
                      <span className="font-medium text-sm">
                        {formatDateTime(result.peakWindowStart)} — {formatDateTime(result.peakWindowEnd)}
                      </span>
                    </div>
                    {flourBlend.length > 1 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Blended protein</span>
                        <span className="font-medium">{result.blendedProtein.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status Badge */}
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
                        {result.isWithinTargetWindow ? 'Perfect timing!' : 'Timing adjustment needed'}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {result.isWithinTargetWindow 
                          ? 'Your starter will peak within your target window.' 
                          : 'The estimated peak time falls outside your target window.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {suggestion}
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
                  Ready to Calculate
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Configure your starter settings on the left and click calculate to see your optimal feeding schedule.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
