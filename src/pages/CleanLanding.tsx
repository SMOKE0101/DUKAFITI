
import { EmailProvider } from '@/contexts/EmailContext';
import CleanNavigationHeader from '@/components/landing/CleanNavigationHeader';
import CleanHeroSection from '@/components/landing/CleanHeroSection';
import EasyStepsSection from '@/components/landing/EasyStepsSection';
import FeatureHighlightsSection from '@/components/landing/FeatureHighlightsSection';
import CleanSignUpSection from '@/components/landing/CleanSignUpSection';
import Footer from '@/components/landing/Footer';

const CleanLanding = () => {
  return (
    <EmailProvider>
      <div className="min-h-screen bg-white">
        <CleanNavigationHeader />
        <CleanHeroSection />
        <div id="overview">
          <EasyStepsSection />
        </div>
        <div id="features">
          <FeatureHighlightsSection />
        </div>
        <CleanSignUpSection />
        <Footer />
      </div>
    </EmailProvider>
  );
};

export default CleanLanding;
