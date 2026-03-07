import { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PREDEFINED_TAGS } from "@/lib/tags";

import { MapPin, GraduationCap, Languages, Calendar, CheckCircle2, UserCircle } from "lucide-react";

export function TraineePublicProfile({ therapist, supervisorName }: { therapist: UserProfile, supervisorName?: string }) {
    const avatarImage = therapist.photoURL || undefined;

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
    };

    const interestsLabel = (therapist.areasOfInterest || []).map(tag => {
        return PREDEFINED_TAGS.find(t => t.value === tag)?.label || tag;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start bg-card p-8 rounded-xl border shadow-sm">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-md">
                    <AvatarImage src={avatarImage} className="object-cover" />
                    <AvatarFallback className="text-4xl">{getInitials(therapist.displayName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{therapist.displayName}</h1>
                            {therapist.pronouns && (
                                <Badge variant="secondary" className="text-sm font-normal py-0.5">
                                    {therapist.pronouns}
                                </Badge>
                            )}
                            <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                                Trainee
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground mt-2 font-medium flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            {therapist.degree || "Degree Program"} at {therapist.institution || "University"}
                            {therapist.graduationYear && ` (Class of ${therapist.graduationYear})`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {therapist.supervisorId && (
                            <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                                <UserCircle className="w-4 h-4 text-primary" />
                                <span>Supervised by <a href={`/therapist/${therapist.supervisorId}`} className="font-medium text-foreground hover:underline">{supervisorName || "Supervisor"}</a></span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>{therapist.sessionsCompleted || 0} Sessions Completed</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {therapist.bio || "This therapist hasn't provided a personal statement yet."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Areas of Focus</CardTitle>
                            <CardDescription>What I can help you with</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {interestsLabel.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {interestsLabel.map(label => (
                                        <Badge key={label} variant="secondary" className="px-3 py-1 text-sm">
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No specific areas of focus highlighted.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Languages className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Session Languages</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {therapist.languages?.join(", ") || therapist.languagePreference || "English"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Session Format</h4>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {therapist.preferredSessionFormat?.replace('-', ' ') || "Online / In-person"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Availability</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Accepting new clients
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Booking call to action could go here */}
                </div>
            </div>
        </div>
    );
}
