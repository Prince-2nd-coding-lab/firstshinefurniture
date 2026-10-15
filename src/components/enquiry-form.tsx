import { useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validateUpload, whatsappMessageUrl } from '@/lib/furniture';
import { useSettings } from './site-shell';

const opt = (max: number) => z.string().trim().max(max).optional().transform(v => v || null);
export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,25}$/, 'Enter a valid phone or WhatsApp number'),
  category: opt(100),
  description: z.string().trim().min(5, 'Please describe what you need').max(2000),
  dimensions: opt(200),
  materials: opt(300),
  budget: opt(100),
  location: opt(200),
});

const categories = ['Sofas & chairs', 'Beds', 'TV stands', 'Kitchens', 'Wardrobes', 'Tables', 'Office furniture', 'Doors', 'Other'];

export function EnquiryForm({ kind }: { kind: 'custom' | 'contact' }) {
  const s = useSettings();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState('');
  const custom = kind === 'custom';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string'));
    const parsed = enquirySchema.safeParse(raw);
    const file = fd.get('file');
    const next: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach(i => { next[String(i.path[0])] = i.message; });
    if (file instanceof File && file.size > 0) { const err = validateUpload(file); if (err) next['file'] = err; }
    setErrors(next);
    if (!parsed.success || Object.keys(next).length) return;
    setStatus('sending');
    try {
      let attachment_path: string | null = null;
      if (file instanceof File && file.size > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('enquiry-uploads').upload(path, file, { contentType: file.type });
        if (error) throw error;
        attachment_path = path;
      }
      const { error } = await supabase.from('enquiries').insert({ ...parsed.data, kind, attachment_path });
      if (error) throw error;
      const d = parsed.data;
      setSummary(`Hello First Shine Furniture, I'm ${d.name}. I just sent a ${custom ? 'custom furniture request' : 'message'} on your website${d.category ? ` about ${d.category}` : ''}: ${d.description}`);
      setStatus('done');
      e.currentTarget?.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') return <div className="form-success" role="status"><CheckCircle2 size={34} /><h3>Thank you — we’ve received your {custom ? 'request' : 'message'}.</h3><p>We’ll get back to you on the number you provided. You can also follow up straight away on WhatsApp.</p><Button asChild size="lg"><a href={whatsappMessageUrl(summary, s.whatsapp)} target="_blank" rel="noreferrer"><MessageCircle /> Follow up on WhatsApp</a></Button><Button variant="ghost" onClick={() => setStatus('idle')}>Send another</Button></div>;

  const field = (name: string, label: string, el: ReactNode) => <div className="field"><Label htmlFor={`${kind}-${name}`}>{label}</Label>{el}{errors[name] && <span className="field-error">{errors[name]}</span>}</div>;
  const id = (n: string) => `${kind}-${n}`;
  return <form className="enquiry-form" onSubmit={onSubmit} noValidate>
    <div className="form-row">{field('name', 'Your name *', <Input id={id('name')} name="name" autoComplete="name" maxLength={100} />)}{field('phone', 'Phone or WhatsApp *', <Input id={id('phone')} name="phone" type="tel" autoComplete="tel" placeholder="+250 ..." maxLength={25} />)}</div>
    {field('category', 'Furniture type', <select id={id('category')} name="category" className="native-select" defaultValue=""><option value="">Choose a category</option>{categories.map(c => <option key={c}>{c}</option>)}</select>)}
    {field('description', custom ? 'Describe the item you want *' : 'Your message *', <Textarea id={id('description')} name="description" rows={5} maxLength={2000} />)}
    {custom && <><div className="form-row">{field('dimensions', 'Preferred dimensions', <Input id={id('dimensions')} name="dimensions" placeholder="e.g. 220 × 90 cm" maxLength={200} />)}{field('materials', 'Material & finish', <Input id={id('materials')} name="materials" placeholder="e.g. dark wood, grey fabric" maxLength={300} />)}</div>
    <div className="form-row">{field('budget', 'Budget range (optional)', <Input id={id('budget')} name="budget" maxLength={100} />)}{field('location', 'Delivery / installation location', <Input id={id('location')} name="location" maxLength={200} />)}</div>
    {field('file', 'Reference image (optional, JPG/PNG/WEBP, max 5 MB)', <Input id={id('file')} name="file" type="file" accept="image/jpeg,image/png,image/webp" />)}</>}
    {status === 'error' && <p className="field-error" role="alert">Sorry, something went wrong sending your {custom ? 'request' : 'message'}. Please try again or contact us on WhatsApp.</p>}
    <Button type="submit" size="lg" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : custom ? 'Send request' : 'Send message'}</Button>
  </form>;
}
