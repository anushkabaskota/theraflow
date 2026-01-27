'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Loading from '@/app/loading';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProfilePage() {
  const { profile, loading } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  };

  const avatarImage =
    profile?.photoURL ||
    (profile?.role === 'therapist' || profile?.role === 'supervisor'
      ? PlaceHolderImages.find((img) => img.id === 'therapist-avatar')?.imageUrl
      : PlaceHolderImages.find((img) => img.id === 'patient-avatar')?.imageUrl);


  if (loading) {
    return <Loading />;
  }
  
  if (!profile) {
    return <p>Could not load profile.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">
          View and manage your profile details.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarImage} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center">
              <span className="font-semibold w-24">Role:</span>
              <span className="capitalize text-muted-foreground">{profile.role}</span>
            </div>
            {profile.role === 'trainee' && (
              <div className="flex items-center">
                <span className="font-semibold w-24">Status:</span>
                <span className="capitalize text-muted-foreground">{profile.supervisionStatus}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
