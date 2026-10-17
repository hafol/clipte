import type { Metadata } from 'next';
import { ProductArticle } from '@/components/info/Pages';
import { PRODUCT_PAGES } from '@/content/product';

const page = PRODUCT_PAGES['clip'];

export const metadata: Metadata = {
  title: `${page.title.en} | Clipte`,
  description: page.excerpt.en,
};

export default function Page() {
  return <ProductArticle pageKey="clip" />;
}
