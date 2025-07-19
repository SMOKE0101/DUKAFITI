
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import UserMenu from '../UserMenu';

const TopNavigation = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          DukaFiti
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            className="pl-10 w-64"
          />
        </div>
        
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <Bell className="w-5 h-5" />
        </button>
        
        <UserMenu />
      </div>
    </div>
  );
};

export default TopNavigation;
