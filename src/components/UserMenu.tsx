
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      console.log('UserMenu: Signing out user');
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('UserMenu: Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shopName = user?.user_metadata?.shop_name || 'My Shop';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-12 px-4 border-2 border-purple-600 bg-transparent text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-mono font-bold uppercase tracking-widest transition-all duration-200">
          <div className="w-6 h-6 border-2 border-purple-600 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
            <User size={14} className="text-purple-600" />
          </div>
          <span className="hidden sm:inline text-purple-600">{shopName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 sm:w-80 max-w-[90vw] border-2 border-purple-600 rounded-xl bg-white dark:bg-gray-900 shadow-2xl backdrop-blur-sm z-50"
        sideOffset={8}
      >
        <div className="border-2 border-purple-300 dark:border-purple-600 rounded-xl p-4 m-2 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 border-2 border-purple-600 rounded-full flex items-center justify-center bg-white dark:bg-gray-800">
              <User size={16} className="text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-purple-600 truncate">
                {shopName}
              </p>
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-2 pb-2">
          <DropdownMenuItem className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-3 mb-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 cursor-pointer">
            <div className="w-6 h-6 border-2 border-blue-600 rounded-full flex items-center justify-center mr-3">
              <Settings size={14} className="text-blue-600" />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-blue-600">
              Shop Settings
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="border-2 border-red-300 dark:border-red-600 rounded-xl p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 cursor-pointer"
          >
            <div className="w-6 h-6 border-2 border-red-600 rounded-full flex items-center justify-center mr-3">
              <LogOut size={14} className="text-red-600" />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-red-600">
              Sign Out
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
