import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return Response.json({ error: 'No image' }, { status: 400 });

    const base64 = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const prompt = `Ти нутріціолог. Розпізнай страву на фото.
Поверни ТІЛЬКИ JSON без markdown:
{"name":"назва українською","calories":число_ккал,"protein":грами,"fat":грами,"carbs":грами,"portion":"опис, напр ~250 г"}
Якщо на фото не їжа — поверни {"error":"not_food"}.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');

    const result = JSON.parse(text);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}