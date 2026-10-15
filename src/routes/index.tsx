import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, MapPin, MessageCircle, PenLine, Ruler, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactBand, useSettings } from '@/components/site-shell';
import { ConceptBadge, ProductCard } from '@/components/product-card';
import { directionsUrl, enquiryUrl, pageHead, resolveImage, telUrl } from '@/lib/furniture';
import { categoriesQuery, productsQuery, projectsQuery } from '@/lib/queries';
import hero from '@/assets/hero-living.jpg';

export const Route = createFileRoute('/')({
  head: () => pageHead('Furniture made for the way you live', 'Sofas, beds, TV stands, fitted kitchens, wardrobes, tables, office furniture and doors from First Shine Furniture in Kigali, Rwanda.'),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(categoriesQuery),
    context.queryClient.ensureQueryData(productsQuery),
    context.queryClient.ensureQueryData(projectsQuery),
  ]),
  component: Index,
});

function Index() {
  const s = useSettings();
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const featured = products.filter(p => p.featured).slice(0, 4);
  return <main>
    <section className="home-hero"><img className="hero-photo" src={hero} alt="Living room with a navy sectional sofa and walnut TV wall unit" width={1920} height={1088} /><div className="hero-shade" /><div className="hero-content"><span className="eyebrow">FIRST SHINE FURNITURE · RWANDA</span><h1>{s.hero_title}</h1><p>{s.hero_text}</p><div className="hero-actions"><Button variant="brass" size="lg" asChild><Link to="/furniture">Explore furniture <ArrowUpRight /></Link></Button><Button variant="hero" size="lg" asChild><Link to="/custom-orders"><PenLine /> Request custom furniture</Link></Button><Button variant="hero" size="lg" asChild><a href={enquiryUrl('furniture', s.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button></div></div><span className="inspiration-label">ILLUSTRATIVE CONCEPT</span></section>

    <section className="section"><div className="section-heading"><div><span className="eyebrow">WHAT WE MAKE</span><h2>Furniture for <em>every room.</em></h2></div><Link to="/furniture" className="text-link">View the catalogue <ArrowUpRight size={18} /></Link></div>
      <div className="category-grid">{categories.map(c => <Link key={c.id} to="/furniture" search={{ category: c.slug }} className="category-tile"><img src={resolveImage(c.image_url)} alt={`${c.name} — illustrative concept`} width={448} height={560} loading="lazy" /><div><h3>{c.name}</h3><ArrowUpRight size={18} /></div></Link>)}</div>
      <p className="note">Category images are illustrative concepts, not photographs of our delivered work.</p></section>

    {featured.length > 0 && <section className="section section-muted"><div className="section-heading"><div><span className="eyebrow">FEATURED</span><h2>Selected <em>pieces.</em></h2></div><Link to="/furniture" className="text-link">All furniture <ArrowUpRight size={18} /></Link></div><div className="product-grid">{featured.map(p => <ProductCard key={p.id} product={p} />)}</div></section>}

    <section className="section custom-steps"><div><span className="eyebrow">CUSTOM FURNITURE</span><h2>Have something <em>specific</em> in mind?</h2><p>Tell us what you need and we’ll discuss the details with you directly.</p><Button size="lg" asChild><Link to="/custom-orders">Start a request <ArrowUpRight /></Link></Button></div><ol><li><PenLine /><strong>Describe it</strong><span>Share the item, size, materials and a reference photo if you have one.</span></li><li><Ruler /><strong>Discuss the details</strong><span>We contact you to talk through specifications and a quotation.</span></li><li><Truck /><strong>Agree next steps</strong><span>Delivery or installation is arranged with you directly.</span></li></ol></section>

    {projects.length > 0 && <section className="section section-muted"><div className="section-heading"><div><span className="eyebrow">PROJECTS</span><h2>From our <em>workshop.</em></h2></div><Link to="/projects" className="text-link">See the gallery <ArrowUpRight size={18} /></Link></div><div className="project-grid">{projects.slice(0, 3).map(p => <figure key={p.id} className="project-tile"><img src={resolveImage(p.images[0])} alt={p.title} loading="lazy" width={448} height={448} /><ConceptBadge concept={p.is_ai_concept} /><figcaption>{p.title}</figcaption></figure>)}</div></section>}

    {s.why_us.length > 0 && <section className="section why"><span className="eyebrow">WHY FIRST SHINE</span><ul>{s.why_us.map(w => <li key={w}>{w}</li>)}</ul></section>}

    <section className="section location"><div><span className="eyebrow">VISIT US</span><h2>Find <em>First Shine.</em></h2><p><MapPin size={16} /> {s.location_text}</p><div className="hero-actions"><Button size="lg" asChild><a href={directionsUrl(s.latitude, s.longitude)} target="_blank" rel="noreferrer">Get directions <ArrowUpRight /></a></Button><Button size="lg" variant="outline" asChild><a href={telUrl(s.phone)}>Call {s.phone}</a></Button></div></div><iframe title="Map showing First Shine Furniture location" loading="lazy" src={`https://maps.google.com/maps?q=${s.latitude},${s.longitude}&z=16&output=embed`} /></section>

    <ContactBand />
  </main>;
}
