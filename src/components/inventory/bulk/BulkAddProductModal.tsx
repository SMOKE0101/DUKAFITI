import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-7xl w-[98vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Package2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Bulk Add Products</h2>
              <p className="text-sm text-muted-foreground">
                {stats.selectedCount > 0 && `${stats.selectedCount} templates selected • `}
                {stats.validCount > 0 && `${stats.validCount} products ready • `}
                {stats.totalCount} total entries
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={activeView === 'spreadsheet' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('spreadsheet')}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Spreadsheet
              </Button>
              <Button
                variant={activeView === 'templates' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('templates')}
                className="h-8 px-3"
              >
                <Package2 className="w-4 h-4 mr-1" />
                Templates
              </Button>
            </div>
            
            {/* Action Buttons */}
            {stats.totalCount > 0 && (
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={!stats.hasValidProducts}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Add {stats.validCount} Product{stats.validCount !== 1 ? 's' : ''}
            </Button>
            
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {activeView === 'spreadsheet' ? (
            <div className="absolute inset-0 overflow-auto">
              <SpreadsheetView />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-auto">
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