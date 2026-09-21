import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages, profile } = await req.json();
    if (!messages) return Response.json({ error: 'No messages' }, { status: 400 });

    const systemPrompt = `Ти — персональний нутріціолог-тренер у додатку CalorieAI.
Дані користувача:
- Стать: ${profile?.sex === 'm' ? 'чоловік' : 'жінка'}
- Вік: ${profile?.age}
- Вага: ${profile?.weight} кг, зріст: ${profile?.height} см
- Активність: ${profile?.activity}
- Ціль: ${profile?.goal === 'lose' ? 'схуднення' : profile?.goal === 'gain' ? 'набір маси' : 'підтримка'}
- Денна норма: ${profile?.daily_norm} ккал

Відповідай коротко (2-4 речення), дружньо, українською.
Давай конкретні поради по їжі, тренуваннях, мотивації.
Не використовуй markdown, тільки простий текст.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemPrompt }] },
            ...messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          ],
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');

    return Response.json({ reply: text });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
