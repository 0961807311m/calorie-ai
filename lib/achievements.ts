export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(new Set(dates.map((d) => d.slice(0, 10)))).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function getAchievements(stats: {
  totalMeals: number;
  streak: number;
  daysUsed: number;
  aiRecognitions: number;
}): Achievement[] {
  return [
    {
      id: 'first-meal',
      emoji: '🍽️',
      title: 'Перший крок',
      description: 'Додай першу страву — початок покладено!',
      unlocked: stats.totalMeals >= 1,
      progress: Math.min(stats.totalMeals, 1),
      target: 1,
    },
    {
      id: 'ai-master',
      emoji: '🤖',
      title: 'Майстер ШІ',
      description: 'Розпізнай 10 страв через ШІ — ти знаєш силу технологій!',
      unlocked: stats.aiRecognitions >= 10,
      progress: Math.min(stats.aiRecognitions, 10),
      target: 10,
    },
    {
      id: 'streak-3',
      emoji: '🔥',
      title: 'У вогні',
      description: 'Ти топ! Три дні поспіль у грі!',
      unlocked: stats.streak >= 3,
      progress: Math.min(stats.streak, 3),
      target: 3,
    },
    {
      id: 'streak-7',
      emoji: '⚡',
      title: 'Цей тиждень твій!',
      description: '7 днів підряд — справжній чемпіон!',
      unlocked: stats.streak >= 7,
      progress: Math.min(stats.streak, 7),
      target: 7,
    },
    {
      id: 'streak-30',
      emoji: '👑',
      title: 'Ти легенда!',
      description: '30 днів підряд — неймовірна дисципліна!',
      unlocked: stats.streak >= 30,
      progress: Math.min(stats.streak, 30),
      target: 30,
    },
    {
      id: 'meals-50',
      emoji: '💪',
      title: 'Майстер харчування',
      description: '50 страв загалом — ти справжній профі!',
      unlocked: stats.totalMeals >= 50,
      progress: Math.min(stats.totalMeals, 50),
      target: 50,
    },
  ];
}