import { describe, expect, it } from 'vitest';
import { enquiryUrl } from '@/lib/furniture';

describe('Furniture enquiries', () => {
  it('addresses WhatsApp enquiries to the business phone number', () => {
    expect(new URL(enquiryUrl()).pathname).toBe('/250784874351');
  });
  it('includes the selected furniture type in the enquiry', () => {
    expect(new URL(enquiryUrl('kitchens')).searchParams.get('text')).toBe('Hello First Shine Furniture, I would like to enquire about kitchens.');
  });
});