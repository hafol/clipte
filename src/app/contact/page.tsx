import type { Metadata } from 'next';
import ContactPage from '@/components/info/ContactPage';

export const metadata: Metadata = {
  title: 'Contact | Clipte',
  description: 'Clipper support, brand campaigns and everything else — reach the Clipte team.',
};

export default function Page() {
  return <ContactPage />;
}
