'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getSupervisors, createSupervisionRequest } from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { SupervisorCard } from '@/components/explore/SupervisorCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Search } from 'lucide-react';

export default function FindSupervisorPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [supervisors, setSupervisors] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const sups = await getSupervisors();
                setSupervisors(sups.filter(s => s.displayName?.trim()));

                // Fetch existing pending requests from this trainee
                if (user) {
                    const reqRef = collection(db, 'supervisionRequests');
                    const q = query(reqRef, where('traineeId', '==', user.uid), where('status', '==', 'pending'));
                    const snap = await getDocs(q);
                    const ids = new Set<string>();
                    snap.forEach(doc => ids.add(doc.data().supervisorId));
                    setRequestedIds(ids);
                }
            } catch (error) {
                console.error('Error fetching supervisors:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const handleRequestMentorship = async (supervisorId: string, message: string) => {
        if (!user) return;
        try {
            await createSupervisionRequest(user.uid, supervisorId, message);
            setRequestedIds(prev => new Set(prev).add(supervisorId));
            toast({ title: 'Request Sent!', description: 'Your mentorship request has been sent to the supervisor.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not send the request. Please try again.', variant: 'destructive' });
            throw error;
        }
    };

    if (!user || profile?.role !== 'trainee') return null;

    // If already supervised
    if (profile?.supervisionStatus === 'approved' && profile?.supervisorId) {
        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Find a Supervisor</h1>
                </div>
                <div className="flex flex-col items-center justify-center p-12 text-center bg-green-500/5 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                    <p className="font-medium text-green-700 dark:text-green-400">You already have a supervisor!</p>
                    <p className="text-sm text-muted-foreground mt-1">Check your profile to see your supervisor&apos;s details.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Find a Supervisor</h1>
                <p className="text-muted-foreground">
                    Browse available supervisors and send a mentorship request.
                </p>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : supervisors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {supervisors.map(supervisor => (
                        <SupervisorCard
                            key={supervisor.uid}
                            supervisor={supervisor}
                            onRequestMentorship={handleRequestMentorship}
                            alreadyRequested={requestedIds.has(supervisor.uid)}
                            alreadySupervised={profile?.supervisorId === supervisor.uid}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-muted-foreground bg-accent/50 rounded-lg border border-dashed flex flex-col items-center gap-3">
                    <Search className="h-10 w-10 opacity-40" />
                    <p>No supervisors are currently available. Please check back later.</p>
                </div>
            )}
        </div>
    );
}
