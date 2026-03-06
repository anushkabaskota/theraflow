'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listenForAppointments, updateAppointmentStatus, getUserProfile } from '@/lib/firestore';
import { Appointment, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PREDEFINED_TAGS } from '@/lib/tags';

export default function SessionRequestsPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
    const [patientProfiles, setPatientProfiles] = useState<Record<string, UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user || profile?.role !== 'trainee') return;

        const unsubscribe = listenForAppointments(user.uid, 'trainee', (appointments) => {
            const pending = appointments.filter((app) => app.status === 'pending');
            setPendingRequests(pending);
            setIsLoading(false);

            // Fetch missing patient profiles
            pending.forEach(app => {
                setPatientProfiles(prev => {
                    if (!prev[app.patientId]) {
                        getUserProfile(app.patientId).then(p => {
                            if (p) {
                                setPatientProfiles(current => ({ ...current, [app.patientId]: p }));
                            }
                        });
                    }
                    return prev;
                });
            });
        });

        return () => unsubscribe();
    }, [user, profile]);

    const handleAction = async (appointmentId: string, action: 'confirmed' | 'cancelled') => {
        setActionLoading(appointmentId);
        try {
            await updateAppointmentStatus(appointmentId, action);
            toast({
                title: action === 'confirmed' ? "Session Accepted" : "Session Declined",
                description: action === 'confirmed' ? "The user has been notified of the confirmation." : "The request was successfully removed.",
            });
        } catch (error) {
            toast({
                title: "Action Failed",
                description: "An error occurred while updating the request.",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (!user || profile?.role !== 'trainee') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Session Requests</h1>
                <p className="text-muted-foreground">
                    Review and respond to session requests from users.
                </p>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground">Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/20 border-dashed border-2">
                    <Clock className="h-12 w-12 mb-4 opacity-50" />
                    <p>You have no pending session requests at the moment.</p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pendingRequests.map((request) => {
                        const pProfile = patientProfiles[request.patientId];

                        return (
                            <Card key={request.id} className="flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={pProfile?.photoURL || ''} />
                                        <AvatarFallback>{request.patientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-xl">{request.patientName}</CardTitle>
                                        <CardDescription>
                                            {format(new Date(request.startTime), 'EEEE, MMMM do yyyy')} <br />
                                            {format(new Date(request.startTime), 'h:mm a')} - {format(new Date(request.endTime), 'h:mm a')}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    {pProfile ? (
                                        <div className="space-y-3">
                                            <div className="text-sm">
                                                <span className="font-semibold block mb-1">Details:</span>
                                                {pProfile.age && <span className="block text-muted-foreground">Age: {pProfile.age}</span>}
                                                {pProfile.pronouns && <span className="block text-muted-foreground">Pronouns: {pProfile.pronouns}</span>}
                                                {pProfile.preferredSessionFormat && <span className="block text-muted-foreground capitalize">Format: {pProfile.preferredSessionFormat}</span>}
                                            </div>

                                            {pProfile.areasOfConcern && pProfile.areasOfConcern.length > 0 && (
                                                <div>
                                                    <span className="text-sm font-semibold block mb-1.5">Areas of Concern:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {pProfile.areasOfConcern.map(concern => {
                                                            const label = PREDEFINED_TAGS.find(t => t.value === concern)?.label || concern;
                                                            return (
                                                                <Badge key={concern} variant="outline" className="text-xs font-normal bg-primary/5">
                                                                    {label}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Loading user details...</p>
                                    )}
                                </CardContent>
                                <CardFooter className="flex gap-2 pt-4 border-t mt-auto">
                                    <Button
                                        variant="default"
                                        className="flex-1"
                                        onClick={() => handleAction(request.id, 'confirmed')}
                                        disabled={actionLoading === request.id}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Accept
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleAction(request.id, 'cancelled')}
                                        disabled={actionLoading === request.id}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Decline
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
