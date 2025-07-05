
import { ArrowRight, Smartphone, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const navigateToApp = () => {
    window.location.href = '/app';
  };

  return (
    <section className="hero-dukafiti relative overflow-hidden">
      <div className="hero-background" />
      
      {/* Main Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh]">
          
          {/* Left Column - Hero Text */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-green-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-sm sm:text-base text-white font-medium">
                #1 Shop Management System in Kenya
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="block text-white">Transform Your</span>
                <span className="block bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                  Kenyan Shop
                </span>
                <span className="block text-white">Into a Smart Business</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Say goodbye to pen and paper. Track inventory, manage customers, process M-Pesa payments, and grow your business with Kenya's most trusted shop management system.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
              <Button 
                size="lg"
                onClick={navigateToApp}
                className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 border-0"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl transition-all duration-300"
              >
                <Smartphone className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 sm:pt-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 text-sm sm:text-base text-slate-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span>10,000+ Kenyan Shops</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <span>KSh 500M+ Sales Tracked</span>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto lg:mx-0">
                ✓ No credit card required  ✓ Full M-Pesa integration  ✓ Works offline
              </p>
            </div>
          </div>

          {/* Right Column - Hero Visual */}
          <div className="relative mt-8 lg:mt-0">
            {/* Phone Mockup */}
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-lg">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-green-500/30 rounded-3xl blur-3xl transform rotate-6" />
              
              {/* Phone Frame */}
              <div className="relative bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Phone Screen */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-6">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center mb-4 sm:mb-6 text-xs sm:text-sm text-slate-400">
                    <span>DukaFiti</span>
                    <span>100%</span>
                  </div>
                  
                  {/* App Interface Preview */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-green-500 rounded-xl p-3 sm:p-4">
                      <h3 className="text-white font-semibold text-sm sm:text-base">Today's Sales</h3>
                      <p className="text-green-100 text-lg sm:text-xl font-bold">KSh 24,500</p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-slate-700 rounded-lg p-2 sm:p-3 text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full mx-auto mb-1 sm:mb-2" />
                        <p className="text-white text-xs sm:text-sm">New Sale</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-2 sm:p-3 text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full mx-auto mb-1 sm:mb-2" />
                        <p className="text-white text-xs sm:text-sm">Inventory</p>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-2 sm:p-3">
                        <div>
                          <p className="text-white text-xs sm:text-sm">Bread - 5 pcs</p>
                          <p className="text-slate-400 text-xs">2 mins ago</p>
                        </div>
                        <p className="text-green-400 font-semibold text-xs sm:text-sm">KSh 250</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-2 sm:p-3">
                        <div>
                          <p className="text-white text-xs sm:text-sm">Milk - 2 packets</p>
                          <p className="text-slate-400 text-xs">5 mins ago</p>
                        </div>
                        <p className="text-green-400 font-semibold text-xs sm:text-sm">KSh 120</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-2 sm:p-3 shadow-lg animate-bounce">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white rounded-full p-2 sm:p-3 shadow-lg animate-pulse">
                <Users className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-12 sm:h-16 lg:h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                fill="rgb(15 23 42)" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
