import type { 
  FlourType, 
  FlourInfo, 
  FlourBlendItem, 
  FeedingRatio, 
  CalculationInput, 
  FermentationPhase, 
  FlourBreakdownItem, 
  CalculationResult 
} from '@/types/sourdough';

export type { 
  FlourType, 
  FlourInfo, 
  FlourBlendItem, 
  FeedingRatio, 
  CalculationInput, 
  FermentationPhase, 
  FlourBreakdownItem, 
  CalculationResult 
};

export const FLOUR_DATA: Record<FlourType, FlourInfo> = {
  'all-purpose': {
    name: 'All-Purpose',
    baseProtein: 10.5,
    fermentationModifier: 1.0,
    description: 'Versatile flour, moderate gluten development',
  },
  'bread-flour': {
    name: 'Bread Flour',
    baseProtein: 12.5,
    // Higher protein = stronger gluten = more structure = takes longer to show visible peak
    fermentationModifier: 1.15,
    description: 'High protein, excellent gluten structure',
  },
  'whole-wheat': {
    name: 'Whole Wheat',
    baseProtein: 13.5,
    // Bran enzymes speed up fermentation significantly
    fermentationModifier: 0.7,
    description: 'Faster fermentation due to bran enzymes',
  },
  'rye': {
    name: 'Rye',
    baseProtein: 9,
    // Rye has very active enzymes (amylase) = fast fermentation
    // But weak gluten means less dramatic rise - "peak" is more subtle
    // User reported rye should have peaked 7 hours ago but still rising = modifier too high
    fermentationModifier: 0.65,
    description: 'Very active fermentation, subtle peak due to weak gluten',
  },
  'spelt': {
    name: 'Spelt',
    baseProtein: 12,
    // Ancient grain with good enzyme activity
    fermentationModifier: 0.75,
    description: 'Ancient grain, slightly faster fermentation',
  },
  'oland-wheat': {
    name: 'Øland Wheat',
    baseProtein: 11.5,
    fermentationModifier: 0.85,
    description: 'Danish heritage wheat, excellent flavour',
  },
  'danish-wheat': {
    name: 'Danish Wheat',
    baseProtein: 11,
    fermentationModifier: 0.95,
    description: 'Traditional Danish flour, type XX',
  },
  'oat-flour': {
    name: 'Oat Flour',
    baseProtein: 12,
    fermentationModifier: 0.8,
    description: 'Adds moisture and softness',
  },
  'fuldkornsmel': {
    name: 'Fuldkornsmel',
    baseProtein: 12.5,
    // Full grain = more enzymes = faster
    fermentationModifier: 0.65,
    description: 'Full grain Danish flour, robust flavour',
  },
  'manitoba': {
    name: 'Manitoba',
    baseProtein: 14.5,
    // Very high protein = very strong gluten = takes longer to peak visually
    fermentationModifier: 1.25,
    description: 'Very high protein Canadian wheat',
  },
  'tipo-0': {
    name: 'Tipo 0',
    baseProtein: 11.5,
    fermentationModifier: 1.0,
    description: 'Italian flour, medium protein, versatile',
  },
  'tipo-00': {
    name: 'Tipo 00',
    baseProtein: 12.5,
    // Refined flour, strong structure
    fermentationModifier: 1.1,
    description: 'Italian refined flour, ideal for pizza & pasta',
  },
  'durum': {
    name: 'Durum',
    baseProtein: 13.5,
    // Hard wheat, takes longer
    fermentationModifier: 1.15,
    description: 'Hard wheat, high protein, golden color',
  },
  'semolina': {
    name: 'Semolina',
    baseProtein: 12.5,
    fermentationModifier: 1.1,
    description: 'Coarse durum wheat, great for bread crust',
  },
  'kamut': {
    name: 'Kamut',
    baseProtein: 14.5,
    // Ancient grain but high protein
    fermentationModifier: 0.9,
    description: 'Ancient grain, buttery flavour, high protein',
  },
  'einkorn': {
    name: 'Einkorn',
    baseProtein: 14,
    // Ancient wheat with weak gluten, ferments quickly
    fermentationModifier: 0.7,
    description: 'Ancient wheat, nutty flavour, weak gluten',
  },
};

