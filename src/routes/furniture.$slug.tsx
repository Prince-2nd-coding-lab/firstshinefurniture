import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConceptBadge, ProductCard } from '@/components/product-card';
import { useSettings } from '@/components/site-shell';
import { formatPrice, pageHead, resolveImage, whatsappMessageUrl } from '@/lib/furniture';
import { productQuery } from '@/lib/queries';

export const Route = createFileRoute('/furniture/$slug')({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!data) throw notFound();
    return { name: data.product.name, description: data.product.description };
  },
  head: ({ loaderData }) => loaderData ? pageHead(loaderData.name, loaderData.description || `${loaderData.name} from First Shine Furniture.`) : { meta: [{ title: 'Unavailable | First Shine Furniture' }, { name: 'robots', content: 'noindex' }] },
  notFoundComponent: () => <main className="section empty-state"><h1>Item not found</h1><p>This piece may no longer be listed.</p><Button asChild><Link to="/furniture">Back to the catalogue</Link></Button></main>,
  errorComponent: () => <main className="section empty-state"><h1>Couldn’t load this item</h1><Button asChild><Link to="/furniture">Back to the catalogue</Link></Button></main>,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const s = useSettings();
  const [active, setActive] = useState(0);
  if (!data) return null;
  const { product: p, related } = data;
  const gallery = [p.main_image, ...p.images].filter(Boolean).map(i => resolveImage(i)!).filter(Boolean);
  const price = formatPrice(p.price);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const msg = `Hello First Shine Furniture, I'm interested in "${p.name}"${url ? ` (${url})` : ''}. Could you share more details and a quote?`;
  const details = [['Material', p.material], ['Finish', p.finish], ['Dimensions', p.dimensions], ['Customisation', p.customization]].filter(([, v]) => v);
  return <main><section className="section product-detail"><div className="gallery">{gallery[active] && <div className="gallery-main"><img src={gallery[active]} alt={p.name} width={896} height={1120} /><ConceptBadge concept={p.is_ai_concept} /></div>}{gallery.length > 1 && <div className="thumbs">{gallery.map((g, i) => <button key={g + i} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-pressed={i === active}><img src={g} alt="" width={90} height={110} /></button>)}</div>}</div>
    <div className="product-info"><Link to="/furniture" className="back-link"><ArrowLeft size={16} /> Catalogue</Link><span className="eyebrow">{p.categories?.name}</span><h1>{p.name}</h1><p className="price">{price ?? 'Price on request'}</p>{p.description && <p>{p.description}</p>}{details.length > 0 && <dl>{details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}{p.is_ai_concept && <p className="note">This image is an illustrative concept. Ask us for photos of comparable work.</p>}<Button size="lg" asChild><a href={whatsappMessageUrl(msg, s.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle /> {price ? 'Enquire on WhatsApp' : 'Request a quote on WhatsApp'}</a></Button></div></section>
    {related.length > 0 && <section className="section section-muted"><h2>More in <em>{p.categories?.name}</em></h2><div className="product-grid">{related.map(r => <ProductCard key={r.id} product={r} />)}</div></section>}</main>;
}
