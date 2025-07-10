
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const EnhancedSidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { products } = useSupabaseProducts();
  
  // Enhanced low stock count - exclude unspecified stock products
  const lowStockCount = products.filter(p => 
    p.currentStock !== -1 && 
    p.currentStock <= p.lowStockThreshold
  ).length;

  const handleLogout = () => {
    console.log('Logging out...');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 border-r-2 border-purple-300/20 transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-16'
        }`}>
          {/* Brand Section */}
          <div className="p-4 border-b border-purple-300/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              {isOpen && (
                <div className="text-white">
                  <h1 className="font-black text-lg tracking-tight uppercase">DUKASMART</h1>
                  <p className="text-purple-200 text-xs opacity-80">Smart Business</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    active 
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30' 
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className={`relative ${isOpen ? 'w-6 h-6' : 'w-6 h-6 mx-auto'}`}>
                    <Icon className="w-full h-full" />
                    {item.name === 'Inventory' && lowStockCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                        {lowStockCount}
                      </Badge>
                    )}
                  </div>
                  {isOpen && (
                    <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                  )}
                  {active && (
                    <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-pink-400 to-purple-400 rounded-r-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-purple-300/20">
            {/* Profile */}
            <div className={`flex items-center gap-3 mb-3 p-2 rounded-lg ${isOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="text-white text-sm">
                  <div className="font-medium">Admin</div>
                  <div className="text-purple-200 text-xs">Owner</div>
                </div>
              )}
            </div>

            {/* Utility Buttons */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full text-purple-200 hover:text-white hover:bg-white/10 ${
                  isOpen ? 'justify-start gap-3' : 'justify-center p-2'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                {isOpen && <span className="text-sm">Help</span>}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className={`w-full text-purple-200 hover:text-red-300 hover:bg-red-500/20 ${
                  isOpen ? 'justify-start gap-3' : 'justify-center p-2'
                }`}
              >
                <LogOut className="w-4 h-4" />
                {isOpen && <span className="text-sm">Logout</span>}
              </Button>
            </div>

            {/* Toggle Button */}
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-purple-200 hover:text-white hover:bg-white/10 justify-center"
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-around py-2">
            {navigation.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    active 
                      ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.name === 'Inventory' && lowStockCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                        {lowStockCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Logout
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to exit DukaSmart?
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Logout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
