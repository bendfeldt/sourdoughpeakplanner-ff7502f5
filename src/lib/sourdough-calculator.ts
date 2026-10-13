import type {
  FlourType,
  FlourInfo,
  FlourBlendItem,
  FeedingRatio,
  CalculationInput,
  FermentationPhase,
  FlourBreakdownItem,
  CalculationResult,
  SugarType,
  SugarInfo,
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

/**
 * FERMENTATION MODEL
 *
 * hours to peak = 3.5 h × flour × temperature × ratio × hydration × sugar × calibration
 *
 * 3.5 h is all-purpose flour, 1:1:1, 24°C, no sugar. Each factor is 1.0 at that reference.
 *
 * - Flour: how much of the whole grain the flour contains drives speed (bran minerals,
 *   enzymes, free sugars, microbes), not the grain's name or its protein.
 * - Temperature: extended Ratkowsky model. Fastest near 30–31°C (yeast grows best at
 *   27–28°C, the bacteria at 32–33°C, Gänzle et al. 1998); yeast stops around 35–36°C,
 *   so from ~37.5°C there is no normal peak.
 * - Ratio: (flour / starter)^0.6, an empirical fit to what bakers see from 1:1 to 1:10.
 * - Hydration: stiff starters are slower. The exponent is an estimate; no study measures it.
 * - Sugar: what stresses the microbes is sugar dissolved in the starter's water. Below 5%
 *   the yeast simply eats it. Above that, growth falls in a straight line as sugar rises
 *   (Narendranath & Power 2005), so the time to peak stretches more and more and growth
 *   stops near 55% sugar in the water (syrup strength). Threshold and limit are estimates;
 *   calibration from logged feeds corrects them.
 * - Calibration: a per-starter multiplier learned from logged feeds.
 *
 * Peak is the MIDPOINT of the plateau.
 */

// Ordered by how much of the whole grain each flour contains (estimates).
export const FLOUR_DATA: Record<FlourType, FlourInfo> = {
  'all-purpose': {
    name: 'All-Purpose',
    baseProtein: 10.5,
    fermentationModifier: 1.0,
    description: 'Refined wheat flour, the reference for timing',
  },
  'bread-flour': {
    name: 'Bread Flour',
    baseProtein: 12.5,
    fermentationModifier: 1.0,
    description: 'Refined, high protein, excellent gluten structure',
  },
  'whole-wheat': {
    name: 'Whole Wheat',
    baseProtein: 13.5,
    fermentationModifier: 0.65,
    description: 'Whole grain: bran minerals and enzymes speed fermentation',
  },
  'rye': {
    name: 'Rye',
    baseProtein: 9,
    fermentationModifier: 0.5,
    description: 'Very active fermentation; rises less visibly than wheat',
  },
  'spelt': {
    name: 'Spelt (white)',
    baseProtein: 12,
    fermentationModifier: 0.9,
    description: 'Sifted spelt, close to white wheat in speed',
  },
  'spelt-whole': {
    name: 'Whole Spelt',
    baseProtein: 13,
    fermentationModifier: 0.65,
    description: 'Whole grain spelt, fast fermentation',
  },
  'oland-wheat': {
    name: 'Øland Wheat',
    baseProtein: 11.5,
    fermentationModifier: 0.85,
    description: 'Danish heritage wheat, usually stone-ground with some bran',
  },
  'danish-wheat': {
    name: 'Danish Wheat',
    baseProtein: 11,
    fermentationModifier: 1.0,
    description: 'Traditional refined Danish wheat flour',
  },
  'oat-flour': {
    name: 'Oat Flour',
    baseProtein: 12,
    fermentationModifier: 0.8,
    description: 'Whole grain oats, no gluten, adds moisture',
  },
  'fuldkornsmel': {
    name: 'Fuldkornsmel',
    baseProtein: 12.5,
    fermentationModifier: 0.65,
    description: 'Danish whole grain wheat, fast fermentation',
  },
  'manitoba': {
    name: 'Manitoba',
    baseProtein: 14.5,
    fermentationModifier: 1.0,
    description: 'Refined, very high protein Canadian wheat',
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
    fermentationModifier: 1.05,
    description: 'Most refined Italian flour, least bran',
  },
  'durum': {
    name: 'Durum',
    baseProtein: 13.5,
    fermentationModifier: 1.0,
    description: 'Hard wheat, high protein, golden colour',
  },
  'semolina': {
    name: 'Semolina',
    baseProtein: 12.5,
    fermentationModifier: 1.0,
    description: 'Coarse durum wheat, great for bread crust',
  },
  'kamut': {
    name: 'Kamut (white)',
    baseProtein: 14.5,
    fermentationModifier: 0.95,
    description: 'Sifted khorasan wheat, buttery flavour',
  },
  'kamut-whole': {
    name: 'Whole Kamut',
    baseProtein: 15,
    fermentationModifier: 0.7,
    description: 'Whole grain khorasan wheat, fast fermentation',
  },
  'einkorn': {
    name: 'Einkorn (white)',
    baseProtein: 14,
    fermentationModifier: 0.9,
    description: 'Sifted einkorn, nutty flavour, weak gluten',
  },
  'einkorn-whole': {
    name: 'Whole Einkorn',
    baseProtein: 15,
    fermentationModifier: 0.65,
    description: 'Whole grain einkorn, fast fermentation, weak gluten',
  },
};

// What each sweetener is made of. Only the sugar slows the starter; the water is
// subtracted from the water you add so the starter keeps its hydration.
export const SUGAR_DATA: Record<SugarType, SugarInfo> = {
  'white-sugar': {
    name: 'White Sugar',
    sugarFraction: 1.0,
    waterFraction: 0,
    description: 'Pure sucrose',
  },
  'powdered-sugar': {
    name: 'Powdered Sugar',
    sugarFraction: 0.97,
    waterFraction: 0,
    description: 'Sucrose with about 3% starch',
  },
  'cane-sugar': {
    name: 'Cane Sugar',
    sugarFraction: 0.995,
    waterFraction: 0,
    description: 'Lightly refined sucrose',
  },
  'brown-sugar': {
    name: 'Brown Sugar',
    sugarFraction: 0.97,
    waterFraction: 0.02,
    description: 'Sucrose with a little molasses',
  },
  'honey': {
    name: 'Honey',
    sugarFraction: 0.82,
    waterFraction: 0.17,
    description: 'About 17% water, which is taken off the feeding water',
  },
  'maple-syrup': {
    name: 'Maple Syrup',
    sugarFraction: 0.67,
    waterFraction: 0.32,
    description: 'About 32% water, which is taken off the feeding water',
  },
};

const BASE_FERMENTATION_HOURS = 3.5;
const REFERENCE_TEMPERATURE = 24;

// Shortest prediction we trust, and the longest before we say "no normal peak".
const MIN_FERMENTATION_HOURS = 1.5;
export const MAX_FERMENTATION_HOURS = 48;

// Feeding ratios the solver may recommend (flour per part starter).
const MIN_FLOUR_PER_STARTER = 0.5;
const MAX_FLOUR_PER_STARTER = 15;

// Extended Ratkowsky: √rate = (T − Tmin)(1 − e^(c(T − Tmax))). Fitted to the published optima.
const T_MIN = 1;
const T_MAX = 38;
const T_C = 0.3;

const HYDRATION_EXPONENT = 0.25;

// Sugar dissolved in the starter's water below this causes no slowdown.
export const SUGAR_THRESHOLD = 0.05;
// Sugar in the water at which the starter stops growing.
const SUGAR_LIMIT = 0.55;

const CALIBRATION_MIN = 0.6;
const CALIBRATION_MAX = 1.6;

function temperatureRate(t: number): number {
  if (t <= T_MIN || t >= T_MAX) return 0;
  return ((t - T_MIN) * (1 - Math.exp(T_C * (t - T_MAX)))) ** 2;
}

/** Peak-time multiplier for a temperature, 1.0 at 24°C. Infinity when the starter won't peak. */
export function temperatureFactor(temperature: number): number {
  const rate = temperatureRate(temperature);
  return rate > 0 ? temperatureRate(REFERENCE_TEMPERATURE) / rate : Infinity;
}

/** Water per flour, by weight (1 = 100% hydration). */
function hydrationOf(ratio: FeedingRatio): number {
  return ratio.flour > 0 ? ratio.water / ratio.flour : 1;
}

export function hydrationFactor(hydration: number): number {
  return Math.pow(1 / Math.max(0.4, hydration), HYDRATION_EXPONENT);
}

/** Share of sugar in the starter's water phase (0–1). */
export function sugarConcentration(input: Pick<CalculationInput, 'isSweetMode' | 'sugarPercentage' | 'sugarType'>, hydration: number): number {
  if (!input.isSweetMode || input.sugarPercentage <= 0) return 0;
  const sugar = (input.sugarPercentage / 100) * (SUGAR_DATA[input.sugarType]?.sugarFraction ?? 1);
  return sugar / (Math.max(0.4, hydration) + sugar);
}

/** Peak-time multiplier for sugar; Infinity at or above the limit. */
export function sugarFactor(concentration: number): number {
  const slowdown = Math.max(0, concentration - SUGAR_THRESHOLD) / (SUGAR_LIMIT - SUGAR_THRESHOLD);
  return slowdown >= 1 ? Infinity : 1 / (1 - slowdown);
}

function blendedFermentationModifier(flourBlend: FlourBlendItem[]): number {
  let totalPercentage = 0;
  let weighted = 0;
  for (const item of flourBlend) {
    totalPercentage += item.percentage;
    weighted += FLOUR_DATA[item.flourType].fermentationModifier * item.percentage;
  }
  return totalPercentage > 0 ? weighted / totalPercentage : 1;
}

function clampCalibration(factor: number | undefined): number {
  return Math.max(CALIBRATION_MIN, Math.min(CALIBRATION_MAX, factor ?? 1));
}

/** Everything except the feeding ratio. Shared by the prediction and the ratio solver. */
function conditionsFactor(input: CalculationInput, hydration: number): number {
  return BASE_FERMENTATION_HOURS *
    blendedFermentationModifier(input.flourBlend) *
    temperatureFactor(input.temperature) *
    hydrationFactor(hydration) *
    sugarFactor(sugarConcentration(input, hydration)) *
    clampCalibration(input.calibrationFactor);
}

function ratioFactor(ratio: FeedingRatio): number {
  return Math.pow(Math.max(MIN_FLOUR_PER_STARTER, ratio.flour / ratio.starter), 0.6);
}

/** Unclamped hours to peak midpoint; Infinity when the starter won't peak. */
function rawFermentationHours(input: CalculationInput, ratio: FeedingRatio): number {
  return conditionsFactor(input, hydrationOf(ratio)) * ratioFactor(ratio);
}

export function calculateFermentationTime(input: CalculationInput, customRatio?: FeedingRatio): number {
  const hours = rawFermentationHours(input, customRatio || input.feedingRatio);
  return Math.max(MIN_FERMENTATION_HOURS, Math.min(MAX_FERMENTATION_HOURS, hours));
}

/** A feeding ratio with the given flour per starter, keeping the user's hydration. */
function ratioWithFlour(input: CalculationInput, flourPerStarter: number): FeedingRatio {
  return { starter: 1, flour: flourPerStarter, water: flourPerStarter * hydrationOf(input.feedingRatio) };
}

/**
 * Calculate the achievable range of fermentation times given the current conditions.
 */
export function calculateAchievableRange(input: CalculationInput): { minHours: number; maxHours: number } {
  return {
    minHours: calculateFermentationTime(input, ratioWithFlour(input, MIN_FLOUR_PER_STARTER)),
    maxHours: calculateFermentationTime(input, ratioWithFlour(input, MAX_FLOUR_PER_STARTER)),
  };
}

/**
 * Calculate required feeding ratio for a target fermentation time
 */
export function calculateRequiredRatio(input: CalculationInput, targetHours: number): FeedingRatio {
  const hydration = hydrationOf(input.feedingRatio);
  // targetHours = conditions × (flour/starter)^0.6
  const requiredRatioFactor = targetHours / conditionsFactor(input, hydration);
  const flourStarterRatio = Math.pow(Math.max(0.1, requiredRatioFactor), 1 / 0.6);
  const clampedRatio = Math.max(MIN_FLOUR_PER_STARTER, Math.min(MAX_FLOUR_PER_STARTER, flourStarterRatio));

  return {
    starter: 1,
    flour: Math.round(clampedRatio * 10) / 10,
    water: Math.round(clampedRatio * hydration * 10) / 10,
  };
}

/**
 * Check whether hitting the target means a ratio outside 1:0.5 – 1:15.
 */
function checkTargetAchievability(input: CalculationInput, feedingTime: Date, targetTime: Date | null): {
  warningKey: string | null;
  minAchievableHours: number;
  maxAchievableHours: number;
} {
  const { minHours, maxHours } = calculateAchievableRange(input);
  let warningKey: string | null = null;
  if (targetTime) {
    const hoursUntilTarget = (targetTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);
    if (hoursUntilTarget < minHours) warningKey = 'targetPeakTooSoon';
    else if (hoursUntilTarget > maxHours) warningKey = 'targetPeakTooLate';
  }
  return { warningKey, minAchievableHours: minHours, maxAchievableHours: maxHours };
}

function generateFermentationPhases(feedingTime: Date, peakMidpoint: Date): FermentationPhase[] {
  const start = feedingTime.getTime();
  const totalMs = peakMidpoint.getTime() - start;
  const at = (share: number) => new Date(start + totalMs * share);

  // The plateau is roughly ±15% of the time to peak; longer feeds have longer plateaus.
  const lagEnd = at(0.12);
  const riseEnd = at(0.85);
  const peakEnd = at(1.15);
  const declineEnd = at(1.45);

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
      endTime: peakEnd,
      description: 'Maximum activity - ideal for baking',
      descriptionKey: 'peakPhaseDesc',
    },
    {
      name: 'Decline Phase',
      nameKey: 'declinePhase',
      startTime: peakEnd,
      endTime: declineEnd,
      description: 'Activity decreasing - still usable',
      descriptionKey: 'declinePhaseDesc',
    },
  ];
}

