
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';

const NavigationHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navigateToApp = () => {
    window.location.href = '/app';
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-slate-900/80 backdrop-blur-sm'
    }`}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* DukaFiti Brand Logo */}
          <div className="flex items-center">
            <img 
              src={theme === 'dark' ? '/landing-logo-dark.png' : '/landing-logo-light.png'}
              alt="DukaFiti Logo" 
              className="h-10 w-auto transition-all duration-300 ease-in-out"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-slate-200 hover:text-white transition-colors font-medium text-sm hover:scale-105 transform duration-200"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('demo')}
              className="text-slate-200 hover:text-white transition-colors font-medium text-sm hover:scale-105 transform duration-200"
            >
              Live Demo
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-slate-200 hover:text-white transition-colors font-medium text-sm hover:scale-105 transform duration-200"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-slate-200 hover:text-white transition-colors font-medium text-sm hover:scale-105 transform duration-200"
            >
              Success Stories
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-all duration-200"
              onClick={navigateToApp}
            >
              Sign In
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-medium border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={navigateToApp}
            >
              Start 14-Day Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md rounded-lg">
            <div className="flex flex-col space-y-4 px-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-slate-200 hover:text-white transition-colors text-left font-medium text-sm py-2"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('demo')}
                className="text-slate-200 hover:text-white transition-colors text-left font-medium text-sm py-2"
              >
                Live Demo
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-slate-200 hover:text-white transition-colors text-left font-medium text-sm py-2"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-slate-200 hover:text-white transition-colors text-left font-medium text-sm py-2"
              >
                Success Stories
              </button>
              <div className="pt-4 space-y-3 border-t border-white/10">
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-200 hover:text-white justify-start font-medium"
                  onClick={navigateToApp}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-medium border-0"
                  onClick={navigateToApp}
                >
                  Start 14-Day Free Trial
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavigationHeader;
