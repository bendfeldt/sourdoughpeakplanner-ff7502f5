import { SourdoughCalculator } from '@/components/SourdoughCalculator';
import { usePersonas } from '@/hooks/use-personas';

const Index = () => {
  // A restored backup rebuilds the form from the restored starter, instead of keeping (and later saving) the old values
  const { restoreCount } = usePersonas();
  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 px-4 md:py-12">
        <SourdoughCalculator key={restoreCount} />
      </div>
    </main>
  );
};

export default Index;
