'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Loading from '@/app/loading';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCheck, Search, Send } from 'lucide-react';

const ProfileDetail = ({ label, value }: { label: string, value?: string | number | string[] | null }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className="flex items-start py-2">
      <span className="font-semibold w-32 shrink-0">{label}:</span>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">{value}</span>
      )}
    </div>
  );
};


export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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

  const renderSupervisionStatus = () => {
    if (profile.role !== 'trainee') return null;

    switch (profile.supervisionStatus) {
      case 'unsupervised':
        return (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>Find a Supervisor</AlertTitle>
            <AlertDescription>
              You need to be supervised to work with clients.
            </AlertDescription>
            <Button className="mt-4">Search for Supervisors</Button>
          </Alert>
        );
      case 'pending':
        return (
          <Alert variant="default">
             <Send className="h-4 w-4" />
            <AlertTitle>Request Sent</AlertTitle>
            <AlertDescription>
              Your supervision request is awaiting approval.
            </AlertDescription>
          </Alert>
        );
      case 'approved':
        return (
           <Alert className="border-green-500 text-green-700 [&>svg]:text-green-700">
            <UserCheck className="h-4 w-4" />
            <AlertTitle>Supervision Approved</AlertTitle>
            <AlertDescription>
              You are approved to work with clients.
              {/* TODO: Add supervisor name */}
            </AlertDescription>
          </Alert>
        );
      case 'revoked':
         return (
          <Alert variant="destructive">
            <AlertTitle>Supervision Inactive</AlertTitle>
            <AlertDescription>
              Your supervision has been revoked. Please contact your supervisor.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };
  
  const renderTraineeBanner = () => {
    if (profile.role !== 'trainee') return null;
    return (
       <Alert variant="default" className="mb-6 bg-accent">
          <AlertTitle>Psychology Trainee · Supervised Practice</AlertTitle>
          <AlertDescription>
           This provider is a psychology trainee working under supervision.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update your profile details below.' : 'View and manage your profile details.'}
        </p>
      </div>

      {renderTraineeBanner()}
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
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
          {!isEditing && (
             <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <EditProfileForm onFinished={() => setIsEditing(false)} />
          ) : (
            <div className="space-y-2 divide-y">
                <ProfileDetail label="Role" value={profile.role} />
                {profile.bio && <ProfileDetail label="Bio" value={profile.bio} />}
                
                {/* Trainee Details */}
                {profile.role === 'trainee' && (
                    <>
                        <ProfileDetail label="Degree" value={profile.degree} />
                        <ProfileDetail label="Institution" value={profile.institution} />
                        <ProfileDetail label="Graduation Year" value={profile.graduationYear} />
                        <ProfileDetail label="Areas of Interest" value={profile.areasOfInterest} />
                    </>
                )}

                {/* Supervisor Details */}
                {profile.role === 'supervisor' && (
                    <ProfileDetail label="License #" value={profile.licenseNumber} />
                )}

                {profile.role === 'trainee' && (
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-2">Supervision Status</h3>
                    {renderSupervisionStatus()}
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
