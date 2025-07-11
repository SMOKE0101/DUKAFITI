
import { Store, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EasyStepsSection = () => {
  const steps = [
    {
      number: "1",
      title: "Set Up Your Shop",
      description: "Add your products, set prices, and configure your shop details in minutes. Our intuitive interface makes setup effortless.",
      icon: Store,
      color: "bg-purple-100 text-purple-600"
    },
    {
      number: "2", 
      title: "Start Selling & Tracking",
      description: "Process sales, accept M-Pesa payments, and track inventory in real-time. Everything syncs automatically across devices.",
      icon: BarChart3,
      color: "bg-teal-100 text-teal-600"
    },
    {
      number: "3",
      title: "Grow Your Business",
      description: "Use detailed reports and customer insights to make smarter business decisions and increase your profits.",
      icon: TrendingUp,
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <section id="overview" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How DUKAFITI Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get your shop running smart in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-2xl font-bold rounded-full mb-6 group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 ${step.color} rounded-lg mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline"
            className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-xl"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More About Features
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EasyStepsSection;
