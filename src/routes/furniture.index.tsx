import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { ContactBand, useSettings } from '@/components/site-shell';
import { enquiryUrl, pageHead } from '@/lib/furniture';
import { categoriesQuery, productsQuery } from '@/lib/queries';

type CatalogSearch = { category?: string | undefined; q?: string | undefined; sort?: 'newest' | 'name' | undefined };
const str = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 100) : undefined);

export const Route = createFileRoute('/furniture/')({
  validateSearch: (s: Record<string, unknown>): CatalogSearch => ({ category: str(s['category']), q: str(s['q']), sort: s['sort'] === 'name' ? 'name' : s['sort'] === 'newest' ? 'newest' : undefined }),
  head: () => pageHead('Furniture catalogue', 'Browse sofas, beds, TV stands, kitchens, wardrobes, tables, office furniture and doors from First Shine Furniture.'),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(productsQuery)]),
  pendingComponent: () => <main className="section"><p className="note">Loading furniture…</p></main>,
  errorComponent: () => <main className="section"><h1>Catalogue unavailable</h1><p className="note">We couldn’t load the furniture right now. Please refresh or try again shortly.</p></main>,
  component: Catalog,
});

export function filterProducts<T extends { name: string; created_at?: string; categories: { slug: string } | null }>(items: T[], opts: CatalogSearch) {
  const q = opts.q?.trim().toLowerCase();
  const list = items.filter(p => (!opts.category || p.categories?.slug === opts.category) && (!q || p.name.toLowerCase().includes(q)));
  return opts.sort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
}

function Catalog() {
  const { category, q, sort } = Route.useSearch();
  const navigate = useNavigate({ from: '/furniture/' });
  const s = useSettings();
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const list = filterProducts(products, { category, q, sort });
  return <main><section className="page-intro"><span className="eyebrow">FURNITURE CATALOGUE</span><h1>Find the right <em>piece.</em></h1><p>Prices are shared on request — ask for a quote on any item.</p></section>
    <section className="section"><div className="catalog-tools"><div className="search-box"><Search size={16} /><Input aria-label="Search furniture by name" placeholder="Search by name" defaultValue={q ?? ''} onChange={e => navigate({ search: prev => ({ ...prev, q: e.target.value || undefined }), replace: true })} /></div><select aria-label="Sort" className="native-select" value={sort ?? 'newest'} onChange={e => navigate({ search: prev => ({ ...prev, sort: e.target.value as 'newest' | 'name' }) })}><option value="newest">Newest</option><option value="name">Name A–Z</option></select></div>
      <div className="filters" aria-label="Furniture categories"><Button variant={!category ? 'default' : 'outline'} aria-pressed={!category} onClick={() => navigate({ search: prev => ({ ...prev, category: undefined }) })}>All</Button>{categories.map(c => <Button key={c.id} variant={category === c.slug ? 'default' : 'outline'} aria-pressed={category === c.slug} onClick={() => navigate({ search: prev => ({ ...prev, category: c.slug }) })}>{c.name}</Button>)}</div>
      {list.length ? <div className="product-grid">{list.map(p => <ProductCard key={p.id} product={p} />)}</div> : <div className="empty-state"><h3>No furniture to show here yet.</h3><p>Tell us what you’re looking for and we’ll help.</p><Button asChild><a href={enquiryUrl(category ? categories.find(c => c.slug === category)?.name ?? 'furniture' : 'furniture', s.whatsapp)} target="_blank" rel="noreferrer">Ask on WhatsApp</a></Button></div>}
    </section><ContactBand /></main>;
}
