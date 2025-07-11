
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';

const CleanNavigationHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/dedf9c88-aa30-41f1-9cb1-97691bcb580f.png'
    : '/lovable-uploads/89b3e0a6-730e-4441-8bec-2776d3c222d6.png';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={logoSrc}
                alt="DUKAFITI Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">DUKAFITI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#overview" className="text-gray-600 hover:text-gray-900 font-medium">
              Overview
            </a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
              Pricing
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">
              About
            </a>
            <Link to="/signin" className="text-gray-600 hover:text-gray-900 font-medium">
              Login
            </Link>
            <Link to="/signup">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMenu}
              className="text-gray-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <a
                href="#overview"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={toggleMenu}
              >
                Overview
              </a>
              <a
                href="#features"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={toggleMenu}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={toggleMenu}
              >
                Pricing
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={toggleMenu}
              >
                About
              </a>
              <Link
                to="/signin"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link to="/signup" onClick={toggleMenu}>
                <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CleanNavigationHeader;
