
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSettingsClick = () => {
    navigate('/app/settings');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      // The useAuth hook will handle the redirect to landing page
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
      setShowLogoutConfirm(false);
    }
  };

  const shopName = user?.user_metadata?.shop_name || 'My Shop';

  return (
    <>
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
            <DropdownMenuItem 
              onClick={handleSettingsClick}
              className="border-2 border-blue-300 dark:border-blue-600 rounded-xl p-3 mb-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 cursor-pointer"
            >
              <div className="w-6 h-6 border-2 border-blue-600 rounded-full flex items-center justify-center mr-3">
                <Settings size={14} className="text-blue-600" />
              </div>
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-blue-600">
                Shop Settings
              </span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleLogoutClick} 
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

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="border-2 border-red-300 dark:border-red-600 rounded-xl bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-mono font-bold uppercase tracking-widest">
              Confirm Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-mono">
              Are you sure you want to sign out? You will be redirected to the landing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowLogoutConfirm(false)}
              className="border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono font-bold uppercase tracking-widest"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout}
              className="border-2 border-red-600 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-widest"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserMenu;
