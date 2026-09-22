import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { meals, profile } = await req.json();
    if (!profile) return Response.json({ error: 'No profile' }, { status: 400 });

    const totalCal = (meals || []).reduce((s: number, m: any) => s + (m.calories || 0), 0);
    const totalProtein = (meals || []).reduce((s: number, m: any) => s + Number(m.protein || 0), 0);
    const totalFat = (meals || []).reduce((s: number, m: any) => s + Number(m.fat || 0), 0);
    const totalCarbs = (meals || []).reduce((s: number, m: any) => s + Number(m.carbs || 0), 0);
    const totalSugar = (meals || []).reduce((s: number, m: any) => s + Number(m.sugar || 0), 0);

    const mealsList = (meals || [])
      .map((m: any) => `- ${m.name} (${m.calories} ккал, Б${m.protein} Ж${m.fat} В${m.carbs}${m.sugar ? ` Цукор${m.sugar}г` : ''})`)
      .join('\n');

    const prompt = `Ти персональний нутріціолог-тренер. Проаналізуй день користувача.

ДАНІ КОРИСТУВАЧА:
- Норма: ${profile.daily_norm} ккал/день
- Ціль: ${profile.goal === 'lose' ? 'схуднення' : profile.goal === 'gain' ? 'набір маси' : 'підтримка'}
- Стать: ${profile.sex === 'm' ? 'чоловік' : 'жінка'}
- Вік: ${profile.age}, вага: ${profile.weight} кг, зріст: ${profile.height} см

З'ЇДЕНО СЬОГОДНІ:
- Калорії: ${totalCal} (${Math.round((totalCal / profile.daily_norm) * 100)}% норми)
- Білки: ${Math.round(totalProtein)} г
- Жири: ${Math.round(totalFat)} г
- Вуглеводи: ${Math.round(totalCarbs)} г
- Цукор: ${Math.round(totalSugar)} г

СТРАВИ:
${mealsList || '(ще нічого не додано)'}

Напиши короткий аналіз (3-5 речень) українською:
1. Що добре сьогодні
2. Що зменшити або додати
3. Від чого відмовитись (якщо є)
4. Одна конкретна порада на вечір

Тон: дружній, мотивуючий. Без markdown, простий текст.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');

    return Response.json({ advice: text });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}