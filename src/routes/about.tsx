import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { ContactBand } from '@/components/site-shell';
import { pageHead } from '@/lib/furniture';
import wardrobes from '@/assets/cat-wardrobes.jpg';

export const Route = createFileRoute('/about')({ head: () => pageHead('About us', 'Meet First Shine Furniture: sofas, beds, kitchens, wardrobes, tables, office furniture and doors for homes and workplaces in Rwanda.'), component: About });

function About() {
  return <main><section className="page-intro"><span className="eyebrow">ABOUT US</span><h1>Furniture for the <em>spaces you live in.</em></h1></section><section className="section about-content"><img src={wardrobes} alt="Built-in wardrobe — illustrative concept" width={896} height={1120} loading="lazy" /><div><span className="eyebrow">FIRST SHINE FURNITURE</span><h2>What <em>we make.</em></h2><p>First Shine Furniture offers sofas and chairs, beds, TV stands and entertainment units, kitchen furniture and fitted kitchens, wardrobes, tables, office furniture and doors.</p><p>Have a style in mind or a space you want to furnish? Share your ideas with us and we’ll discuss your requirements together.</p><Link className="text-link" to="/furniture">Explore the catalogue <ArrowUpRight size={18} /></Link></div></section><ContactBand /></main>;
}
