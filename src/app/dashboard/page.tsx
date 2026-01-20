'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppointmentList } from '@/components/appointments/AppointmentList';

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
          Here’s what’s happening with your account today.
        </p>
      </div>

      {profile?.role === 'patient' && (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Ready for your next session?</h3>
                    <p className="text-muted-foreground mt-1">
                        Our AI assistant can help you find the perfect time slot.
                    </p>
                </div>
                <Button asChild className="mt-4 w-fit">
                    <Link href="/dashboard/book">
                        Book a new session <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Upcoming Appointments</h2>
        <AppointmentList />
      </div>
    </div>
  );
}
