import { createFileRoute } from '@tanstack/react-router';
import { EnquiryForm } from '@/components/enquiry-form';
import { pageHead } from '@/lib/furniture';

export const Route = createFileRoute('/custom-orders')({
  head: () => pageHead('Custom furniture requests', 'Request custom furniture from First Shine Furniture: describe the item, dimensions and materials, and we will discuss it with you.'),
  component: CustomOrders,
});

function CustomOrders() {
  return <main><section className="page-intro"><span className="eyebrow">CUSTOM ORDERS</span><h1>Tell us what <em>you need.</em></h1><p>Share as much detail as you can. We’ll contact you to discuss specifications and a quotation.</p></section><section className="section form-section"><EnquiryForm kind="custom" /></section></main>;
}
