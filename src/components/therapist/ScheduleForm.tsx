'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTherapistSchedule, saveTherapistSchedule } from '@/lib/firestore';
import type { TherapistSchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format, startOfDay } from 'date-fns';
import { generateSlots } from '@/lib/schedule';
import { Loader2, Trash2 } from 'lucide-react';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSchema = z.object({
  workingDays: z.array(z.number()).min(1, 'Please select at least one working day.'),
  workingHours: z.object({
    start: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM.'),
    end: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM.'),
  }),
  sessionDurationMinutes: z.coerce.number().int().positive('Session duration must be a positive number.'),
  lunchBreak: z.object({
    enabled: z.boolean(),
    start: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM.').optional(),
    end: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM.').optional(),
  }),
  manualSlots: z.array(z.object({
    start: z.date(),
    end: z.date(),
  })).optional(),
}).refine(data => data.workingHours.start < data.workingHours.end, {
  message: 'End time must be after start time.',
  path: ['workingHours', 'end'],
}).refine(data => {
  if (!data.lunchBreak.enabled) return true;
  if (!data.lunchBreak.start || !data.lunchBreak.end) return false;
  return data.lunchBreak.start >= data.workingHours.start && data.lunchBreak.end <= data.workingHours.end;
}, {
  message: 'Lunch break must be within working hours.',
  path: ['lunchBreak', 'start'],
}).refine(data => {
    if (!data.lunchBreak.enabled || !data.lunchBreak.start || !data.lunchBreak.end) return true;
    return data.lunchBreak.start < data.lunchBreak.end;
}, {
    message: 'Lunch end time must be after start time.',
    path: ['lunchBreak', 'end'],
});

const defaultSchedule: TherapistSchedule = {
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '09:00', end: '17:00' },
  sessionDurationMinutes: 60,
  mandatoryBreakMinutes: 15,
  lunchBreak: { enabled: false, start: '12:00', end: '13:00' },
  manualSlots: [],
};


