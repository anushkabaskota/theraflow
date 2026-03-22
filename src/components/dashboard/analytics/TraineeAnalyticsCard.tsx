'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ChevronDown,
    ChevronUp,
    FileText,
    GraduationCap,
    Sparkles,
    Calendar,
    Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import { getSessionNotesForTrainee } from '@/lib/firestore';
import type { SessionNotes, UserProfile } from '@/types';
import { SessionThemeCards, type ThemeAnalysis } from './SessionThemeCards';

export function TraineeAnalyticsCard({
    trainee,
    supervisorId,
    allNotes,
}: {
    trainee: UserProfile;
    supervisorId: string;
    allNotes: SessionNotes[];
}) {
    const [expanded, setExpanded] = useState(false);
    const [traineeNotes, setTraineeNotes] = useState<SessionNotes[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Track analysis state per note
    const [analyses, setAnalyses] = useState<Record<string, ThemeAnalysis | null>>({});
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);

    // Filter notes for this trainee from the pre-fetched data
    const notesForTrainee = allNotes.filter(n => n.traineeId === trainee.uid);
    const totalSessions = notesForTrainee.length;
    const lastSession = notesForTrainee[0]?.createdAt;

    useEffect(() => {
        if (expanded && traineeNotes.length === 0 && totalSessions > 0) {
            setLoadingNotes(true);
            getSessionNotesForTrainee(trainee.uid, supervisorId)
                .then(setTraineeNotes)
                .catch(console.error)
                .finally(() => setLoadingNotes(false));
        }
    }, [expanded, trainee.uid, supervisorId, traineeNotes.length, totalSessions]);

    async function handleAnalyze(note: SessionNotes) {
        if (analyses[note.id] || analyzingId === note.id) return;
        setAnalyzingId(note.id);
        try {
            const res = await fetch('/api/analyze-themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supervisorSummary: note.supervisorSummary }),
            });
            if (!res.ok) throw new Error('Analysis failed');
            const data: ThemeAnalysis = await res.json();
            setAnalyses(prev => ({ ...prev, [note.id]: data }));
        } catch (err) {
            console.error('Failed to analyze themes:', err);
        } finally {
            setAnalyzingId(null);
        }
    }

    return (
        <Card className="transition-all hover:shadow-md border-border/60">
            <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage src={trainee.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {trainee.displayName?.charAt(0) || 'T'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            {trainee.displayName || 'Trainee'}
                            <Badge variant="secondary" className="text-[10px] font-medium">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                Trainee
                            </Badge>
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                            {trainee.degree && <span>{trainee.degree}</span>}
                            {trainee.institution && <span> · {trainee.institution}</span>}
                        </CardDescription>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5" />
                            <span className="font-semibold text-foreground">{totalSessions}</span>
                            <span>sessions</span>
                        </div>
                        {lastSession && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{format(lastSession, 'MMM d, yyyy')}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        {expanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                </div>

                {/* Mobile stats */}
                <div className="flex sm:hidden items-center gap-4 text-xs text-muted-foreground mt-2 ml-16">
                    <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span className="font-semibold text-foreground">{totalSessions}</span>
                        sessions
                    </div>
                    {lastSession && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(lastSession, 'MMM d')}
                        </div>
                    )}
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                    {totalSessions === 0 ? (
                        <div className="py-8 text-center text-muted-foreground border-dashed border-2 rounded-lg">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No session notes shared yet.</p>
                        </div>
                    ) : loadingNotes ? (
                        <p className="text-sm text-muted-foreground py-4">Loading session notes...</p>
                    ) : (
                        <div className="space-y-4">
                            {traineeNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className="rounded-lg border bg-muted/30 p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">
                                                Session — {format(note.createdAt, 'EEEE, MMMM d, yyyy')}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAnalyze(note)}
                                            disabled={!!analyses[note.id] || analyzingId === note.id}
                                            className="gap-1.5 text-xs"
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {analyses[note.id]
                                                ? 'Analyzed'
                                                : analyzingId === note.id
                                                    ? 'Analyzing...'
                                                    : 'Analyze Themes'}
                                        </Button>
                                    </div>

                                    {/* Truncated summary preview */}
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {note.supervisorSummary.replace(/[#*_\-]/g, '').slice(0, 200)}...
                                    </p>

                                    {/* Theme Analysis */}
                                    <SessionThemeCards
                                        analysis={analyses[note.id] || null}
                                        loading={analyzingId === note.id}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
