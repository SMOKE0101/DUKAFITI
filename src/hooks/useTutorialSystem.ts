import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TutorialState, TutorialSettings, TutorialProgress, TutorialConfig } from '@/types/tutorial';
import { useToast } from './use-toast';

interface TutorialContextType {
  state: TutorialState;
  startTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  restartTutorial: (tutorialId: string) => void;
  updateSettings: (settings: Partial<TutorialSettings>) => void;
  getTutorialConfig: (tutorialId: string) => TutorialConfig | null;
  isStepCompleted: (tutorialId: string, stepIndex: number) => boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

const defaultSettings: TutorialSettings = {
  autoStart: true,
  showTooltips: true,
  tutorialSpeed: 'normal',
  enableAnimations: true,
  completedTutorials: [],
  dismissedTutorials: [],
  skipOnboarding: false,
};

const defaultState: TutorialState = {
  isActive: false,
  currentTutorial: null,
  currentStep: 0,
  isVisible: false,
  userProgress: {},
  settings: defaultSettings,
};

export const useTutorialSystem = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialSystem must be used within a TutorialProvider');
  }
  return context;
};

export const useTutorialProvider = () => {
  const [state, setState] = useState<TutorialState>(defaultState);
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorials, setTutorials] = useState<Record<string, TutorialConfig>>({});

  // Load tutorial settings from database
  useEffect(() => {
    if (user) {
      loadTutorialSettings();
      loadTutorialProgress();
    }
  }, [user]);

  const loadTutorialSettings = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_preferences')
        .eq('id', user.id)
        .single();

      if (profile?.tutorial_preferences) {
        setState(prev => ({
          ...prev,
          settings: { ...defaultSettings, ...profile.tutorial_preferences }
        }));
      }
    } catch (error) {
      console.error('Error loading tutorial settings:', error);
    }
  };

  const loadTutorialProgress = async () => {
    if (!user) return;

    try {
      const { data: progress } = await supabase
        .from('tutorial_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progress) {
        const progressMap: Record<string, TutorialProgress> = {};
        progress.forEach(p => {
          progressMap[p.tutorial_page] = {
            tutorialId: p.tutorial_page,
            currentStep: parseInt(p.step_id),
            completed: p.completed,
            skipped: false,
            completedAt: p.completed_at ? new Date(p.completed_at) : undefined,
            startedAt: new Date(p.created_at),
          };
        });

        setState(prev => ({
          ...prev,
          userProgress: progressMap
        }));
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    }
  };

  const saveTutorialProgress = async (tutorialId: string, step: number, completed: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_page: tutorialId,
          step_id: step.toString(),
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });
    } catch (error) {
      console.error('Error saving tutorial progress:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<TutorialSettings>) => {
    const updatedSettings = { ...state.settings, ...newSettings };
    setState(prev => ({ ...prev, settings: updatedSettings }));

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ tutorial_preferences: updatedSettings })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating tutorial settings:', error);
      }
    }
  }, [state.settings, user]);

  const startTutorial = useCallback((tutorialId: string) => {
    const tutorial = tutorials[tutorialId];
    if (!tutorial) {
      toast({
        title: "Tutorial not found",
        description: "The requested tutorial could not be loaded.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      currentTutorial: tutorialId,
      currentStep: 0,
      isVisible: true,
    }));

    // Track tutorial start
    if (user) {
      saveTutorialProgress(tutorialId, 0, false);
    }
  }, [tutorials, toast, user]);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.currentTutorial) return prev;
      
      const tutorial = tutorials[prev.currentTutorial];
      if (!tutorial) return prev;

      const nextStepIndex = prev.currentStep + 1;
      
      if (nextStepIndex >= tutorial.steps.length) {
        // Tutorial completed
        completeTutorial();
        return prev;
      }

      // Save progress
      if (user) {
        saveTutorialProgress(prev.currentTutorial, nextStepIndex, false);
      }

      return {
        ...prev,
        currentStep: nextStepIndex,
      };
    });
  }, [tutorials, user]);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => {
      if (prev.currentTutorial) {
        const skippedTutorials = [...prev.settings.dismissedTutorials, prev.currentTutorial];
        updateSettings({ dismissedTutorials: skippedTutorials });
      }

      return {
        ...prev,
        isActive: false,
        currentTutorial: null,
        currentStep: 0,
        isVisible: false,
      };
    });

    toast({
      title: "Tutorial skipped",
      description: "You can restart tutorials anytime from Settings.",
    });
  }, [updateSettings, toast]);

  const completeTutorial = useCallback(() => {
    setState(prev => {
      if (!prev.currentTutorial) return prev;

      const completedTutorials = [...prev.settings.completedTutorials, prev.currentTutorial];
      updateSettings({ completedTutorials });

      // Save completion to database
      if (user) {
        saveTutorialProgress(prev.currentTutorial, prev.currentStep, true);
      }

      toast({
        title: "Tutorial completed! 🎉",
        description: "Great job! You've mastered this feature.",
      });

      return {
        ...prev,
        isActive: false,
        currentTutorial: null,
        currentStep: 0,
        isVisible: false,
      };
    });
  }, [updateSettings, toast, user]);

  const restartTutorial = useCallback((tutorialId: string) => {
    // Remove from completed tutorials
    const updatedCompleted = state.settings.completedTutorials.filter(id => id !== tutorialId);
    const updatedDismissed = state.settings.dismissedTutorials.filter(id => id !== tutorialId);
    
    updateSettings({ 
      completedTutorials: updatedCompleted,
      dismissedTutorials: updatedDismissed 
    });

    startTutorial(tutorialId);
  }, [state.settings, updateSettings, startTutorial]);

  const getTutorialConfig = useCallback((tutorialId: string) => {
    return tutorials[tutorialId] || null;
  }, [tutorials]);

  const isStepCompleted = useCallback((tutorialId: string, stepIndex: number) => {
    const progress = state.userProgress[tutorialId];
    return progress ? progress.currentStep > stepIndex || progress.completed : false;
  }, [state.userProgress]);

  const contextValue: TutorialContextType = {
    state,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
    updateSettings,
    getTutorialConfig,
    isStepCompleted,
  };

  return { 
    contextValue, 
    TutorialContext,
    setTutorials // Export this to allow setting tutorials from provider
  };
};