'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
    getAppointmentsForUser,
    getSessionNotesForAppointment,
    saveSessionNotes,
    shareNotesWithSupervisor,
} from '@/lib/firestore';
import { generateSessionNotes } from '@/ai/flows/generate-session-notes';
import { getGoogleAccessToken } from '@/lib/auth';
import type { Appointment, SessionNotes } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast as useToastType } from '@/hooks/use-toast';
import {
    FileText,
    Upload,
    Download,
    Loader2,
    CheckCircle2,
    Share2,
    Eye,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';

export default function SessionNotesPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [transcription, setTranscription] = useState('');
    const [generating, setGenerating] = useState(false);
    const [notes, setNotes] = useState<SessionNotes | null>(null);
    const [showDetailed, setShowDetailed] = useState(true);
    const [showSupervisor, setShowSupervisor] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [importingWorkspace, setImportingWorkspace] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    // Load past confirmed appointments
    useEffect(() => {
        async function loadAppointments() {
            if (!user || profile?.role !== 'trainee') return;
            setLoading(true);
            try {
                const all = await getAppointmentsForUser(user.uid, 'trainee');
                const confirmed = all.filter(a => a.status === 'confirmed');
                setAppointments(confirmed);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadAppointments();
    }, [user, profile]);

    // Load existing notes when appointment changes
    useEffect(() => {
        if (!selectedAppointment) {
            setNotes(null);
            setTranscription('');
            return;
        }
        async function loadNotes() {
            const existing = await getSessionNotesForAppointment(selectedAppointment);
            if (existing) {
                setNotes(existing);
                setTranscription(existing.transcription);
            } else {
                setNotes(null);
                setTranscription('');
            }
        }
        loadNotes();
    }, [selectedAppointment]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setTranscription(text);
            setUploadDialogOpen(false);
            toast({ title: 'Transcription loaded', description: `Loaded ${file.name}` });
        };
        reader.readAsText(file);
    };

    const handleImportFromWorkspace = async () => {
        const accessToken = getGoogleAccessToken();
        if (!accessToken) {
            toast({ title: 'Not connected', description: 'Please connect your Google account first.', variant: 'destructive' });
            return;
        }

        setImportingWorkspace(true);
        try {
            // Fetch recent Google Docs that might contain transcripts
            const res = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document' and name contains 'transcript'&orderBy=modifiedTime desc&pageSize=5&fields=files(id,name,modifiedTime)`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const data = await res.json();

            if (!data.files || data.files.length === 0) {
                toast({ title: 'No transcripts found', description: 'No documents with "transcript" in the name were found in your Google Drive.', variant: 'destructive' });
                return;
            }

            // Get the most recent transcript
            const docId = data.files[0].id;
            const docName = data.files[0].name;

            // Export as plain text
            const textRes = await fetch(
                `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const text = await textRes.text();

            setTranscription(text);
            toast({ title: 'Imported!', description: `Loaded transcript from "${docName}"` });
        } catch (err) {
            console.error(err);
            toast({ title: 'Import failed', description: 'Could not import from Google Workspace.', variant: 'destructive' });
        } finally {
            setImportingWorkspace(false);
        }
    };

    const handleGenerateNotes = async () => {
        if (!transcription.trim() || !selectedAppointment || !user) return;
        const appt = appointments.find(a => a.id === selectedAppointment);
        if (!appt) return;

        setGenerating(true);
        try {
            const result = await generateSessionNotes({
                transcription,
                patientName: appt.patientName,
                therapistName: appt.therapistName,
                sessionDate: format(new Date(appt.startTime), 'EEEE, MMMM d, yyyy'),
            });

            const notesData = {
                appointmentId: selectedAppointment,
                traineeId: user.uid,
                supervisorId: profile?.supervisorId,
                transcription,
                detailedNotes: result.detailedNotes,
                supervisorSummary: result.supervisorSummary,
                sharedWithSupervisor: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const id = await saveSessionNotes(notesData);
            setNotes({ ...notesData, id });
            toast({ title: 'Notes generated!', description: 'Session notes have been created successfully.' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to generate notes. Please try again.', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!notes || !profile?.supervisorId) return;
        setSharing(true);
        try {
            await shareNotesWithSupervisor(notes.id, profile.supervisorId);
            setNotes({ ...notes, sharedWithSupervisor: true });
            toast({ title: 'Shared!', description: 'Anonymized summary has been shared with your supervisor.' });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to share notes.', variant: 'destructive' });
        } finally {
            setSharing(false);
        }
    };

    if (!user || profile?.role !== 'trainee') return null;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Session Notes</h1>
                <p className="text-muted-foreground">
                    Upload or import a meeting transcription and generate AI-powered session notes.
                </p>
            </div>

            {/* Appointment Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" /> Select Session
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-muted-foreground">Loading appointments...</p>
                    ) : appointments.length === 0 ? (
                        <p className="text-muted-foreground">No confirmed sessions found.</p>
                    ) : (
                        <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a session..." />
                            </SelectTrigger>
                            <SelectContent>
                                {appointments.map(appt => (
                                    <SelectItem key={appt.id} value={appt.id}>
                                        {format(new Date(appt.startTime), 'MMM d, yyyy h:mm a')} — {appt.patientName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* Transcription Input */}
            {selectedAppointment && !notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Transcription
                        </CardTitle>
                        <CardDescription>
                            Paste, upload, or import the meeting transcription
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUploadDialogOpen(true)}
                            >
                                <Upload className="h-4 w-4 mr-2" /> Upload File
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImportFromWorkspace}
                                disabled={importingWorkspace}
                            >
                                {importingWorkspace ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Import from Google Workspace
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Paste or type the meeting transcription here..."
                            value={transcription}
                            onChange={(e) => setTranscription(e.target.value)}
                            rows={12}
                            className="font-mono text-sm"
                        />
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleGenerateNotes}
                            disabled={generating || !transcription.trim()}
                            className="w-full"
                        >
                            {generating ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Notes...</>
                            ) : (
                                <><Sparkles className="h-4 w-4 mr-2" /> Generate Notes with AI</>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Generated Notes */}
            {notes && (
                <div className="space-y-4">
                    {/* Detailed Notes */}
                    <Card>
                        <CardHeader className="cursor-pointer" onClick={() => setShowDetailed(!showDetailed)}>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5" /> Detailed Notes
                                    <Badge variant="secondary" className="text-xs">Your Reference</Badge>
                                </CardTitle>
                                {showDetailed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                        </CardHeader>
                        {showDetailed && (
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{notes.detailedNotes}</ReactMarkdown>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Supervisor Summary */}
                    <Card className="border-blue-500/20">
                        <CardHeader className="cursor-pointer" onClick={() => setShowSupervisor(!showSupervisor)}>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Share2 className="h-5 w-5" /> Supervisor Summary
                                    <Badge variant={notes.sharedWithSupervisor ? 'default' : 'outline'} className="text-xs">
                                        {notes.sharedWithSupervisor ? 'Shared' : 'Not Shared'}
                                    </Badge>
                                </CardTitle>
                                {showSupervisor ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                            <CardDescription>
                                Anonymized thematic summary — no personal client info included
                            </CardDescription>
                        </CardHeader>
                        {showSupervisor && (
                            <>
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{notes.supervisorSummary}</ReactMarkdown>
                                    </div>
                                </CardContent>
                                {profile?.supervisorId && !notes.sharedWithSupervisor && (
                                    <CardFooter>
                                        <Button onClick={handleShare} disabled={sharing} className="w-full">
                                            {sharing ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sharing...</>
                                            ) : (
                                                <><Share2 className="h-4 w-4 mr-2" /> Share with Supervisor</>
                                            )}
                                        </Button>
                                    </CardFooter>
                                )}
                                {notes.sharedWithSupervisor && (
                                    <CardFooter>
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircle2 className="h-4 w-4" /> Shared with your supervisor
                                        </div>
                                    </CardFooter>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            )}

            {/* File Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Transcription</DialogTitle>
                        <DialogDescription>
                            Upload a text file (.txt, .md, .doc) containing the meeting transcription.
                        </DialogDescription>
                    </DialogHeader>
                    <input
                        type="file"
                        accept=".txt,.md,.text"
                        onChange={handleFileUpload}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
