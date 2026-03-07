'use client';

import { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Briefcase, GraduationCap, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PREDEFINED_TAGS } from "@/lib/tags";

interface SupervisorCardProps {
    supervisor: UserProfile;
    onRequestMentorship: (supervisorId: string, message: string) => Promise<void>;
    alreadyRequested?: boolean;
    alreadySupervised?: boolean;
}

export function SupervisorCard({ supervisor, onRequestMentorship, alreadyRequested, alreadySupervised }: SupervisorCardProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(alreadyRequested || false);
    const [open, setOpen] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await onRequestMentorship(supervisor.uid, message);
            setSent(true);
            setOpen(false);
        } finally {
            setSending(false);
        }
    };

    const getInitials = (name?: string | null) => {
        if (!name) return 'S';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
    };

    const interestsLabel = (supervisor.areasOfInterest || []).map(tag => {
        return PREDEFINED_TAGS.find(t => t.value === tag)?.label || tag;
    });

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-14 w-14">
                    <AvatarImage src={supervisor.photoURL || undefined} />
                    <AvatarFallback>{getInitials(supervisor.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <CardTitle className="text-lg">{supervisor.displayName || 'Supervisor'}</CardTitle>
                    <CardDescription className="capitalize">Supervisor</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 flex-grow">
                {supervisor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        &ldquo;{supervisor.bio}&rdquo;
                    </p>
                )}

                <div className="space-y-1.5 text-sm">
                    {supervisor.yearsOfExperience && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span>{supervisor.yearsOfExperience} years of experience</span>
                        </div>
                    )}
                    {supervisor.licenseNumber && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Award className="h-3.5 w-3.5" />
                            <span>License: {supervisor.licenseNumber}</span>
                        </div>
                    )}
                    {supervisor.institution && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span>{supervisor.institution}</span>
                        </div>
                    )}
                </div>

                {interestsLabel.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {interestsLabel.slice(0, 4).map(label => (
                            <Badge key={label} variant="secondary" className="text-xs font-normal">{label}</Badge>
                        ))}
                        {interestsLabel.length > 4 && (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">+{interestsLabel.length - 4} more</Badge>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                {alreadySupervised ? (
                    <Badge variant="default" className="w-full justify-center py-2">Your Supervisor</Badge>
                ) : sent ? (
                    <Badge variant="secondary" className="w-full justify-center py-2">Request Sent</Badge>
                ) : (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" variant="default">
                                <Send className="h-4 w-4 mr-2" /> Request Mentorship
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Request Mentorship</DialogTitle>
                                <DialogDescription>
                                    Send a mentorship request to {supervisor.displayName || 'this supervisor'}. Include a message introducing yourself.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Hi, I'm a trainee interested in your mentorship. I'm currently studying..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    Send Request
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardFooter>
        </Card>
    );
}
