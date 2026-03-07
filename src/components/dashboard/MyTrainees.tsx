'use client';

import { useEffect, useState } from 'react';
import { getTraineesForSupervisor, getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap } from 'lucide-react';

export function MyTrainees({ supervisorId }: { supervisorId: string }) {
    const [trainees, setTrainees] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrainees() {
            try {
                const list = await getTraineesForSupervisor(supervisorId);
                setTrainees(list);
            } catch (error) {
                console.error('Error fetching trainees:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTrainees();
    }, [supervisorId]);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Loading trainees...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>My Trainees</CardTitle>
                </div>
                <CardDescription>Trainees currently under your supervision</CardDescription>
            </CardHeader>
            <CardContent>
                {trainees.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border-dashed border-2 rounded-lg">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p>No trainees under your supervision yet.</p>
                        <p className="text-xs mt-1">Check your mentorship requests for new applicants.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trainees.map(trainee => (
                            <div key={trainee.uid} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={trainee.photoURL || undefined} />
                                    <AvatarFallback>{trainee.displayName?.charAt(0) || 'T'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{trainee.displayName || 'Trainee'}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {trainee.degree && <span>{trainee.degree}</span>}
                                        {trainee.institution && <span> · {trainee.institution}</span>}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    <GraduationCap className="h-3 w-3 mr-1" /> Trainee
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
