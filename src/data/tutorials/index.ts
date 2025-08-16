import { TutorialConfig } from '@/types/tutorial';
import { dashboardTutorial } from './dashboardTutorial';
import { salesTutorial } from './salesTutorial';
import { inventoryTutorial } from './inventoryTutorial';
import { customersTutorial } from './customersTutorial';
import { reportsTutorial } from './reportsTutorial';
import { settingsTutorial } from './settingsTutorial';

export const tutorialConfigs: TutorialConfig[] = [
  dashboardTutorial,
  salesTutorial,
  inventoryTutorial,
  customersTutorial,
  reportsTutorial,
  settingsTutorial,
];

// Export individual tutorials for easy access
export {
  dashboardTutorial,
  salesTutorial,
  inventoryTutorial,
  customersTutorial,
  reportsTutorial,
  settingsTutorial,
};