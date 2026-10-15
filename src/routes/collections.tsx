import { createFileRoute, redirect } from '@tanstack/react-router';

// Old URL kept working: "Our collections" became the Furniture catalogue.
export const Route = createFileRoute('/collections')({
  beforeLoad: () => { throw redirect({ to: '/furniture', statusCode: 301 }); },
});
