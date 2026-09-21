import { Profile } from './types';

export function calcNorm(p: Profile): number {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const act: Record<string, number> = { sed: 1.2, light: 1.375, mod: 1.55, high: 1.725, ath: 1.9 };
  let tdee = bmr * act[p.activity];
  if (p.goal === 'lose') tdee -= 500;
  if (p.goal === 'gain') tdee += 400;
  return Math.round(tdee);
}

export function macroSplit(calories: number, goal: string) {
  const splits: Record<string, [number, number, number]> = {
    lose: [0.35, 0.3, 0.35],
    keep: [0.25, 0.3, 0.45],
    gain: [0.25, 0.25, 0.5],
  };
  const [p, f, c] = splits[goal] || splits.keep;
  return {
    protein: Math.round((calories * p) / 4),
    fat: Math.round((calories * f) / 9),
    carbs: Math.round((calories * c) / 4),
  };
}