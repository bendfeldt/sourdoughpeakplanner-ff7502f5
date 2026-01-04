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
  | 'manitoba'
  | 'tipo-0'
  | 'tipo-00'
  | 'durum'
  | 'semolina'
  | 'kamut'
  | 'einkorn';

export type SugarType = 
  | 'white-sugar'
  | 'powdered-sugar'
  | 'cane-sugar'
  | 'brown-sugar'
  | 'honey'
  | 'maple-syrup';

export interface SugarInfo {
  name: string;
  fermentationModifier: number;
  description: string;
}

export type InputMode = 'basic' | 'target-window' | 'total-sourdough';

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

export interface PersonaTimeSettings {
  inputMode: InputMode;
  targetStartDate: string;
  targetStartTime: string;
  targetPeakStartDate: string;
  targetPeakStartTime: string;
  targetPeakEndDate: string;
  targetPeakEndTime: string;
  targetPeakDate: string;
  targetPeakTime: string;
  targetTotalSourdough: number;
  targetTotalSourdoughInput: string;
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
  sugarType: SugarType;
  timeSettings: PersonaTimeSettings;
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
  sugarType: SugarType;
  inputMode: InputMode;
  targetTotalSourdough: number;
  targetPeakTime: Date | null;
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
  // Warning if target time is not achievable
  achievabilityWarning: string | null;
  minAchievableHours: number;
  maxAchievableHours: number;
}
