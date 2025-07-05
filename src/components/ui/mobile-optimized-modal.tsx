
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const MobileOptimizedModal = ({ isOpen, onClose, title, children, className }: MobileOptimizedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
        w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[75vw] xl:max-w-6xl
        h-[95vh] sm:h-[90vh] md:h-[85vh]
        max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh]
        overflow-hidden flex flex-col bg-white rounded-lg shadow-lg border z-50
        ${className}
      `}>
        <DialogHeader className="flex-shrink-0 p-3 sm:p-4 md:p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-bold truncate pr-4">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOptimizedModal;
