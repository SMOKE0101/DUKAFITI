
import { useState } from 'react';
import { ArrowRight, Play, Check, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ModernLanding = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const features = [
    {
      title: "Simplified Inventory & Sales",
      description: "Track stock levels, process sales quickly, and manage your products with ease.",
      icon: "📦"
    },
    {
      title: "M-Pesa & Credit Support", 
      description: "Accept M-Pesa payments instantly and manage customer credit seamlessly.",
      icon: "💳"
    },
    {
      title: "Offline Mode & Real-time Sync",
      description: "Continue working without internet and sync automatically when connected.",
      icon: "🔄"
    }
  ];

  const steps = [
    {
      title: "How Dukasmart works?",
      description: "Dukasmart is a modern POS system designed specifically for Kenyan dukashops. It helps you manage inventory, process sales, track customers, and grow your business with powerful analytics and reporting tools."
    },
    {
      title: "Complete business management",
      description: "The most important part of Dukasmart is its comprehensive approach. You get inventory management, sales tracking, customer management, M-Pesa integration, and detailed reports all in one simple platform."
    },
    {
      title: "Variety of payment options",
      description: "Accept cash, M-Pesa, and customer credit. Track all transactions automatically and provide customers with multiple convenient payment methods."
    }
  ];

  const testimonials = [
    {
      name: "Grace Mutua",
      role: "Shop Owner, Machakos",
      content: "Dukasmart transformed my business completely. Sales tracking is so easy now!",
      rating: 5
    },
    {
      name: "James Kiprotich", 
      role: "Electronics Store, Eldoret",
      content: "The M-Pesa integration is perfect. My customers love the convenience.",
      rating: 5
    },
    {
      name: "Mary Wanjiru",
      role: "General Store, Nakuru", 
      content: "Best investment for my shop. Everything is organized and efficient now.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <img 
                  src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                  alt="Dukasmart Logo" 
                  className="w-8 h-8"
                />
              </div>
              <span className="text-2xl font-bold text-primary">Dukasmart</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it Works</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/auth">Login</a>
              </Button>
              <Button asChild>
                <a href="/auth">Sign Up</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-primary leading-tight">
                You have the shop, you have the code
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Smart POS for Kenyan Dukashops. We made it beautiful and simple. It combines inventory management, sales tracking, and customer management. It is definitely the tool you need for your shop!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <a href="/auth">
                    Get Started - Free 14-day Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline">
                  <Play className="mr-2 w-5 h-5" />
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-12 h-12 bg-yellow-400 rounded-lg transform rotate-45" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <div className="text-4xl">⌘</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Easy Steps Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-primary mb-16">Easy steps</h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="p-6 border-l-4 border-l-primary">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-semibold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedStep === index ? 'rotate-180' : ''
                      }`} />
                    </button>
                    {expandedStep === index && (
                      <p className="mt-4 text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    )}
                    {index === 1 && expandedStep === index && (
                      <div className="mt-6 flex items-center space-x-4 p-4 bg-primary/5 rounded-lg">
                        <img src="/lovable-uploads/8d8ce036-eba9-4359-8db6-057c40d653b7.png" alt="Feature highlight" className="w-16 h-12 object-cover rounded" />
                        <div>
                          <h4 className="font-semibold text-primary">Smart POS Design</h4>
                          <p className="text-sm text-muted-foreground">
                            Dukasmart contains components which can easily be integrated into almost any shop workflow.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Spend Less Time Managing</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-primary-foreground/10 border-primary-foreground/20 text-white p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-primary-foreground/80">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sign Up Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-primary">
                Sign Up to Discover Dukasmart Features
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">NAME</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="Your email"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">PASSWORD</label>
                  <input 
                    type="password" 
                    placeholder="Your password"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3">
                  Sign Up
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  By signing up you agree to Our Terms and Privacy Policy
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-400 via-purple-500 to-pink-500 rounded-3xl aspect-square relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">What Our Customers Say</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <img 
                  src="/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png" 
                  alt="Dukasmart Logo" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-xl font-bold">Dukasmart</span>
            </div>
            <p className="text-muted">Smart POS for Kenyan Dukashops</p>
            <p className="text-sm text-muted mt-4">&copy; 2024 Dukasmart. Built for Kenyan entrepreneurs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernLanding;
