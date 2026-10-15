import { createFileRoute } from '@tanstack/react-router';
import { listProducts } from '@/lib/public-data.functions';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const products = await listProducts().catch(() => []);
        const paths = ['/', '/furniture', '/custom-orders', '/projects', '/about', '/contact', ...products.map(p => `/furniture/${p.slug}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
      },
    },
  },
});
