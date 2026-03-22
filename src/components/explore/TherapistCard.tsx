'use client';

import { UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PREDEFINED_TAGS } from "@/lib/tags";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TherapistCard({ therapist }: { therapist: UserProfile }) {
    const router = useRouter();

    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
    };

    const avatarImage = therapist.photoURL || undefined;

    const interestsLabel = (therapist.areasOfInterest || []).map(tag => {
        return PREDEFINED_TAGS.find(t => t.value === tag)?.label || tag;
    });

    return (
        <div
            onClick={() => router.push(`/therapist/${therapist.uid}`)}
            className="block h-full cursor-pointer"
        >
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow group">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-14 w-14 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={avatarImage} />
                        <AvatarFallback>{getInitials(therapist.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{therapist.displayName}</CardTitle>
                        <CardDescription className="capitalize flex items-center gap-1">
                            {therapist.role}
                            {therapist.role === 'trainee' && therapist.supervisionStatus === 'unsupervised' && (
                                <span title="Unsupervised" className="text-amber-500">
                                    <AlertCircle className="w-3 h-3" />
                                </span>
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 flex-grow">
                    {therapist.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            "{therapist.bio}"
                        </p>
                    )}

                    <div className="mt-auto pt-2 space-y-2">
                        {interestsLabel.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {interestsLabel.slice(0, 4).map(label => (
                                    <Badge key={label} variant="secondary" className="text-xs font-normal">
                                        {label}
                                    </Badge>
                                ))}
                                {interestsLabel.length > 4 && (
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                        +{interestsLabel.length - 4} more
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">No specific tags highlighted</span>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Button asChild className="w-full" variant="secondary" onClick={(e) => {
                        // Prevent Card Link click
                        e.stopPropagation();
                    }}>
                        <Link href={`/dashboard/book?therapistId=${therapist.uid}`}>
                            Book Session
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
