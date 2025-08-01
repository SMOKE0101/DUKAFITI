import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkSelectionToolsProps {
  selectedCount: number;
  totalCount: number;
  visibleCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectVisible: () => void;
  disabled?: boolean;
  className?: string;
}

const BulkSelectionTools: React.FC<BulkSelectionToolsProps> = ({
  selectedCount,
  totalCount,
  visibleCount,
  onSelectAll,
  onClearAll,
  onSelectVisible,
  disabled = false,
  className
}) => {
  const isAllSelected = selectedCount === totalCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;
  const hasSelection = selectedCount > 0;

  return (
    <div className={cn("flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border", className)}>
      {/* Selection Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : isPartiallySelected ? (
            <div className="w-4 h-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-sm" />
            </div>
          ) : (
            <Square className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {selectedCount.toLocaleString()} of {totalCount.toLocaleString()} selected
          </span>
        </div>

        {hasSelection && (
          <Badge variant="secondary" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Ready to add
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {visibleCount < totalCount && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectVisible}
            disabled={disabled}
            className="text-xs"
          >
            Select Visible ({visibleCount.toLocaleString()})
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={isAllSelected ? onClearAll : onSelectAll}
          disabled={disabled}
          className={cn(
            "text-xs",
            isAllSelected ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"
          )}
        >
          {isAllSelected ? (
            <>
              <X className="w-3 h-3 mr-1" />
              Clear All
            </>
          ) : (
            <>
              <CheckSquare className="w-3 h-3 mr-1" />
              Select All
            </>
          )}
        </Button>

        {hasSelection && !isAllSelected && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={disabled}
            className="text-xs text-destructive hover:text-destructive"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkSelectionTools;