export interface TutorialStep {
  id: string;
  page: string;
  title: string;
  description: string;
  target: string; // CSS selector
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'input' | 'wait';
  highlightStyle: 'spotlight' | 'border' | 'glow';
  content: React.ReactNode;
  prerequisites?: string[];
  onComplete?: () => void;
  delay?: number;
  optional?: boolean;
}

export interface TutorialConfig {
  id: string;
  name: string;
  description: string;
  page: string;
  steps: TutorialStep[];
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'onboarding' | 'feature' | 'advanced';
}

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  completedAt?: Date;
  startedAt: Date;
}

export interface TutorialState {
  isActive: boolean;
  currentTutorial: string | null;
  currentStep: number;
  isVisible: boolean;
  userProgress: Record<string, TutorialProgress>;
  settings: TutorialSettings;
}

export interface TutorialSettings {
  autoStart: boolean;
  showTooltips: boolean;
  tutorialSpeed: 'slow' | 'normal' | 'fast';
  enableAnimations: boolean;
  completedTutorials: string[];
  dismissedTutorials: string[];
  skipOnboarding: boolean;
}