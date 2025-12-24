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

export interface SourdoughPersona {
  id: string;
  name: string;
  flourBlend: FlourBlendItem[];
  feedingRatio: FeedingRatio;
  ratioInputs: { starter: string; flour: string; water: string };
  temperature: number;
  oldSourdoughAmount: number;
  oldSourdoughInput: string;
  isSweetMode: boolean;
  sugarPercentage: number;
  createdAt: number;
  updatedAt: number;
}

export interface CalculationInput {
  flourBlend: FlourBlendItem[];
  feedingRatio: FeedingRatio;
  temperature: number;
  targetStartTime: Date | null;
  targetPeakStart: Date | null;
  targetPeakEnd: Date | null;
  useTargetWindow: boolean;
  oldSourdoughAmount: number;
  isSweetMode: boolean;
  sugarPercentage: number;
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
