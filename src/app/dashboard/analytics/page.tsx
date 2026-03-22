'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTraineesForSupervisor, getSessionNotesForSupervisor } from '@/lib/firestore';
import type { SessionNotes, UserProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { TraineeAnalyticsCard } from '@/components/dashboard/analytics/TraineeAnalyticsCard';
import {
    Users,
    FileText,
    CalendarClock,
    BarChart3,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
    const { user, profile } = useAuth();
    const [trainees, setTrainees] = useState<UserProfile[]>([]);
    const [allNotes, setAllNotes] = useState<SessionNotes[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || profile?.role !== 'supervisor') return;

        async function fetchData() {
            try {
                const [traineeList, notesList] = await Promise.all([
                    getTraineesForSupervisor(user!.uid),
                    getSessionNotesForSupervisor(user!.uid),
                ]);
                setTrainees(traineeList);
                setAllNotes(notesList);
            } catch (err) {
                console.error('Error fetching analytics data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, profile]);

    if (!user || profile?.role !== 'supervisor') return null;

    // Compute stats
    const totalTrainees = trainees.length;
    const totalSessions = allNotes.length;
    const recentSessions = allNotes.filter(n => {
        const daysDiff = (Date.now() - n.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }).length;

    const stats = [
        {
            label: 'Total Trainees',
            value: totalTrainees,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Shared Sessions',
            value: totalSessions,
            icon: FileText,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-500/10',
        },
        {
            label: 'This Week',
            value: recentSessions,
            icon: CalendarClock,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    Analytics Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Monitor your trainees&apos; clinical sessions, analyze themes, and track supervision progress.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="relative overflow-hidden">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold tracking-tight">
                                    {loading ? '—' : stat.value}
                                </p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Trainee Cards */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Trainees</h2>

                {loading ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Loading analytics data...
                        </CardContent>
                    </Card>
                ) : trainees.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground">
                            <Users className="h-12 w-12 mb-4 opacity-40" />
                            <p>No trainees under your supervision yet.</p>
                            <p className="text-xs mt-1">
                                Approved trainees and their shared sessions will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {trainees.map((trainee) => (
                            <TraineeAnalyticsCard
                                key={trainee.uid}
                                trainee={trainee}
                                supervisorId={user.uid}
                                allNotes={allNotes}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
