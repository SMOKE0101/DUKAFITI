
import NavigationHeader from '@/components/landing/NavigationHeader';
import HeroSection from '@/components/landing/HeroSection';
import PainPointsSection from '@/components/landing/PainPointsSection';
import SolutionSection from '@/components/landing/SolutionSection';
import InteractiveDemoSection from '@/components/landing/InteractiveDemoSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';
import { useEffect } from 'react';

const ModernLanding = () => {
  useEffect(() => {
    // Add global styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .hero-dukafiti {
        background: linear-gradient(135deg, 
          rgb(15 23 42) 0%, 
          rgb(30 41 59) 25%, 
          rgb(51 65 85) 50%, 
          rgb(30 41 59) 75%, 
          rgb(15 23 42) 100%
        );
        position: relative;
      }
      
      .hero-background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
          radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
        animation: float 20s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-20px) rotate(1deg); }
        66% { transform: translateY(-10px) rotate(-1deg); }
      }
      
      [data-scroll-trigger] {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      [data-scroll-trigger].animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      
      .feature-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .feature-card:hover {
        transform: translateY(-8px);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      <NavigationHeader />
      <HeroSection />
      <PainPointsSection />  
      <SolutionSection />
      <InteractiveDemoSection />
      <TestimonialsSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default ModernLanding;
