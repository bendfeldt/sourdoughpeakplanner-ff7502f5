import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Scale } from 'lucide-react';
import type { FeedingRatio } from '@/types/sourdough';
import { useI18n } from '@/lib/i18n';
import { parseDecimalInput, ratioFromGrams } from '@/lib/sourdough-calculator';

interface FeedingRatioInputProps {
  feedingRatio: FeedingRatio;
  ratioInputs: { starter: string; flour: string; water: string };
  oldSourdoughAmount: number;
  onRatioChange: (ratio: FeedingRatio, inputs: { starter: string; flour: string; water: string }) => void;
  onOldSourdoughChange?: (amount: number, input: string) => void;
  // Weights mode: type grams of starter, flour and water instead of ratio parts
  showGrams?: boolean;
}

export function FeedingRatioInput({
  feedingRatio,
  ratioInputs,
  oldSourdoughAmount,
  onRatioChange,
  onOldSourdoughChange,
  showGrams = false,
}: FeedingRatioInputProps) {
  const { t } = useI18n();
  const [gramInputs, setGramInputs] = useState<{ starter: string; flour: string; water: string }>({
    starter: oldSourdoughAmount.toString(),
    flour: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.flour).toString(),
    water: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.water).toString(),
  });

  // Calculate gram amounts based on ratio and old sourdough amount
  const gramAmounts = {
    starter: oldSourdoughAmount,
    flour: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.flour),
    water: Math.round((oldSourdoughAmount / feedingRatio.starter) * feedingRatio.water),
  };

  const handleInputChange = (key: 'starter' | 'flour' | 'water', value: string) => {
    // Allow empty for easier input
    const newInputs = { ...ratioInputs, [key]: value };
    
    if (value === '' || value.endsWith('.') || value.endsWith(',')) {
      onRatioChange(feedingRatio, newInputs);
      return;
    }
    
    const parsed = parseDecimalInput(value);
    if (!isNaN(parsed) && parsed > 0) {
      onRatioChange({ ...feedingRatio, [key]: parsed }, newInputs);
    } else {
      onRatioChange(feedingRatio, newInputs);
    }
  };

  // Grams are applied while typing, so the ratio and the schedule follow at once.
  // The other two fields keep the grams typed in them; the ratio follows.
  const handleGramInputChange = (key: 'starter' | 'flour' | 'water', value: string) => {
    const next = { ...gramInputs, [key]: value };
    setGramInputs(next);
    if (value.endsWith('.') || value.endsWith(',')) return;
    const grams = parseDecimalInput(value);
    if (isNaN(grams) || grams <= 0) return;

    const typed = (k: 'starter' | 'flour' | 'water') => {
      const g = parseDecimalInput(next[k]);
      return isNaN(g) || g <= 0 ? gramAmounts[k] : g;
    };
    const ratio = ratioFromGrams(typed('starter'), typed('flour'), typed('water'), feedingRatio.starter);
    if (key === 'starter') onOldSourdoughChange?.(grams, value);
    onRatioChange(ratio, { ...ratioInputs, flour: ratio.flour.toFixed(2), water: ratio.water.toFixed(2) });
  };

  // An empty or 0 entry goes back to the amount in use
  const handleGramBlur = (key: 'starter' | 'flour' | 'water') => {
    const grams = parseDecimalInput(gramInputs[key]);
    if (isNaN(grams) || grams <= 0) setGramInputs(prev => ({ ...prev, [key]: gramAmounts[key].toString() }));
  };

  // Format ratio for display (round to 2 decimals when in grams view)
  const formatRatioValue = (value: number): string => {
    if (showGrams) {
      return (Math.round(value * 100) / 100).toFixed(2);
    }
    return value.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {(['starter', 'flour', 'water'] as const).map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            {i > 0 && <span className="text-2xl text-muted-foreground font-light">:</span>}
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">{t(key)}</Label>
              {showGrams ? (
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={gramInputs[key]}
                    onChange={(e) => handleGramInputChange(key, e.target.value)}
                    onBlur={() => handleGramBlur(key)}
                    className="text-center pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
                </div>
              ) : (
                <Input
                  type="text"
                  inputMode="decimal"
                  value={ratioInputs[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="text-center"
                  placeholder=""
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
            {t('ratio')}: {formatRatioValue(feedingRatio.starter)}:{formatRatioValue(feedingRatio.flour)}:{formatRatioValue(feedingRatio.water)}
          </span>
        ) : (
          <span>
            {gramAmounts.starter}g : {gramAmounts.flour}g : {gramAmounts.water}g
          </span>
        )}
      </div>

      {!showGrams && <p className="text-xs text-muted-foreground">{t('commonRatios')}</p>}
    </div>
  );
}