export function calculateFeedingSchedule(input: CalculationInput): CalculationResult {
  const now = new Date();
  const feedingTime = input.targetStartTime ? new Date(input.targetStartTime) : now;
  const isTotalMode = input.inputMode === 'total-sourdough' && input.targetTotalSourdough > 0;
  const isWindowMode = !isTotalMode && input.useTargetWindow && input.targetPeakStart && input.targetPeakEnd;

  // Desired peak: the window's midpoint, or the single target time in total-sourdough mode.
  const targetTime = isWindowMode
    ? new Date((input.targetPeakStart!.getTime() + input.targetPeakEnd!.getTime()) / 2)
    : isTotalMode ? input.targetPeakTime : null;

  let recommendedRatio: FeedingRatio | null = null;
  if (targetTime) {
    const hoursUntilTarget = (targetTime.getTime() - feedingTime.getTime()) / (1000 * 60 * 60);
    if (hoursUntilTarget > 0) recommendedRatio = calculateRequiredRatio(input, hoursUntilTarget);
  }
  const effectiveRatio = recommendedRatio || input.feedingRatio;

  const rawHours = rawFermentationHours(input, effectiveRatio);
  const hoursToPeak = calculateFermentationTime(input, effectiveRatio);
  const estimatedPeakTime = new Date(feedingTime.getTime() + hoursToPeak * 60 * 60 * 1000);

  // Sweetener: grams on the scale, and the water it brings.
  const sweetenerPerFlour = input.isSweetMode ? input.sugarPercentage / 100 : 0;
  const sweetenerWaterFraction = input.isSweetMode ? (SUGAR_DATA[input.sugarType]?.waterFraction ?? 0) : 0;

  const suggestions: string[] = [];
  let starterAmount: number;
  let flourAmount: number;

  if (isTotalMode) {
    const totalParts = effectiveRatio.starter + effectiveRatio.flour + effectiveRatio.water +
      effectiveRatio.flour * sweetenerPerFlour * (1 - sweetenerWaterFraction);
    const gramsPerPart = totalParts > 0 ? input.targetTotalSourdough / totalParts : 0;
    starterAmount = Math.round(gramsPerPart * effectiveRatio.starter);
    flourAmount = Math.round(gramsPerPart * effectiveRatio.flour);

    // Respect available starter amount (old sourdough). If not enough, fall back to using all available.
    if (input.oldSourdoughAmount > 0 && starterAmount > input.oldSourdoughAmount) {
      starterAmount = Math.round(input.oldSourdoughAmount);
      flourAmount = Math.round((starterAmount / effectiveRatio.starter) * effectiveRatio.flour);
      suggestions.push('insufficientStarterForTargetTotal');
    }
  } else {
    starterAmount = input.oldSourdoughAmount;
    flourAmount = Math.round((starterAmount / effectiveRatio.starter) * effectiveRatio.flour);
  }

  const sugarAmount = Math.round(flourAmount * sweetenerPerFlour);
  const plainWater = flourAmount * hydrationOf(effectiveRatio);
  const waterAmount = Math.max(0, Math.round(plainWater - flourAmount * sweetenerPerFlour * sweetenerWaterFraction));

  const flourBreakdown: FlourBreakdownItem[] = input.flourBlend.map(item => ({
    flourType: item.flourType,
    percentage: item.percentage,
    amountGrams: Math.round((flourAmount * item.percentage) / 100),
    proteinContent: item.proteinContent,
  }));

  const achievability = checkTargetAchievability(input, feedingTime, targetTime);
  if (achievability.warningKey) suggestions.push(achievability.warningKey);
  if (isWindowMode && recommendedRatio) suggestions.push('adjustedRatioRecommendation');

  const exceedsMaxHours = rawHours > MAX_FERMENTATION_HOURS;
  if (exceedsMaxHours) suggestions.push('noPeakExpected');

  if (input.temperature > 35) {
    suggestions.push('tooHotForYeast');
  } else if (input.temperature >= 28 && input.temperature <= 33) {
    suggestions.push('warmerFasterLessComplex');
  } else if (input.temperature < 18) {
    suggestions.push('coolerSlowerFlavourful');
  }

  // Extra time the sugar adds, compared with the same feed without sugar.
  const sugarMultiplier = sugarFactor(sugarConcentration(input, hydrationOf(effectiveRatio)));
  const sugarDelayMinutes = exceedsMaxHours ? 0 : Math.round(hoursToPeak * (1 - 1 / sugarMultiplier) * 60);
  if (input.isSweetMode && sugarMultiplier > 1) suggestions.push('sweetSlowerFermentation');

  return {
    feedingTime,
    estimatedPeakTime,
    hoursToReachPeak: hoursToPeak,
    exceedsMaxHours,
    suggestions,
    starterAmount,
    flourAmount,
    waterAmount,
    sugarAmount,
    sugarDelayMinutes,
    totalSourdoughAmount: starterAmount + flourAmount + waterAmount + sugarAmount,
    flourBreakdown,
    fermentationPhases: generateFermentationPhases(feedingTime, estimatedPeakTime),
    recommendedRatio,
    achievabilityWarning: achievability.warningKey,
    minAchievableHours: achievability.minAchievableHours,
    maxAchievableHours: achievability.maxAchievableHours,
  };
}

