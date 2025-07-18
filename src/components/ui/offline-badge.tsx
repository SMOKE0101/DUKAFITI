import React from 'react';
import { Badge } from './badge';
import { Clock } from 'lucide-react';

interface OfflineBadgeProps {
  show?: boolean;
  className?: string;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ show = false, className = "" }) => {
  if (!show) return null;

  return (
    <Badge
      variant="outline" 
      className={`text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 flex items-center gap-1 ${className}`}
    >
      <Clock className="w-3 h-3" />
      Offline
    </Badge>
  );
};

export default OfflineBadge;