
import { ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';

interface DemoTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DemoTabsProps {
  activeDemo: string;
  onDemoChange: (demoId: string) => void;
}

const demoTabs: DemoTab[] = [
  { id: 'sales', label: 'Record a Sale', icon: ShoppingCart },
  { id: 'inventory', label: 'Add Inventory', icon: Package },
  { id: 'customer', label: 'Manage Customer', icon: Users },
  { id: 'reports', label: 'View Reports', icon: BarChart3 }
];

const DemoTabs = ({ activeDemo, onDemoChange }: DemoTabsProps) => {
  return (
    <div className="flex flex-wrap justify-center mb-8 gap-2">
      {demoTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onDemoChange(tab.id)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeDemo === tab.id
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DemoTabs;
