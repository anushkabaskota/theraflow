import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
          Chat with our AI assistant to find the perfect time for your next session.
        </p>
      </div>
      <Card className="flex-grow">
        <ChatInterface initialTherapistId={therapistId} />
      </Card>
    </div>
  );
}
