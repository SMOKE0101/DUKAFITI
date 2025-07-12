
import { AlertTriangle, TrendingDown, Users, CreditCard, ArrowRight } from 'lucide-react';

const PainPointsSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Memory-Based Management",
      description: "Relying on memory for inventory levels, prices, and customer debts leads to costly mistakes and lost profits",
      impact: "Up to 30% revenue loss"
    },
    {
      icon: TrendingDown,
      title: "No Business Insights",
      description: "Without proper tracking, you can't identify your best products, peak hours, or customer buying patterns",
      impact: "Missing growth opportunities"
    },
    {
      icon: Users,
      title: "Lost Customer Data",
      description: "Customer purchase history and preferences are forgotten, reducing repeat sales and loyalty",
      impact: "40% lower customer retention"
    },
    {
      icon: CreditCard,
      title: "Limited Payment Options",
      description: "Cash-only transactions in Kenya's digital economy limits sales and customer convenience",
      impact: "60% of customers prefer M-Pesa"
    }
  ];

  return (
    <section id="problems" className="py-16 sm:py-20 lg:py-24 bg-slate-950 relative overflow-hidden" data-scroll-trigger>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #ef4444 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #f97316 0%, transparent 50%)`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-sm sm:text-base text-red-300 font-medium">The Hidden Cost of Old Methods</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            <span className="text-white">Running a Shop Shouldn't</span>
            <br />
            <span className="text-red-400">Feel Like Chaos</span>
          </h2>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Most Kenyan shop owners struggle with outdated methods that secretly hurt their business growth
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 sm:p-8 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-2"
              data-scroll-trigger
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 space-y-4 sm:space-y-6">
                {/* Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-300">
                  <problem.icon className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>

                {/* Content */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-red-100 transition-colors">
                    {problem.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    {problem.description}
                  </p>
                  
                  {/* Impact Badge */}
                  <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 sm:px-4 py-1 sm:py-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm text-red-300 font-medium">{problem.impact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Representation */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          
          {/* Problem Visualization */}
          <div className="relative order-2 lg:order-1">
            <div className="relative bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-800/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <span className="text-red-400 font-semibold text-sm sm:text-base">Current Method</span>
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 animate-pulse" />
                </div>
                
                {/* Scattered Notes */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 sm:p-4 rounded-lg transform -rotate-2 hover:rotate-0 transition-transform">
                    <div className="text-sm sm:text-base text-yellow-300">Remember: Mary owes KSh 500</div>
                    <div className="text-xs text-yellow-400 mt-1">When was this again? 🤔</div>
                  </div>
                  
                  <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 sm:p-4 rounded-lg transform rotate-1 hover:rotate-0 transition-transform">
                    <div className="text-sm sm:text-base text-yellow-300">Buy more milk tomorrow?</div>
                    <div className="text-xs text-yellow-400 mt-1">How many left? 🥛</div>
                  </div>
                  
                  <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 sm:p-4 rounded-lg transform -rotate-1 hover:rotate-0 transition-transform">
                    <div className="text-sm sm:text-base text-yellow-300">Check sugar price changes</div>
                    <div className="text-xs text-yellow-400 mt-1">Still profitable? 📊</div>
                  </div>
                </div>
                
                {/* Calculator */}
                <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl p-4 sm:p-6">
                  <div className="text-right text-green-400 mb-3 sm:mb-4 text-lg sm:text-xl font-mono">1,245.00</div>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {[7,8,9,4,5,6,1,2,3].map(num => (
                      <button 
                        key={num} 
                        className="bg-slate-700 hover:bg-slate-600 text-white text-center py-2 sm:py-3 rounded text-sm sm:text-base font-mono transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Warning Indicators */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-white text-sm sm:text-base font-bold">!</span>
              </div>
              
              <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-sm sm:text-base font-bold">?</span>
              </div>
            </div>
          </div>

          {/* Solution Teaser */}
          <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 sm:px-6 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm sm:text-base text-green-300 font-medium">There's a Better Way</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                What if your shop could run itself while you focus on growing your business?
              </h3>
              
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Imagine having all your sales, inventory, and customer data automatically tracked and analyzed. 
                No more guessing, no more lost opportunities—just clear insights that help you make profitable decisions.
              </p>
            </div>

            {/* Benefits Preview */}
            <div className="space-y-3 sm:space-y-4">
              {[
                "Automatic inventory tracking with low-stock alerts",
                "Customer debt management with payment reminders",
                "M-Pesa integration for instant payments",
                "Daily, weekly, and monthly business reports"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 group">
                  <div className="w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                  <span className="text-sm sm:text-base text-slate-300 group-hover:text-white transition-colors">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-4 sm:pt-6">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
              >
                <span className="text-sm sm:text-base">See How DukaFiti Solves This</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
