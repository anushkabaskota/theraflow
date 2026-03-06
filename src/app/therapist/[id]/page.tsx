'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { TraineePublicProfile } from '@/components/profile/TraineePublicProfile';
import { SupervisorPublicProfile } from '@/components/profile/SupervisorPublicProfile';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TherapistProfilePage() {
    const params = useParams();
    const id = params.id as string;

    const [therapist, setTherapist] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [extraData, setExtraData] = useState<any>(null); // For supervisorName or trainees list

    useEffect(() => {
        async function fetchTherapistData() {
            if (!id) return;
            setLoading(true);
            try {
                const docRef = doc(db, 'users', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    setTherapist(data);

                    // Fetch additional relational data
                    if (data.role === 'trainee' && data.supervisorId) {
                        const supRef = doc(db, 'users', data.supervisorId);
                        const supSnap = await getDoc(supRef);
                        if (supSnap.exists()) {
                            setExtraData({ supervisorName: supSnap.data().displayName });
                        }
                    } else if (data.role === 'supervisor') {
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where('supervisorId', '==', id));
                        const traineesSnap = await getDocs(q);
                        const traineesList = traineesSnap.docs.map(d => d.data() as UserProfile);
                        setExtraData({ trainees: traineesList });
                    }
                }
            } catch (error) {
                console.error("Error fetching therapist profile:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTherapistData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (!therapist || (therapist.role !== 'trainee' && therapist.role !== 'supervisor')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-2xl font-bold">Profile Not Found</h1>
                <p className="text-muted-foreground">The requested therapist profile could not be found or does not exist.</p>
                <Button asChild>
                    <Link href="/dashboard/explore">Back to Explore</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-5xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
                    <Link href="/dashboard/explore">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Therapists
                    </Link>
                </Button>
            </div>

            {therapist.role === 'trainee' ? (
                <TraineePublicProfile therapist={therapist} supervisorName={extraData?.supervisorName} />
            ) : (
                <SupervisorPublicProfile therapist={therapist} trainees={extraData?.trainees || []} />
            )}
        </div>
    );
}
