
create policy "Admins manage product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
create policy "Anyone can upload enquiry images" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'enquiry-uploads' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
create policy "Admins read enquiry images" on storage.objects for select to authenticated
  using (bucket_id = 'enquiry-uploads' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete enquiry images" on storage.objects for delete to authenticated
  using (bucket_id = 'enquiry-uploads' and public.has_role(auth.uid(),'admin'));
