'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSessionNotesForSupervisor, getUserProfile } from '@/lib/firestore';
import type { SessionNotes, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function TraineeNotesPage() {
    const { user, profile } = useAuth();
    const [notes, setNotes] = useState<SessionNotes[]>([]);
    const [traineeProfiles, setTraineeProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || profile?.role !== 'supervisor') return;
        async function fetchNotes() {
            try {
                const allNotes = await getSessionNotesForSupervisor(user!.uid);
                setNotes(allNotes);

                // Fetch trainee profiles
                const uniqueTraineeIds = [...new Set(allNotes.map(n => n.traineeId))];
                const profiles: Record<string, UserProfile> = {};
                await Promise.all(
                    uniqueTraineeIds.map(async (id) => {
                        const p = await getUserProfile(id);
                        if (p) profiles[id] = p;
                    })
                );
                setTraineeProfiles(profiles);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchNotes();
    }, [user, profile]);

    if (!user || profile?.role !== 'supervisor') return null;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Trainee Notes</h1>
                <p className="text-muted-foreground">
                    Anonymized session summaries shared by your trainees for supervision review.
                </p>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Loading notes...</p>
            ) : notes.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/20 border-dashed border-2">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>No session notes have been shared with you yet.</p>
                    <p className="text-xs mt-1">Your trainees can share anonymized session summaries from their Session Notes page.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notes.map(note => {
                        const trainee = traineeProfiles[note.traineeId];
                        const isExpanded = expandedId === note.id;
                        return (
                            <Card key={note.id} className="hover:shadow-sm transition-shadow">
                                <CardHeader
                                    className="cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : note.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Session Summary
                                                <Badge variant="secondary" className="text-xs ml-2">
                                                    {trainee?.displayName || 'Trainee'}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {format(note.createdAt, 'EEEE, MMMM d, yyyy')}
                                            </CardDescription>
                                        </div>
                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{note.supervisorSummary}</ReactMarkdown>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
