
import { Bell, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';

interface EnhancedTopbarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const EnhancedTopbar = ({ onMenuClick, sidebarOpen }: EnhancedTopbarProps) => {
  const { theme } = useTheme();
  
  const logoSrc = theme === 'dark' 
    ? '/lovable-uploads/dedf9c88-aa30-41f1-9cb1-97691bcb580f.png'
    : '/lovable-uploads/89b3e0a6-730e-4441-8bec-2776d3c222d6.png';

  return (
    <div className="h-16 bg-[#602d86] border-b border-border/40 flex items-center justify-between px-4 lg:px-6">
      {/* Left Side - Logo and Menu */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-white hover:bg-white/10"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex items-center gap-3">
          <img 
            src={logoSrc}
            alt="DUKAFITI Logo" 
            className="h-8 w-auto"
          />
          <span className="text-xl font-bold text-white hidden sm:block">DUKAFITI</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products, customers..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
          />
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="bg-white/20 text-white text-sm">U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default EnhancedTopbar;
