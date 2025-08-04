import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package2, Grid3X3, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulkAddProvider, useBulkAdd } from './BulkAddProvider';
import SpreadsheetView from './SpreadsheetView';
import TemplatesView from './TemplatesView';
import { Product } from '../../../types';

interface BulkAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const BulkAddProductModalContent: React.FC<BulkAddProductModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const {
    activeView,
    stats,
    clearAll,
    getValidProducts,
    initializeSpreadsheet,
    setActiveView,
  } = useBulkAdd();

  // Initialize spreadsheet when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeSpreadsheet();
    }
  }, [isOpen, initializeSpreadsheet]);

  const handleSave = () => {
    const products = getValidProducts();
    if (products.length > 0) {
      onSave(products);
      clearAll();
      onClose();
    }
  };

  const handleClose = () => {
    clearAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] p-0 flex flex-col bg-background">
        <DialogTitle className="sr-only">Bulk Add Products</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-border bg-muted/30 flex-shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-semibold truncate">Bulk Add Products</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {stats.selectedCount > 0 && `${stats.selectedCount} selected • `}
                {stats.validCount > 0 && `${stats.validCount} ready • `}
                {stats.totalCount} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* View Toggle */}
            <div className="flex flex-col items-center">
              <div className="flex items-center bg-muted rounded-lg p-0.5 sm:p-1">
                <Button
                  variant={activeView === 'spreadsheet' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('spreadsheet')}
                  className="h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Spreadsheet</span>
                </Button>
                <Button
                  variant={activeView === 'templates' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('templates')}
                  className="h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Package2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Templates</span>
                </Button>
              </div>
              <span className="text-[9px] text-muted-foreground/70 mt-0.5 font-medium">
                {activeView === 'spreadsheet' ? 'Manual Entry' : 'From Library'}
              </span>
            </div>
            
            {/* Action Buttons */}
            <Button
              onClick={handleSave}
              disabled={!stats.hasValidProducts}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Add {stats.validCount}</span>
              <span className="sm:hidden">+{stats.validCount}</span>
            </Button>
            
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeView === 'spreadsheet' ? (
            <div className="h-[calc(95vh-140px)] overflow-auto">
              <SpreadsheetView />
            </div>
          ) : (
            <div className="h-[calc(95vh-140px)]">
              <TemplatesView />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BulkAddProductModal: React.FC<BulkAddProductModalProps> = (props) => {
  return (
    <BulkAddProvider>
      <BulkAddProductModalContent {...props} />
    </BulkAddProvider>
  );
};

export default BulkAddProductModal;