
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddProductButtonProps {
  onClick: () => void;
  className?: string;
}

const AddProductButton: React.FC<AddProductButtonProps> = ({ onClick, className = '' }) => {
  const isMobile = useIsMobile();

  return (
    <Button
      onClick={onClick}
      className={`
        ${isMobile 
          ? 'h-12 px-4 text-sm w-full sm:w-auto min-w-[140px]' 
          : 'h-10 px-6'
        }
        bg-blue-600 hover:bg-blue-700 text-white font-medium
        flex items-center gap-2 justify-center
        touch-manipulation
        ${className}
      `}
    >
      <Plus className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
      <span className="whitespace-nowrap">
        {isMobile ? 'Add Product' : 'Add New Product'}
      </span>
    </Button>
  );
};

export default AddProductButton;
