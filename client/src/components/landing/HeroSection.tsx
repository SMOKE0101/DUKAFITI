
import { ArrowRight, Smartphone, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const HeroSection = () => {
  const navigateToApp = () => {
    window.location.href = '/app';
  };

  useEffect(() => {
    // Scroll-triggered animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-scroll-trigger]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero-dukafiti relative overflow-hidden min-h-screen flex items-center">
      <div className="hero-background absolute inset-0" />
      
      {/* Main Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Column - Hero Text */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left" data-scroll-trigger>
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-green-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <span className="text-sm sm:text-base text-white font-medium">
                #1 Shop Management System in Kenya
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-white">Transform Your</span>
                <span className="block bg-gradient-to-r from-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                  Kenyan Shop
                </span>
                <span className="block text-white">Into a Smart Business</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Say goodbye to pen and paper. Track inventory, manage customers, process M-Pesa payments, and grow your business with Kenya's most trusted shop management system.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              {[
                "M-Pesa Integration",
                "Offline Support", 
                "Customer Management",
                "Real-time Reports"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start pt-4">
              <Button 
                size="lg"
                onClick={navigateToApp}
                className="bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 border-0"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 hover:text-white px-8 py-4 text-lg rounded-xl transition-all duration-300"
              >
                <Smartphone className="mr-2 w-6 h-6" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span>10,000+ Kenyan Shops</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>KSh 500M+ Sales Tracked</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 max-w-md mx-auto lg:mx-0">
                ✓ No credit card required  ✓ Full M-Pesa integration  ✓ Works offline
              </p>
            </div>
          </div>

          {/* Right Column - Hero Visual */}
          <div className="relative mt-8 lg:mt-0" data-scroll-trigger>
            {/* Phone Mockup */}
            <div className="relative mx-auto max-w-sm lg:max-w-lg">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-green-500/30 rounded-3xl blur-3xl transform rotate-6 animate-pulse" />
              
              {/* Phone Frame */}
              <div className="relative bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Phone Screen */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center mb-6 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-1">
                        <img 
                          src="/landing-logo-light.png" 
                          alt="DukaFiti" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-green-400 rounded-full"></div>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* App Interface Preview */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-green-500 rounded-xl p-4">
                      <h3 className="text-white font-semibold">Today's Sales</h3>
                      <p className="text-green-100 text-2xl font-bold">KSh 24,500</p>
                      <p className="text-green-200 text-sm">+15% from yesterday</p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700 rounded-lg p-3 text-center hover:bg-slate-600 transition-colors">
                        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-white text-xs">+</span>
                        </div>
                        <p className="text-white text-sm">New Sale</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-3 text-center hover:bg-slate-600 transition-colors">
                        <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-white text-xs">📦</span>
                        </div>
                        <p className="text-white text-sm">Inventory</p>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <h4 className="text-white text-sm font-semibold">Recent Sales</h4>
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm">Bread - 5 pcs</p>
                          <p className="text-slate-400 text-xs">2 mins ago</p>
                        </div>
                        <p className="text-green-400 font-semibold">KSh 250</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm">Milk - 2 packets</p>
                          <p className="text-slate-400 text-xs">5 mins ago</p>
                        </div>
                        <p className="text-green-400 font-semibold">KSh 120</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3 shadow-lg animate-bounce">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white rounded-full p-3 shadow-lg animate-pulse">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                fill="rgb(2 6 23)" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
