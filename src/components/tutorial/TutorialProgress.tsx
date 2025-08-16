import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TutorialConfig } from '@/types/tutorial';
import { Clock, Star } from 'lucide-react';

interface TutorialProgressProps {
  tutorial: TutorialConfig;
  currentStep: number;
}

const TutorialProgress: React.FC<TutorialProgressProps> = ({
  tutorial,
  currentStep
}) => {
  const progress = ((currentStep + 1) / tutorial.steps.length) * 100;
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="fixed top-6 right-6 pointer-events-auto z-[10001] bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
      <div className="p-4 space-y-3">
        {/* Tutorial Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-card-foreground">
              {tutorial.name}
            </h3>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(tutorial.difficulty)}`} />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {tutorial.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {tutorial.steps.length}
            </span>
            <span className="text-primary font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2 bg-muted"
          />
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{tutorial.estimatedDuration} min</span>
          </div>
          
          <Badge variant="outline" className="text-xs py-0 px-2">
            {tutorial.category}
          </Badge>
        </div>

        {/* Current Step Title */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-primary">
            {tutorial.steps[currentStep]?.title}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TutorialProgress;