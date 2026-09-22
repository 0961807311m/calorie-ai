import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { barcode } = await req.json();
    if (!barcode) return Response.json({ error: 'No barcode' }, { status: 400 });

    // Запит до OpenFoodFacts
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_uk,brands,nutriments,serving_size,image_front_small_url,quantity`,
      {
        headers: {
          'User-Agent': 'CalorieAI - WebApp - Version 1.0',
        },
      }
    );

    const data = await res.json();

    if (data.status === 0 || !data.product) {
      return Response.json({ error: 'product_not_found' }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments || {};

    // Калорії (на 100г)
    const calories100 =
      n['energy-kcal_100g'] ||
      (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0) ||
      0;

    // Пробуємо отримати назву українською
    const name = p.product_name_uk || p.product_name || 'Невідомий продукт';

    // Спроба визначити порцію
    const servingSize = p.serving_size || p.quantity || '100 г';
    const servingGrams = parseFloat(servingSize) || 100;

    // Розрахунок на порцію
    const ratio = servingGrams / 100;

    const result = {
      name,
      brand: p.brands || '',
      barcode,
      image_url: p.image_front_small_url || '',
      serving_size: servingSize,
      serving_grams: servingGrams,
      // На 100г
      per_100g: {
        calories: Math.round(calories100),
        protein: Math.round((n.proteins_100g || 0) * 10) / 10,
        fat: Math.round((n.fat_100g || 0) * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
        sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
      },
      // На порцію
      per_serving: {
        calories: Math.round(calories100 * ratio),
        protein: Math.round((n.proteins_100g || 0) * ratio * 10) / 10,
        fat: Math.round((n.fat_100g || 0) * ratio * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g || 0) * ratio * 10) / 10,
        sugar: Math.round((n.sugars_100g || 0) * ratio * 10) / 10,
      },
    };

    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}