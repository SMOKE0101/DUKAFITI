
import { Package, Smartphone, Users, BarChart, Wifi, RefreshCw } from 'lucide-react';

const FeatureHighlightsSection = () => {
  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels, set alerts, and never run out of popular items again.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Smartphone,
      title: "M-Pesa Integration", 
      description: "Accept mobile payments seamlessly with built-in M-Pesa support.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Users,
      title: "Customer Tracking",
      description: "Manage customer relationships and track purchase history effortlessly.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: BarChart,
      title: "Sales Reports",
      description: "Get detailed insights into your business performance and trends.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Wifi,
      title: "Offline Mode",
      description: "Keep selling even without internet. All data syncs when you're back online.",
      color: "bg-teal-100 text-teal-600"
    },
    {
      icon: RefreshCw,
      title: "Real-time Sync",
      description: "All your data stays up-to-date across all your devices automatically.",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Spend Less Time Managing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Focus on growing your business while DUKAFITI handles the complex stuff
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} rounded-lg mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlightsSection;
