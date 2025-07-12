
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryDemo from './InventoryDemo';
import SalesDemo from './SalesDemo';
import CustomerDemo from './CustomerDemo';
import ReportsDemo from './ReportsDemo';

interface DemoTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DemoTabs: React.FC<DemoTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm rounded-xl p-1">
        <TabsTrigger 
          value="inventory" 
          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/80 rounded-lg transition-all duration-200"
        >
          Inventory
        </TabsTrigger>
        <TabsTrigger 
          value="sales" 
          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/80 rounded-lg transition-all duration-200"
        >
          Sales
        </TabsTrigger>
        <TabsTrigger 
          value="customers" 
          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/80 rounded-lg transition-all duration-200"
        >
          Customers
        </TabsTrigger>
        <TabsTrigger 
          value="reports" 
          className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-white/80 rounded-lg transition-all duration-200"
        >
          Reports
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-8">
        <TabsContent value="inventory" className="mt-0">
          <InventoryDemo />
        </TabsContent>
        <TabsContent value="sales" className="mt-0">
          <SalesDemo />
        </TabsContent>
        <TabsContent value="customers" className="mt-0">
          <CustomerDemo />
        </TabsContent>
        <TabsContent value="reports" className="mt-0">
          <ReportsDemo />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default DemoTabs;
