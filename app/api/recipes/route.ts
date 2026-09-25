import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { profile, target, dietary, timeOfDay } = await req.json();

    const prompt = `Ти шеф-кухар і нутріціолог. Запропонуй 3 рецепти українською.

ДАНІ КОРИСТУВАЧА:
- Норма: ${profile.daily_norm} ккал/день
- Ціль: ${
      profile.goal === 'lose'
        ? 'схуднення'
        : profile.goal === 'gain'
        ? 'набір маси'
        : 'підтримка'
    }
- Вік: ${profile.age}, стать: ${profile.sex === 'm' ? 'чоловік' : 'жінка'}
- Обмеження: ${dietary || 'немає'}
- Прийом їжі: ${timeOfDay || 'будь-який'}
- Цільова калорійність страви: ${target || 'будь-яка'} ккал

Поверни ТІЛЬКИ JSON:
{
  "recipes": [
    {
      "name": "назва страви",
      "emoji": "емодзі страви",
      "calories": число,
      "protein": число,
      "fat": число,
      "carbs": число,
      "time_min": час_приготування_у_хвилинах,
      "difficulty": "easy" | "medium" | "hard",
      "ingredients": ["100 г курки", "2 яйця", ...],
      "steps": ["Крок 1...", "Крок 2...", ...]
    }
  ]
}

Правила:
- 3 рецепти різних за складністю
- Реалістичні інгредієнти, які є в українських магазинах
- Покрокові інструкції (3-6 кроків)
- Калорії в межах ±15% від цільової
- Якщо обмеження — дотримуйся
- Українською мовою`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');

    return Response.json(JSON.parse(text));
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}