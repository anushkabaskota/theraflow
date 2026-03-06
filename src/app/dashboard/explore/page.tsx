'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_TAGS } from '@/lib/tags';
import { TherapistCard } from '@/components/explore/TherapistCard';

export default function ExplorePage() {
    const { profile } = useAuth();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [therapists, setTherapists] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Optionally default to the user's areas of concern for first fetch
        if (profile?.areasOfConcern && profile.areasOfConcern.length > 0 && selectedTags.length === 0) {
            setSelectedTags(profile.areasOfConcern);
        }
    }, [profile]);

    useEffect(() => {
        async function fetchTherapists() {
            setLoading(true);
            try {
                const usersRef = collection(db, 'users');
                let therapistResults: UserProfile[] = [];

                // Note: Firestore doesn't easily let you query multiple array elements as AND
                // without composite indexes, but 'array-contains-any' is great for OR.
                // We will fetch where role == 'trainee' OR 'supervisor'

                // Since we want to let users explore without tags or with tags:
                // Due to Firestore query limits for 'OR' roles + 'array-contains-any', 
                // it's easier to fetch trainees/supervisors and filter in-memory if the dataset isn't huge.
                // For a true production app with 1M users, we'd use Typesense/Algolia or strict composite queries.

                const qTrainee = query(usersRef, where('role', '==', 'trainee'));
                const qSupervisor = query(usersRef, where('role', '==', 'supervisor'));

                const [traineeSnap, supervisorSnap] = await Promise.all([
                    getDocs(qTrainee),
                    getDocs(qSupervisor)
                ]);

                let fetchedTherapists = [
                    ...traineeSnap.docs.map(doc => doc.data() as UserProfile),
                    ...supervisorSnap.docs.map(doc => doc.data() as UserProfile),
                ];

                // Filter out dummy users
                fetchedTherapists = fetchedTherapists.filter(t => {
                    const name = t.displayName?.trim().toLowerCase();
                    if (!name) return false;
                    if (name === 'trainee' || name === 'supervisor' || name.startsWith('user')) return false;
                    return true;
                });

                if (selectedTags.length > 0) {
                    // Client-side filtering to ensure ALL selected tags match (AND logic)
                    // or ANY selected tag matches (OR logic). We will use OR logic to match Wattpad's style
                    // so if they search "Anxiety, Stress", they see therapists handling BOTH or EITHER.
                    therapistResults = fetchedTherapists.filter(t => {
                        const interests = t.areasOfInterest || [];
                        return selectedTags.some(tag => interests.includes(tag));
                    });
                } else {
                    therapistResults = fetchedTherapists;
                }

                setTherapists(therapistResults);
            } catch (error) {
                console.error("Error fetching therapists:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTherapists();
    }, [selectedTags]);

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Explore Therapists</h1>
                <p className="text-muted-foreground">
                    Find the right support by filtering through areas of interest.
                </p>
            </div>

            <div className="flex flex-col gap-2 max-w-2xl">
                <h3 className="font-semibold text-sm">Filter by Tags:</h3>
                <MultiSelect
                    options={PREDEFINED_TAGS}
                    value={selectedTags}
                    onChange={setSelectedTags}
                    placeholder="Search for Anxiety, Trauma, etc..."
                />
            </div>

            <div>
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : therapists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {therapists.map(therapist => (
                            <TherapistCard key={therapist.uid} therapist={therapist} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground bg-accent/50 rounded-lg mt-4 border border-dashed">
                        No therapists found matching "{selectedTags.map(t => PREDEFINED_TAGS.find(p => p.value === t)?.label).join(', ')}".
                        Try removing some tags.
                    </div>
                )}
            </div>
        </div>
    );
}
