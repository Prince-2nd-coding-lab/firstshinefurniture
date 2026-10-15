import sofas from '@/assets/cat-sofas.jpg';
import beds from '@/assets/cat-beds.jpg';
import tv from '@/assets/cat-tv.jpg';
import kitchens from '@/assets/cat-kitchens.jpg';
import wardrobes from '@/assets/cat-wardrobes.jpg';
import tables from '@/assets/cat-tables.jpg';
import office from '@/assets/cat-office.jpg';
import doors from '@/assets/cat-doors.jpg';
import accentChairs from '@/assets/accent_chairs.jpg';
import tvUnit from '@/assets/tv_unit.jpg';
import kitchenProject from '@/assets/kitchen.jpg';

const assetImages: Record<string, string> = { sofas, beds, tv, kitchens, wardrobes, tables, office, doors, accent_chairs: accentChairs, tv_unit: tvUnit, kitchen: kitchenProject };

export const DEFAULT_WHATSAPP = '250784874351';
export const DEFAULT_PHONE = '+250 784 874 351';

/** Seeded rows reference bundled images as "asset:<key>"; uploaded images are full URLs. */
export function resolveImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('asset:')) return assetImages[src.slice(6)];
  return src;
}

export function enquiryUrl(subject = 'furniture', whatsapp: string = DEFAULT_WHATSAPP) {
  const number = whatsapp.replace(/\D/g, '') || DEFAULT_WHATSAPP;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hello First Shine Furniture, I would like to enquire about ${subject}.`)}`;
}

export function whatsappMessageUrl(message: string, whatsapp: string = DEFAULT_WHATSAPP) {
  const number = whatsapp.replace(/\D/g, '') || DEFAULT_WHATSAPP;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function telUrl(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `RWF ${Number(price).toLocaleString('en-US')}`;
}

export const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export function validateUpload(file: File): string | null {
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) return 'Please upload a JPG, PNG or WEBP image.';
  if (file.size > MAX_UPLOAD_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}

export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} | First Shine Furniture` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} | First Shine Furniture` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
