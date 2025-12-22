export type FlourType = 
  | 'all-purpose'
  | 'bread-flour'
  | 'whole-wheat'
  | 'rye'
  | 'spelt'
  | 'oland-wheat'
  | 'danish-wheat'
  | 'oat-flour'
  | 'fuldkornsmel'
  | 'manitoba';

export interface FlourInfo {
  name: string;
  baseProtein: number;
  fermentationModifier: number;
  description: string;
}

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
    fermentationModifier: 1.1,
    description: 'High protein, excellent gluten structure',
  },
  'whole-wheat': {
    name: 'Whole Wheat',
    baseProtein: 13.5,
    fermentationModifier: 0.8,
    description: 'Faster fermentation due to bran enzymes',
  },
  'rye': {
    name: 'Rye',
    baseProtein: 9,
    fermentationModifier: 0.7,
    description: 'Very active fermentation, different gluten',
  },
  'spelt': {
    name: 'Spelt',
    baseProtein: 12,
    fermentationModifier: 0.85,
    description: 'Ancient grain, slightly faster fermentation',
  },
  'oland-wheat': {
    name: 'Øland Wheat',
    baseProtein: 11.5,
    fermentationModifier: 0.95,
    description: 'Danish heritage wheat, excellent flavour',
  },
  'danish-wheat': {
    name: 'Danish Wheat',
    baseProtein: 11,
    fermentationModifier: 1.0,
    description: 'Traditional Danish flour, type XX',
  },
  'oat-flour': {
    name: 'Oat Flour',
    baseProtein: 12,
    fermentationModifier: 0.9,
    description: 'Adds moisture and softness',
  },
  'fuldkornsmel': {
    name: 'Fuldkornsmel',
    baseProtein: 12.5,
    fermentationModifier: 0.75,
    description: 'Full grain Danish flour, robust flavour',
  },
  'manitoba': {
    name: 'Manitoba',
    baseProtein: 14.5,
    fermentationModifier: 1.2,
    description: 'Very high protein Canadian wheat',
  },
};

export interface FlourBlendItem {
  id: string;
  flourType: FlourType;
  percentage: number;
  proteinContent: number;
}

export interface FeedingRatio {
  starter: number;
  flour: number;
  water: number;
}

export interface CalculationInput {
  flourBlend: FlourBlendItem[];
  feedingRatio: FeedingRatio;
  temperature: number;
  targetPeakStart: Date | null;
  targetPeakEnd: Date | null;
  useTargetWindow: boolean;
  oldSourdoughAmount: number;
  isSweetMode: boolean;
  sugarPercentage: number;
  isAlwaysOn: boolean;
}

export interface FermentationPhase {
  name: string;
  nameKey: string;
  startTime: Date;
  endTime: Date;
  description: string;
  descriptionKey: string;
}

export interface FlourBreakdownItem {
  flourType: FlourType;
  percentage: number;
  amountGrams: number;
  proteinContent: number;
}

export interface CalculationResult {
  feedingTime: Date;
  estimatedPeakTime: Date;
  peakWindowStart: Date;
  peakWindowEnd: Date;
  hoursToReachPeak: number;
  isWithinTargetWindow: boolean;
  suggestions: string[];
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  sugarAmount: number;
  totalSourdoughAmount: number;
  blendedProtein: number;
  blendedFermentationModifier: number;
  flourBreakdown: FlourBreakdownItem[];
  fermentationPhases: FermentationPhase[];
  recommendedRatio: FeedingRatio | null;
}

const BASE_FERMENTATION_HOURS = 6;

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

