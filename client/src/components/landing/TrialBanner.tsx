
import { useState } from 'react';
import { X, Star } from 'lucide-react';

const TrialBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 relative overflow-hidden">
      <div className="container mx-auto flex items-center justify-center space-x-2 sm:space-x-4 text-center">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-xs sm:text-sm">Start Your Free 14-Day Trial</span>
        </div>
        <span className="hidden sm:inline text-sm">•</span>
        <span className="text-xs sm:text-sm">
          <span className="hidden sm:inline">No credit card • 250 products • 1,500 sales • 50 customers • Then just KSh 200/month</span>
          <span className="sm:hidden">No credit card • KSh 200/month after trial</span>
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
