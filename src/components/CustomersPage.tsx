
import React from 'react';
import CustomerCRUDManager from './customers/CustomerCRUDManager';

const CustomersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
        <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
          CUSTOMERS
        </h1>
      </div>
      
      <div className="p-6 max-w-7xl mx-auto">
        <CustomerCRUDManager />
      </div>
    </div>
  );
};

export default CustomersPage;
