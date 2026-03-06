import { ManualBookingForm } from '@/components/booking/ManualBookingForm';

interface PageProps {
  searchParams: Promise<{ therapistId?: string }>;
}

export default async function BookSessionPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const therapistId = resolvedParams.therapistId;
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Book a Session</h1>
        <p className="text-muted-foreground">
          Choose a date and pick an available time slot to book your session.
        </p>
      </div>
      <div className="max-w-2xl w-full">
        <ManualBookingForm therapistId={therapistId} />
      </div>
    </div>
  );
}
