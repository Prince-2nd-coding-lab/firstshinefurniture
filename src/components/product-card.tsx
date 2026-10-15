import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { formatPrice, resolveImage } from '@/lib/furniture';
import type { Product } from '@/lib/queries';

export function ConceptBadge({ concept }: { concept: boolean }) {
  return <span className={concept ? 'badge-concept' : 'badge-real'}>{concept ? 'Illustrative concept' : 'Our work'}</span>;
}

export function ProductCard({ product }: { product: Product }) {
  const img = resolveImage(product.main_image ?? product.images[0]);
  const price = formatPrice(product.price);
  return <article className="product-card"><Link to="/furniture/$slug" params={{ slug: product.slug }} className="product-image">{img ? <img src={img} alt={product.name} width={448} height={560} loading="lazy" /> : <div className="image-empty" />}<ConceptBadge concept={product.is_ai_concept} /><span className="image-arrow"><ArrowUpRight size={20} /></span></Link><div className="product-meta"><span className="eyebrow">{product.categories?.name ?? 'Furniture'}</span><h3><Link to="/furniture/$slug" params={{ slug: product.slug }}>{product.name}</Link></h3><p>{price ?? 'Request a quote'}</p></div></article>;
}
