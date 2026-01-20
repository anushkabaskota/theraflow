'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!profile?.role) {
        router.replace('/role-selection');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  return <Loading />;
}
