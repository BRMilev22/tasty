import { PlannedMeal } from './meals';

export type RootStackParamList = {
  '(tabs)': undefined;
  'dashboard': undefined;
  'goalsSelect': undefined;
  'editProfile': undefined;
  'addMeal': undefined;
  'planMeal': { meal?: PlannedMeal };
  'trackWeight': undefined;
  'genderSelect': undefined;
  'weightSelect': undefined;
  'heightSelect': undefined;
  'targetWeightSelect': undefined;
}; 