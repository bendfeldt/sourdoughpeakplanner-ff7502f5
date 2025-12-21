import { SourdoughCalculator } from '@/components/SourdoughCalculator';
import { I18nProvider } from '@/lib/i18n';

const Index = () => {
  return (
    <I18nProvider>
      <main className="min-h-screen bg-background">
        <div className="container py-8 px-4 md:py-12">
          <SourdoughCalculator />
        </div>
      </main>
    </I18nProvider>
  );
};

export default Index;
