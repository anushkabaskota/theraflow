'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, getAvailableSlots, createAppointment } from '@/lib/firestore';
import { getGoogleAccessToken, refreshGoogleAccessToken, connectGoogleCalendar } from '@/lib/auth';
import { createCalendarEvent } from '@/lib/google-calendar';
import type { UserProfile } from '@/types';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { format, addDays, startOfDay, isBefore } from 'date-fns';

export function ManualBookingForm({ therapistId }: { therapistId?: string }) {
    const [therapist, setTherapist] = useState<UserProfile | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [booking, setBooking] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [meetLink, setMeetLink] = useState<string | null>(null);
    const [loadingTherapist, setLoadingTherapist] = useState(true);
    const [calendarConnected, setCalendarConnected] = useState(!!getGoogleAccessToken());
    const [connectingCalendar, setConnectingCalendar] = useState(false);

    const { user, profile } = useAuth();
    const { toast } = useToast();

    // Set default date to today
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setSelectedDate(today);
    }, []);

    // Load therapist profile
    useEffect(() => {
        if (!therapistId) {
            setLoadingTherapist(false);
            return;
        }
        setLoadingTherapist(true);
        getUserProfile(therapistId)
            .then(setTherapist)
            .catch((err) => {
                console.error('Failed to load therapist:', err);
                toast({ title: 'Error', description: 'Could not load therapist info.', variant: 'destructive' });
            })
            .finally(() => setLoadingTherapist(false));
    }, [therapistId, toast]);

    // Fetch slots when date changes
    useEffect(() => {
        if (!therapistId || !selectedDate) return;
        setLoadingSlots(true);
        setSlots([]);
        setResult(null);
        getAvailableSlots(therapistId, selectedDate, selectedDate)
            .then((dates) => setSlots(dates.map((d) => d.toISOString())))
            .catch((err) => {
                console.error('Failed to fetch slots:', err);
                toast({ title: 'Error', description: 'Could not load available slots.', variant: 'destructive' });
            })
            .finally(() => setLoadingSlots(false));
    }, [therapistId, selectedDate, toast]);

    const handleBookSlot = async (slotISO: string) => {
        if (!user || !profile || !therapist || !therapistId) return;

        setBooking(true);
        setMeetLink(null);
        try {
            const startTime = new Date(slotISO);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            const isTrainee = therapist.role === 'trainee';
            const therapistName = therapist.displayName || 'Therapist';
            const patientName = profile.displayName || user.displayName || user.email || 'User';

            await createAppointment({
                patientId: user.uid,
                patientName,
                therapistId,
                therapistName,
                startTime,
                endTime,
                status: isTrainee ? 'pending' : 'confirmed',
            });

            // Only create calendar event for auto-confirmed (non-trainee) bookings.
            // For trainees, the calendar invite is created when the therapist accepts.
            let calendarNote = '';
            if (!isTrainee) {
                const accessToken = getGoogleAccessToken();
                if (accessToken) {
                    const attendeeEmails: string[] = [];
                    if (user.email) attendeeEmails.push(user.email);
                    if (therapist.email) attendeeEmails.push(therapist.email);

                    let calResult = await createCalendarEvent({
                        accessToken,
                        summary: `TheraFlow Session — ${patientName} & ${therapistName}`,
                        description: `Therapy session booked via TheraFlow.\n\nPatient: ${patientName}\nTherapist: ${therapistName}`,
                        startTime,
                        endTime,
                        attendeeEmails,
                    });

                    // If token expired, refresh and retry once
                    if (!calResult.success && calResult.error === 'token_expired') {
                        const newToken = await refreshGoogleAccessToken();
                        if (newToken) {
                            calResult = await createCalendarEvent({
                                accessToken: newToken,
                                summary: `TheraFlow Session — ${patientName} & ${therapistName}`,
                                description: `Therapy session booked via TheraFlow.\n\nPatient: ${patientName}\nTherapist: ${therapistName}`,
                                startTime,
                                endTime,
                                attendeeEmails,
                            });
                        }
                    }

                    if (calResult.success && calResult.meetLink) {
                        setMeetLink(calResult.meetLink);
                        calendarNote = ' A calendar invite with a Google Meet link has been sent to both parties.';
                    } else if (!calResult.success) {
                        calendarNote = ' (Calendar invite could not be created — the session is still booked.)';
                    }
                } else {
                    calendarNote = ' Sign in with Google to get calendar invites with Meet links.';
                }
            } else {
                calendarNote = ' A calendar invite with a Google Meet link will be sent once the therapist accepts.';
            }

            const dateStr = startTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const message = isTrainee
                ? `Your session request with ${therapistName} on ${dateStr} at ${timeStr} has been sent and is pending approval.${calendarNote}`
                : `Your session with ${therapistName} on ${dateStr} at ${timeStr} has been confirmed!${calendarNote}`;

            setResult({ success: true, message });
            setSlots((prev) => prev.filter((s) => s !== slotISO));
            toast({ title: isTrainee ? 'Request Sent!' : 'Booked!', description: isTrainee ? 'Request sent for approval.' : 'Session confirmed!' });
        } catch {
            toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
        } finally {
            setBooking(false);
        }
    };

    const navigateDate = (days: number) => {
        if (!selectedDate) return;
        const current = new Date(selectedDate + 'T00:00:00');
        const next = addDays(current, days);
        const today = startOfDay(new Date());
        // Don't allow going to past dates
        if (isBefore(next, today)) return;
        setSelectedDate(format(next, 'yyyy-MM-dd'));
    };

    if (loadingTherapist) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!therapistId || !therapist) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No therapist selected.</p>
                <p className="text-sm text-muted-foreground mt-1">Please go back and choose a therapist to book with.</p>
            </div>
        );
    }

    const displayDate = selectedDate
        ? format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
        : '';

    // Group slots by morning / afternoon / evening
    const groupSlots = (slotList: string[]) => {
        const morning: string[] = [];
        const afternoon: string[] = [];
        const evening: string[] = [];
        slotList.forEach((iso) => {
            const hour = new Date(iso).getHours();
            if (hour < 12) morning.push(iso);
            else if (hour < 17) afternoon.push(iso);
            else evening.push(iso);
        });
        return { morning, afternoon, evening };
    };

    const grouped = groupSlots(slots);

    const SlotGroup = ({ label, items }: { label: string; items: string[] }) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="flex flex-wrap gap-2">
                    {items.map((slot) => (
                        <Button
                            key={slot}
                            variant="outline"
                            size="sm"
                            disabled={booking || !!result?.success}
                            onClick={() => handleBookSlot(slot)}
                            className="min-w-[90px] transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
                        >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Therapist Info */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarImage src={therapist.photoURL || undefined} alt={therapist.displayName || ''} />
                            <AvatarFallback className="text-lg">{therapist.displayName?.charAt(0) || 'T'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{therapist.displayName || 'Therapist'}</CardTitle>
                            <CardDescription className="mt-0.5">
                                {therapist.degree || therapist.role === 'trainee' ? 'Trainee Therapist' : 'Therapist'}
                                {therapist.institution && ` · ${therapist.institution}`}
                            </CardDescription>
                            {therapist.role === 'trainee' && (
                                <Badge variant="secondary" className="mt-1.5 text-xs">
                                    Sessions require approval
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Connect Google Calendar */}
            {!calendarConnected && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="pt-5 pb-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <CalendarDays className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Connect Google Calendar</p>
                                    <p className="text-xs text-muted-foreground">Get calendar invites with Google Meet links when you book</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={connectingCalendar}
                                onClick={async () => {
                                    setConnectingCalendar(true);
                                    try {
                                        const token = await connectGoogleCalendar();
                                        if (token) {
                                            setCalendarConnected(true);
                                            toast({ title: 'Connected!', description: 'Google Calendar linked successfully.' });
                                        }
                                    } catch {
                                        toast({ title: 'Error', description: 'Could not connect Google Calendar.', variant: 'destructive' });
                                    } finally {
                                        setConnectingCalendar(false);
                                    }
                                }}
                                className="flex-shrink-0"
                            >
                                {connectingCalendar ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Date Picker */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Select a Date
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigateDate(-1)}
                            disabled={isBefore(addDays(new Date(selectedDate + 'T00:00:00'), -1), startOfDay(new Date()))}
                            aria-label="Previous day"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <input
                                type="date"
                                value={selectedDate}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5 text-center">{displayDate}</p>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => navigateDate(1)} aria-label="Next day">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Available Slots */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Available Slots
                    </CardTitle>
                    <CardDescription>
                        {loadingSlots
                            ? 'Loading available times...'
                            : slots.length > 0
                                ? `${slots.length} slot${slots.length !== 1 ? 's' : ''} available — pick one to book`
                                : 'No slots available for this date'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No available slots on this day. Try another date.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <SlotGroup label="🌅 Morning" items={grouped.morning} />
                            <SlotGroup label="☀️ Afternoon" items={grouped.afternoon} />
                            <SlotGroup label="🌙 Evening" items={grouped.evening} />
                        </div>
                    )}

                    {booking && (
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Booking your session...
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation */}
            {result?.success && (
                <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-green-700 dark:text-green-400">
                                    {therapist.role === 'trainee' ? 'Request Sent!' : 'Session Booked!'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                            </div>
                        </div>
                        {meetLink && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Video className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Google Meet Link</p>
                                    <a
                                        href={meetLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 underline truncate block"
                                    >
                                        {meetLink}
                                    </a>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { navigator.clipboard.writeText(meetLink); toast({ title: 'Copied!', description: 'Meet link copied to clipboard.' }); }}
                                >
                                    Copy
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
