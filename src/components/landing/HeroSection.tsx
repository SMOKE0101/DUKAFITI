import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';
import CubeLogo from '@/components/branding/CubeLogo';

export const HeroSection = () => {
  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-gray-100/50 dark:bg-grid-gray-800/50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <CubeLogo size="lg" className="w-16 h-16" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-normal mb-6 text-gray-900 dark:text-white leading-tight">
            <span className="font-caesar tracking-wide">DUKAFITI</span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-700 dark:text-gray-300">
              Smart Business Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your small business with our comprehensive point-of-sale and inventory management system. Track sales, manage inventory, and grow your business with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup">
              <Button size="lg" className="px-8">
                Get Started <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="px-8">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Point of Sale (POS)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Streamline your sales process with our intuitive POS system.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Inventory Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep track of your stock levels and avoid stockouts.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Sales Reporting
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get insights into your sales performance with detailed reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
