create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.assign_first_admin();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
drop policy if exists "Categories public read" on public.categories;
create policy "Categories public read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  main_image text,
  images text[] not null default '{}',
  material text,
  finish text,
  dimensions text,
  customization text,
  price numeric,
  availability text not null default 'on_request',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  is_ai_concept boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
drop policy if exists "Published products public" on public.products;
create policy "Published products public" on public.products for select to anon, authenticated using (status = 'published' or public.has_role(auth.uid(),'admin'));
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  images text[] not null default '{}',
  is_ai_concept boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
drop policy if exists "Published projects public" on public.projects;
create policy "Published projects public" on public.projects for select to anon, authenticated using (status = 'published' or public.has_role(auth.uid(),'admin'));
drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects" on public.projects for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'custom' check (kind in ('custom','contact')),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  category text check (category is null or char_length(category) <= 100),
  description text not null check (char_length(description) between 5 and 2000),
  dimensions text check (dimensions is null or char_length(dimensions) <= 200),
  materials text check (materials is null or char_length(materials) <= 300),
  budget text check (budget is null or char_length(budget) <= 100),
  location text check (location is null or char_length(location) <= 200),
  attachment_path text check (attachment_path is null or char_length(attachment_path) <= 300),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
drop policy if exists "Anyone can submit enquiry" on public.enquiries;
create policy "Anyone can submit enquiry" on public.enquiries for insert to anon, authenticated with check (status = 'new');
drop policy if exists "Admins read enquiries" on public.enquiries;
create policy "Admins read enquiries" on public.enquiries for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries" on public.enquiries for update to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "Admins delete enquiries" on public.enquiries;
create policy "Admins delete enquiries" on public.enquiries for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  phone text not null default '+250 784 874 351',
  whatsapp text not null default '250784874351',
  instagram text not null default 'firstshinefurniture',
  location_text text not null default 'Kugisozi, Beretwari, near the signboard, on the left before reaching the signboard.',
  latitude double precision not null default -1.9144367966455453,
  longitude double precision not null default 30.06565279272995,
  hero_title text not null default 'Furniture Made for the Way You Live',
  hero_text text not null default 'Explore furniture for your home and workplace, from comfortable seating and bedroom furniture to fitted kitchens and custom interior solutions.',
  why_us text[] not null default array['Sofas, beds, kitchens, wardrobes, tables, office furniture and doors in one place','Talk directly with us on WhatsApp or by phone','Share your ideas and we will discuss your requirements'],
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
drop policy if exists "Settings public read" on public.site_settings;
create policy "Settings public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins update settings" on public.site_settings;
create policy "Admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

insert into public.categories (slug, name, description, image_url, sort_order) values
('sofas-chairs','Sofas & chairs','Sofas, armchairs and seating for everyday living.','asset:sofas',1),
('beds','Beds','Beds and bedroom furniture for restful spaces.','asset:beds',2),
('tv-stands','TV stands','TV stands and entertainment units.','asset:tv',3),
('kitchens','Kitchens','Kitchen furniture and fitted kitchens.','asset:kitchens',4),
('wardrobes','Wardrobes','Wardrobes and storage for bedrooms.','asset:wardrobes',5),
('tables','Tables','Dining tables, coffee tables and more.','asset:tables',6),
('office','Office furniture','Desks and furniture for the workplace.','asset:office',7),
('doors','Doors','Interior door designs.','asset:doors',8)
on conflict (slug) do nothing;

insert into public.products (slug, name, category_id, description, main_image, customization, featured, status, is_ai_concept)
select v.slug, v.name, c.id, v.descr, v.img, 'Discuss size, fabric or finish with us.', true, 'draft', true
from (values
 ('three-seat-sofa','Three-seat sofa','sofas-chairs','A comfortable three-seat sofa concept for living rooms.','asset:sofas'),
 ('upholstered-bed','Bed with wooden headboard','beds','A bed concept with a wide wooden headboard.','asset:beds'),
 ('tv-stand-unit','Low TV stand','tv-stands','A low TV stand concept with storage and open shelves.','asset:tv'),
 ('fitted-kitchen','Fitted kitchen','kitchens','A fitted kitchen concept with upper and lower cabinets.','asset:kitchens'),
 ('built-in-wardrobe','Built-in wardrobe','wardrobes','A built-in wardrobe concept with drawers and shelving.','asset:wardrobes'),
 ('dining-table','Dining table','tables','A wooden dining table concept for family meals.','asset:tables'),
 ('office-desk','Office desk','office','A wooden office desk concept for home or workplace.','asset:office'),
 ('panel-door','Panelled interior door','doors','A panelled interior door concept.','asset:doors')
) as v(slug,name,cat,descr,img) join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
drop policy if exists "Anyone can upload enquiry images" on storage.objects;
create policy "Anyone can upload enquiry images" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'enquiry-uploads' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
drop policy if exists "Admins read enquiry images" on storage.objects;
create policy "Admins read enquiry images" on storage.objects for select to authenticated
  using (bucket_id = 'enquiry-uploads' and public.has_role(auth.uid(),'admin'));
drop policy if exists "Admins delete enquiry images" on storage.objects;
create policy "Admins delete enquiry images" on storage.objects for delete to authenticated
  using (bucket_id = 'enquiry-uploads' and public.has_role(auth.uid(),'admin'));

insert into public.projects (title, description, category_id, images, is_ai_concept, status)
select v.t, v.d, c.id, array[v.img], false, 'published'
from (values
 ('Accent chairs','Seating made by First Shine Furniture, as shared on our Instagram.','sofas-chairs','/__l5e/assets-v1/cd720fac-fe3b-4a42-826d-7cbe5858619c/accent_chairs.jpg'),
 ('TV wall unit','A TV unit made by First Shine Furniture, as shared on our Instagram.','tv-stands','/__l5e/assets-v1/151ffd23-b6b7-4d1c-a912-4d1bec775ece/tv_unit.jpg'),
 ('Kitchen cabinets','Kitchen cabinetry by First Shine Furniture, as shared on our Instagram.','kitchens','/__l5e/assets-v1/51df4795-1da1-4053-8e22-8bc1023bdfeb/kitchen.jpg')
) as v(t,d,cat,img) join public.categories c on c.slug = v.cat
where not exists (select 1 from public.projects p where p.title = v.t);