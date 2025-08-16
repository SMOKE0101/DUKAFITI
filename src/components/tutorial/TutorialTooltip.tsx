import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TutorialStep, TutorialConfig } from '@/types/tutorial';
import { cn } from '@/lib/utils';

interface TutorialTooltipProps {
  step: TutorialStep;
  targetRect: DOMRect | null;
  tutorialConfig: TutorialConfig;
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  step,
  targetRect,
  tutorialConfig
}) => {
  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200; // estimated
    
    let position: React.CSSProperties = {};

    switch (step.placement) {
      case 'top':
        position = {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
        };
        break;
      case 'bottom':
        position = {
          top: targetRect.bottom + padding,
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
        };
        break;
      case 'left':
        position = {
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
          left: targetRect.left - tooltipWidth - padding,
        };
        break;
      case 'right':
        position = {
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
          left: targetRect.right + padding,
        };
        break;
      case 'center':
      default:
        position = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position.left && (position.left as number) < 0) {
      position.left = padding;
    }
    if (position.left && (position.left as number) + tooltipWidth > viewportWidth) {
      position.left = viewportWidth - tooltipWidth - padding;
    }
    if (position.top && (position.top as number) < 0) {
      position.top = padding;
    }
    if (position.top && (position.top as number) + tooltipHeight > viewportHeight) {
      position.top = viewportHeight - tooltipHeight - padding;
    }

    return position;
  };

  const getActionText = () => {
    switch (step.action) {
      case 'click':
        return 'Click the highlighted element to continue';
      case 'hover':
        return 'Hover over the highlighted element';
      case 'input':
        return 'Enter some text in the highlighted field';
      case 'wait':
        return 'Please wait while we prepare the next step';
      default:
        return 'Continue when ready';
    }
  };

  return (
    <div
      className="absolute pointer-events-auto z-[10000]"
      style={getTooltipPosition()}
    >
      <Card className={cn(
        "w-80 bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl",
        "animate-scale-in"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {tutorialConfig.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Step {step.id}
            </Badge>
          </div>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {step.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            
            {step.content && (
              <div className="text-sm">
                {step.content}
              </div>
            )}
            
            {step.action && (
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <p className="text-xs font-medium text-primary">
                  💡 {getActionText()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Arrow pointing to target */}
      {targetRect && step.placement !== 'center' && (
        <div
          className={cn(
            "absolute w-0 h-0 border-solid",
            {
              'border-t-8 border-t-primary/20 border-l-8 border-l-transparent border-r-8 border-r-transparent top-full left-1/2 transform -translate-x-1/2': step.placement === 'top',
              'border-b-8 border-b-primary/20 border-l-8 border-l-transparent border-r-8 border-r-transparent bottom-full left-1/2 transform -translate-x-1/2': step.placement === 'bottom',
              'border-r-8 border-r-primary/20 border-t-8 border-t-transparent border-b-8 border-b-transparent right-full top-1/2 transform -translate-y-1/2': step.placement === 'left',
              'border-l-8 border-l-primary/20 border-t-8 border-t-transparent border-b-8 border-b-transparent left-full top-1/2 transform -translate-y-1/2': step.placement === 'right',
            }
          )}
        />
      )}
    </div>
  );
};

export default TutorialTooltip;