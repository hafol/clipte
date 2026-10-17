import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompareArticle } from '@/components/info/Pages';
import { COMPARE_PAGES } from '@/content/compare';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(COMPARE_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = COMPARE_PAGES[slug];
  return page ? { title: `${page.title.en} | Clipte`, description: page.excerpt.en } : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!COMPARE_PAGES[slug]) notFound();
  return <CompareArticle slug={slug} />;
}
