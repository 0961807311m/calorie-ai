export type Profile = {
  id: string;
  sex: 'm' | 'f';
  age: number;
  weight: number;
  height: number;
  activity: 'sed' | 'light' | 'mod' | 'high' | 'ath';
  goal: 'lose' | 'keep' | 'gain';
  daily_norm: number;
  theme?: 'dark' | 'light';
  points?: number;
};

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  portion?: string;
  image_url?: string;
  eaten_at: string;
  sugar?: number;
  is_drink?: boolean;
  volume_ml?: number;
  label_analysis?: string;
  has_additives?: boolean;
  additives_list?: string;
};

export type DailyReport = {
  id: string;
  date: string;
  report: string;
};

export type NutritionReport = {
  id: string;
  week_start: string;
  report: string;
};