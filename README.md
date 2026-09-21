<div align="center">

# 🍎 CalorieAI

### Розумний щоденник калорій з ШІ-розпізнаванням їжі за фото

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash--Lite-4285F4?logo=google)](https://ai.google.dev)

[**🚀 Live Demo**](https://calorie-ai-heln.onrender.com)

</div>

---

## ✨ Що вміє

- 📸 **Розпізнавання їжі за фото** — Google Gemini 3.5 Flash-Lite аналізує страву за 2-4 секунди
- 🔥 **Персональна норма калорій** — формула Міффліна-Сан Жеора
- 🎯 **3 цілі** — схуднення / підтримка / набір маси
- 📊 **Макро-баланс** — білки / жири / вуглеводи у реальному часі
- 📈 **Графіки історії** — 7 днів / 30 днів (Recharts)
- 🏆 **Стріки та досягнення** — геймифікація для мотивації
- 🤖 **AI-чат тренер** — персональні поради по харчуванню
- 🔐 **Авторизація** — email + пароль, RLS-захист даних
- 💾 **Хмарна база** — Supabase (PostgreSQL + Auth + Storage)
- 📱 **PWA** — встановлюється як застосунок на телефон
- 🎨 **Premium UI** — темна тема, glassmorphism, Framer Motion анімації

## 🛠️ Технології

| Шар | Технологія |
|-----|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Стилі** | Tailwind CSS 4 + Framer Motion |
| **Backend** | Next.js API Routes |
| **База даних** | Supabase (PostgreSQL + Row Level Security) |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (фото страв) |
| **ШІ** | Google Gemini 3.5 Flash-Lite |
| **Графіки** | Recharts |
| **Іконки** | Lucide React |
| **Хостинг** | Render.com |

## 🚀 Локальний запуск

### 1. Клонування

```bash
git clone https://github.com/0961807311m/calorie-ai.git
cd calorie-ai
npm install