import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveImage, slugify, validateUpload } from '@/lib/furniture';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({ meta: [{ title: 'Admin | First Shine Furniture' }, { name: 'description', content: 'Manage the First Shine Furniture website.' }, { property: 'og:title', content: 'Admin | First Shine Furniture' }, { property: 'og:description', content: 'Owner dashboard.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
  component: Admin,
});

type Product = Tables<'products'>; type Category = Tables<'categories'>; type Project = Tables<'projects'>; type Enquiry = Tables<'enquiries'>; type Settings = Tables<'site_settings'>;

async function uploadImage(file: File) {
  const err = validateUpload(file);
  if (err) throw new Error(err);
  const path = `${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() ?? 'jpg'}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from('product-images').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error('Could not create image link');
  return data.signedUrl;
}
const str = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? '').trim(); return v || null; };

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useQuery({ queryKey: ['admin-role'], queryFn: async () => { const { data: u } = await supabase.auth.getUser(); const { data } = await supabase.rpc('has_role', { _user_id: u.user!.id, _role: 'admin' }); return { isAdmin: !!data, email: u.user?.email }; } });
  async function signOut() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: '/auth', replace: true }); }
  if (role.isLoading) return <main className="section"><p className="note">Loading…</p></main>;
  if (!role.data?.isAdmin) return <main className="section empty-state"><h1>No admin access</h1><p>Signed in as {role.data?.email}. This account is not an administrator.</p><Button onClick={signOut}>Sign out</Button></main>;
  return <main className="section admin"><div className="admin-head"><h1>Dashboard</h1><div><span className="note">{role.data.email}</span> <Button variant="outline" onClick={signOut}>Sign out</Button></div></div>
    <Tabs defaultValue="products"><TabsList className="admin-tabs"><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger><TabsTrigger value="enquiries">Enquiries</TabsTrigger><TabsTrigger value="settings">Business info</TabsTrigger></TabsList>
      <TabsContent value="products"><Products /></TabsContent><TabsContent value="categories"><Categories /></TabsContent><TabsContent value="projects"><Projects /></TabsContent><TabsContent value="enquiries"><Enquiries /></TabsContent><TabsContent value="settings"><SettingsForm /></TabsContent></Tabs></main>;
}

function useCategories() { return useQuery({ queryKey: ['admin-categories'], queryFn: async () => { const { data, error } = await supabase.from('categories').select('*').order('sort_order'); if (error) throw error; return data; } }); }
function invalidatePublic(qc: ReturnType<typeof useQueryClient>) { ['products', 'categories', 'projects', 'settings'].forEach(k => qc.invalidateQueries({ queryKey: [k] })); }

function Products() {
  const qc = useQueryClient();
  const cats = useCategories();
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const list = useQuery({ queryKey: ['admin-products'], queryFn: async () => { const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const save = useMutation({
    mutationFn: async ({ fd, id }: { fd: FormData; id?: string | undefined }) => {
      const main = fd.get('main_file'); const extra = fd.getAll('extra_files').filter((f): f is File => f instanceof File && f.size > 0);
      const name = str(fd, 'name')!; const priceRaw = str(fd, 'price');
      const row: Partial<Product> = { name, slug: slugify(str(fd, 'slug') ?? name), category_id: str(fd, 'category_id'), description: str(fd, 'description') ?? '', material: str(fd, 'material'), finish: str(fd, 'finish'), dimensions: str(fd, 'dimensions'), customization: str(fd, 'customization'), price: priceRaw ? Number(priceRaw) : null, availability: str(fd, 'availability') ?? 'on_request', featured: fd.get('featured') === 'on', status: fd.get('status') === 'published' ? 'published' : 'draft', is_ai_concept: fd.get('is_ai_concept') === 'on', updated_at: new Date().toISOString() };
      if (!name) throw new Error('Name is required');
      if (main instanceof File && main.size > 0) row.main_image = await uploadImage(main);
      if (extra.length) { const urls = await Promise.all(extra.map(uploadImage)); const prev = typeof editing === 'object' && editing ? editing.images : []; row.images = [...prev, ...urls]; }
      const { error } = id ? await supabase.from('products').update(row).eq('id', id) : await supabase.from('products').insert(row as Product);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Product saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['admin-products'] }); invalidatePublic(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('products').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); invalidatePublic(qc); }, onError: (e: Error) => toast.error(e.message) });
  const quick = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Partial<Product> }) => { const { error } = await supabase.from('products').update(patch).eq('id', id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); invalidatePublic(qc); } });

  if (editing) { const p = editing === 'new' ? null : editing; return <form className="admin-form" onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); save.mutate({ fd: new FormData(e.currentTarget), id: p?.id }); }}>
    <h2>{p ? 'Edit product' : 'New product'}</h2>
    <div className="form-row"><F l="Name *"><Input name="name" defaultValue={p?.name} required /></F><F l="URL slug"><Input name="slug" defaultValue={p?.slug} placeholder="auto from name" /></F></div>
    <div className="form-row"><F l="Category"><select name="category_id" className="native-select" defaultValue={p?.category_id ?? ''}><option value="">None</option>{cats.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F><F l="Price (RWF, leave empty for quote only)"><Input name="price" type="number" min="0" defaultValue={p?.price ?? ''} /></F></div>
    <F l="Description"><Textarea name="description" rows={4} defaultValue={p?.description} /></F>
    <div className="form-row"><F l="Material"><Input name="material" defaultValue={p?.material ?? ''} /></F><F l="Finish"><Input name="finish" defaultValue={p?.finish ?? ''} /></F></div>
    <div className="form-row"><F l="Dimensions"><Input name="dimensions" defaultValue={p?.dimensions ?? ''} /></F><F l="Availability"><select name="availability" className="native-select" defaultValue={p?.availability ?? 'on_request'}><option value="on_request">Ask for availability</option><option value="made_to_order">Made to order</option><option value="in_stock">In stock</option></select></F></div>
    <F l="Customisation options"><Input name="customization" defaultValue={p?.customization ?? ''} /></F>
    <div className="form-row"><F l={`Main image${p?.main_image ? ' (replace)' : ''}`}><Input name="main_file" type="file" accept="image/jpeg,image/png,image/webp" /></F><F l="Add more images"><Input name="extra_files" type="file" multiple accept="image/jpeg,image/png,image/webp" /></F></div>
    {p && <div className="thumbs">{[p.main_image, ...p.images].filter(Boolean).map((i, n) => <img key={n} src={resolveImage(i)} alt="" width={70} height={88} />)}</div>}
    <div className="checks"><label><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Featured on home page</label><label><input type="checkbox" name="is_ai_concept" defaultChecked={p ? p.is_ai_concept : false} /> Image is an illustrative concept (not a real photo)</label><label>Status <select name="status" className="native-select" defaultValue={p?.status ?? 'draft'}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
    <div className="admin-actions"><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div></form>; }

  return <div><div className="admin-bar"><p className="note">Products marked Draft are hidden from visitors.</p><Button onClick={() => setEditing('new')}>Add product</Button></div>
    {list.isLoading ? <p className="note">Loading…</p> : list.error ? <p className="field-error">Could not load products.</p> : <table className="admin-table"><thead><tr><th></th><th>Name</th><th>Status</th><th>Featured</th><th>Price</th><th></th></tr></thead><tbody>{list.data!.map(p => <tr key={p.id}><td><img src={resolveImage(p.main_image)} alt="" width={48} height={60} /></td><td>{p.name}<br /><span className="note">{cats.data?.find(c => c.id === p.category_id)?.name}</span></td><td><Button size="sm" variant={p.status === 'published' ? 'default' : 'outline'} onClick={() => quick.mutate({ id: p.id, patch: { status: p.status === 'published' ? 'draft' : 'published' } })}>{p.status === 'published' ? 'Published' : 'Draft'}</Button></td><td><input type="checkbox" aria-label="Featured" checked={p.featured} onChange={() => quick.mutate({ id: p.id, patch: { featured: !p.featured } })} /></td><td>{p.price ?? 'Quote'}</td><td><Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button> <Button size="sm" variant="ghost" onClick={() => confirm(`Delete ${p.name}?`) && remove.mutate(p.id)}>Delete</Button></td></tr>)}</tbody></table>}</div>;
}

function F({ l, children }: { l: string; children: ReactNode }) { return <div className="field"><Label>{l}</Label>{children}</div>; }

function Categories() {
  const qc = useQueryClient(); const cats = useCategories();
  const save = useMutation({ mutationFn: async ({ fd, c }: { fd: FormData; c?: Category | undefined }) => { const name = str(fd, 'name'); if (!name) throw new Error('Name required'); const row: Partial<Category> = { name, slug: c?.slug ?? slugify(name), description: str(fd, 'description') ?? '', sort_order: Number(fd.get('sort_order') ?? 0) }; const f = fd.get('file'); if (f instanceof File && f.size > 0) row.image_url = await uploadImage(f); const { error } = c ? await supabase.from('categories').update(row).eq('id', c.id) : await supabase.from('categories').insert(row as Category); if (error) throw error; }, onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); invalidatePublic(qc); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('categories').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); invalidatePublic(qc); } });
  const row = (c?: Category) => <form key={c?.id ?? 'new'} className="cat-row" onSubmit={e => { e.preventDefault(); save.mutate({ fd: new FormData(e.currentTarget), c }); if (!c) e.currentTarget.reset(); }}>{c ? <img src={resolveImage(c.image_url)} alt="" width={48} height={60} /> : <span />}<Input name="name" defaultValue={c?.name} placeholder="New category name" aria-label="Name" /><Input name="description" defaultValue={c?.description} placeholder="Description" aria-label="Description" /><Input name="sort_order" type="number" defaultValue={c?.sort_order ?? 99} aria-label="Order" className="w-20" /><Input name="file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Image" /><Button type="submit" size="sm">{c ? 'Save' : 'Add'}</Button>{c && <Button type="button" size="sm" variant="ghost" onClick={() => confirm(`Delete ${c.name}?`) && remove.mutate(c.id)}>Delete</Button>}</form>;
  return <div>{cats.data?.map(c => row(c))}{row()}</div>;
}

function Projects() {
  const qc = useQueryClient(); const cats = useCategories();
  const list = useQuery({ queryKey: ['admin-projects'], queryFn: async () => { const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const save = useMutation({ mutationFn: async (fd: FormData) => { const title = str(fd, 'title'); if (!title) throw new Error('Title required'); const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0); if (!files.length) throw new Error('Add at least one image'); const images = await Promise.all(files.map(uploadImage)); const { error } = await supabase.from('projects').insert({ title, description: str(fd, 'description') ?? '', category_id: str(fd, 'category_id'), images, is_ai_concept: fd.get('is_ai_concept') === 'on', status: fd.get('status') === 'published' ? 'published' : 'draft' }); if (error) throw error; }, onSuccess: () => { toast.success('Project added'); qc.invalidateQueries({ queryKey: ['admin-projects'] }); invalidatePublic(qc); }, onError: (e: Error) => toast.error(e.message) });
  const patch = useMutation({ mutationFn: async ({ id, p }: { id: string; p: Partial<Project> | null }) => { const { error } = p ? await supabase.from('projects').update(p).eq('id', id) : await supabase.from('projects').delete().eq('id', id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-projects'] }); invalidatePublic(qc); } });
  return <div><form className="admin-form" onSubmit={e => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}><h2>Add project</h2><div className="form-row"><F l="Title *"><Input name="title" /></F><F l="Category"><select name="category_id" className="native-select"><option value="">None</option>{cats.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F></div><F l="Description"><Textarea name="description" rows={2} /></F><F l="Images *"><Input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp" /></F><div className="checks"><label><input type="checkbox" name="is_ai_concept" /> These are illustrative concepts, not completed customer work</label><label>Status <select name="status" className="native-select" defaultValue="published"><option value="published">Published</option><option value="draft">Draft</option></select></label></div><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Uploading…' : 'Add project'}</Button></form>
    <table className="admin-table"><tbody>{list.data?.map(p => <tr key={p.id}><td><img src={resolveImage(p.images[0])} alt="" width={48} height={48} /></td><td>{p.title}</td><td>{p.is_ai_concept ? 'Concept' : 'Real work'}</td><td><Button size="sm" variant="outline" onClick={() => patch.mutate({ id: p.id, p: { status: p.status === 'published' ? 'draft' : 'published' } })}>{p.status}</Button></td><td><Button size="sm" variant="ghost" onClick={() => confirm('Delete project?') && patch.mutate({ id: p.id, p: null })}>Delete</Button></td></tr>)}</tbody></table></div>;
}

function Enquiries() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin-enquiries'], queryFn: async () => { const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const update = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string | null }) => { const { error } = status ? await supabase.from('enquiries').update({ status }).eq('id', id) : await supabase.from('enquiries').delete().eq('id', id); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-enquiries'] }) });
  async function openFile(path: string) { const { data, error } = await supabase.storage.from('enquiry-uploads').createSignedUrl(path, 300); if (error || !data) { toast.error('Could not open image'); return; } window.open(data.signedUrl, '_blank', 'noopener'); }
  if (list.isLoading) return <p className="note">Loading…</p>;
  if (!list.data?.length) return <p className="note">No enquiries yet.</p>;
  return <div className="enquiry-list">{list.data.map((q: Enquiry) => <article key={q.id} className="enquiry-card"><div className="admin-bar"><strong>{q.name} · <a href={`https://wa.me/${q.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{q.phone}</a></strong><span className="note">{q.kind === 'custom' ? 'Custom order' : 'Contact'} · {new Date(q.created_at).toLocaleString()}</span></div><p>{q.description}</p><p className="note">{[q.category, q.dimensions && `Size: ${q.dimensions}`, q.materials && `Materials: ${q.materials}`, q.budget && `Budget: ${q.budget}`, q.location && `Location: ${q.location}`].filter(Boolean).join(' · ')}</p><div className="admin-actions">{q.attachment_path && <Button size="sm" variant="outline" onClick={() => openFile(q.attachment_path!)}>View reference image</Button>}<select className="native-select" value={q.status} onChange={e => update.mutate({ id: q.id, status: e.target.value })} aria-label="Status"><option value="new">New</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select><Button size="sm" variant="ghost" onClick={() => confirm('Delete enquiry?') && update.mutate({ id: q.id, status: null })}>Delete</Button></div></article>)}</div>;
}

function SettingsForm() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: async () => { const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single(); if (error) throw error; return data as Settings; } });
  const save = useMutation({ mutationFn: async (fd: FormData) => { const lat = Number(fd.get('latitude')), lng = Number(fd.get('longitude')); if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Coordinates must be numbers'); const { error } = await supabase.from('site_settings').update({ phone: str(fd, 'phone')!, whatsapp: String(fd.get('whatsapp')).replace(/\D/g, ''), instagram: (str(fd, 'instagram') ?? '').replace(/^@/, ''), location_text: str(fd, 'location_text')!, latitude: lat, longitude: lng, hero_title: str(fd, 'hero_title')!, hero_text: str(fd, 'hero_text')!, why_us: String(fd.get('why_us')).split('\n').map(s => s.trim()).filter(Boolean), updated_at: new Date().toISOString() }).eq('id', 1); if (error) throw error; }, onSuccess: () => { toast.success('Business info saved'); qc.invalidateQueries({ queryKey: ['admin-settings'] }); invalidatePublic(qc); }, onError: (e: Error) => toast.error(e.message) });
  const s = q.data; if (!s) return <p className="note">Loading…</p>;
  return <form className="admin-form" onSubmit={e => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}><div className="form-row"><F l="Phone"><Input name="phone" defaultValue={s.phone} required /></F><F l="WhatsApp number (digits, with country code)"><Input name="whatsapp" defaultValue={s.whatsapp} required /></F></div><F l="Instagram handle"><Input name="instagram" defaultValue={s.instagram} /></F><F l="Location description"><Textarea name="location_text" rows={2} defaultValue={s.location_text} required /></F><div className="form-row"><F l="Latitude"><Input name="latitude" defaultValue={s.latitude} /></F><F l="Longitude"><Input name="longitude" defaultValue={s.longitude} /></F></div><F l="Home headline"><Input name="hero_title" defaultValue={s.hero_title} required /></F><F l="Home intro text"><Textarea name="hero_text" rows={3} defaultValue={s.hero_text} required /></F><F l="Why choose us (one point per line)"><Textarea name="why_us" rows={4} defaultValue={s.why_us.join('\n')} /></F><Button type="submit" disabled={save.isPending}>Save</Button></form>;
}