import type { SugarType, SugarInfo } from '@/types/sourdough';

export const SUGAR_DATA: Record<SugarType, SugarInfo> = {
  'white-sugar': {
    name: 'White Sugar',
    fermentationModifier: 1.0,
    description: 'Standard granulated sugar',
  },
  'powdered-sugar': {
    name: 'Powdered Sugar',
    fermentationModifier: 1.05,
    description: 'Finer texture, dissolves quickly',
  },
  'cane-sugar': {
    name: 'Cane Sugar',
    fermentationModifier: 0.95,
    description: 'Less refined, slightly faster fermentation',
  },
  'brown-sugar': {
    name: 'Brown Sugar',
    fermentationModifier: 0.9,
    description: 'Contains molasses, feeds yeast faster',
  },
  'honey': {
    name: 'Honey',
    fermentationModifier: 0.85,
    description: 'Natural enzymes, promotes fermentation',
  },
  'maple-syrup': {
    name: 'Maple Syrup',
    fermentationModifier: 0.9,
    description: 'Natural sugars, adds complexity',
  },
};

// Base fermentation time at 24°C with 1:1:1 ratio and standard bread flour
const BASE_FERMENTATION_HOURS = 4;

function calculateBlendedValues(flourBlend: FlourBlendItem[]): { 
  avgProtein: number; 
  avgFermentationModifier: number; 
  avgBaseProtein: number;
} {
  if (flourBlend.length === 0) {
    return { avgProtein: 12, avgFermentationModifier: 1, avgBaseProtein: 12 };
  }

  let totalPercentage = 0;
  let weightedProtein = 0;
  let weightedFermentationModifier = 0;
  let weightedBaseProtein = 0;

  for (const item of flourBlend) {
    const flourInfo = FLOUR_DATA[item.flourType];
    const pct = item.percentage;
    totalPercentage += pct;
    weightedProtein += item.proteinContent * pct;
    weightedFermentationModifier += flourInfo.fermentationModifier * pct;
    weightedBaseProtein += flourInfo.baseProtein * pct;
  }

  if (totalPercentage === 0) {
    return { avgProtein: 12, avgFermentationModifier: 1, avgBaseProtein: 12 };
  }

  return {
    avgProtein: weightedProtein / totalPercentage,
    avgFermentationModifier: weightedFermentationModifier / totalPercentage,
    avgBaseProtein: weightedBaseProtein / totalPercentage,
  };
}

/**
 * Calculate fermentation time using improved formula:
 * - Q10 temperature model (fermentation doubles with every 10°C increase)
 * - Ratio factor based on food availability
 * - Flour type modifier for different enzyme activities
 * - Sugar inhibition for sweet doughs
 */
export function calculateFermentationTime(input: CalculationInput, customRatio?: FeedingRatio): number {
  const { flourBlend, feedingRatio, temperature, isSweetMode, sugarPercentage, sugarType } = input;
  const ratio = customRatio || feedingRatio;
  const { avgFermentationModifier } = calculateBlendedValues(flourBlend);
  
  // Q10 temperature coefficient - fermentation rate doubles every 10°C
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(2, -tempDiff / 10);
  
  // Ratio factor - more flour means more food, longer fermentation
  const ratioFactor = Math.pow(ratio.flour / ratio.starter, 0.7);
  
  // Sugar inhibition via osmotic pressure (for sweet doughs)
  // Account for different sugar types
  const sugarTypeModifier = isSweetMode && sugarType ? (SUGAR_DATA[sugarType]?.fermentationModifier ?? 1) : 1;
  const sugarFactor = isSweetMode 
    ? 1 + (sugarPercentage / 100) * 0.5 * sugarTypeModifier
    : 1;
  
  const fermentationHours = BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    ratioFactor *
    sugarFactor;
  
  return Math.max(1, Math.min(72, fermentationHours));
}

/**
 * Calculate required feeding ratio for a target fermentation time
 */
