import { AppointmentList } from '@/components/appointments/AppointmentList';

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Appointments</h1>
        <p className="text-muted-foreground">
          View your upcoming and past sessions.
        </p>
      </div>
      <AppointmentList />
    </div>
  );
}
