
import { Mail, Phone, MapPin, Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Live Demo', href: '#demo' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Success Stories', href: '#testimonials' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Support', href: 'mailto:support@dukafiti.com' },
      { name: 'WhatsApp Support', href: 'https://wa.me/254700000000', external: true },
      { name: 'Video Tutorials', href: '/tutorials' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' }
    ]
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLinkClick = (href: string, external?: boolean) => {
    if (href.startsWith('#')) {
      scrollToSection(href);
    } else if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #10b981 0%, transparent 50%)`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">DF</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                  DukaFiti
                </span>
                <span className="text-sm text-green-400 font-medium -mt-1">
                  Jua Duka Yako
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base text-slate-400 leading-relaxed">
              Kenya's most trusted shop management system. Transform your business with smart inventory tracking, customer management, and M-Pesa integration.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-slate-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:support@dukafiti.com" className="hover:underline">
                  support@dukafiti.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+254700000000" className="hover:underline">
                  +254 700 000 000
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link.href)}
                    className="text-slate-400 hover:text-white transition-colors text-sm hover:underline text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link.href, link.external)}
                    className="text-slate-400 hover:text-white transition-colors text-sm hover:underline text-left flex items-center space-x-1"
                  >
                    <span>{link.name}</span>
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link.href)}
                    className="text-slate-400 hover:text-white transition-colors text-sm hover:underline text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Newsletter Signup */}
            <div className="pt-4">
              <h4 className="text-base font-semibold text-white mb-3">Stay Updated</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Get updates on new features and shop management tips.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 sm:pt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            
            {/* Copyright */}
            <div className="flex items-center space-x-1 text-sm text-slate-400">
              <span>© {currentYear} DukaFiti. Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for Kenyan entrepreneurs.</span>
            </div>

            {/* Social Links & Additional Info */}
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <span>🇰🇪 Proudly Kenyan</span>
              <span>•</span>
              <span>💳 M-Pesa Ready</span>
              <span>•</span>
              <span>📱 Mobile First</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-800">
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                </div>
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                </div>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                </div>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-green-500 to-blue-600" />
    </footer>
  );
};

export default Footer;
