import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTutorialSystem } from '@/hooks/useTutorialSystem';
import { tutorialConfigs } from '@/data/tutorials';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Star,
  Settings as SettingsIcon 
} from 'lucide-react';

const TutorialSettings: React.FC = () => {
  const { state, updateSettings, restartTutorial, startTutorial } = useTutorialSystem();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSettingChange = async (key: keyof typeof state.settings, value: any) => {
    setIsLoading(true);
    try {
      await updateSettings({ [key]: value });
      toast({
        title: "Settings updated",
        description: "Your tutorial preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTutorialStatus = (tutorialId: string) => {
    if (state.settings.completedTutorials.includes(tutorialId)) {
      return 'completed';
    }
    if (state.settings.dismissedTutorials.includes(tutorialId)) {
      return 'skipped';
    }
    return 'available';
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="text-muted-foreground">Skipped</Badge>;
      default:
        return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <div data-tutorial="tutorial-settings" className="space-y-6">
      {/* Tutorial Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Tutorial Preferences
          </CardTitle>
          <CardDescription>
            Customize your learning experience and tutorial behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-start tutorials */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-start tutorials</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start tutorials when visiting new pages
              </p>
            </div>
            <Switch
              checked={state.settings.autoStart}
              onCheckedChange={(checked) => handleSettingChange('autoStart', checked)}
              disabled={isLoading}
            />
          </div>

          {/* Show tooltips */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show helpful tooltips</Label>
              <p className="text-sm text-muted-foreground">
                Display additional tips and explanations during tutorials
              </p>
            </div>
            <Switch
              checked={state.settings.showTooltips}
              onCheckedChange={(checked) => handleSettingChange('showTooltips', checked)}
              disabled={isLoading}
            />
          </div>

          {/* Enable animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable animations</Label>
              <p className="text-sm text-muted-foreground">
                Use smooth transitions and animations in tutorials
              </p>
            </div>
            <Switch
              checked={state.settings.enableAnimations}
              onCheckedChange={(checked) => handleSettingChange('enableAnimations', checked)}
              disabled={isLoading}
            />
          </div>

          {/* Tutorial speed */}
          <div className="space-y-3">
            <Label>Tutorial Speed</Label>
            <Select
              value={state.settings.tutorialSpeed}
              onValueChange={(value) => handleSettingChange('tutorialSpeed', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow - Take your time</SelectItem>
                <SelectItem value="normal">Normal - Comfortable pace</SelectItem>
                <SelectItem value="fast">Fast - Quick learner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skip onboarding */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Skip onboarding for new features</Label>
              <p className="text-sm text-muted-foreground">
                Don't show tutorials for new features automatically
              </p>
            </div>
            <Switch
              checked={state.settings.skipOnboarding}
              onCheckedChange={(checked) => handleSettingChange('skipOnboarding', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Available Tutorials
          </CardTitle>
          <CardDescription>
            Start or restart any tutorial to refresh your knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {tutorialConfigs.map((tutorial) => {
              const status = getTutorialStatus(tutorial.id);
              return (
                <div
                  key={tutorial.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{tutorial.name}</h4>
                      {getStatusBadge(status)}
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(tutorial.difficulty)}`} />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {tutorial.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{tutorial.estimatedDuration} min</span>
                      </div>
                      <Badge variant="outline" className="text-xs py-0 px-2">
                        {tutorial.category}
                      </Badge>
                      <span className="capitalize">{tutorial.difficulty}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {status === 'completed' || status === 'skipped' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restartTutorial(tutorial.id)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restart
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => startTutorial(tutorial.id)}
                        className="flex items-center gap-1"
                      >
                        <PlayCircle className="w-3 h-3" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {state.settings.completedTutorials.length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-muted-foreground">
                {state.settings.dismissedTutorials.length}
              </div>
              <p className="text-sm text-muted-foreground">Skipped</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {tutorialConfigs.length - state.settings.completedTutorials.length - state.settings.dismissedTutorials.length}
              </div>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialSettings;