'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setTherapistAvailability, getTherapistAvailability } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, setHours, setMinutes, startOfDay, isSameDay } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Date[]>([]);
  const [savedSlots, setSavedSlots] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (user) {
      setIsFetching(true);
      getTherapistAvailability(user.uid)
        .then(slots => {
          setSavedSlots(slots);
        })
        .finally(() => setIsFetching(false));
    }
  }, [user]);

  const timeSlots = Array.from({ length: 9 }, (_, i) => setHours(startOfDay(new Date()), 9 + i));

  const handleSlotToggle = (slot: Date) => {
    if (!selectedDate) return;
    const fullSlotDate = setMinutes(setHours(startOfDay(selectedDate), slot.getHours()), 0);
    setSelectedSlots(prev =>
      prev.some(s => s.getTime() === fullSlotDate.getTime())
        ? prev.filter(s => s.getTime() !== fullSlotDate.getTime())
        : [...prev, fullSlotDate]
    );
  };

  const handleSave = async () => {
    if (!user || selectedSlots.length === 0) return;
    setIsLoading(true);
    try {
      await setTherapistAvailability(user.uid, selectedSlots);
      toast({
        title: 'Availability Saved!',
        description: 'Your new slots have been added.',
      });
      setSavedSlots(prev => [...prev, ...selectedSlots].sort((a,b) => a.getTime() - b.getTime()));
      setSelectedSlots([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save availability. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Set Your Availability</h1>
        <p className="text-muted-foreground">
          Choose dates and times when you are available for sessions.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Choose a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlots([]); // Reset selected slots when date changes
              }}
              disabled={(date) => date < startOfDay(new Date())}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Select Time Slots</CardTitle>
            <CardDescription>
              For {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map(slot => {
                if (!selectedDate) return null;
                const fullSlotDate = setMinutes(setHours(startOfDay(selectedDate), slot.getHours()), 0);
                const isSelected = selectedSlots.some(s => s.getTime() === fullSlotDate.getTime());
                const isSaved = savedSlots.some(s => s.getTime() === fullSlotDate.getTime());
                return (
                  <Button
                    key={slot.toISOString()}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSlotToggle(slot)}
                    disabled={isSaved}
                  >
                    {format(slot, 'p')}
                  </Button>
                );
              })}
            </div>
            <Button onClick={handleSave} disabled={isLoading || selectedSlots.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Availability
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Your Upcoming Availability</CardTitle>
          </CardHeader>
          <CardContent>
             {isFetching ? (
                <p>Loading availability...</p>
             ) : savedSlots.length > 0 ? (
                <ul className="space-y-2">
                    {savedSlots.filter(s => s >= startOfDay(new Date())).map(slot => (
                        <li key={slot.toISOString()} className="flex justify-between items-center p-2 border rounded-md bg-muted/50">
                            <span>{format(slot, 'eeee, MMMM d, yyyy')}</span>
                            <span>{format(slot, 'p')}</span>
                        </li>
                    ))}
                </ul>
             ) : (
                <p>You have no upcoming availability set.</p>
             )}
          </CardContent>
       </Card>
    </div>
  );
}
