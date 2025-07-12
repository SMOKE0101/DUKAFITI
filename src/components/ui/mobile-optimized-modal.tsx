
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const MobileOptimizedModal: React.FC<MobileOptimizedModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          isMobile 
            ? "fixed inset-x-2 inset-y-4 h-[calc(100vh-2rem)] w-[calc(100vw-1rem)] max-w-none max-h-none m-0 p-0 flex flex-col rounded-lg overflow-hidden" 
            : "max-h-[90vh] w-full max-w-2xl p-0 flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Mobile drag indicator */}
        {isMobile && (
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0" />
        )}
        
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 pr-2 line-clamp-1">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 flex-shrink-0 rounded-full"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOptimizedModal;
