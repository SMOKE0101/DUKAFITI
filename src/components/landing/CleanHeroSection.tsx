
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CleanHeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-purple-50 to-teal-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Kenyan Shop Into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-500">
              Smart Business
            </span>
          </h1>
          
          {/* Tagline */}
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Smart POS for Kenyan Dukashops. Manage inventory, track sales, accept M-Pesa payments, and grow your business with our all-in-one solution.
          </p>

          {/* Key Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100">
              <span className="text-sm font-medium text-gray-700">✓ M-Pesa Integration</span>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100">
              <span className="text-sm font-medium text-gray-700">✓ Offline Mode</span>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100">
              <span className="text-sm font-medium text-gray-700">✓ Real-time Sync</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link to="/signup">
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Started – Free 14-day Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Trusted by 10,000+ Kenyan shop owners</p>
            <div className="flex justify-center items-center space-x-6 text-xs text-gray-400">
              <span>🇰🇪 Made in Kenya</span>
              <span>•</span>
              <span>💳 M-Pesa Ready</span>
              <span>•</span>
              <span>📱 Mobile First</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleanHeroSection;
