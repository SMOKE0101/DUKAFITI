
import { useTheme } from 'next-themes';

const Footer = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/77d747ef-d8fb-4a5c-b4c7-3e43d709d5f3.png'
    : '/lovable-uploads/b8e58169-8231-49d4-95c5-39d340fd66dd.png';

  return (
    <footer id="about" className="bg-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #10b981 0%, transparent 50%)`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        
        {/* Simplified Footer Content */}
        <div className="text-center space-y-8">
          
          {/* Logo and Brand */}
          <div className="flex flex-col items-center space-y-4">
            <img 
              src={logoSrc}
              alt="DUKAFITI Logo" 
              className="h-16 w-auto"
            />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                DUKAFITI
              </span>
              <span className="text-lg text-green-400 font-medium">
                Jua Duka Yako
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Kenya's most trusted shop management system. Transform your business with smart inventory tracking, customer management, and M-Pesa integration.
          </p>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col items-center space-y-4">
              
              {/* Copyright */}
              <div className="flex items-center space-x-2 text-slate-400">
                <span>© {currentYear} DUKAFITI. Made with ❤️ for Kenyan entrepreneurs.</span>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
                <span>🇰🇪 Proudly Kenyan</span>
                <span>•</span>
                <span>💳 M-Pesa Ready</span>
                <span>•</span>
                <span>📱 Mobile First</span>
                <span>•</span>  
                <span>🔒 SSL Secured</span>
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
