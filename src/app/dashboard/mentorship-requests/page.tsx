'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listenForSupervisionRequests, updateSupervisionRequestStatus, approveTrainee, getUserProfile } from '@/lib/firestore';
import type { SupervisionRequest, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Users, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function MentorshipRequestsPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<SupervisionRequest[]>([]);
    const [traineeProfiles, setTraineeProfiles] = useState<Record<string, UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user || profile?.role !== 'supervisor') return;

        const unsubscribe = listenForSupervisionRequests(user.uid, 'supervisor', (reqs) => {
            setRequests(reqs);
            setIsLoading(false);

            // Fetch trainee profiles
            reqs.forEach(req => {
                setTraineeProfiles(prev => {
                    if (!prev[req.traineeId]) {
                        getUserProfile(req.traineeId).then(p => {
                            if (p) {
                                setTraineeProfiles(current => ({ ...current, [req.traineeId]: p }));
                            }
                        });
                    }
                    return prev;
                });
            });
        });

        return () => unsubscribe();
    }, [user, profile]);

    const handleAction = async (request: SupervisionRequest, action: 'approved' | 'rejected') => {
        setActionLoading(request.id);
        try {
            await updateSupervisionRequestStatus(request.id, action);

            if (action === 'approved' && user) {
                await approveTrainee(user.uid, request.traineeId);
            }

            toast({
                title: action === 'approved' ? 'Request Accepted' : 'Request Declined',
                description: action === 'approved'
                    ? 'The trainee has been added to your supervised list.'
                    : 'The mentorship request has been declined.',
            });
        } catch {
            toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
        } finally {
            setActionLoading(null);
        }
    };

    if (!user || profile?.role !== 'supervisor') return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mentorship Requests</h1>
                <p className="text-muted-foreground">
                    Review mentorship requests from trainees.
                </p>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground">Loading requests...</p>
            ) : requests.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/20 border-dashed border-2">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>No pending mentorship requests.</p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((request) => {
                        const tProfile = traineeProfiles[request.traineeId];
                        return (
                            <Card key={request.id} className="flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={tProfile?.photoURL || ''} />
                                        <AvatarFallback>{tProfile?.displayName?.charAt(0) || 'T'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-xl">{tProfile?.displayName || 'Trainee'}</CardTitle>
                                        <CardDescription>
                                            {tProfile?.degree && <span>{tProfile.degree}</span>}
                                            {tProfile?.institution && <span> · {tProfile.institution}</span>}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3">
                                    {request.message && (
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p className="text-sm font-medium mb-1">Message:</p>
                                            <p className="text-sm text-muted-foreground">{request.message}</p>
                                        </div>
                                    )}
                                    {tProfile?.bio && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">&ldquo;{tProfile.bio}&rdquo;</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Requested {format(request.createdAt, 'MMM d, yyyy')}
                                    </p>
                                </CardContent>
                                <CardFooter className="flex gap-2 pt-4 border-t mt-auto">
                                    <Button
                                        variant="default"
                                        className="flex-1"
                                        onClick={() => handleAction(request, 'approved')}
                                        disabled={actionLoading === request.id}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Accept
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleAction(request, 'rejected')}
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
