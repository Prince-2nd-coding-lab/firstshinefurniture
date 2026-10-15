import { queryOptions } from '@tanstack/react-query';
import { getProduct, getSettings, listCategories, listProducts, listProjects } from './public-data.functions';
import { DEFAULT_PHONE, DEFAULT_WHATSAPP } from './furniture';

export const fallbackSettings = {
  phone: DEFAULT_PHONE,
  whatsapp: DEFAULT_WHATSAPP,
  instagram: 'firstshinefurniture',
  location_text: 'Kugisozi, Beretwari, near the signboard, on the left before reaching the signboard.',
  latitude: -1.9144367966455453,
  longitude: 30.06565279272995,
  hero_title: 'Furniture Made for the Way You Live',
  hero_text: 'Explore furniture for your home and workplace, from comfortable seating and bedroom furniture to fitted kitchens and custom interior solutions.',
  why_us: [] as string[],
};
export type Settings = typeof fallbackSettings;

export const settingsQuery = queryOptions({
  queryKey: ['settings'],
  queryFn: async (): Promise<Settings> => (await getSettings()) ?? fallbackSettings,
  staleTime: 60_000,
});
export const categoriesQuery = queryOptions({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 60_000 });
export const productsQuery = queryOptions({ queryKey: ['products'], queryFn: () => listProducts() });
export const productQuery = (slug: string) => queryOptions({ queryKey: ['product', slug], queryFn: () => getProduct({ data: { slug } }) });
export const projectsQuery = queryOptions({ queryKey: ['projects'], queryFn: () => listProjects() });

export type Product = Awaited<ReturnType<typeof listProducts>>[number];
export type Category = Awaited<ReturnType<typeof listCategories>>[number];
export type Project = Awaited<ReturnType<typeof listProjects>>[number];
