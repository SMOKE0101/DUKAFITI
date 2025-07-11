
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import InteractiveDemoSection from '@/components/landing/InteractiveDemoSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';
import NavigationHeader from '@/components/landing/NavigationHeader';
import PainPointsSection from '@/components/landing/PainPointsSection';
import PWAInstallPrompt from '@/components/landing/PWAInstallPrompt';
import TrialBanner from '@/components/landing/TrialBanner';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <NavigationHeader />
      <PWAInstallPrompt />
      <TrialBanner />
      <HeroSection />
      <ProblemSection />
      <PainPointsSection />
      <SolutionSection />
      <InteractiveDemoSection />
      <TestimonialsSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Landing;
