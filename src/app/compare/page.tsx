import type { Metadata } from 'next';
import { CompareHub } from '@/components/info/Pages';
import { COMPARE_HUB } from '@/content/compare';

export const metadata: Metadata = {
  title: `${COMPARE_HUB.title.en} | Clipte`,
  description: COMPARE_HUB.excerpt.en,
};

export default function Page() {
  return <CompareHub />;
}
