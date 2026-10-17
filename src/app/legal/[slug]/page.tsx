import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalArticle } from '@/components/info/Pages';
import { LEGAL_PAGES } from '@/content/legal';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  return page ? { title: `${page.title.en} | Clipte`, description: page.excerpt.en } : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!LEGAL_PAGES[slug]) notFound();
  return <LegalArticle slug={slug} />;
}
