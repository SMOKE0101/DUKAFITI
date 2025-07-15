
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface FeatureLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentUsage: number;
  limit: number;
}

const FeatureLimitModal: React.FC<FeatureLimitModalProps> = ({
  open,
  onOpenChange,
  feature,
  currentUsage,
  limit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Trial Limit Reached
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You've reached the trial limit of {limit} {feature}. 
            Current usage: {currentUsage}/{limit}.
            Upgrade to continue using this feature.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1">
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureLimitModal;
