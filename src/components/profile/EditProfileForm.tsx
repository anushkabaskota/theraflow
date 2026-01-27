'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters.').optional(),
  // Trainee fields
  degree: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.coerce.number().optional(),
  areasOfInterest: z.string().optional(), // Will be handled as a string and converted to array
  // Supervisor fields
  licenseNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
  onFinished: () => void;
}

export function EditProfileForm({ onFinished }: EditProfileFormProps) {
  const { user, profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues: Partial<ProfileFormValues> = {
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    degree: profile?.degree || '',
    institution: profile?.institution || '',
    graduationYear: profile?.graduationYear,
    areasOfInterest: profile?.areasOfInterest?.join(', ') || '',
    licenseNumber: profile?.licenseNumber || '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const areasOfInterestArray = data.areasOfInterest?.split(',').map(s => s.trim()).filter(Boolean) || [];
      const updateData: Partial<UserProfile> = {
        displayName: data.displayName,
        bio: data.bio,
      };

      if (profile?.role === 'trainee') {
        updateData.degree = data.degree;
        updateData.institution = data.institution;
        updateData.graduationYear = data.graduationYear;
        updateData.areasOfInterest = areasOfInterestArray;
      }

      if (profile?.role === 'supervisor') {
        updateData.licenseNumber = data.licenseNumber;
      }

      await updateUserProfile(user.uid, updateData);
      refetchProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully saved.',
      });
      onFinished();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A short biography that will be displayed on your public profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {profile?.role === 'trainee' && (
            <>
                <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., M.S. in Clinical Psychology" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Institution</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., University of Psychology" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Graduation Year</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 2023" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="areasOfInterest"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Areas of Interest</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Anxiety, Mindfulness, CBT" {...field} />
                            </FormControl>
                             <FormDescription>
                                Separate areas with a comma.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        )}

        {profile?.role === 'supervisor' && (
            <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                            <Input placeholder="Your license number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}


        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onFinished} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
