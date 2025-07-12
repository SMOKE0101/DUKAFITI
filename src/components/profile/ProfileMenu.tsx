
import React, { useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogoutConfirmDialog } from '@/components/dialogs/LogoutConfirmDialog';

export const ProfileMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleSignOut = async () => {
    setShowLogoutDialog(false);
    await signOut();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const userInitials = user?.email 
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-white/20 text-white text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Account</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Shop Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowLogoutDialog(true)}
            className="cursor-pointer text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleSignOut}
      />
    </>
  );
};
