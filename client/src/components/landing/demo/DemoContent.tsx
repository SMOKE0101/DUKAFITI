
import React from 'react';
import InventoryDemo from './InventoryDemo';
import SalesDemo from './SalesDemo';
import CustomerDemo from './CustomerDemo';
import ReportsDemo from './ReportsDemo';

interface DemoContentProps {
  activeDemo: string;
}

const DemoContent: React.FC<DemoContentProps> = ({ activeDemo }) => {
  const renderDemo = () => {
    switch (activeDemo) {
      case 'inventory':
        return <InventoryDemo />;
      case 'sales':
        return <SalesDemo />;
      case 'customers':
        return <CustomerDemo />;
      case 'reports':
        return <ReportsDemo />;
      default:
        return <SalesDemo />;
    }
  };

  return (
    <div className="mt-8">
      {renderDemo()}
    </div>
  );
};

export default DemoContent;
