import { UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PREDEFINED_TAGS } from "@/lib/tags";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Award, Briefcase, Building2, Languages, Clock, Users } from "lucide-react";
import Link from "next/link";

export function SupervisorPublicProfile({ therapist, trainees = [] }: { therapist: UserProfile, trainees?: UserProfile[] }) {
    const avatarImage = therapist.photoURL || PlaceHolderImages.find((img) => img.id === 'therapist-avatar')?.imageUrl;

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
                                Clinical Supervisor
                            </Badge>
                        </div>
                        <div className="text-lg text-muted-foreground mt-3 space-y-2">
                            <p className="flex items-center gap-2 font-medium">
                                <Award className="w-5 h-5 text-primary" />
                                {therapist.degree || "Professional Credentials"}
                            </p>
                            {(therapist.licenseNumber || therapist.institution) && (
                                <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                    {therapist.licenseNumber && (
                                        <span className="flex items-center gap-1.5">
                                            <Briefcase className="w-4 h-4" />
                                            Reg. No: {therapist.licenseNumber}
                                        </span>
                                    )}
                                    {therapist.institution && (
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4" />
                                            {therapist.institution}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Professional Biography</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {therapist.bio || "This supervisor hasn't provided a professional biography yet."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Areas of Specialization</CardTitle>
                            <CardDescription>Clinical expertise and supervision areas</CardDescription>
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
                                <p className="text-muted-foreground">No specific specializations highlighted.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Trainees Under Supervision
                            </CardTitle>
                            <CardDescription>Professionals currently mentored by {therapist.displayName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trainees.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {trainees.map(trainee => (
                                        <Link key={trainee.uid} href={`/therapist/${trainee.uid}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={trainee.photoURL || undefined} />
                                                    <AvatarFallback>{getInitials(trainee.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium group-hover:text-primary transition-colors">{trainee.displayName}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{trainee.role}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">No trainees currently listed under this supervisor.</p>
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
                                <Clock className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Experience</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {therapist.yearsOfExperience ? `${therapist.yearsOfExperience}+ Years` : "Not specified"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Languages className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">Session Languages</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {therapist.languages?.join(", ") || therapist.languagePreference || "English"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
