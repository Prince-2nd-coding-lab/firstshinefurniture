
insert into public.projects (title, description, category_id, images, is_ai_concept, status)
select v.t, v.d, c.id, array[v.img], false, 'published'
from (values
 ('Accent chairs','Seating made by First Shine Furniture, as shared on our Instagram.','sofas-chairs','/__l5e/assets-v1/cd720fac-fe3b-4a42-826d-7cbe5858619c/accent_chairs.jpg'),
 ('TV wall unit','A TV unit made by First Shine Furniture, as shared on our Instagram.','tv-stands','/__l5e/assets-v1/151ffd23-b6b7-4d1c-a912-4d1bec775ece/tv_unit.jpg'),
 ('Kitchen cabinets','Kitchen cabinetry by First Shine Furniture, as shared on our Instagram.','kitchens','/__l5e/assets-v1/51df4795-1da1-4053-8e22-8bc1023bdfeb/kitchen.jpg')
) as v(t,d,cat,img) join public.categories c on c.slug = v.cat;