function calculateFermentationTime(input: CalculationInput, customRatio?: FeedingRatio): number {
  const { flourBlend, feedingRatio, temperature, isSweetMode, sugarPercentage, isAlwaysOn } = input;
  const ratio = customRatio || feedingRatio;
  const { avgProtein, avgFermentationModifier, avgBaseProtein } = calculateBlendedValues(flourBlend);
  
  // Always on mode means starter is kept at peak, so very short time to peak
  if (isAlwaysOn) {
    return 1;
  }
  
  // Q10 rule for fermentation kinetics
  // Yeast and LAB double their metabolic rate for every 10°C increase
  // Reference temperature: 24°C (optimal for sourdough fermentation)
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(0.5, tempDiff / 10);
  
  // Ratio factor - higher flour ratio means more food, longer fermentation
  // Based on first-order kinetics where substrate (flour) affects rate
  const ratioFactor = (ratio.flour / ratio.starter);
  
  // Protein factor - higher protein slows fermentation slightly
  // Gluten development competes with microbial activity
  const proteinFactor = 1 + (avgProtein - avgBaseProtein) * 0.03;
  
  // Sugar inhibition via osmotic pressure (Monod kinetics modified)
  // Sucrose reduces water activity (aw), inhibiting yeast at high concentrations
  // Ki (inhibition constant) approximated - 50% inhibition at ~25% sugar
  const sugarFactor = isSweetMode 
    ? 1 / (1 - (sugarPercentage / 100) * 0.8) // Osmotic pressure effect
    : 1;
  
  const fermentationHours = BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    ratioFactor * 
    proteinFactor *
    sugarFactor;
  
  return Math.max(1, Math.min(48, fermentationHours));
}

// Calculate required feeding ratio for a target fermentation time
function calculateRequiredRatio(input: CalculationInput, targetHours: number): FeedingRatio {
  const { flourBlend, feedingRatio, temperature, isSweetMode, sugarPercentage, isAlwaysOn } = input;
  const { avgProtein, avgFermentationModifier, avgBaseProtein } = calculateBlendedValues(flourBlend);
  
  if (isAlwaysOn) {
    return { starter: 1, flour: 1, water: 1 };
  }
  
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(0.5, tempDiff / 10);
  const proteinFactor = 1 + (avgProtein - avgBaseProtein) * 0.03;
  const sugarFactor = isSweetMode 
    ? 1 / (1 - (sugarPercentage / 100) * 0.8)
    : 1;
  
  // Solve for ratio factor
  const requiredRatioFactor = targetHours / (
    BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    proteinFactor * 
    sugarFactor
  );
  
  // Clamp to reasonable ratios
  const clampedRatio = Math.max(0.5, Math.min(10, requiredRatioFactor));
  
  // Keep water ratio proportional to flour
  const waterRatio = clampedRatio * (feedingRatio.water / feedingRatio.flour);
  
  return {
    starter: 1,
    flour: Math.round(clampedRatio * 10) / 10,
    water: Math.round(waterRatio * 10) / 10,
  };
}

function generateFermentationPhases(feedingTime: Date, peakTime: Date): FermentationPhase[] {
  const totalHours = (peakTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);
  
  // Lag phase: ~10-15% of total time
  const lagEnd = new Date(feedingTime.getTime() + totalHours * 0.12 * 60 * 60 * 1000);
  
  // Rise phase: 15% to 70%
  const riseEnd = new Date(feedingTime.getTime() + totalHours * 0.7 * 60 * 60 * 1000);
  
  // Peak phase: 70% to 100%
  const peakEnd = new Date(peakTime.getTime() + totalHours * 0.15 * 60 * 60 * 1000);
  
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
      endTime: peakEnd,
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
  
  if (input.useTargetWindow && input.targetPeakStart && input.targetPeakEnd) {
    // Calculate the target midpoint
    const targetMidpoint = new Date(
      (input.targetPeakStart.getTime() + input.targetPeakEnd.getTime()) / 2
    );
    
    // Calculate required fermentation hours to reach target from NOW
    const now = new Date();
    const hoursUntilTarget = (targetMidpoint.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilTarget > 0) {
      // Feed now, adjust ratio to hit target
      feedingTime = now;
      recommendedRatio = calculateRequiredRatio(input, hoursUntilTarget);
      
      // Recalculate with recommended ratio
      const adjustedHours = calculateFermentationTime(input, recommendedRatio);
      estimatedPeakTime = new Date(feedingTime.getTime() + adjustedHours * 60 * 60 * 1000);
    } else {
      // Target is in the past, use current ratio
      feedingTime = new Date(targetMidpoint.getTime() - fermentationHours * 60 * 60 * 1000);
      estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
    }
  } else {
    // No target window - use current time as feeding time
    feedingTime = new Date();
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
  
  // If old sourdough = 50g and ratio is 1:1:1, then we add 50g flour and 50g water
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
