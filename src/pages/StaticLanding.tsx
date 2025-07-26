import React from 'react';
import { ArrowRight, Check, Menu, X } from 'lucide-react';
import { useState } from 'react';

const StaticLanding = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">DukaFiti</span>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a href="#hero" className="text-gray-600 hover:text-gray-900 transition-colors">
                Intro
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#signup" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign Up
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <a 
                href="/signin" 
                className="hidden sm:flex px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Login
              </a>
              <a 
                href="/signup" 
                className="hidden sm:flex px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Get Started
              </a>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              <a href="#hero" className="block text-gray-600 hover:text-gray-900 py-2">
                Intro
              </a>
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2">
                Features
              </a>
              <a href="#signup" className="block text-gray-600 hover:text-gray-900 py-2">
                Sign Up
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <a href="/signin" className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700">
                  Login
                </a>
                <a href="/signup" className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              We've Got Your Duka Covered
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              DukaFiti ni POS rahisi kabisa kwa maduka ya Kenya. Hakuna maneno mengi—usimamia stoko, uziuze kwa haraka na upokee malipo ya M‑Pesa, na wafuate wateja wako kwa urahisi. DukaFiti ni mshirika wako wa kila siku kwa biashara yako!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Spend Less Time Managing</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
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
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join thousands of Kenyan shop owners who trust DukaFiti to manage their business efficiently.
          </p>
          <a 
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold"
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <span className="text-xl font-bold">DukaFiti</span>
            </div>
            <p className="text-gray-400">
              © 2024 DukaFiti. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StaticLanding;