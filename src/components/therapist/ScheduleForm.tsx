'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTherapistSchedule, saveTherapistSchedule, TherapistSchedule } from '@/lib/firestore';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { generateSlots } from '@/lib/schedule';

/* ---------------- Schema ---------------- */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = z.object({
  workingDaysType: z.enum(['weekdays', 'weekends', 'both']),
  workingDays: z.array(z.number()),
  workingHours: z.object({
    start: z.string().regex(timeRegex, { message: 'Invalid time format. Use HH:MM' }),
    end: z.string().regex(timeRegex, { message: 'Invalid time format. Use HH:MM' }),
  }).refine(data => data.end > data.start, {
    message: 'End time must be after start time.',
    path: ['end'],
  }),
  sessionDurationMinutes: z.coerce.number().int().positive(),
  lunchBreak: z.object({
    enabled: z.boolean(),
    start: z.string().regex(timeRegex).optional(),
    end: z.string().regex(timeRegex).optional(),
  }).refine(data => !data.enabled || (data.start && data.end && data.end > data.start), {
    message: 'End time must be after start time for lunch break.',
    path: ['end'],
  }),
  manualSlots: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
    })
  ).optional(),
}).refine(data => {
  if (!data.lunchBreak.enabled || !data.lunchBreak.start || !data.lunchBreak.end) {
    return true;
  }
  return data.lunchBreak.start >= data.workingHours.start && data.lunchBreak.end <= data.workingHours.end;
}, {
  message: "Lunch break must be within your working hours.",
  path: ["lunchBreak", "start"],
});


type FormSchema = z.infer<typeof scheduleSchema>;

const defaultValues: FormSchema = {
  workingDaysType: 'weekdays',
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '09:00', end: '17:00' },
  sessionDurationMinutes: 60,
  lunchBreak: { enabled: true, start: '12:00', end: '13:00' },
  manualSlots: [],
};

export function ScheduleForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDate, setPreviewDate] = useState<Date>();
  const [previewSlots, setPreviewSlots] = useState<Date[]>([]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(scheduleSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "manualSlots",
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
          const sanitizedSlots = (data.manualSlots || []).map((s: any) => {
            const startDate = s.start?.toDate ? s.start.toDate() : new Date(s.start);
            const endDate = s.end?.toDate ? s.end.toDate() : new Date(s.end);
            return {
              start: format(startDate, "yyyy-MM-dd'T'HH:mm"),
              end: format(endDate, "yyyy-MM-dd'T'HH:mm"),
            }
          });

          let workingDaysType: FormSchema['workingDaysType'] = 'weekdays';
          if (data.workingDays?.length === 2) workingDaysType = 'weekends';
          if (data.workingDays?.length === 7) workingDaysType = 'both';

          form.reset({
            ...defaultValues,
            ...data,
            workingDaysType,
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
  const watchedValuesString = JSON.stringify(watched);

  useEffect(() => {
    const result = scheduleSchema.safeParse(watched);
    if (!result.success || !previewDate) {
      setPreviewSlots([]);
      return;
    }

    try {
      const { workingDaysType, ...scheduleData } = result.data;
      const scheduleForPreview: TherapistSchedule = {
        ...scheduleData,
        manualSlots: (scheduleData.manualSlots || [])
          .map(slot => ({
            start: parseISO(slot.start),
            end: parseISO(slot.end)
          }))
          .filter(slot => !isNaN(slot.start.getTime())),
        mandatoryBreakMinutes: 15,
      };
      const slots = generateSlots(scheduleForPreview, previewDate, previewDate);
      setPreviewSlots(slots);
    } catch (e) {
      console.error("Error generating preview slots:", e);
      setPreviewSlots([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDate, watchedValuesString]);

  /* -------- Submit Handler -------- */
  const onSubmit = async (values: FormSchema) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { workingDaysType, ...scheduleData } = values;
      const scheduleToSave: TherapistSchedule = {
        ...scheduleData,
        manualSlots: (scheduleData.manualSlots || []).map(slot => ({
            start: parseISO(slot.start),
            end: parseISO(slot.end),
        })),
        mandatoryBreakMinutes: 15,
      };
      await saveTherapistSchedule(user.uid, scheduleToSave);
      toast({ title: 'Success', description: 'Schedule updated.' });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast({ title: 'Error', variant: 'destructive', description: 'Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Working Days</CardTitle>
                <CardDescription>Choose your regular working days.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="workingDaysType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                        >
                          {(['weekdays', 'weekends', 'both'] as const).map((type) => (
                            <div key={type}>
                              <RadioGroupItem value={type} id={type} className="peer sr-only" />
                              <Label
                                htmlFor={type}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hours & Sessions</CardTitle>
                <CardDescription>Define your standard working hours and the length of each session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workingHours.start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workingHours.end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sessionDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1 hour 30 minutes</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breaks</CardTitle>
                <CardDescription>Set up breaks in your schedule. A 15-minute break is mandatory between sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="lunchBreak.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Lunch Break</FormLabel>
                        <FormDescription>Block out time for a lunch break.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch('lunchBreak.enabled') && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lunchBreak.start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lunch Start</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lunchBreak.end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lunch End</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Slots</CardTitle>
                <CardDescription>Add one-off availability for specific dates and times.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`manualSlots.${index}.start`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Start</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`manualSlots.${index}.end`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>End</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ start: '', end: '' })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Manual Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Today's Preview</CardTitle>
                <CardDescription>
                  A preview of available slots for{' '}
                  {previewDate ? format(previewDate, 'MMMM d, yyyy') : 'today'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                    {previewSlots.map((slot, i) => (
                      <div key={i} className="rounded-md bg-muted px-3 py-2 text-sm text-center">
                        {format(slot, 'p')}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No available slots for today based on current settings.</p>
                )}
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-muted-foreground">This is a preview and does not account for already booked appointments.</p>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSaving}
            size="lg"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </Button>
        </div>
      </form>
    </Form>
  );
}

    