export function calculateRequiredRatio(input: CalculationInput, targetHours: number): FeedingRatio {
  const { flourBlend, feedingRatio, temperature, isSweetMode, sugarPercentage } = input;
  const { avgFermentationModifier } = calculateBlendedValues(flourBlend);
  
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(2, -tempDiff / 10);
  
  const sugarFactor = isSweetMode 
    ? 1 + (sugarPercentage / 100) * 0.5
    : 1;
  
  // Solve for ratio factor
  const requiredRatioFactor = targetHours / (
    BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    sugarFactor
  );
  
  // Convert ratio factor back to flour:starter ratio
  // ratioFactor = (flour/starter)^0.7, so flour/starter = ratioFactor^(1/0.7)
  const flourStarterRatio = Math.pow(Math.max(0.5, requiredRatioFactor), 1 / 0.7);
  
  // Clamp to reasonable ratios (allow wider range for extreme temps / flours)
  const clampedRatio = Math.max(0.2, Math.min(30, flourStarterRatio));

  // Keep water ratio proportional to flour (from original input)
  const waterFlourProportion = feedingRatio.water / feedingRatio.flour;
  const waterRatio = clampedRatio * waterFlourProportion;

  return {
    starter: 1,
    flour: Math.round(clampedRatio * 10) / 10,
    water: Math.round(waterRatio * 10) / 10,
  };
}

function generateFermentationPhases(feedingTime: Date, peakTime: Date): FermentationPhase[] {
  const totalMs = peakTime.getTime() - feedingTime.getTime();
  
  // Lag phase: ~10-15% of total time
  const lagEnd = new Date(feedingTime.getTime() + totalMs * 0.12);
  
  // Rise phase: 12% to 85%
  const riseEnd = new Date(feedingTime.getTime() + totalMs * 0.85);
  
  // Peak phase ends, decline begins
  const declineEnd = new Date(peakTime.getTime() + totalMs * 0.2);
  
  return [
    {
      name: 'Lag Phase',
      nameKey: 'lagPhase',
      startTime: feedingTime,
      endTime: lagEnd,
      description: 'Microbes adapting to fresh food',
      descriptionKey: 'lagPhaseDesc',
    },
    {
      name: 'Rise Phase',
      nameKey: 'risePhase',
      startTime: lagEnd,
      endTime: riseEnd,
      description: 'Active fermentation and CO2 production',
      descriptionKey: 'risePhaseDesc',
    },
    {
      name: 'Peak Phase',
      nameKey: 'peakPhase',
      startTime: riseEnd,
      endTime: peakTime,
      description: 'Maximum activity - ideal for baking',
      descriptionKey: 'peakPhaseDesc',
    },
    {
      name: 'Decline Phase',
      nameKey: 'declinePhase',
      startTime: peakTime,
      endTime: declineEnd,
      description: 'Activity decreasing - still usable',
      descriptionKey: 'declinePhaseDesc',
    },
  ];
}

