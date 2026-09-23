import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return Response.json({ error: 'No image' }, { status: 400 });

    const base64 = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const prompt = `Ти експерт з харчових добавок та безпеки продуктів. Проаналізуй склад продукту на фото етикетки.

Твоє завдання:
1. Прочитати всі інгредієнти та E-добавки з етикетки
2. Оцінити безпечність продукту загалом

Поверни ТІЛЬКИ JSON без markdown:
{
  "product_name": "назва продукту (якщо видно) або 'Невідомий продукт'",
  "verdict": "safe" | "caution" | "danger",
  "verdict_text": "1-2 речення — короткий вердикт чи варто брати",
  "dangerous": [
    {
      "code": "E-код або назва",
      "name": "повна назва",
      "effect": "побічні ефекти коротко"
    }
  ],
  "caution": [
    {
      "code": "E-код або назва",
      "name": "повна назва",
      "risk": "в чому ризик"
    }
  ],
  "safe_count": число_безпечних_добавок
}

Правила:
- "danger": барвники E102, E104, E110, E122, E124, E129, E131, E142, E151, E153, E155, E180; консерванти E211, E212, E213, E216, E217, E240; підсилювачі E621 (глутамат), E622, E623, E627, E631, E635; цукрозамінники аспартам E951, E952, E954, E962; сиропи фруктози, гідрогенізовані жири, трансжири
- "caution": E100-E171, E200-E203, E220-E228 (сульфіти), E250, E251, E252, E320, E321, E338-E343, E407, E450-E452, E951 в малих дозах
- "safe": E300 (вітамін C), E306-E309 (вітамін E), E322 (лецитин), E330 (лимонна кислота), E440 (пектин), E948+, природні барвники

Якщо добавок немає взагалі — "dangerous" та "caution" порожні масиви, verdict "safe".
Якщо фото не етикетка — поверни {"error":"not_label"}.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          generationConfig: { responseMimeType: 'application/json' },
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