/** What calibration needs from a logged feed. */
export interface CalibrationEntry {
  personaId: string;
  feedingTime: string;
  predictedPeakTime: string;
  actualPeakTime: string | null;
  sugarAmount: number;
  calibrationFactor?: number;
}

const CALIBRATION_WINDOW = 10;

/**
 * Per-starter multiplier learned from logged feeds.
 *
 * Each entry stores the factor its prediction used, so factor × actual ÷ predicted is what
 * that feed says the factor should have been. Averaging those converges instead of
 * undoing itself. Feeds with sugar are calibrated separately once there are two of them.
 * Entries logged before this existed have no factor and count as 1.
 */
export function calibrationFactorFor(history: CalibrationEntry[], personaId: string, isSweet: boolean): number {
  const recorded = history.filter(e => e.personaId === personaId && e.actualPeakTime);
  const sameKind = recorded.filter(e => (e.sugarAmount > 0) === isSweet);
  const entries = (sameKind.length >= 2 ? sameKind : recorded).slice(0, CALIBRATION_WINDOW);

  const samples = entries.flatMap(e => {
    const fed = new Date(e.feedingTime).getTime();
    const predicted = new Date(e.predictedPeakTime).getTime() - fed;
    const actual = new Date(e.actualPeakTime!).getTime() - fed;
    return predicted > 0 && actual > 0 ? [(e.calibrationFactor ?? 1) * actual / predicted] : [];
  });
  if (samples.length === 0) return 1;
  return clampCalibration(samples.reduce((a, b) => a + b, 0) / samples.length);
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
