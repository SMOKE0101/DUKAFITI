
import { Package, ShoppingCart, BarChart3, Users } from 'lucide-react';

const SolutionSection = () => {
  const features = [
    {
      icon: Package,
      title: "Smart Inventory",
      description: "Track stock levels, set reorder alerts, and analyze which products make you the most money",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: ShoppingCart,
      title: "Quick Sales",
      description: "Process sales in seconds with support for cash, M-Pesa, and customer credit",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Business Insights",
      description: "Understand your customers, track profits, and make data-driven decisions",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build relationships with credit tracking, payment history, and loyalty programs",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-slate-900" data-scroll-trigger>
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Meet Your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Smart Shop Assistant
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Everything you need to run a modern shop, designed specifically for Kenyan business owners
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 hover:-translate-y-2"
              data-scroll-trigger
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10 space-y-4">
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-white/90">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Learn More Link */}
                <div className="pt-2">
                  <span className="text-sm text-blue-400 group-hover:text-blue-300 cursor-pointer">
                    Learn more →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-8 py-4">
            <span className="text-slate-300">Ready to transform your shop?</span>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-full text-white font-medium transition-all hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
