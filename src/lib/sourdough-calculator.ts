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

function calculateFermentationTime(input: CalculationInput): number {
  const { flourBlend, feedingRatio, temperature, isSweetMode, sugarPercentage, isAlwaysOn } = input;
  const { avgProtein, avgFermentationModifier, avgBaseProtein } = calculateBlendedValues(flourBlend);
  
  // Always on mode means starter is kept at peak, so very short time to peak
  if (isAlwaysOn) {
    return 1;
  }
  
  // Temperature factor (Q10 rule)
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(0.5, tempDiff / 10);
  
  // Ratio factor
  const ratioFactor = (feedingRatio.flour / feedingRatio.starter);
  
  // Protein factor
  const proteinFactor = 1 + (avgProtein - avgBaseProtein) * 0.03;
  
  // Sugar slows down fermentation
  const sugarFactor = isSweetMode ? 1 + (sugarPercentage * 0.02) : 1;
  
  const fermentationHours = BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    ratioFactor * 
    proteinFactor *
    sugarFactor;
  
  return Math.max(1, Math.min(36, fermentationHours));
}

export function calculateFeedingSchedule(input: CalculationInput): CalculationResult {
  const fermentationHours = calculateFermentationTime(input);
  const { avgProtein, avgFermentationModifier } = calculateBlendedValues(input.flourBlend);
  
  let feedingTime: Date;
  let estimatedPeakTime: Date;
  
  if (input.useTargetWindow && input.targetPeakStart && input.targetPeakEnd) {
    // If using target window, calculate feeding time to hit the window
    const targetMidpoint = new Date(
      (input.targetPeakStart.getTime() + input.targetPeakEnd.getTime()) / 2
    );
    feedingTime = new Date(targetMidpoint.getTime() - fermentationHours * 60 * 60 * 1000);
    estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
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
  
  if (input.useTargetWindow && !isWithinTargetWindow && input.targetPeakStart) {
    if (estimatedPeakTime < input.targetPeakStart) {
      suggestions.push('feedLaterOrHigherRatio');
      suggestions.push('lowerTempToExtend');
    } else {
      suggestions.push('feedEarlierOrLowerRatio');
      suggestions.push('increaseTempToSpeed');
    }
  }
  
  if (input.temperature < 20) {
    suggestions.push('coolerSlowerFlavourful');
  } else if (input.temperature > 28) {
    suggestions.push('warmerFasterLessComplex');
  }
  
  if (input.isSweetMode) {
    suggestions.push('sweetSlowerFermentation');
  }
  
  // Calculate amounts based on old sourdough amount
  const oldStarterAmount = input.oldSourdoughAmount;
  const totalParts = input.feedingRatio.starter + input.feedingRatio.flour + input.feedingRatio.water;
  const starterPart = input.feedingRatio.starter / totalParts;
  
  // If old sourdough = 50g and ratio is 1:1:1, then we add 50g flour and 50g water
  const flourAmount = Math.round((oldStarterAmount / input.feedingRatio.starter) * input.feedingRatio.flour);
  const waterAmount = Math.round((oldStarterAmount / input.feedingRatio.starter) * input.feedingRatio.water);
  const sugarAmount = input.isSweetMode ? Math.round(flourAmount * (input.sugarPercentage / 100)) : 0;
  const totalSourdoughAmount = oldStarterAmount + flourAmount + waterAmount + sugarAmount;
  
  // Calculate flour breakdown
  const flourBreakdown: FlourBreakdownItem[] = input.flourBlend.map(item => ({
    flourType: item.flourType,
    percentage: item.percentage,
    amountGrams: Math.round((flourAmount * item.percentage) / 100),
    proteinContent: item.proteinContent,
  }));
  
  return {
    feedingTime,
    estimatedPeakTime,
    peakWindowStart,
    peakWindowEnd,
    hoursToReachPeak: fermentationHours,
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
