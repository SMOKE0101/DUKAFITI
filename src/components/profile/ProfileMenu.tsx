
import React, { useState } from 'react';
import { User, Settings, Palette, LogOut, Edit, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { LogoutConfirmDialog } from '@/components/dialogs/LogoutConfirmDialog';

interface ProfileMenuProps {
  className?: string;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const shopName = user?.user_metadata?.shop_name || 'My Shop';
  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || shopName;

  const handleSignOut = async () => {
    setShowLogoutDialog(false);
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-white hover:bg-white/10 h-auto py-2 px-3"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-white/20 text-white text-sm">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">{shopName}</span>
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Profile Menu Panel */}
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {shopName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Edit Profile */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Edit Profile</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your information</p>
                  </div>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Shop Settings</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure your shop</p>
                  </div>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current: {theme === 'dark' ? 'Dark' : 'Light'} mode
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </Badge>
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                {/* Logout */}
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm opacity-75">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleSignOut}
      />
    </>
  );
};
