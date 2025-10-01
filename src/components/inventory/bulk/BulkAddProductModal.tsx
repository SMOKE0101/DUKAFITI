import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { X, Package2, Grid3X3, RotateCcw, Plus, Upload, Download } from 'lucide-react';
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

// Custom DialogContent for full-screen layout
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 grid gap-0 bg-background p-0 shadow-none border-0 rounded-none",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

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

  const [showConfirmClose, setShowConfirmClose] = React.useState(false);

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
    if (stats.totalCount > 0) {
      setShowConfirmClose(true);
      return;
    }
    clearAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { if (stats.totalCount > 0) { setShowConfirmClose(true); } else { clearAll(); onClose(); } } }}>
      <CustomDialogContent className="flex flex-col bg-background">
        <DialogTitle className="sr-only">Bulk Add Products</DialogTitle>
        
        {/* Header - Full width */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">Bulk Add Products</h2>
              <p className="text-sm text-muted-foreground truncate">
                {stats.selectedCount > 0 && `${stats.selectedCount} selected • `}
                {stats.validCount > 0 && `${stats.validCount} ready • `}
                {stats.totalCount} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Action Buttons */}
            <Button
              onClick={handleSave}
              disabled={!stats.hasValidProducts}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold shadow-lg"
            >
              Save Products ({stats.validCount})
            </Button>
            
            <Button
              onClick={() => { if (stats.totalCount > 0) { setShowConfirmClose(true); } else { clearAll(); onClose(); } }}
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sub-header with view toggle and actions */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={activeView === 'spreadsheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('spreadsheet')}
                className="h-8 px-3 text-sm"
                aria-pressed={activeView === 'spreadsheet'}
                aria-current={activeView === 'spreadsheet' ? 'page' : undefined}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Spreadsheet
              </Button>
              <Button
                variant={activeView === 'templates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('templates')}
                className="h-8 px-3 text-sm"
                aria-pressed={activeView === 'templates'}
                aria-current={activeView === 'templates' ? 'page' : undefined}
              >
                <Package2 className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </div>
          </div>

          {/* Spreadsheet Actions */}
          {activeView === 'spreadsheet' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add more rows functionality
                  const event = new CustomEvent('bulk-add-add-rows');
                  window.dispatchEvent(event);
                }}
                className="h-8 px-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Rows
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // CSV upload functionality
                  const event = new CustomEvent('bulk-add-csv-upload');
                  window.dispatchEvent(event);
                }}
                className="h-8 px-3"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Download template functionality
                  const event = new CustomEvent('bulk-add-download-template');
                  window.dispatchEvent(event);
                }}
                className="h-8 px-3"
              >
                <Download className="w-4 h-4 mr-1" />
                Template
              </Button>
            </div>
          )}
        </div>

        {/* Main Content - Full height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeView === 'spreadsheet' ? (
            <div className="h-full overflow-auto">
              <SpreadsheetView />
            </div>
          ) : (
            <div className="h-full">
              <TemplatesView />
            </div>
          )}
        </div>
      </CustomDialogContent>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved products?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved products in your bulk add list. Closing will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                onClose();
                setShowConfirmClose(false);
              }}
            >
              Discard and close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
