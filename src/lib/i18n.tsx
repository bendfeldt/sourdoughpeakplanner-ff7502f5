import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'da';

export const translations = {
  en: {
    // Header
    title: 'Sourdough Peak Calculator',
    subtitle: 'Calculate the perfect feeding time for your sourdough starter to peak exactly when you need it.',
    
    // Flour section
    flourBlend: 'Flour Blend',
    flourBlendDesc: 'Add multiple flours with their percentages and protein levels',
    addFlour: 'Add Flour',
    percentage: 'Percentage',
    protein: 'Protein',
    flourPercentageWarning: 'Flour percentages should total 100%',
    blendedProtein: 'Blended protein',
    
    // Flour types
    'all-purpose': 'All-Purpose',
    'bread-flour': 'Bread Flour',
    'whole-wheat': 'Whole Wheat',
    'rye': 'Rye',
    'spelt': 'Spelt',
    'oland-wheat': 'Øland Wheat',
    'danish-wheat': 'Danish Wheat',
    'oat-flour': 'Oat Flour',
    'fuldkornsmel': 'Whole Grain (Fuldkornsmel)',
    'manitoba': 'Manitoba',
    
    // Flour descriptions
    'all-purpose-desc': 'Versatile flour, moderate gluten development',
    'bread-flour-desc': 'High protein, excellent gluten structure',
    'whole-wheat-desc': 'Faster fermentation due to bran enzymes',
    'rye-desc': 'Very active fermentation, different gluten',
    'spelt-desc': 'Ancient grain, slightly faster fermentation',
    'oland-wheat-desc': 'Danish heritage wheat, excellent flavour',
    'danish-wheat-desc': 'Traditional Danish flour, type XX',
    'oat-flour-desc': 'Adds moisture and softness',
    'fuldkornsmel-desc': 'Full grain Danish flour, robust flavour',
    'manitoba-desc': 'Very high protein Canadian wheat',
    
    // Feeding ratio
    feedingRatio: 'Feeding Ratio',
    feedingRatioDesc: 'Starter : Flour : Water (in grams)',
    starter: 'Starter',
    flour: 'Flour',
    water: 'Water',
    commonRatios: 'Common ratios: 1:1:1 (quick), 1:2:2 (moderate), 1:5:5 (slow)',
    
    // Temperature
    ambientTemperature: 'Ambient Temperature',
    roomTemperature: 'Room temperature',
    
    // Target window
    targetPeakWindow: 'Target Peak Window',
    targetWindowDesc: 'When do you need your starter to be at peak?',
    from: 'From',
    to: 'To',
    useWindow: 'Use target window',
    
    // Old sourdough
    oldSourdough: 'Old Sourdough Amount',
    oldSourdoughDesc: 'Amount of existing starter to use',
    grams: 'grams',
    
    // Sweet sourdough
    sweetSourdough: 'Sweet Sourdough',
    sweetSourdoughDesc: 'Add powdered sugar for sweet bread',
    enableSweetMode: 'Enable sweet mode',
    powderedSugar: 'Powdered sugar',
    sugarAmount: 'Sugar amount',
    
    // Always on
    alwaysOn: 'Always On Mode',
    alwaysOnDesc: 'Starter is kept at peak activity continuously',
    enableAlwaysOn: 'Enable always on',
    
    // Calculate button
    calculateSchedule: 'Calculate Feeding Schedule',
    
    // Results
    yourFeedingSchedule: 'Your Feeding Schedule',
    feedStarterAt: 'Feed your starter at',
    timeToPeak: 'Time to peak',
    estimatedPeak: 'Estimated peak',
    peakWindow: 'Peak window',
    totalSourdough: 'Total sourdough',
    hours: 'hours',
    
    // Flour breakdown
    flourBreakdown: 'Flour Breakdown',
    
    // Status
    perfectTiming: 'Perfect timing!',
    timingAdjustmentNeeded: 'Timing adjustment needed',
    starterWillPeak: 'Your starter will peak within your target window.',
    peakOutsideWindow: 'The estimated peak time falls outside your target window.',
    
    // Tips
    tips: 'Tips',
    
    // Ready state
    readyToCalculate: 'Ready to Calculate',
    configureSettings: 'Configure your starter settings on the left and click calculate to see your optimal feeding schedule.',
    
    // Language
    language: 'Language',
    english: 'English',
    danish: 'Danish',
    
    // Suggestion messages
    feedLaterOrHigherRatio: 'Consider feeding later or using a higher flour ratio to slow fermentation',
    lowerTempToExtend: 'You could also lower the temperature to extend fermentation time',
    feedEarlierOrLowerRatio: 'Consider feeding earlier or using a lower flour ratio to speed up fermentation',
    increaseTempToSpeed: 'Increasing ambient temperature will also speed things up',
    coolerSlowerFlavourful: 'Cooler temperatures will result in slower but more flavourful fermentation',
    warmerFasterLessComplex: 'Warmer temperatures may lead to faster but less complex flavour development',
    sweetSlowerFermentation: 'Sugar slows fermentation - expect longer rise times',
    adjustedRatioRecommendation: 'Ratio adjusted to hit your target window - see recommended ratio below',
    
    // Fermentation phases
    fermentationTimeline: 'Fermentation Timeline',
    lagPhase: 'Lag Phase',
    lagPhaseDesc: 'Microbes adapting to fresh food',
    risePhase: 'Rise Phase',
    risePhaseDesc: 'Active fermentation and CO2 production',
    peakPhase: 'Peak Phase',
    peakPhaseDesc: 'Maximum activity - ideal for baking',
    declinePhase: 'Decline Phase',
    declinePhaseDesc: 'Activity decreasing - still usable',
    
    // Recommended ratio
    recommendedRatio: 'Recommended Ratio',
    recommendedRatioDesc: 'Adjusted ratio to hit your target window',
  },
  da: {
    // Header
    title: 'Surdejs Peak Beregner',
    subtitle: 'Beregn det perfekte fodringstidspunkt så din surdej topper præcis når du har brug for det.',
    
    // Flour section
    flourBlend: 'Melblanding',
    flourBlendDesc: 'Tilføj flere meltyper med deres procenter og proteinniveauer',
    addFlour: 'Tilføj Mel',
    percentage: 'Procent',
    protein: 'Protein',
    flourPercentageWarning: 'Melprocenter skal udgøre 100%',
    blendedProtein: 'Blandet protein',
    
    // Flour types
    'all-purpose': 'Almindeligt Hvedemel',
    'bread-flour': 'Brødmel',
    'whole-wheat': 'Fuldkornshvede',
    'rye': 'Rugmel',
    'spelt': 'Speltmel',
    'oland-wheat': 'Ølandshvede',
    'danish-wheat': 'Dansk Hvedemel',
    'oat-flour': 'Havremel',
    'fuldkornsmel': 'Fuldkornsmel',
    'manitoba': 'Manitoba',
    
    // Flour descriptions
    'all-purpose-desc': 'Alsidigt mel, moderat glutenudvikling',
    'bread-flour-desc': 'Høj protein, fremragende glutenstruktur',
    'whole-wheat-desc': 'Hurtigere gæring pga. klidenzym',
    'rye-desc': 'Meget aktiv gæring, anderledes gluten',
    'spelt-desc': 'Gammelt korn, lidt hurtigere gæring',
    'oland-wheat-desc': 'Dansk arve-hvede, fremragende smag',
    'danish-wheat-desc': 'Traditionelt dansk mel, type XX',
    'oat-flour-desc': 'Tilføjer fugt og blødhed',
    'fuldkornsmel-desc': 'Dansk fuldkornsmel, robust smag',
    'manitoba-desc': 'Meget høj protein canadisk hvede',
    
    // Feeding ratio
    feedingRatio: 'Fodringsforhold',
    feedingRatioDesc: 'Surdej : Mel : Vand (i gram)',
    starter: 'Surdej',
    flour: 'Mel',
    water: 'Vand',
    commonRatios: 'Almindelige forhold: 1:1:1 (hurtigt), 1:2:2 (moderat), 1:5:5 (langsomt)',
    
    // Temperature
    ambientTemperature: 'Omgivelsestemperatur',
    roomTemperature: 'Rumtemperatur',
    
    // Target window
    targetPeakWindow: 'Ønsket Peak-vindue',
    targetWindowDesc: 'Hvornår har du brug for at din surdej topper?',
    from: 'Fra',
    to: 'Til',
    useWindow: 'Brug målvindue',
    
    // Old sourdough
    oldSourdough: 'Gammel Surdejsmængde',
    oldSourdoughDesc: 'Mængde af eksisterende surdej at bruge',
    grams: 'gram',
    
    // Sweet sourdough
    sweetSourdough: 'Sød Surdej',
    sweetSourdoughDesc: 'Tilføj flormelis til sødt brød',
    enableSweetMode: 'Aktiver sød tilstand',
    powderedSugar: 'Flormelis',
    sugarAmount: 'Sukkermængde',
    
    // Always on
    alwaysOn: 'Altid Aktiv Tilstand',
    alwaysOnDesc: 'Surdej holdes på peak aktivitet konstant',
    enableAlwaysOn: 'Aktiver altid aktiv',
    
    // Calculate button
    calculateSchedule: 'Beregn Fodringsplan',
    
    // Results
    yourFeedingSchedule: 'Din Fodringsplan',
    feedStarterAt: 'Fodr din surdej kl.',
    timeToPeak: 'Tid til peak',
    estimatedPeak: 'Forventet peak',
    peakWindow: 'Peak-vindue',
    totalSourdough: 'Total surdej',
    hours: 'timer',
    
    // Flour breakdown
    flourBreakdown: 'Meloversigt',
    
    // Status
    perfectTiming: 'Perfekt timing!',
    timingAdjustmentNeeded: 'Timing justering nødvendig',
    starterWillPeak: 'Din surdej vil toppe inden for dit målvindue.',
    peakOutsideWindow: 'Den forventede peak-tid falder uden for dit målvindue.',
    
    // Tips
    tips: 'Tips',
    
    // Ready state
    readyToCalculate: 'Klar til Beregning',
    configureSettings: 'Konfigurer dine surdejs-indstillinger til venstre og klik beregn for at se din optimale fodringsplan.',
    
    // Language
    language: 'Sprog',
    english: 'Engelsk',
    danish: 'Dansk',
    
    // Suggestion messages
    feedLaterOrHigherRatio: 'Overvej at fodre senere eller bruge et højere melforhold for at bremse gæringen',
    lowerTempToExtend: 'Du kan også sænke temperaturen for at forlænge gæringstiden',
    feedEarlierOrLowerRatio: 'Overvej at fodre tidligere eller bruge et lavere melforhold for at fremskynde gæringen',
    increaseTempToSpeed: 'Øgning af omgivelsestemperaturen vil også fremskynde tingene',
    coolerSlowerFlavourful: 'Køligere temperaturer giver langsommere men mere smagsfuld gæring',
    warmerFasterLessComplex: 'Varmere temperaturer kan føre til hurtigere men mindre kompleks smagsudvikling',
    sweetSlowerFermentation: 'Sukker bremser gæring - forvent længere hævetider',
    adjustedRatioRecommendation: 'Forholdet er justeret for at ramme dit målvindue - se anbefalet forhold nedenfor',
    
    // Fermentation phases
    fermentationTimeline: 'Gærings-tidslinje',
    lagPhase: 'Lag-fase',
    lagPhaseDesc: 'Mikrober tilpasser sig frisk føde',
    risePhase: 'Hævefase',
    risePhaseDesc: 'Aktiv gæring og CO2-produktion',
    peakPhase: 'Peak-fase',
    peakPhaseDesc: 'Maksimal aktivitet - ideel til bagning',
    declinePhase: 'Nedgangsfase',
    declinePhaseDesc: 'Aktivitet faldende - stadig brugbar',
    
    // Recommended ratio
    recommendedRatio: 'Anbefalet Forhold',
    recommendedRatioDesc: 'Justeret forhold for at ramme dit målvindue',
  },
};

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
