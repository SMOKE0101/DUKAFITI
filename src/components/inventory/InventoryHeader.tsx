
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface InventoryHeaderProps {
  onAddProduct: () => void;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ onAddProduct }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-3xl font-display text-primary">Inventory</h1>
      <Button 
        onClick={onAddProduct}
        className="px-6 py-2 bg-accent text-white rounded-xl shadow-lg hover:bg-accent/90 transition-all duration-200 flex items-center gap-2"
      >
        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </div>
        Add Product
      </Button>
    </div>
  );
};

export default InventoryHeader;
