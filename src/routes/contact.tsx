import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpRight, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnquiryForm } from '@/components/enquiry-form';
import { useSettings } from '@/components/site-shell';
import { directionsUrl, enquiryUrl, pageHead, telUrl } from '@/lib/furniture';

export const Route = createFileRoute('/contact')({ head: () => pageHead('Contact & location', 'Call or WhatsApp First Shine Furniture, find directions to Kugisozi, Beretwari, or send us a message.'), component: Contact });

function Contact() {
  const s = useSettings();
  return <main><section className="page-intro"><span className="eyebrow">CONTACT</span><h1>Good things start <em>with a conversation.</em></h1></section>
    <section className="section contact-content"><div className="contact-details"><div><Phone size={20} /><span className="eyebrow">CALL</span><a href={telUrl(s.phone)}>{s.phone} <ArrowUpRight size={18} /></a></div><div><MessageCircle size={20} /><span className="eyebrow">WHATSAPP</span><Button asChild><a href={enquiryUrl('furniture', s.whatsapp)} target="_blank" rel="noreferrer">Message us on WhatsApp</a></Button></div><div><Instagram size={20} /><span className="eyebrow">INSTAGRAM</span><a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer">@{s.instagram} <ArrowUpRight size={18} /></a></div><div><MapPin size={20} /><span className="eyebrow">LOCATION</span><p>{s.location_text}</p><a href={directionsUrl(s.latitude, s.longitude)} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={18} /></a></div></div>
      <div><h2>Send a <em>message.</em></h2><EnquiryForm kind="contact" /></div></section>
    <section className="map-wrap"><iframe title="Map showing First Shine Furniture location" loading="lazy" src={`https://maps.google.com/maps?q=${s.latitude},${s.longitude}&z=16&output=embed`} /></section></main>;
}
