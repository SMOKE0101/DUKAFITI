
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import PainPointsSection from '../components/landing/PainPointsSection';
import SolutionSection from '../components/landing/SolutionSection';
import InteractiveDemoSection from '../components/landing/InteractiveDemoSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';
import NavigationHeader from '../components/landing/NavigationHeader';
import PWAInstallPrompt from '../components/landing/PWAInstallPrompt';
import TrialBanner from '../components/landing/TrialBanner';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';

const Landing = () => {
  const landingRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { isInstalledApp } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Smart routing: If user is authenticated and using installed app, go directly to app
    if (isAuthenticated && isInstalledApp) {
      navigate('/app', { replace: true });
      return;
    }
  }, [isAuthenticated, isInstalledApp, navigate]);

  useEffect(() => {
    // Initialize scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.classList.add('animate-in');
          
          // Trigger specific animations based on element type
          if (element.classList.contains('counter')) {
            animateCounter(element);
          } else if (element.classList.contains('feature-card')) {
            staggerFeatureCards(element);
          } else if (element.classList.contains('pain-point')) {
            animatePainPointSolution(element);
          }
        }
      });
    }, observerOptions);

    // Apply observer to all animated elements
    const animatedElements = document.querySelectorAll('[data-scroll-trigger]');
    animatedElements.forEach(el => animationObserver.observe(el));

    // Preload critical resources for DukaFiti
    preloadCriticalResources();

    // Initialize PWA features
    initializePWAFeatures();

    return () => {
      animatedElements.forEach(el => animationObserver.unobserve(el));
    };
  }, []);

  const animateCounter = (element: HTMLElement) => {
    const target = parseInt(element.dataset.target || '0');
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString();
    }, 16);
  };

  const staggerFeatureCards = (element: HTMLElement) => {
    const cards = element.parentElement?.querySelectorAll('.feature-card') || [];
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('slide-in-up');
      }, index * 150);
    });
  };

  const animatePainPointSolution = (element: HTMLElement) => {
    // Animate pain point first, then solution
    element.classList.add('animate-in');
    const solutionElement = element.nextElementSibling;
    if (solutionElement?.classList.contains('solution-reveal')) {
      setTimeout(() => {
        solutionElement.classList.add('animate-in');
      }, 300);
    }
  };

  const preloadCriticalResources = () => {
    const criticalResources = [
      '/images/dukafiti-hero-bg.webp',
      '/images/kenyan-shop-mockup.webp',
      '/images/mpesa-integration.webp'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'image';
      document.head.appendChild(link);
    });
  };

  const initializePWAFeatures = () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('DukaFiti PWA is installed');
      return;
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
      
      // Show custom install prompt after user scrolls
      setTimeout(() => {
        const installPrompt = document.getElementById('pwa-install-prompt');
        if (installPrompt) {
          installPrompt.classList.add('show');
        }
      }, 5000);
    });
  };

  return (
    <div 
      ref={landingRef} 
      className="landing-page bg-slate-900 text-white overflow-x-hidden min-h-screen w-full"
    >
      <TrialBanner />
      <NavigationHeader />
      <main className="relative w-full">
        <div className="w-full">
          <HeroSection />
          <PainPointsSection />
          <SolutionSection />
          <InteractiveDemoSection />
          <TestimonialsSection />
          <PricingSection />
        </div>
      </main>
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

export default Landing;
