
import CleanNavigationHeader from '@/components/landing/CleanNavigationHeader';
import CleanHeroSection from '@/components/landing/CleanHeroSection';
import EasyStepsSection from '@/components/landing/EasyStepsSection';
import FeatureHighlightsSection from '@/components/landing/FeatureHighlightsSection';
import CleanSignUpSection from '@/components/landing/CleanSignUpSection';
import Footer from '@/components/landing/Footer';

const CleanLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <CleanNavigationHeader />
      <CleanHeroSection />
      <EasyStepsSection />
      <FeatureHighlightsSection />
      <CleanSignUpSection />
      <Footer />
    </div>
  );
};

export default CleanLanding;
