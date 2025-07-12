
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
            ? "max-h-[90vh] w-[95vw] max-w-none m-2 p-0 flex flex-col" 
            : "max-h-[85vh] p-0 flex flex-col",
          className
        )}
      >
        {/* Mobile drag bar */}
        {isMobile && (
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 flex-shrink-0" />
        )}
        
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-display font-semibold pr-2">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-accent/10 flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOptimizedModal;
