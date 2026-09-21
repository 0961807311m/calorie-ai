export type Profile = {
  id: string;
  sex: 'm' | 'f';
  age: number;
  weight: number;
  height: number;
  activity: 'sed' | 'light' | 'mod' | 'high' | 'ath';
  goal: 'lose' | 'keep' | 'gain';
  daily_norm: number;
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
};