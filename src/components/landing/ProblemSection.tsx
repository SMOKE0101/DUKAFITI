
import { AlertTriangle, TrendingDown, Users, CreditCard } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Memory-Based Management",
      description: "Relying on memory for inventory levels, prices, and customer debts leads to costly mistakes"
    },
    {
      icon: TrendingDown,
      title: "No Business Insights",
      description: "Without proper tracking, you can't see which products are profitable or identify trends"
    },
    {
      icon: Users,
      title: "Lost Customer Data",
      description: "Customer purchase history and preferences are lost, missing opportunities for growth"
    },
    {
      icon: CreditCard,
      title: "Limited Payment Options",
      description: "Cash-only transactions in a digital world limits your customer base and convenience"
    }
  ];

  return (
    <section className="py-20 bg-slate-950" data-scroll-trigger>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Problem Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              {/* Chaotic Illustration */}
              <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-2xl p-8 border border-red-800/30">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-semibold">Current Method</span>
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  
                  {/* Scattered Notes */}
                  <div className="space-y-3">
                    <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 rounded transform -rotate-2">
                      <div className="text-sm text-yellow-300">Remember: Mary owes 500</div>
                    </div>
                    <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 rounded transform rotate-1">
                      <div className="text-sm text-yellow-300">Buy more milk tomorrow?</div>
                    </div>
                    <div className="bg-yellow-200/10 border border-yellow-600/30 p-3 rounded transform -rotate-1">
                      <div className="text-sm text-yellow-300">Check sugar price</div>
                    </div>
                  </div>
                  
                  {/* Calculator */}
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                    <div className="text-right text-green-400 mb-2">1,245.00</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[7,8,9,4,5,6,1,2,3].map(num => (
                        <div key={num} className="bg-slate-700 text-center py-2 rounded text-sm">
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Warning indicators */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-sm">!</span>
              </div>
            </div>
          </div>

          {/* Problem Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Running a Shop Shouldn't Feel Like{' '}
                <span className="text-red-400">Chaos</span>
              </h2>
              <p className="text-xl text-slate-300">
                Most shop owners struggle with outdated methods that hurt their business growth
              </p>
            </div>

            <div className="space-y-6">
              {problems.map((problem, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 group"
                  data-scroll-trigger
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <problem.icon className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {problem.title}
                    </h3>
                    <p className="text-slate-300">
                      {problem.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
