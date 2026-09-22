import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { meals, profile, weekStart } = await req.json();

    if (!meals || meals.length === 0) {
      return Response.json({
        report: 'За цей тиждень ще немає даних. Додай хоча б кілька страв, і я проаналізую твій раціон.',
      });
    }

    const mealsList = meals
      .map((m: any) => `- ${new Date(m.eaten_at).toLocaleDateString('uk-UA')}: ${m.name} (${m.calories} ккал)`)
      .join('\n');

    const prompt = `Ти нутріціолог. Проаналізуй раціон за тиждень і дай рекомендації по вітамінах та мінералах.

КОРИСТУВАЧ:
- Вік: ${profile.age}, стать: ${profile.sex === 'm' ? 'чоловік' : 'жінка'}
- Вага: ${profile.weight} кг, зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Норма: ${profile.daily_norm} ккал

СТРАВИ ЗА ТИЖДЕНЬ (${meals.length} шт):
${mealsList}

Проаналізуй і напиши (українською, 6-10 речень):

1. **Загальний баланс** — чи достатньо калорій, білків, жирів, вуглеводів
2. **Яких вітамінів не вистачає** (наприклад A, C, D, B12) — і чому
3. **Яких мінералів не вистачає** (залізо, кальцій, магній, цинк) — і чому
4. **Конкретні продукти** — що додати в раціон (наприклад: "додай більше лосося, яєць, шпинату")
5. **Які вітамінні добавки розглянути** (без брендів, просто тип)
6. **Що обмежити** — від чого відмовитись

Тон: турботливий, науковий, але доступний. Без markdown.
Розбий на абзаци для читабельності.`;

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

    return Response.json({ report: text });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}