export function ScheduleForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<TherapistSchedule>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: defaultSchedule,
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "manualSlots",
  });

  const [previewDate, setPreviewDate] = useState<Date | undefined>(new Date());
  const [generatedPreviewSlots, setGeneratedPreviewSlots] = useState<Date[]>([]);
  const [manualSlotDate, setManualSlotDate] = useState<Date | undefined>(new Date());
  const [manualStartTime, setManualStartTime] = useState('10:00');
  const [manualEndTime, setManualEndTime] = useState('11:00');

  useEffect(() => {
    if (user) {
      getTherapistSchedule(user.uid).then(schedule => {
        if (schedule) {
          form.reset({
            ...defaultSchedule,
            ...schedule,
            manualSlots: schedule.manualSlots?.map(s => ({ start: s.start.toDate(), end: s.end.toDate() })) || []
          });
        }
        setIsLoading(false);
      });
    }
  }, [user, form]);
  
  const watchedSchedule = form.watch();

  useEffect(() => {
    const fetchPreviewSlots = () => {
      if (previewDate) {
        const schedule = form.getValues();
        schedule.sessionDurationMinutes = Number(schedule.sessionDurationMinutes);
        const isValid = scheduleSchema.safeParse(schedule).success;
        
        if (isValid) {
            const slots = generateSlots(schedule, previewDate, previewDate);
            setGeneratedPreviewSlots(slots);
        } else {
            setGeneratedPreviewSlots([]);
        }
      }
    };
    fetchPreviewSlots();
  }, [watchedSchedule, previewDate, form]);

  const onSubmit = async (data: TherapistSchedule) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveTherapistSchedule(user.uid, data);
      toast({
        title: 'Schedule Saved!',
        description: 'Your schedule has been updated successfully.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Saving Schedule',
        description: 'There was a problem saving your schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddManualSlot = () => {
    if (!manualSlotDate || !manualStartTime || !manualEndTime) return;
    if (manualStartTime >= manualEndTime) {
      toast({ title: "Invalid Time", description: "End time must be after start time.", variant: "destructive" });
      return;
    }

    const [startH, startM] = manualStartTime.split(':').map(Number);
    const [endH, endM] = manualEndTime.split(':').map(Number);
    
    const start = new Date(manualSlotDate.setHours(startH, startM, 0, 0));
    const end = new Date(manualSlotDate.setHours(endH, endM, 0, 0));
    
    append({ start, end });
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Working Days & Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Working Days & Hours</CardTitle>
                <CardDescription>Set your general weekly availability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="workingDays"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>When do you work?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            const dayValues = value === 'weekdays' ? [1,2,3,4,5] : value === 'weekends' ? [0,6] : [0,1,2,3,4,5,6];
                            field.onChange(dayValues);
                          }}
                          value={
                            JSON.stringify(field.value) === JSON.stringify([1,2,3,4,5]) ? 'weekdays' :
                            JSON.stringify(field.value) === JSON.stringify([0,6]) ? 'weekends' :
                            JSON.stringify(field.value) === JSON.stringify([0,1,2,3,4,5,6]) ? 'both' : ''
                          }
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="weekdays" /></FormControl>
                            <FormLabel className="font-normal">Weekdays (Monday - Friday)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="weekends" /></FormControl>
                            <FormLabel className="font-normal">Weekends (Saturday & Sunday)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="both" /></FormControl>
                            <FormLabel className="font-normal">Both</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workingHours.start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
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
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session & Breaks */}
            <Card>
              <CardHeader>
                <CardTitle>Sessions & Breaks</CardTitle>
                <CardDescription>Define session length and optional breaks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="sessionDurationMinutes"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>How long is each session?</FormLabel>
                       <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          className="flex items-center gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="30" /></FormControl>
                            <FormLabel className="font-normal">30 min</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="60" /></FormControl>
                            <FormLabel className="font-normal">1 hour</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="120" /></FormControl>
                            <FormLabel className="font-normal">2 hours</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><Input type="number" {...field} className="w-24" placeholder="Custom" /></FormControl>
                               <FormLabel className="font-normal">min</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>A 15-minute break is automatically added between sessions.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lunchBreak.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Add a Lunch Break?</FormLabel>
                        <FormDescription>Block out time for lunch in your schedule.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                {form.watch('lunchBreak.enabled') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 ml-2">
                    <FormField
                      control={form.control}
                      name="lunchBreak.start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lunch Start</FormLabel>
                          <FormControl><Input type="time" {...field} /></FormControl>
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
                          <FormControl><Input type="time" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

             {/* Custom one-off slots */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom One-off Slots</CardTitle>
                    <CardDescription>Manually add specific slots outside of your regular schedule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                            <Calendar
                                mode="single"
                                selected={manualSlotDate}
                                onSelect={setManualSlotDate}
                                disabled={(date) => date < startOfDay(new Date())}
                            />
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium text-center md:text-left">
                                Add a slot for {manualSlotDate ? format(manualSlotDate, 'PPP') : '...'}
                            </h4>
                            <div className="flex items-center gap-2">
                                <Input type="time" value={manualStartTime} onChange={e => setManualStartTime(e.target.value)} />
                                <span>-</span>
                                <Input type="time" value={manualEndTime} onChange={e => setManualEndTime(e.target.value)} />
                            </div>
                            <Button type="button" onClick={handleAddManualSlot} className="w-full">Add Custom Slot</Button>
                        </div>
                    </div>
                     {fields.length > 0 && (
                      <div className="space-y-2 pt-4">
                          <h4 className="font-medium">Your Custom Slots</h4>
                          <ul className="space-y-2">
                              {fields.map((field, index) => (
                                  <li key={field.id} className="flex justify-between items-center p-2 border rounded-md bg-muted/50">
                                      <span>{format(field.start, 'PPP, p')} - {format(field.end, 'p')}</span>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                    )}
                </CardContent>
            </Card>

          </div>

          {/* Preview */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Schedule Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Calendar
                        mode="single"
                        selected={previewDate}
                        onSelect={setPreviewDate}
                        disabled={(date) => date < startOfDay(new Date()) || date > addDays(new Date(), 30)}
                    />
                    <div className="w-full">
                        <h4 className="font-medium mb-2 text-center">
                            Available slots for {previewDate ? format(previewDate, 'PPP') : '...'}
                        </h4>
                        {generatedPreviewSlots.length > 0 ? (
                             <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                                {generatedPreviewSlots.map(slot => (
                                    <div key={slot.toISOString()} className="text-center p-2 rounded-md bg-muted text-sm">
                                        {format(slot, 'p')}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center text-sm">No automatically generated slots for this day based on your rules.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
        </Button>
      </form>
    </Form>
  );
}
