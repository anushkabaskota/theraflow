'use client';

import { useAuth } from '@/hooks/useAuth';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ClientExploreFeed } from '@/components/dashboard/ClientExploreFeed';

export default function DashboardPage() {
  const { profile } = useAuth();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {displayName}!
        </h1>
        <p className="text-muted-foreground">
          {profile?.role === 'user'
            ? 'Find and book sessions with our available trainees.'
            : 'Here’s what’s happening with your account today.'}
        </p>
      </div>

      {profile?.role === 'user' ? (
        <ClientExploreFeed />
      ) : (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Upcoming Appointments</h2>
          <AppointmentList />
        </div>
      )}
    </div>
  );
}
