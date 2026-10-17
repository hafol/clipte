import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideArticle } from '@/components/info/Pages';
import { GUIDES, getGuide } from '@/content/guides';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return guide ? { title: `${guide.title.en} | Clipte`, description: guide.excerpt.en } : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!getGuide(slug)) notFound();
  return <GuideArticle slug={slug} />;
}
