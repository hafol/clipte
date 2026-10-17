'use client';

import DiscoverView from '@/components/dashboard/DiscoverView';
import { useUserProfile } from '@/lib/supabase/hooks';

// Discover in any mode (the shell shows the sign-in gate when signed out)
export default function DiscoverPage() {
  const { profile } = useUserProfile();
  if (!profile) return null;
  return <DiscoverView />;
}
