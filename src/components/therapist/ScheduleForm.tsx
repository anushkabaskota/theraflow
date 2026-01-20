'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTherapistSchedule, saveTherapistSchedule } from '@/lib/firestore';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

import { generateSlots } from '@/lib/schedule';

/* ---------------- Schema ---------------- */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = z.object({
  workingDaysType: z.enum(['weekdays', 'weekends', 'both']),
  workingDays: z.array(z.number()),
  workingHours: z.object({
    start: z.string().regex(timeRegex),
    end: z.string().regex(timeRegex),
  }),
  sessionDurationMinutes: z.coerce.number().int().positive(),
  lunchBreak: z.object({
    enabled: z.boolean(),
    start: z.string().regex(timeRegex).optional(),
    end: z.string().regex(timeRegex).optional(),
  }),
  manualSlots: z.array(
    z.object({
      start: z.date(),
      end: z.date(),
    })
  ),
});

const defaultValues = {
  workingDaysType: 'weekdays' as const,
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '09:00', end: '17:00' },
  sessionDurationMinutes: 60,
  lunchBreak: { enabled: false },
  manualSlots: [],
};

export function ScheduleForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDate, setPreviewDate] = useState<Date>();
  const [previewSlots, setPreviewSlots] = useState<Date[]>([]);

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues,
  });

  useEffect(() => {
    setPreviewDate(new Date());
  }, []);

  /* -------- Load Existing Schedule -------- */
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const data = await getTherapistSchedule(user.uid);
        if (data) {
          // Convert Firestore objects/Timestamps to actual JS Date objects
          const sanitizedSlots = (data.manualSlots || []).map((s: any) => ({
            start: s.start?.toDate ? s.start.toDate() : new Date(s.start),
            end: s.end?.toDate ? s.end.toDate() : new Date(s.end),
          }));

          form.reset({
            ...defaultValues,
            ...data,
            manualSlots: sanitizedSlots,
          });
        }
      } catch (err) {
        console.error("Failed to load schedule:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, form]);

  /* -------- Update Working Days based on Radio Selection -------- */
  const workingDaysType = form.watch('workingDaysType');

  useEffect(() => {
    const days =
      workingDaysType === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : workingDaysType === 'weekends'
        ? [0, 6]
        : [0, 1, 2, 3, 4, 5, 6];

    form.setValue('workingDays', days, { shouldDirty: true });
  }, [workingDaysType, form]);

  /* -------- Handle Preview Logic -------- */
  const watched = form.watch();

  useEffect(() => {
    const result = scheduleSchema.safeParse(watched);
    if (!result.success || !previewDate) {
      setPreviewSlots([]);
      return;
    }

    try {
      const slots = generateSlots(result.data as any, previewDate, previewDate);
      setPreviewSlots(slots);
    } catch (e) {
      setPreviewSlots([]);
    }
  }, [previewDate, watched]);

  /* -------- Submit Handler -------- */
  const onSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveTherapistSchedule(user.uid, values);
      toast({ title: 'Success', description: 'Schedule updated.' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Availability Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="workingDaysType"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>Working Days</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-center space-x-3 space-y-0 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="weekdays" id="weekdays" />
                        <Label htmlFor="weekdays" className="font-normal cursor-pointer w-full">
                          Weekdays (Mon - Fri)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 space-y-0 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="weekends" id="weekends" />
                        <Label htmlFor="weekends" className="font-normal cursor-pointer w-full">
                          Weekends (Sat - Sun)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 space-y-0 border p-3 rounded-md hover:bg-zinc-50 cursor-pointer">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="font-normal cursor-pointer w-full">
                          Full Week (Mon - Sun)
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-black text-white px-8"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Schedule
          </Button>
        </div>
      </form>
    </Form>
  );
}
