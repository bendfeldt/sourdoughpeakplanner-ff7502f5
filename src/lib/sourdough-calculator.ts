export type FlourType = 
  | 'all-purpose'
  | 'bread-flour'
  | 'whole-wheat'
  | 'rye'
  | 'spelt';

export interface FlourInfo {
  name: string;
  baseProtein: number;
  fermentationModifier: number; // multiplier for fermentation time
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
};

export interface FlourBlendItem {
  id: string;
  flourType: FlourType;
  percentage: number; // percentage of total flour (0-100)
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
  temperature: number; // Celsius
  targetPeakStart: Date;
  targetPeakEnd: Date;
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
  blendedProtein: number;
  blendedFermentationModifier: number;
}

// Base fermentation time at 24°C for 1:1:1 ratio
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
  const { flourBlend, feedingRatio, temperature } = input;
  const { avgProtein, avgFermentationModifier, avgBaseProtein } = calculateBlendedValues(flourBlend);
  
  // Temperature factor (Q10 rule: fermentation doubles every 10°C increase)
  // Reference temperature: 24°C
  const tempDiff = temperature - 24;
  const temperatureFactor = Math.pow(0.5, tempDiff / 10);
  
  // Ratio factor - higher flour:starter ratio = longer fermentation
  const ratioFactor = (feedingRatio.flour / feedingRatio.starter);
  
  // Protein factor - higher protein slightly slows fermentation
  const proteinFactor = 1 + (avgProtein - avgBaseProtein) * 0.03;
  
  // Calculate total fermentation time
  const fermentationHours = BASE_FERMENTATION_HOURS * 
    avgFermentationModifier * 
    temperatureFactor * 
    ratioFactor * 
    proteinFactor;
  
  return Math.max(2, Math.min(24, fermentationHours)); // Clamp between 2-24 hours
}

export function calculateFeedingSchedule(input: CalculationInput): CalculationResult {
  const fermentationHours = calculateFermentationTime(input);
  const { avgProtein, avgFermentationModifier } = calculateBlendedValues(input.flourBlend);
  
  // Calculate when to feed to hit the target window
  const targetMidpoint = new Date(
    (input.targetPeakStart.getTime() + input.targetPeakEnd.getTime()) / 2
  );
  
  const feedingTime = new Date(targetMidpoint.getTime() - fermentationHours * 60 * 60 * 1000);
  const estimatedPeakTime = new Date(feedingTime.getTime() + fermentationHours * 60 * 60 * 1000);
  
  // Peak window is about 1-2 hours around the peak
  const peakWindowHours = 1.5;
  const peakWindowStart = new Date(estimatedPeakTime.getTime() - peakWindowHours * 30 * 60 * 1000);
  const peakWindowEnd = new Date(estimatedPeakTime.getTime() + peakWindowHours * 30 * 60 * 1000);
  
  // Check if peak falls within target window
  const isWithinTargetWindow = 
    estimatedPeakTime >= input.targetPeakStart && 
    estimatedPeakTime <= input.targetPeakEnd;
  
  // Generate suggestions
  const suggestions: string[] = [];
  
  if (!isWithinTargetWindow) {
    if (estimatedPeakTime < input.targetPeakStart) {
      suggestions.push('Consider feeding later or using a higher flour ratio to slow fermentation');
      suggestions.push('You could also lower the temperature to extend fermentation time');
    } else {
      suggestions.push('Consider feeding earlier or using a lower flour ratio to speed up fermentation');
      suggestions.push('Increasing ambient temperature will also speed things up');
    }
  }
  
  if (input.temperature < 20) {
    suggestions.push('Cooler temperatures will result in slower but more flavourful fermentation');
  } else if (input.temperature > 28) {
    suggestions.push('Warmer temperatures may lead to faster but less complex flavour development');
  }
  
  // Calculate actual amounts in grams (100g total)
  const totalParts = input.feedingRatio.starter + input.feedingRatio.flour + input.feedingRatio.water;
  const multiplier = 100 / totalParts;
  
  return {
    feedingTime,
    estimatedPeakTime,
    peakWindowStart,
    peakWindowEnd,
    hoursToReachPeak: fermentationHours,
    isWithinTargetWindow,
    suggestions,
    starterAmount: Math.round(input.feedingRatio.starter * multiplier),
    flourAmount: Math.round(input.feedingRatio.flour * multiplier),
    waterAmount: Math.round(input.feedingRatio.water * multiplier),
    blendedProtein: avgProtein,
    blendedFermentationModifier: avgFermentationModifier,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDateTime(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const timeStr = formatTime(date);
  
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  
  return date.toLocaleDateString('en-GB', { 
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
