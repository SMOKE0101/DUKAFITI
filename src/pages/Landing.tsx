
import React from 'react';
import { NavigationHeader } from '../components/landing/NavigationHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { PainPointsSection } from '../components/landing/PainPointsSection';
import { SolutionSection } from '../components/landing/SolutionSection';
import { InteractiveDemoSection } from '../components/landing/InteractiveDemoSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';
import { TrialBanner } from '../components/landing/TrialBanner';
import { PWAInstallPrompt } from '../components/landing/PWAInstallPrompt';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <TrialBanner />
      <NavigationHeader />
      <main>
        <HeroSection />
        <PainPointsSection />
        <SolutionSection />
        <InteractiveDemoSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

export default Landing;
