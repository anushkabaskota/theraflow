'use client';

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Award, Briefcase, ShieldCheck } from 'lucide-react';

export function MySupervisor({ supervisorId }: { supervisorId: string }) {
    const [supervisor, setSupervisor] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const profile = await getUserProfile(supervisorId);
                setSupervisor(profile);
            } catch (error) {
                console.error('Error fetching supervisor:', error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [supervisorId]);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                    Loading supervisor info...
                </CardContent>
            </Card>
        );
    }

    if (!supervisor) return null;

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Your Supervisor</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={supervisor.photoURL || undefined} />
                        <AvatarFallback>{supervisor.displayName?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-lg">{supervisor.displayName || 'Supervisor'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            {supervisor.yearsOfExperience && (
                                <span className="flex items-center gap-1">
                                    <Briefcase className="h-3.5 w-3.5" /> {supervisor.yearsOfExperience} yrs experience
                                </span>
                            )}
                            {supervisor.licenseNumber && (
                                <span className="flex items-center gap-1">
                                    <Award className="h-3.5 w-3.5" /> License: {supervisor.licenseNumber}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge variant="default" className="flex-shrink-0">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
