import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return Response.json({ error: 'No text' }, { status: 400 });

    const prompt = `Ти нутріціолог. Користувач описав напій. Проаналізуй його.

НАПІЙ: "${text}"

Поверни ТІЛЬКИ JSON без markdown:
{
  "name": "назва напою українською",
  "volume_ml": об'єм у мл (приблизно),
  "calories": калорій,
  "protein": грами,
  "fat": грами,
  "carbs": грами,
  "sugar": грами цукру,
  "portion": "опис, напр ~250 мл"
}

Якщо це просто вода — calories 0.
Якщо не зрозуміло — поверни {"error":"unknown"}.
Приклади: "кава з молоком", "кола 0.5", "сік апельсиновий 200 мл".`;

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

    const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textRes) throw new Error('Empty response');

    const result = JSON.parse(textRes);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}