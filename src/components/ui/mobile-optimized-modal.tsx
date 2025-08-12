
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileOptimizedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

const MobileOptimizedModal: React.FC<MobileOptimizedModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
  maxHeight = 'calc(100vh - 2rem)'
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          w-[95vw] max-w-md mx-auto my-4 p-0 
          max-h-[calc(var(--vvh,100dvh)-2rem)] flex flex-col overflow-hidden touch-pan-y
          dark:bg-slate-800 dark:border-slate-700
          ${className}
        `}
        style={{ 
          maxHeight: `min(${maxHeight}, var(--vvh, 100dvh))`,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-4 pb-2 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-foreground dark:text-white truncate">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div 
            className="p-4 pt-2"
            style={{
              minHeight: 'fit-content',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 4rem)'
            }}
          >
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOptimizedModal;
