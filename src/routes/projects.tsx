import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConceptBadge } from '@/components/product-card';
import { ContactBand } from '@/components/site-shell';
import { pageHead, resolveImage } from '@/lib/furniture';
import { projectsQuery } from '@/lib/queries';

export const Route = createFileRoute('/projects')({
  head: () => pageHead('Project gallery', 'See furniture projects by First Shine Furniture, with illustrative concepts clearly labelled.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  errorComponent: () => <main className="section empty-state"><h1>Gallery unavailable</h1><p>Please refresh in a moment.</p></main>,
  notFoundComponent: () => <main className="section empty-state"><h1>Not found</h1></main>,
  component: Projects,
});

function Projects() {
  const { data } = useSuspenseQuery(projectsQuery);
  const [cat, setCat] = useState('');
  const cats = [...new Map(data.filter(p => p.categories).map(p => [p.categories!.slug, p.categories!.name])).entries()];
  const list = data.filter(p => !cat || p.categories?.slug === cat);
  return <main><section className="page-intro"><span className="eyebrow">PROJECTS</span><h1>Work from <em>our workshop.</em></h1><p>Items marked “Our work” are pieces we made. Items marked “Illustrative concept” are design ideas.</p></section>
    <section className="section"><div className="filters"><Button variant={!cat ? 'default' : 'outline'} onClick={() => setCat('')}>All</Button>{cats.map(([slug, name]) => <Button key={slug} variant={cat === slug ? 'default' : 'outline'} onClick={() => setCat(slug)}>{name}</Button>)}</div>
      {list.length ? <div className="project-grid">{list.flatMap(p => p.images.map((img, i) => <figure key={p.id + i} className="project-tile"><img src={resolveImage(img)} alt={p.title} loading="lazy" width={448} height={448} /><ConceptBadge concept={p.is_ai_concept} /><figcaption><strong>{p.title}</strong>{p.description && <span>{p.description}</span>}</figcaption></figure>))}</div> : <div className="empty-state"><h3>No projects in this category yet.</h3></div>}</section><ContactBand /></main>;
}
