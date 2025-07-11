
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CleanSignUpSection = () => {
  const [email, setEmail] = useState('');

  const benefits = [
    "14-day free trial",
    "No credit card required", 
    "Full M-Pesa integration",
    "24/7 customer support"
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-teal-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Form */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sign Up to Discover DUKAFITI Features
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of Kenyan shop owners who've transformed their business with our smart POS system.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <Link to="/signup" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold">
                  Get Started – Free 14-day Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Already have an account?{' '}
              <Link to="/signin" className="text-purple-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Right Side - Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/lovable-uploads/d7a8889a-593a-4af6-acd3-00ef070f03fd.png"
                alt="Modern POS System"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Happy Merchants</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-white rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold text-purple-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleanSignUpSection;
