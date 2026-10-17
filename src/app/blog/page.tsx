import type { Metadata } from 'next';
import BlogIndex from '@/components/info/BlogIndex';

export const metadata: Metadata = {
  title: 'Guides & notes for clippers | Clipte',
  description: 'Practical guides on finding moments, editing shorts and getting paid on Clipte.',
};

export default function Page() {
  return <BlogIndex />;
}
