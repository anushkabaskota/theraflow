'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAppointmentsForUser, Appointment } from '@/lib/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CalendarCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function AppointmentCard({ appointment, role }: { appointment: Appointment, role: 'patient' | 'therapist' }) {
    const isPatient = role === 'patient';
    const otherPartyName = isPatient ? appointment.therapistName : appointment.patientName;
    const otherPartyRole = isPatient ? 'Therapist' : 'Patient';
    const avatarImg = isPatient 
      ? PlaceHolderImages.find((img) => img.id === 'therapist-avatar')?.imageUrl
      : PlaceHolderImages.find((img) => img.id === 'patient-avatar')?.imageUrl

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {format(appointment.startTime, 'eeee, MMMM d')}
        </CardTitle>
        <CardDescription>
          {format(appointment.startTime, 'p')} -{' '}
          {format(appointment.endTime, 'p')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar>
            <AvatarImage src={avatarImg} />
            <AvatarFallback>{getInitials(otherPartyName)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-medium">{otherPartyName}</p>
            <p className="text-sm text-muted-foreground">{otherPartyRole}</p>
        </div>
      </CardContent>
    </Card>
  );
}


export function AppointmentList() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role) {
      setLoading(true);
      getAppointmentsForUser(user.uid, profile.role)
        .then((apps) => {
          setAppointments(apps);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Alert>
        <CalendarCheck className="h-4 w-4" />
        <AlertTitle>No appointments yet</AlertTitle>
        <AlertDescription>
          You have no upcoming or past appointments scheduled.
        </AlertDescription>
      </Alert>
    );
  }
  
  const upcomingAppointments = appointments.filter(a => new Date(a.startTime) >= new Date());
  const pastAppointments = appointments.filter(a => new Date(a.startTime) < new Date());

  return (
    <div className="space-y-8">
        {upcomingAppointments.length > 0 && (
            <div>
                <h3 className="text-xl font-semibold mb-4">Upcoming</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingAppointments.map((app) => (
                        <AppointmentCard key={app.id} appointment={app} role={profile!.role!} />
                    ))}
                </div>
            </div>
        )}
        
        {pastAppointments.length > 0 && (
            <div>
                <h3 className="text-xl font-semibold mb-4">Past</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                    {pastAppointments.map((app) => (
                        <AppointmentCard key={app.id} appointment={app} role={profile!.role!} />
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}
