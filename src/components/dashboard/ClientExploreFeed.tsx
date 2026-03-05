'use client';

import { useState, useEffect } from 'react';
import { getTrainees, type UserProfile } from '@/lib/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, GraduationCap, MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ClientExploreFeed() {
    const [trainees, setTrainees] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');

    useEffect(() => {
        async function fetchTrainees() {
            try {
                const data = await getTrainees();
                setTrainees(data);
            } catch (error) {
                console.error("Failed to load trainees:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchTrainees();
    }, []);

    const filteredAndSortedTrainees = trainees
        .filter((trainee) => {
            const query = searchQuery.toLowerCase();
            const name = trainee.displayName?.toLowerCase() || '';
            const bio = trainee.bio?.toLowerCase() || '';
            const areas = trainee.areasOfInterest?.join(' ').toLowerCase() || '';
            return name.includes(query) || bio.includes(query) || areas.includes(query);
        })
        .sort((a, b) => {
            if (sortBy === 'name-asc') {
                return (a.displayName || '').localeCompare(b.displayName || '');
            } else if (sortBy === 'name-desc') {
                return (b.displayName || '').localeCompare(a.displayName || '');
            } else if (sortBy === 'grad-year') {
                return (b.graduationYear || 0) - (a.graduationYear || 0);
            }
            return 0;
        });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, specialty, or bio..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="grad-year">Graduation Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredAndSortedTrainees.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No trainees found matching your criteria.</p>
                    <Button
                        variant="link"
                        onClick={() => { setSearchQuery(''); setSortBy('name-asc'); }}
                        className="mt-2"
                    >
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedTrainees.map((trainee) => (
                        <Card key={trainee.uid} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={trainee.photoURL || undefined} alt={trainee.displayName || 'Trainee'} />
                                            <AvatarFallback>{trainee.displayName?.charAt(0) || 'T'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{trainee.displayName || 'Anonymous Trainee'}</CardTitle>
                                            <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                                <GraduationCap className="h-3.5 w-3.5" />
                                                <span className="truncate">{trainee.degree || 'Trainee'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-grow pb-4 space-y-4">
                                {trainee.bio && (
                                    <p className="text-sm text-foreground/90 line-clamp-3">
                                        {trainee.bio}
                                    </p>
                                )}

                                {trainee.institution && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-foreground/80">Institution:</span> {trainee.institution} {trainee.graduationYear ? `('${trainee.graduationYear.toString().slice(-2)})` : ''}
                                        </div>
                                    </div>
                                )}

                                {trainee.areasOfInterest && trainee.areasOfInterest.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {trainee.areasOfInterest.slice(0, 3).map((area, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs font-normal px-2 py-0 h-5">
                                                {area}
                                            </Badge>
                                        ))}
                                        {trainee.areasOfInterest.length > 3 && (
                                            <Badge variant="outline" className="text-xs font-normal px-2 py-0 h-5">
                                                +{trainee.areasOfInterest.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0 pb-4 border-t mt-auto pt-4 flex gap-2">
                                <Button className="w-full" asChild>
                                    <Link href={`/dashboard/book?therapistId=${trainee.uid}`}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Book Session
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
