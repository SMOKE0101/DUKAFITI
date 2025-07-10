import { useState } from 'react';
import { ArrowRight, Play, Check, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const ModernLanding = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      setSignUpError('Please fill in all fields');
      return;
    }

    if (signUpData.password.length < 6) {
      setSignUpError('Password must be at least 6 characters');
      return;
    }

    setIsSigningUp(true);
    
    try {
      const { error } = await signUp(signUpData.email, signUpData.password, {
        full_name: signUpData.name
      });
      
      if (error) {
        setSignUpError(error.message);
      } else {
        navigate('/app');
      }
    } catch (err) {
      setSignUpError('An unexpected error occurred');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpData({
      ...signUpData,
      [e.target.name]: e.target.value
    });
  };

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
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="hover:bg-muted/50">
                <Link to="/signin">Login</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/signup">Sign Up</Link>
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
                  <a href="/signup">
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

      {/* Enhanced Sign Up Section */}
      <section className="py-20 bg-gradient-to-br from-muted/20 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-primary mb-4">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Join thousands of Kenyan shop owners who trust Dukasmart to manage their business efficiently.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-border/50">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">Get Started Today</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg border border-success/20">
                      <span className="text-2xl">✨</span>
                      <span className="text-sm font-medium text-success">14-day free trial • No credit card required</span>
                    </div>
                  </div>

                  {/* Google Sign Up */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full py-3 text-base font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all hover:scale-[1.02]"
                    asChild
                  >
                    <Link to="/signup">
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Link>
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {signUpError && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                      {signUpError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        name="name"
                        value={signUpData.name}
                        onChange={handleInputChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <input 
                        type="email" 
                        name="email"
                        value={signUpData.email}
                        onChange={handleInputChange}
                        placeholder="Email Address"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <input 
                        type="password" 
                        name="password"
                        value={signUpData.password}
                        onChange={handleInputChange}
                        placeholder="Password (min. 6 characters)"
                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSigningUp}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 text-base font-semibold rounded-xl transition-all hover:scale-[1.02] disabled:hover:scale-100"
                    >
                      {isSigningUp ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating Account...
                        </div>
                      ) : (
                        'Start Free Trial'
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-primary hover:underline underline-offset-4 font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-400 via-purple-500 to-pink-500 rounded-3xl aspect-square relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-6">🏪</div>
                    <h3 className="text-2xl font-bold mb-4">Your Success Story Starts Here</h3>
                    <div className="space-y-2 text-lg opacity-90">
                      <p>✓ 10,000+ Happy Shop Owners</p>
                      <p>✓ 99.9% Uptime Guarantee</p>
                      <p>✓ 24/7 Customer Support</p>
                    </div>
                  </div>
                </div>
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
