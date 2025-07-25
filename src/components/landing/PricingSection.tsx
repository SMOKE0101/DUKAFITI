
import { Check, Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  const navigateToApp = () => {
    window.location.href = '/app';
  };

  const features = [
    "Unlimited products & inventory tracking",
    "Unlimited sales & customer management", 
    "M-Pesa payment integration",
    "Detailed business reports & analytics",
    "Customer debt tracking & reminders",
    "Low stock alerts & notifications",
    "Offline mode - works without internet",
    "Data backup & sync across devices",
    "SMS notifications to customers",
    "Multi-currency support (KSh, USD)",
    "Barcode scanning for quick sales",
    "Daily, weekly & monthly reports"
  ];

  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, #6366f1 0%, transparent 50%), 
                           radial-gradient(circle at 80% 80%, #10b981 0%, transparent 50%)`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-sm sm:text-base text-purple-300 font-medium">Simple, Transparent Pricing</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            <span className="text-white">Start Free, Scale</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              When Ready
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            No hidden fees, no long-term contracts. Pay only when your business grows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 max-w-5xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          
          {/* Free Trial Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:border-slate-600">
              
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 sm:px-4 py-1 sm:py-2 mb-4">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm text-blue-300 font-medium">START HERE</span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Free Trial</h3>
                <p className="text-slate-400 text-sm sm:text-base">Perfect for getting started</p>
                
                <div className="mt-4 sm:mt-6">
                  <div className="text-4xl sm:text-5xl font-bold text-white">FREE</div>
                  <div className="text-slate-400 text-sm sm:text-base">for 14 days</div>
                </div>
              </div>

              {/* Trial Limits */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4">
                  <div className="text-white font-semibold text-sm sm:text-base">Trial Includes:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-slate-300">
                    <div>• 250 Products</div>
                    <div>• 1,500 Sales</div>
                    <div>• 50 Customers</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-400">
                    ✓ All features included ✓ No credit card required ✓ Cancel anytime
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button 
                onClick={navigateToApp}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 border-0"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Standard Plan Card */}
          <div className="relative group">
            {/* Popular Badge */}
            <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-sm border-2 border-green-500/30 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:border-green-500/50">
              
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 sm:px-4 py-1 sm:py-2 mb-4">
                  <Crown className="w-4 h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-green-300 font-medium">RECOMMENDED</span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">DukaFiti Standard</h3>
                <p className="text-slate-400 text-sm sm:text-base">Everything you need to grow</p>
                
                <div className="mt-4 sm:mt-6">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white">KSh 200</span>
                    <span className="text-lg sm:text-xl text-slate-400">/month</span>
                  </div>
                  <div className="text-green-400 text-xs sm:text-sm font-medium mt-1">
                    That's only KSh 6.67 per day!
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
                <div className="text-center">
                  <div className="text-green-300 font-semibold text-sm sm:text-base mb-1">💡 Smart Investment</div>
                  <div className="text-xs sm:text-sm text-slate-300">
                    If DukaFiti helps you sell just 1 extra item per day, it pays for itself!
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button 
                onClick={navigateToApp}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 border-0"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <p className="text-center text-xs sm:text-sm text-slate-400 mt-2 sm:mt-3">
                Start with 14-day free trial, then KSh 200/month
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Everything Included in Both Plans
            </h3>
            <p className="text-base sm:text-lg text-slate-400">
              All features available during trial and after upgrade
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-3 sm:p-4 hover:border-slate-600 transition-colors group"
              >
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                </div>
                <span className="text-sm sm:text-base text-slate-300 group-hover:text-white transition-colors">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20">
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Join 10,000+ Kenyan Shop Owners
              </h3>
              
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                "DukaFiti transformed my small shop into a modern business. I now track everything and my profits have increased by 40%!" - Sarah M., Nairobi
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={navigateToApp}
                  className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 border-0"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                
                <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
                  <div>✓ Setup in 2 minutes</div>
                  <div>✓ No technical skills needed</div>
                  <div>✓ Cancel anytime</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 sm:px-6 py-2 sm:py-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">30</span>
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm text-blue-300 font-medium">30-Day Money Back</div>
              <div className="text-xs text-slate-400">Risk-free guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
