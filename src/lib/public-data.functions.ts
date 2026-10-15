import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
        h.set('apikey', key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const productCols = 'id, slug, name, description, main_image, images, material, finish, dimensions, customization, price, availability, featured, is_ai_concept, category_id, categories(slug, name)';

export const getSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('site_settings').select('phone, whatsapp, instagram, location_text, latitude, longitude, hero_title, hero_text, why_us').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export const listCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('categories').select('id, slug, name, description, image_url').order('sort_order');
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('products').select(productCols).eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb.from('products').select(productCols).eq('slug', data.slug).eq('status', 'published').maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const { data: related } = product.category_id
      ? await sb.from('products').select(productCols).eq('status', 'published').eq('category_id', product.category_id).neq('id', product.id).limit(3)
      : { data: [] };
    return { product, related: related ?? [] };
  });

export const listProjects = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('projects').select('id, title, description, images, is_ai_concept, categories(slug, name)').eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});
