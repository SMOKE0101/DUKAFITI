
import { Card, CardContent } from '@/components/ui/card';
import { TouchFriendlyButton } from '@/components/ui/touch-friendly-button';
import SalesDemo from './SalesDemo';
import InventoryDemo from './InventoryDemo';
import CustomerDemo from './CustomerDemo';
import ReportsDemo from './ReportsDemo';

interface DemoContentProps {
  activeDemo: string;
}

const demoContent = {
  sales: {
    title: "Quick Sale Processing",
    description: "Scan products, apply discounts, and accept M-Pesa payments in seconds",
    component: SalesDemo
  },
  inventory: {
    title: "Smart Inventory Management",
    description: "Add products, track stock levels, and get low stock alerts automatically",
    component: InventoryDemo
  },
  customer: {
    title: "Customer Relationship Management",
    description: "Track customer purchases, manage credit, and build lasting relationships",
    component: CustomerDemo
  },
  reports: {
    title: "Business Analytics Dashboard",
    description: "Get insights into sales trends, top products, and profit margins",
    component: ReportsDemo
  }
};

const DemoContent = ({ activeDemo }: DemoContentProps) => {
  const currentDemo = demoContent[activeDemo as keyof typeof demoContent];
  const DemoComponent = currentDemo.component;

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {currentDemo.title}
              </h3>
              <p className="text-base sm:text-lg text-slate-300">
                {currentDemo.description}
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <TouchFriendlyButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                Try This Feature
              </TouchFriendlyButton>
              <p className="text-sm text-slate-400">
                Start your free trial to explore all features
              </p>
            </div>
          </div>

          <div className="relative">
            <DemoComponent />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoContent;
