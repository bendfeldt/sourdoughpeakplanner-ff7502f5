import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
    'spelt': 'Spelt (white)',
    'spelt-whole': 'Whole Spelt',
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
    'spelt-desc': 'Sifted spelt, close to white wheat in speed',
    'spelt-whole-desc': 'Whole grain spelt, fast fermentation',
    'oland-wheat-desc': 'Danish heritage wheat, usually stone-ground with some bran',
    'danish-wheat-desc': 'Traditional refined Danish wheat flour',
    'oat-flour-desc': 'Whole grain oats, no gluten, adds moisture',
    'fuldkornsmel-desc': 'Danish whole grain wheat, fast fermentation',
    'manitoba-desc': 'Refined, very high protein Canadian wheat',
    
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
    
    // Start time
    startTime: 'Start Time',
    startTimeDesc: 'When do you want to start feeding?',
    
    // Old sourdough
    oldSourdough: 'Old Sourdough Amount',
    oldSourdoughDesc: 'Amount of existing starter to use',
    grams: 'grams',
    
    // Sweet sourdough
    sweetSourdough: 'Sweet Sourdough',
    sweetSourdoughDesc: 'Add sugar for sweet bread',
    enableSweetMode: 'Enable sweet mode',
    powderedSugar: 'Sugar',
    sugarAmount: 'Sugar amount (% of flour)',
    sweetFlour: 'Flour for sweet',
    
    // Keep screen on
    keepScreenOn: 'Keep Screen On',
    keepScreenOnDesc: 'Prevents screen from sleeping during feeding work',
    screenOnActive: 'Screen will stay on',
    screenOnNotSupported: 'Not supported on this device',
    
    // Dough method
    doughMethod: 'Dough Method',
    doughMethodDesc: 'Method for mixing dough',
    direct: 'Direct',
    directDesc: 'Mix all ingredients at once',
    autolyse: 'Autolyse',
    autolyseDesc: 'Rest flour and water before adding starter (+30 min)',
    fermentolyse: 'Fermentolyse',
    fermentolyseDesc: 'Rest flour, water, and starter before adding salt (+60 min)',
    
    // Calculate button
    calculateSchedule: 'Calculate Feeding Schedule',
    
    // Results
    yourFeedingSchedule: 'Your Feeding Schedule',
    feedStarterAt: 'Feed your starter at',
    timeToPeak: 'Time to peak',
    estimatedPeak: 'Estimated peak',
    totalSourdough: 'Total sourdough',
    hours: 'hours',
    
    // Flour breakdown
    flourBreakdown: 'Flour Breakdown',
    
    // Status
    perfectTiming: 'Perfect timing!',
    timingAdjustmentNeeded: 'Timing adjustment needed',
    
    // Tips
    tips: 'Tips',
    suggestions: 'Suggestions',
    sugarPercentage: 'Sugar Percentage',
    
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
    sweetSlowerFermentation: 'At this much sugar the starter is slowed by osmotic stress - the peak time already includes it',
    sugarBelowThreshold: 'Below the sugar threshold - no slowdown',
    fromSugar: 'from sugar',
    noPeakExpected: 'No normal peak expected within 48 hours',
    tooHotForYeast: 'Above 35°C the yeast struggles and the starter slows down again - aim for 24-31°C',
    insufficientStarterForTargetTotal: 'Not enough starter available for the target total; using all available starter instead',
    autolyseGlutenDevelopment: 'Autolyse improves gluten development and extensibility',
    fermentolyseEnhancedFlavour: 'Fermentolyse adds extra flavour complexity from early fermentation',
    
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
    recommendedRatioDesc: 'Ratio that peaks at your desired time',
    
    // Reset
    resetSettings: 'Reset to defaults',
    
    // Multi-starter & timer
    allStarters: 'All Starters',
    ratio: 'Ratio',
    peakTimer: 'Peak Timer',
    untilPeak: 'until peak',
    sincePeak: 'since peak',
    atPeak: 'At Peak',
    pastPeak: 'Past Peak',
    almostReady: 'Almost Ready',
    
    // Input modes
    calculationMode: 'Calculation Mode',
    basicMode: 'Normal',
    weightsMode: 'Weights',
    totalSourdoughMode: 'Total Sourdough',
    targetTotalSourdough: 'Target Total Sourdough',
    targetTotalSourdoughDesc: 'Enter desired total amount and peak time to calculate required ratio',
    
    // Guidance page
    guidanceTitle: 'How to Use the Sourdough Calculator',
    guidanceSubtitle: 'A complete guide to understanding and using all calculator modes',
    backToCalculator: 'Back to Calculator',
    guidanceIntro: 'This calculator helps you plan your sourdough feeding schedule to have your starter peak exactly when you need it.',
    normalModeTitle: 'Normal Mode',
    normalModeDesc: 'The simplest mode. Set your feeding ratio, temperature, and start time to see when your starter will peak. Great for regular feeding schedules.',
    weightsModeTitle: 'Weights Mode',
    weightsModeDesc: 'Weigh the starter, flour and water you feed, type the grams, and the calculator tells you when it will peak. The ratio is worked out for you.',
    feedWeights: 'Feed Weights',
    feedWeightsDesc: 'Grams of starter, flour and water in this feed',
    weightsStep1: 'Weigh the starter, flour and water you feed',
    weightsStep2: 'Type the grams; the ratio is shown underneath',
    weightsStep3: 'Set when you feed (use "Use Current Time" for now)',
    weightsStep4: 'Calculator shows when peak will occur',
    totalSourdoughModeTitle: 'Total Sourdough Mode',
    totalSourdoughModeDesc: 'Specify how much total sourdough you need and when you need it ready. The calculator will work backwards to determine amounts and timing.',
    flourTypesTitle: 'Flour Types Matter',
    flourTypesDesc: 'Different flours ferment at different rates. Whole grain and rye flours ferment faster due to higher enzyme activity. Refined flours like bread flour ferment more slowly.',
    temperatureTitle: 'Temperature Effects',
    temperatureDesc: 'Warmer temperatures speed up fermentation up to about 30-31°C, where the starter is fastest. Below that, every 8°C cooler roughly doubles the time, and the cold slows it even more below about 15°C. Above 35°C the yeast struggles, and from about 37°C the starter will not peak normally. Cooler temperatures develop more complex flavours.',
    ratioTitle: 'Feeding Ratios',
    ratioDesc: 'Higher ratios (more flour relative to starter) extend fermentation time. A 1:5:5 ratio takes much longer than 1:1:1. The calculator uses this to hit your target times.',
    tipsTitle: 'Pro Tips',
    tip1: 'Always use the same flour in your starter that you use in your bread for consistent results.',
    tip2: 'Your starter should roughly double or triple in size at peak.',
    tip3: 'A "young" starter (before peak) gives more rise power, while a "mature" starter (at or past peak) gives more flavour.',
    tip4: 'If your starter is peaking too fast or slow, adjust the temperature or ratio accordingly.',
    fastFermentation: 'Fast Fermentation',
    fastFermentationFlours: 'Whole wheat, Rye, Whole spelt, Whole einkorn',
    slowFermentation: 'Slow Fermentation',
    slowFermentationFlours: 'White wheat, Manitoba, Tipo 00',
    tempCoolNote: 'Slower, more flavour',
    tempIdealNote: 'Ideal balance',
    tempWarmNote: 'Faster, less complex',
    pageNotFound: 'Oops! Page not found',
    returnHome: 'Return to Home',
    viewGuidance: 'How to Use',
    // Menu
    menu: 'Menu',
    calculator: 'Calculator',
    starters: 'Starters',
    addStarter: 'Add starter',
    renameStarter: 'Rename starter',
    duplicateStarter: 'Duplicate starter',
    copySuffix: 'copy',
    delete: 'Delete',
    deleteStarterConfirm: 'Delete',
    documentation: 'Documentation',
    backup: 'Backup',
    backupHint: 'Starters and feeds are saved only in this browser. Save a backup to keep them safe or move them to another device.',
    backupSave: 'Save backup',
    backupRestore: 'Restore',
    backupRestoreConfirm: 'Replace the starters and feeds on this device with the {count} starter(s) in the backup?',
    backupRestored: 'Backup restored',
    backupInvalid: 'This file is not a Sourdough Peak Planner backup',
    desiredPeakTime: 'Desired Peak Time',
    
    // History & Warnings
    feedingHistory: 'Feeding History',
    recorded: 'recorded',
    avgTendency: 'Avg tendency',
    predictedPeak: 'Predicted',
    actualPeak: 'Actual',
    recordActualPeak: 'Record actual peak',
    save: 'Save',
    cancel: 'Cancel',
    targetPeakTooSoon: 'Target peak time is too soon - minimum achievable is',
    targetPeakTooLate: 'Target peak time is too late - maximum achievable is',
    hoursFromStart: 'hours from start',
    peakNotAchievable: 'Target time not achievable',
    logFeeding: 'Log Feeding',
    feedingLogged: 'Feeding logged to history',
    useCurrentTime: 'Use Current Time',
    historyTitle: 'Feeding History',
    historyDesc: 'Track your feedings and compare predicted vs actual peak times. After calculating, click "Log Feeding" to save. Then record the actual peak time when your starter peaks to improve future predictions.',
    
    // Sugar types
    sugarType: 'Sugar Type',
    'white-sugar': 'White Sugar',
    'powdered-sugar': 'Powdered Sugar',
    'cane-sugar': 'Cane Sugar',
    'brown-sugar': 'Brown Sugar',
    'honey': 'Honey',
    'maple-syrup': 'Maple Syrup',
    
    // New flour types
    'tipo-0': 'Tipo 0',
    'tipo-00': 'Tipo 00',
    'durum': 'Durum',
    'semolina': 'Semolina',
    'kamut': 'Kamut (white)',
    'kamut-whole': 'Whole Kamut',
    'einkorn': 'Einkorn (white)',
    'einkorn-whole': 'Whole Einkorn',
    'tipo-0-desc': 'Italian flour, medium protein, versatile',
    'tipo-00-desc': 'Most refined Italian flour, ideal for pizza & pasta',
    'durum-desc': 'Hard wheat, high protein, golden color',
    'semolina-desc': 'Coarse durum wheat, great for bread crust',
    'kamut-desc': 'Sifted khorasan wheat, buttery flavour',
    'kamut-whole-desc': 'Whole grain khorasan wheat, fast fermentation',
    'einkorn-desc': 'Sifted einkorn, nutty flavour, weak gluten',
    'einkorn-whole-desc': 'Whole grain einkorn, fast fermentation, weak gluten',
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
    'spelt': 'Speltmel (sigtet)',
    'spelt-whole': 'Fuldkornsspelt',
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
    'spelt-desc': 'Sigtet spelt, næsten lige så langsom som hvidt hvedemel',
    'spelt-whole-desc': 'Fuldkornsspelt, hurtig gæring',
    'oland-wheat-desc': 'Dansk arve-hvede, oftest stenformalet med lidt klid',
    'danish-wheat-desc': 'Traditionelt raffineret dansk hvedemel',
    'oat-flour-desc': 'Fuldkornshavre, uden gluten, tilføjer fugt',
    'fuldkornsmel-desc': 'Dansk fuldkornshvede, hurtig gæring',
    'manitoba-desc': 'Raffineret canadisk hvede med meget højt protein',
    
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
    
    // Start time
    startTime: 'Starttidspunkt',
    startTimeDesc: 'Hvornår vil du starte fodringen?',
    
    // Old sourdough
    oldSourdough: 'Gammel Surdejsmængde',
    oldSourdoughDesc: 'Mængde af eksisterende surdej at bruge',
    grams: 'gram',
    
    // Sweet sourdough
    sweetSourdough: 'Sød Surdej',
    sweetSourdoughDesc: 'Tilføj sukker til sødt brød',
    enableSweetMode: 'Aktiver sød tilstand',
    powderedSugar: 'Sukker',
    sugarAmount: 'Sukkermængde (% af mel)',
    sweetFlour: 'Mel til sødt',
    
    // Keep screen on
    keepScreenOn: 'Hold Skærm Tændt',
    keepScreenOnDesc: 'Forhindrer skærmen i at slukke under fodringsarbejde',
    screenOnActive: 'Skærmen forbliver tændt',
    screenOnNotSupported: 'Ikke understøttet på denne enhed',
    
    // Dough method
    doughMethod: 'Dejmetode',
    doughMethodDesc: 'Metode til blanding af dej',
    direct: 'Direkte',
    directDesc: 'Bland alle ingredienser på én gang',
    autolyse: 'Autolyse',
    autolyseDesc: 'Hvil mel og vand før tilsætning af surdej (+30 min)',
    fermentolyse: 'Fermentolyse',
    fermentolyseDesc: 'Hvil mel, vand og surdej før tilsætning af salt (+60 min)',
    
    // Calculate button
    calculateSchedule: 'Beregn Fodringsplan',
    
    // Results
    yourFeedingSchedule: 'Din Fodringsplan',
    feedStarterAt: 'Fodr din surdej kl.',
    timeToPeak: 'Tid til peak',
    estimatedPeak: 'Forventet peak',
    totalSourdough: 'Total surdej',
    hours: 'timer',
    
    // Flour breakdown
    flourBreakdown: 'Meloversigt',
    
    // Status
    perfectTiming: 'Perfekt timing!',
    timingAdjustmentNeeded: 'Timing justering nødvendig',
    
    // Tips
    tips: 'Tips',
    suggestions: 'Forslag',
    sugarPercentage: 'Sukkerprocent',
    
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
    sweetSlowerFermentation: 'Ved så meget sukker bremses surdejen af osmotisk stress - peak-tiden tager allerede højde for det',
    sugarBelowThreshold: 'Under sukkertærsklen - ingen opbremsning',
    fromSugar: 'pga. sukker',
    noPeakExpected: 'Ingen normal peak forventet inden for 48 timer',
    tooHotForYeast: 'Over 35°C har gæren det svært, og surdejen bliver langsommere igen - sigt efter 24-31°C',
    insufficientStarterForTargetTotal: 'Ikke nok surdej til den ønskede total; bruger al tilgængelig surdej i stedet',
    autolyseGlutenDevelopment: 'Autolyse forbedrer glutenudvikling og smidighed',
    fermentolyseEnhancedFlavour: 'Fermentolyse tilføjer ekstra smagskompleksitet fra tidlig gæring',
    
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
    recommendedRatioDesc: 'Forhold der topper på dit ønskede tidspunkt',
    
    // Reset
    resetSettings: 'Nulstil til standarder',
    
    // Multi-starter & timer
    allStarters: 'Alle Surdejer',
    ratio: 'Forhold',
    peakTimer: 'Peak Timer',
    untilPeak: 'til peak',
    sincePeak: 'siden peak',
    atPeak: 'Ved Peak',
    pastPeak: 'Forbi Peak',
    almostReady: 'Næsten Klar',
    
    // Input modes
    calculationMode: 'Beregningstilstand',
    basicMode: 'Normal',
    weightsMode: 'Vægt',
    totalSourdoughMode: 'Total Surdej',
    targetTotalSourdough: 'Ønsket Total Surdej',
    targetTotalSourdoughDesc: 'Indtast ønsket totalmængde og peak-tid for at beregne nødvendigt forhold',
    
    // Guidance page
    guidanceTitle: 'Sådan Bruger Du Surdejs-Beregneren',
    guidanceSubtitle: 'En komplet guide til at forstå og bruge alle beregningstilstande',
    backToCalculator: 'Tilbage til Beregner',
    guidanceIntro: 'Denne beregner hjælper dig med at planlægge din surdejs fodringsplan, så din surdej topper præcis når du har brug for det.',
    normalModeTitle: 'Normal Tilstand',
    normalModeDesc: 'Den enkleste tilstand. Sæt dit fodringsforhold, temperatur og starttid for at se hvornår din surdej topper. God til regelmæssige fodringsplaner.',
    weightsModeTitle: 'Vægt Tilstand',
    weightsModeDesc: 'Vej surdej, mel og vand til fodringen, skriv grammene, og beregneren fortæller hvornår den topper. Forholdet regnes ud for dig.',
    feedWeights: 'Fodringens Vægt',
    feedWeightsDesc: 'Gram surdej, mel og vand i denne fodring',
    weightsStep1: 'Vej surdej, mel og vand til fodringen',
    weightsStep2: 'Skriv grammene; forholdet vises nedenunder',
    weightsStep3: 'Sæt hvornår du fodrer (brug "Brug Nuværende Tid" for nu)',
    weightsStep4: 'Beregneren viser hvornår den topper',
    totalSourdoughModeTitle: 'Total Surdej Tilstand',
    totalSourdoughModeDesc: 'Angiv hvor meget total surdej du har brug for og hvornår du har brug for den. Beregneren beregner baglæns for at bestemme mængder og timing.',
    flourTypesTitle: 'Meltyper Betyder Noget',
    flourTypesDesc: 'Forskellige meltyper gærer med forskellige hastigheder. Fuldkorn og rugmel gærer hurtigere pga. højere enzymaktivitet. Raffinerede meltyper som brødmel gærer langsommere.',
    temperatureTitle: 'Temperatureffekter',
    temperatureDesc: 'Varmere temperaturer fremskynder gæringen op til omkring 30-31°C, hvor surdejen er hurtigst. Derunder fordobles tiden omtrent for hver 8°C koldere, og under ca. 15°C bremser kulden endnu mere. Over 35°C har gæren det svært, og fra ca. 37°C topper surdejen ikke normalt. Køligere temperaturer udvikler mere komplekse smage.',
    ratioTitle: 'Fodringsforhold',
    ratioDesc: 'Højere forhold (mere mel i forhold til surdej) forlænger gæringstiden. Et 1:5:5 forhold tager meget længere tid end 1:1:1. Beregneren bruger dette til at ramme dine måltider.',
    tipsTitle: 'Pro Tips',
    tip1: 'Brug altid det samme mel i din surdej som du bruger i dit brød for konsistente resultater.',
    tip2: 'Din surdej skal omtrent fordoble eller tredoble i størrelse ved peak.',
    tip3: 'En "ung" surdej (før peak) giver mere hævekraft, mens en "moden" surdej (ved eller efter peak) giver mere smag.',
    tip4: 'Hvis din surdej topper for hurtigt eller langsomt, justér temperaturen eller forholdet tilsvarende.',
    fastFermentation: 'Hurtig Gæring',
    fastFermentationFlours: 'Fuldkornshvede, Rug, Fuldkornsspelt, Fuldkornsenkorn',
    slowFermentation: 'Langsom Gæring',
    slowFermentationFlours: 'Hvidt hvedemel, Manitoba, Tipo 00',
    tempCoolNote: 'Langsommere, mere smag',
    tempIdealNote: 'Ideel balance',
    tempWarmNote: 'Hurtigere, mindre kompleks',
    pageNotFound: 'Ups! Siden findes ikke',
    returnHome: 'Tilbage til forsiden',
    viewGuidance: 'Sådan Bruges',
    // Menu
    menu: 'Menu',
    calculator: 'Beregner',
    starters: 'Surdeje',
    addStarter: 'Tilføj surdej',
    renameStarter: 'Omdøb surdej',
    duplicateStarter: 'Kopiér surdej',
    copySuffix: 'kopi',
    delete: 'Slet',
    deleteStarterConfirm: 'Slet',
    documentation: 'Dokumentation',
    backup: 'Sikkerhedskopi',
    backupHint: 'Surdeje og fodringer gemmes kun i denne browser. Gem en sikkerhedskopi for at passe på dem eller flytte dem til en anden enhed.',
    backupSave: 'Gem kopi',
    backupRestore: 'Gendan',
    backupRestoreConfirm: 'Erstat surdejene og fodringerne på denne enhed med de {count} surdej(e) i sikkerhedskopien?',
    backupRestored: 'Sikkerhedskopi gendannet',
    backupInvalid: 'Filen er ikke en sikkerhedskopi fra Sourdough Peak Planner',
    desiredPeakTime: 'Ønsket Peak-tid',
    
    // History & Warnings
    feedingHistory: 'Fodringshistorik',
    recorded: 'registreret',
    avgTendency: 'Gns. tendens',
    predictedPeak: 'Forudsagt',
    actualPeak: 'Faktisk',
    recordActualPeak: 'Registrer faktisk peak',
    save: 'Gem',
    cancel: 'Annuller',
    targetPeakTooSoon: 'Ønsket peak-tid er for tidligt - minimum opnåelig er',
    targetPeakTooLate: 'Ønsket peak-tid er for sent - maksimum opnåelig er',
    hoursFromStart: 'timer fra start',
    peakNotAchievable: 'Ønsket tid ikke opnåelig',
    logFeeding: 'Log Fodring',
    feedingLogged: 'Fodring logget til historik',
    useCurrentTime: 'Brug Nuværende Tid',
    historyTitle: 'Fodringshistorik',
    historyDesc: 'Spor dine fodringer og sammenlign forudsagt vs faktisk peak-tid. Klik "Log Fodring" efter beregning for at gemme. Registrer derefter den faktiske peak-tid for at forbedre fremtidige forudsigelser.',
    
    // Sugar types
    sugarType: 'Sukkertype',
    'white-sugar': 'Hvidt Sukker',
    'powdered-sugar': 'Flormelis',
    'cane-sugar': 'Rørsukker',
    'brown-sugar': 'Brunt Sukker',
    'honey': 'Honning',
    'maple-syrup': 'Ahornsirup',
    
    // New flour types
    'tipo-0': 'Tipo 0',
    'tipo-00': 'Tipo 00',
    'durum': 'Durummel',
    'semolina': 'Semolina',
    'kamut': 'Kamut (sigtet)',
    'kamut-whole': 'Fuldkornskamut',
    'einkorn': 'Enkorn (sigtet)',
    'einkorn-whole': 'Fuldkornsenkorn',
    'tipo-0-desc': 'Italiensk mel, medium protein, alsidigt',
    'tipo-00-desc': 'Det mest raffinerede italienske mel, ideel til pizza & pasta',
    'durum-desc': 'Hård hvede, høj protein, gylden farve',
    'semolina-desc': 'Grov durumhvede, god til brødskorpe',
    'kamut-desc': 'Sigtet khorasanhvede, smørrig smag',
    'kamut-whole-desc': 'Fuldkorns khorasanhvede, hurtig gæring',
    'einkorn-desc': 'Sigtet enkorn, nøddeagtig smag, svag gluten',
    'einkorn-whole-desc': 'Fuldkornsenkorn, hurtig gæring, svag gluten',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_KEY = 'sourdough-language';

function loadLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'da' ? 'da' : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // Storage blocked: the choice lasts until reload
    }
  };

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
