import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Instagram, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { directionsUrl, enquiryUrl, telUrl } from '@/lib/furniture';
import { fallbackSettings, settingsQuery } from '@/lib/queries';

export function useSettings() {
  const { data } = useQuery(settingsQuery);
  return data ?? fallbackSettings;
}

const links = [
  { to: '/', label: 'Home', exact: true },
  { to: '/furniture', label: 'Furniture' },
  { to: '/custom-orders', label: 'Custom orders' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const s = useSettings();
  return <><div className="announcement">Furniture for homes and workplaces in Rwanda · {s.phone}</div><header className="site-header"><Link to="/" className="brand" aria-label="First Shine Furniture home">first shine<span>FURNITURE</span></Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(l => <Link key={l.to} to={l.to} activeProps={{ className: 'nav-active' }} activeOptions={{ exact: 'exact' in l }}>{l.label}</Link>)}</nav><Button asChild className="header-enquiry" size="lg"><a href={enquiryUrl('furniture', s.whatsapp)} target="_blank" rel="noreferrer">WhatsApp us <ArrowUpRight /></a></Button><Button className="mobile-menu" variant="ghost" size="icon" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></header>{open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(l => <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>)}<a href={enquiryUrl('furniture', s.whatsapp)} target="_blank" rel="noreferrer">WhatsApp us</a></nav>}</>;
}

export function SiteFooter() {
  const s = useSettings();
  return <footer className="site-footer"><div className="footer-grid"><div><Link to="/" className="brand">first shine<span>FURNITURE</span></Link><p className="footer-tag">Furniture for the way you live.</p></div><div><span className="eyebrow">EXPLORE</span>{links.slice(1).map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}</div><div><span className="eyebrow">CONTACT</span><a href={telUrl(s.phone)}><Phone size={15} /> {s.phone}</a><a href={enquiryUrl('furniture', s.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer"><Instagram size={15} /> @{s.instagram}</a></div><div><span className="eyebrow">FIND US</span><p>{s.location_text}</p><a href={directionsUrl(s.latitude, s.longitude)} target="_blank" rel="noreferrer"><MapPin size={15} /> Get directions</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} First Shine Furniture</span><span>Images marked “Illustrative concept” are design ideas, not photos of delivered work.</span></div></footer>;
}

export function ContactBand() {
  const s = useSettings();
  return <section className="contact-band"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Let’s talk about <em>your space.</em></h2><p>Browse the catalogue or send us a message on WhatsApp.</p></div><div className="band-actions"><Button variant="outline" size="lg" className="band-outline" asChild><Link to="/furniture">Explore furniture</Link></Button><Button variant="brass" size="lg" asChild><a href={enquiryUrl('a furniture project', s.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp us</a></Button></div></section>;
}
