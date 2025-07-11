import { useState } from 'react';
import { ArrowRight, CheckCircle, Star, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';

const ModernLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/2ef68a87-0566-45d5-9858-3e800431181a.png'
    : '/lovable-uploads/e649c2a5-648c-492b-b03d-4643ea3118ca.png';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={logoSrc}
                alt="DUKAFITI Logo" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold text-primary">DUKAFITI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Reviews</a>
              <Link to="/signin" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Sign In</Link>
              <Link to="/signup">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="block text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Pricing</a>
              <a href="#testimonials" className="block text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Reviews</a>
              <Link to="/signin" className="block text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Sign In</Link>
              <Link to="/signup">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Transform Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Duka Business
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most powerful POS system designed specifically for Kenyan shop owners. 
              Manage inventory, track sales, and grow your business with DUKAFITI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 rounded-xl border-2">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              ✨ 14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Run Your Duka
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From inventory management to customer tracking, DUKAFITI has all the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Inventory",
                description: "Track stock levels, set low-stock alerts, and manage suppliers effortlessly."
              },
              {
                title: "M-Pesa Integration",
                description: "Accept M-Pesa payments directly and reconcile transactions automatically."
              },
              {
                title: "Customer Management",
                description: "Build customer profiles, track purchase history, and manage credit sales."
              },
              {
                title: "Sales Analytics",
                description: "Get insights into your best-selling products and peak sales times."
              },
              {
                title: "Multi-User Access",
                description: "Add employees with different permission levels for secure operations."
              },
              {
                title: "Offline Mode",
                description: "Continue selling even without internet. Data syncs when you're back online."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Duka?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of shop owners who have already modernized their business with DUKAFITI.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ModernLanding;
