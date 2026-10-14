import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wheat, Thermometer, Scale, Lightbulb, History } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import { AppMenu } from '@/components/AppMenu';

function GuidanceContent() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 px-4 md:py-12 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-2">
          <AppMenu />
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToCalculator')}
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            {t('guidanceTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('guidanceSubtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Intro */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-lg text-foreground leading-relaxed">
                {t('guidanceIntro')}
              </p>
            </CardContent>
          </Card>

          {/* Normal Mode */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wheat className="h-5 w-5 text-primary" />
                </div>
                {t('normalModeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('normalModeDesc')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Set your feeding ratio (e.g., 1:2:2)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Choose your ambient temperature
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Set when you'll start feeding (use "Use Current Time" for now)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Calculator shows when peak will occur
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Weights Mode */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                {t('weightsModeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('weightsModeDesc')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {(['weightsStep1', 'weightsStep2', 'weightsStep3', 'weightsStep4'] as const).map(key => (
                  <li key={key} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Total Sourdough Mode */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                {t('totalSourdoughModeTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('totalSourdoughModeDesc')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Enter how much total sourdough you need
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Set when you'll start and when you need it ready
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Calculator determines starter, flour, and water amounts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Automatically calculates optimal ratio
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feeding History */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                {t('historyTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('historyDesc')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  After calculating, click "Log Feeding" to save the prediction
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  When your starter actually peaks, click "Record actual peak"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  View your history at the bottom of the results section
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  Track prediction accuracy to improve future estimates
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Flour Types */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wheat className="h-5 w-5 text-primary" />
                </div>
                {t('flourTypesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('flourTypesDesc')}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-medium text-foreground">{t('fastFermentation')}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('fastFermentationFlours')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-medium text-foreground">{t('slowFermentation')}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('slowFermentationFlours')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-primary" />
                </div>
                {t('temperatureTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('temperatureDesc')}
              </p>
              <div className="mt-4 flex gap-3 text-sm">
                <div className="flex-1 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="font-medium text-blue-600 dark:text-blue-400">18-22°C</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('tempCoolNote')}</p>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600 dark:text-green-400">23-26°C</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('tempIdealNote')}</p>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="font-medium text-orange-600 dark:text-orange-400">27-31°C</p>
                  <p className="text-muted-foreground text-xs mt-1">{t('tempWarmNote')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-display">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                {t('tipsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-primary font-bold text-lg">1</span>
                  <span>{t('tip1')}</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-primary font-bold text-lg">2</span>
                  <span>{t('tip2')}</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-primary font-bold text-lg">3</span>
                  <span>{t('tip3')}</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-primary font-bold text-lg">4</span>
                  <span>{t('tip4')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Back button */}
          <div className="text-center pt-6">
            <Link to="/">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('backToCalculator')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Guidance() {
  return <GuidanceContent />;
}
