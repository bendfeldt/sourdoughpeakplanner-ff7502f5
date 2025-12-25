import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scale, ToggleLeft, ToggleRight } from 'lucide-react';
import type { FeedingRatio } from '@/types/sourdough';
import { useI18n } from '@/lib/i18n';

interface FeedingRatioInputProps {
  feedingRatio: FeedingRatio;
  ratioInputs: { starter: string; flour: string; water: string };
  oldSourdoughAmount: number;
  onRatioChange: (ratio: FeedingRatio, inputs: { starter: string; flour: string; water: string }) => void;
}

export function FeedingRatioInput({
  feedingRatio,
  ratioInputs,
  oldSourdoughAmount,
  onRatioChange,
}: FeedingRatioInputProps) {
  const { t } = useI18n();
  const [showGrams, setShowGrams] = useState(false);

  // Calculate gram amounts based on ratio and old sourdough amount
  const gramAmounts = {
    starter: oldSourdoughAmount,
    flour: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.flour),
    water: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.water),
  };

  const handleInputChange = (key: 'starter' | 'flour' | 'water', value: string) => {
    const newInputs = { ...ratioInputs, [key]: value };
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      onRatioChange({ ...feedingRatio, [key]: parsed }, newInputs);
    } else {
      onRatioChange(feedingRatio, newInputs);
    }
  };

  const handleGramChange = (key: 'starter' | 'flour' | 'water', gramValue: string) => {
    const grams = parseFloat(gramValue);
    if (isNaN(grams) || grams <= 0) return;

    // Convert grams back to ratio (using starter as base)
    if (key === 'starter') {
      // Changing starter amount changes the base, recalculate ratios
      const newStarterRatio = 1;
      const newFlourRatio = gramAmounts.flour / grams;
      const newWaterRatio = gramAmounts.water / grams;
      onRatioChange(
        { starter: newStarterRatio, flour: newFlourRatio, water: newWaterRatio },
        { starter: newStarterRatio.toString(), flour: newFlourRatio.toFixed(1), water: newWaterRatio.toFixed(1) }
      );
    } else {
      // Adjust the ratio for this component
      const ratioValue = grams / oldSourdoughAmount;
      onRatioChange(
        { ...feedingRatio, [key]: ratioValue },
        { ...ratioInputs, [key]: ratioValue.toFixed(1) }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGrams(!showGrams)}
          className="h-7 px-2 text-xs gap-1"
        >
          {showGrams ? (
            <>
              <ToggleRight className="h-4 w-4 text-primary" />
              <span>{t('showingGrams') || 'Grams'}</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4" />
              <span>{t('showingRatio') || 'Ratio'}</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {(['starter', 'flour', 'water'] as const).map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            {i > 0 && <span className="text-2xl text-muted-foreground font-light">:</span>}
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">{t(key)}</Label>
              {showGrams ? (
                <div className="relative">
                  <Input
                    type="number"
                    value={gramAmounts[key]}
                    onChange={(e) => handleGramChange(key, e.target.value)}
                    className="text-center pr-6"
                    disabled={key === 'starter'}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
                </div>
              ) : (
                <Input
                  type="number"
                  step="0.1"
                  value={ratioInputs[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="text-center"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show alternative values */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        <Scale className="h-3 w-3" />
        {showGrams ? (
          <span>
            {t('ratio') || 'Ratio'}: {feedingRatio.starter}:{feedingRatio.flour}:{feedingRatio.water}
          </span>
        ) : (
          <span>
            {gramAmounts.starter}g : {gramAmounts.flour}g : {gramAmounts.water}g
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t('commonRatios')}</p>
    </div>
  );
}
