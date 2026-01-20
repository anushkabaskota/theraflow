import { ScheduleForm } from '@/components/therapist/ScheduleForm';

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Your Schedule</h1>
        <p className="text-muted-foreground">
          Define your working hours, session times, and breaks. This schedule
          will be used to offer available slots to patients.
        </p>
      </div>
      <ScheduleForm />
    </div>
  );
}
