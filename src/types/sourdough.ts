import type { TranslationKey } from '@/lib/i18n';

export type FlourType = 
  | 'all-purpose'
  | 'bread-flour'
  | 'whole-wheat'
  | 'rye'
  | 'spelt'
  | 'spelt-whole'
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
  | 'kamut-whole'
  | 'einkorn'
  | 'einkorn-whole';

export type SugarType = 
  | 'white-sugar'
  | 'powdered-sugar'
  | 'cane-sugar'
  | 'brown-sugar'
  | 'honey'
  | 'maple-syrup';

export interface SugarInfo {
  // Share of the sweetener's weight that is sugar, and that is water
  sugarFraction: number;
  waterFraction: number;
}

// 'target-window' was replaced by 'weights'; migratePersonas() moves old starters over
export type InputMode = 'basic' | 'weights' | 'total-sourdough';

export interface FlourInfo {
  baseProtein: number;
  fermentationModifier: number;
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
  oldSourdoughAmount: number;
  isSweetMode: boolean;
  sugarPercentage: number;
  sugarType: SugarType;
  inputMode: InputMode;
  targetTotalSourdough: number;
  targetPeakTime: Date | null;
  // Learned per-starter multiplier from feeding history (1 = no correction).
  calibrationFactor?: number;
}

export interface FermentationPhase {
  nameKey: TranslationKey;
  startTime: Date;
  endTime: Date;
  descriptionKey: TranslationKey;
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
  hoursToReachPeak: number;
  // The model says these conditions won't produce a normal peak within 48 h
  exceedsMaxHours: boolean;
  suggestions: TranslationKey[];
  starterAmount: number;
  flourAmount: number;
  waterAmount: number;
  sugarAmount: number;
  // Extra minutes the sugar adds compared with the same feed without it
  sugarDelayMinutes: number;
  totalSourdoughAmount: number;
  flourBreakdown: FlourBreakdownItem[];
  fermentationPhases: FermentationPhase[];
  recommendedRatio: FeedingRatio | null;
  // Warning if target time is not achievable
  achievabilityWarning: TranslationKey | null;
  minAchievableHours: number;
  maxAchievableHours: number;
}
