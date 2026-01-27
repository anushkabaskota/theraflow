'use client';

import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { setUserRole } from '@/lib/firestore';
import { Loader2, User, Stethoscope, GraduationCap, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';

export default function RoleSelectionPage() {
  const { user, profile, loading, refetchProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      }
      if (user && profile?.role) {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, loading, router]);


  const handleRoleSelect = async (role: UserRole) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setUserRole(user.uid, role);
      toast({
        title: 'Role selected!',
        description: `You are now registered as a ${role}.`,
      });
      refetchProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set your role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || profile?.role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to TheraFlow!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          To get started, please select your role.
        </p>
      </div>
      <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => !isSubmitting && handleRoleSelect('patient')}
        >
          <CardHeader className="items-center text-center">
            <User className="h-12 w-12 text-primary" />
            <CardTitle className="mt-4">I am a Patient</CardTitle>
            <CardDescription>
              Book and manage your therapy sessions.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => !isSubmitting && handleRoleSelect('therapist')}
        >
          <CardHeader className="items-center text-center">
            <Stethoscope className="h-12 w-12 text-primary" />
            <CardTitle className="mt-4">I am a Therapist</CardTitle>
            <CardDescription>
              Manage your schedule and appointments.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => !isSubmitting && handleRoleSelect('trainee')}
        >
          <CardHeader className="items-center text-center">
            <GraduationCap className="h-12 w-12 text-primary" />
            <CardTitle className="mt-4">I am a Trainee</CardTitle>
            <CardDescription>
              Work with clients under supervision.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => !isSubmitting && handleRoleSelect('supervisor')}
        >
          <CardHeader className="items-center text-center">
            <UserCheck className="h-12 w-12 text-primary" />
            <CardTitle className="mt-4">I am a Supervisor</CardTitle>
            <CardDescription>
              Oversee and approve trainee sessions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      {isSubmitting && <p className="mt-4 text-muted-foreground">Saving your preference...</p>}
    </div>
  );
}