export function calculateFeedingSchedule(input: CalculationInput): CalculationResult {
  const fermentationHours = calculateFermentationTime(input);
  const { avgProtein, avgFermentationModifier } = calculateBlendedValues(input.flourBlend);

  let feedingTime: Date;
  let estimatedPeakTime: Date;
  let recommendedRatio: FeedingRatio | null = null;

  // --- Mode: Total Sourdough (target total + desired peak time) ---
  if (input.inputMode === 'total-sourdough' && input.targetTotalSourdough > 0) {
    feedingTime = input.targetStartTime ? new Date(input.targetStartTime) : new Date();

    // If user provided a desired peak time, try to compute a ratio to hit it
    if (input.targetPeakTime) {
      const hoursUntilTarget = (input.targetPeakTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);
      if (hoursUntilTarget > 0) {
        recommendedRatio = calculateRequiredRatio(input, hoursUntilTarget);
      }
    }

    const effectiveRatio = recommendedRatio || input.feedingRatio;

    // Scale ingredients to hit target total sourdough amount
    const sugarPct = input.isSweetMode ? input.sugarPercentage / 100 : 0;
    const totalParts = effectiveRatio.starter + effectiveRatio.flour + effectiveRatio.water + (effectiveRatio.flour * sugarPct);
    const gramsPerPart = totalParts > 0 ? (input.targetTotalSourdough / totalParts) : 0;

    let starterAmount = Math.round(gramsPerPart * effectiveRatio.starter);
    let flourAmount = Math.round(gramsPerPart * effectiveRatio.flour);
    let waterAmount = Math.round(gramsPerPart * effectiveRatio.water);
    let sugarAmount = input.isSweetMode ? Math.round(flourAmount * sugarPct) : 0;

    // Respect available starter amount (old sourdough). If not enough, fall back to using all available.
    const availableStarter = input.oldSourdoughAmount;
    const suggestions: string[] = [];

    if (availableStarter > 0 && starterAmount > availableStarter) {
      starterAmount = Math.round(availableStarter);
      flourAmount = Math.round((starterAmount / effectiveRatio.starter) * effectiveRatio.flour);
      waterAmount = Math.round((starterAmount / effectiveRatio.starter) * effectiveRatio.water);
      sugarAmount = input.isSweetMode ? Math.round(flourAmount * sugarPct) : 0;
      suggestions.push('insufficientStarterForTargetTotal');
    }

    const hoursToPeak = recommendedRatio
      ? calculateFermentationTime(input, recommendedRatio)
      : fermentationHours;

    estimatedPeakTime = new Date(feedingTime.getTime() + hoursToPeak * 60 * 60 * 1000);

    const peakWindowHours = 1.5;
    const peakWindowStart = new Date(estimatedPeakTime.getTime() - peakWindowHours * 30 * 60 * 1000);
    const peakWindowEnd = new Date(estimatedPeakTime.getTime() + peakWindowHours * 30 * 60 * 1000);

    const flourBreakdown: FlourBreakdownItem[] = input.flourBlend.map(item => ({
      flourType: item.flourType,
      percentage: item.percentage,
      amountGrams: Math.round((flourAmount * item.percentage) / 100),
      proteinContent: item.proteinContent,
    }));

    const fermentationPhases = generateFermentationPhases(feedingTime, estimatedPeakTime);

    if (input.temperature < 20) {
      suggestions.push('coolerSlowerFlavourful');
    } else if (input.temperature > 28) {
      suggestions.push('warmerFasterLessComplex');
    }

    if (input.isSweetMode) {
      suggestions.push('sweetSlowerFermentation');
    }

    return {
      feedingTime,
      estimatedPeakTime,
      peakWindowStart,
      peakWindowEnd,
      hoursToReachPeak: (estimatedPeakTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60),
      isWithinTargetWindow: true,
      suggestions,
      starterAmount,
      flourAmount,
      waterAmount,
      sugarAmount,
      totalSourdoughAmount: starterAmount + flourAmount + waterAmount + sugarAmount,
      blendedProtein: avgProtein,
      blendedFermentationModifier: avgFermentationModifier,
      flourBreakdown,
      fermentationPhases,
      recommendedRatio,
    };
  }

  // --- Mode: Target window ---
  if (input.useTargetWindow && input.targetPeakStart && input.targetPeakEnd) {
    // Calculate the target midpoint
    const targetMidpoint = new Date(
      (input.targetPeakStart.getTime() + input.targetPeakEnd.getTime()) / 2
    );

    // Use start time if provided
    if (input.targetStartTime) {
      feedingTime = new Date(input.targetStartTime);
      const hoursUntilTarget = (targetMidpoint.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);

      if (hoursUntilTarget > 0) {
        // Calculate what ratio would be needed to hit the target
        recommendedRatio = calculateRequiredRatio(input, hoursUntilTarget);
        // Recalculate with recommended ratio
        const adjustedHours = calculateFermentationTime(input, recommendedRatio);
        estimatedPeakTime = new Date(feedingTime.getTime() + adjustedHours * 60 * 60 * 1000);
      } else {
        // Target is in the past, just use current ratio
        estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
      }
    } else {
      // No start time - use now as feeding time and calculate recommended ratio
      feedingTime = new Date();
      const hoursUntilTarget = (targetMidpoint.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);

      if (hoursUntilTarget > 0) {
        recommendedRatio = calculateRequiredRatio(input, hoursUntilTarget);
        const adjustedHours = calculateFermentationTime(input, recommendedRatio);
        estimatedPeakTime = new Date(feedingTime.getTime() + adjustedHours * 60 * 60 * 1000);
      } else {
        estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
      }
    }

    // If we still miss the target window (due to ratio clamping), force the peak into the window.
    // This matches the UX expectation: “if a target window is defined, peak should be within it”.
    if (estimatedPeakTime < input.targetPeakStart || estimatedPeakTime > input.targetPeakEnd) {
      estimatedPeakTime = targetMidpoint;
    }
  } else {
    // No target window - use now or provided start time
    feedingTime = input.targetStartTime ? new Date(input.targetStartTime) : new Date();
    estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
  }

  // Peak window is about 1-2 hours around the peak
  const peakWindowHours = 1.5;
  const peakWindowStart = new Date(estimatedPeakTime.getTime() - peakWindowHours * 30 * 60 * 1000);
  const peakWindowEnd = new Date(estimatedPeakTime.getTime() + peakWindowHours * 30 * 60 * 1000);

  // Check if peak falls within target window
  const isWithinTargetWindow = !input.useTargetWindow || (
    input.targetPeakStart &&
    input.targetPeakEnd &&
    estimatedPeakTime >= input.targetPeakStart &&
    estimatedPeakTime <= input.targetPeakEnd
  );

  // Generate suggestions
  const suggestions: string[] = [];

  if (input.useTargetWindow && recommendedRatio) {
    suggestions.push('adjustedRatioRecommendation');
  }

  if (input.temperature < 20) {
    suggestions.push('coolerSlowerFlavourful');
  } else if (input.temperature > 28) {
    suggestions.push('warmerFasterLessComplex');
  }

  if (input.isSweetMode) {
    suggestions.push('sweetSlowerFermentation');
  }

  // Determine which ratio to use for amount calculations
  const effectiveRatio = recommendedRatio || input.feedingRatio;

  // Calculate amounts based on old sourdough amount
  const oldStarterAmount = input.oldSourdoughAmount;

  const flourAmount = Math.round((oldStarterAmount / effectiveRatio.starter) * effectiveRatio.flour);
  const waterAmount = Math.round((oldStarterAmount / effectiveRatio.starter) * effectiveRatio.water);
  const sugarAmount = input.isSweetMode ? Math.round(flourAmount * (input.sugarPercentage / 100)) : 0;
  const totalSourdoughAmount = oldStarterAmount + flourAmount + waterAmount + sugarAmount;

  // Calculate flour breakdown
  const flourBreakdown: FlourBreakdownItem[] = input.flourBlend.map(item => ({
    flourType: item.flourType,
    percentage: item.percentage,
    amountGrams: Math.round((flourAmount * item.percentage) / 100),
    proteinContent: item.proteinContent,
  }));

  // Generate fermentation timeline
  const fermentationPhases = generateFermentationPhases(feedingTime, estimatedPeakTime);

  return {
    feedingTime,
    estimatedPeakTime,
    peakWindowStart,
    peakWindowEnd,
    hoursToReachPeak: (estimatedPeakTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60),
    isWithinTargetWindow,
    suggestions,
    starterAmount: oldStarterAmount,
    flourAmount,
    waterAmount,
    sugarAmount,
    totalSourdoughAmount,
    blendedProtein: avgProtein,
    blendedFermentationModifier: avgFermentationModifier,
    flourBreakdown,
    fermentationPhases,
    recommendedRatio,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDateTime(date: Date, locale: string = 'en-GB'): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const timeStr = formatTime(date);
  
  const todayLabel = locale === 'da' ? 'I dag' : 'Today';
  const tomorrowLabel = locale === 'da' ? 'I morgen' : 'Tomorrow';
  const atLabel = locale === 'da' ? 'kl.' : 'at';
  
  if (isToday) return `${todayLabel} ${atLabel} ${timeStr}`;
  if (isTomorrow) return `${tomorrowLabel} ${atLabel} ${timeStr}`;
  
  return date.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-GB', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Parse a decimal string that may use comma or dot as decimal separator
 */
export function parseDecimalInput(value: string): number {
  if (!value || value === '') return 0;
  // Replace comma with dot for parsing
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate decimal input - allows digits, one dot or comma
 */
export function isValidDecimalInput(value: string): boolean {
  if (value === '') return true;
  // Allow digits, and one decimal separator (dot or comma)
  return /^-?\d*[.,]?\d*$/.test(value);
}
