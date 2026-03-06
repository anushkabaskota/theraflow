'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
// import { storage } from '@/lib/firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_TAGS } from '@/lib/tags';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  photoURL: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters.').optional(),
  age: z.coerce.number().optional(),
  pronouns: z.string().optional(),
  preferredSessionFormat: z.enum(['online', 'in-person']).optional(),
  languagePreference: z.string().optional(),
  areasOfConcern: z.array(z.string()).optional(),
  // Trainee fields
  degree: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.coerce.number().optional(),
  areasOfInterest: z.array(z.string()).optional(),
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const defaultValues: Partial<ProfileFormValues> = {
    displayName: profile?.displayName || '',
    photoURL: profile?.photoURL || '',
    bio: profile?.bio || '',
    age: profile?.age,
    pronouns: profile?.pronouns || '',
    preferredSessionFormat: profile?.preferredSessionFormat,
    languagePreference: profile?.languagePreference || '',
    areasOfConcern: profile?.areasOfConcern || [],
    degree: profile?.degree || '',
    institution: profile?.institution || '',
    graduationYear: profile?.graduationYear,
    areasOfInterest: profile?.areasOfInterest || [],
    licenseNumber: profile?.licenseNumber || '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      form.setValue('photoURL', '');
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    console.log("onSubmit triggered!", data);
    if (!user) {
      console.log("No user, returning early");
      return;
    }

    console.log("Setting isSaving to true");
    setIsSaving(true);
    try {
      console.log("Inside try block");
      let finalPhotoURL = data.photoURL;

      if (profileImageFile) {
        console.log("Uploading image...");
        try {
          const formData = new FormData();
          formData.append('file', profileImageFile);
          formData.append('uid', user.uid);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }

          const result = await response.json();
          finalPhotoURL = result.url;
          console.log("Image uploaded:", finalPhotoURL);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast({
            title: 'Image Upload Failed',
            description: 'Failed to upload profile picture via API. Continuing to save profile data...',
            variant: 'destructive',
          });
        }
      }

      const updateData: Partial<UserProfile> = {
        displayName: data.displayName,
        photoURL: finalPhotoURL,
        bio: data.bio,
      };

      if (profile?.role === 'user') {
        updateData.age = data.age;
        updateData.pronouns = data.pronouns;
        updateData.preferredSessionFormat = data.preferredSessionFormat;
        updateData.languagePreference = data.languagePreference;
        updateData.areasOfConcern = data.areasOfConcern || [];
      } else if (profile?.role === 'trainee') {
        updateData.degree = data.degree;
        updateData.institution = data.institution;
        updateData.graduationYear = data.graduationYear;
        updateData.areasOfInterest = data.areasOfInterest || [];
        updateData.age = data.age;
        updateData.pronouns = data.pronouns;
        updateData.languagePreference = data.languagePreference;
      } else if (profile?.role === 'supervisor') {
        updateData.licenseNumber = data.licenseNumber;
      }

      console.log("Update Data built:", updateData);

      console.log("Calling updateUserProfile");
      await updateUserProfile(user.uid, updateData);
      console.log("updateUserProfile resolved, calling refetchProfile");
      refetchProfile();
      console.log("refetchProfile called, calling toast");
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully saved.',
      });
      console.log("toast called, calling onFinished");
      onFinished();
      console.log("onFinished called");
    } catch (error) {
      console.error("Catch block error:", error);
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      console.log("Finally block, setting isSaving to false");
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("Form validation errors:", errors);
        toast({
          title: "Validation Error",
          description: "Please check the form for missing or invalid fields: " + Object.keys(errors).join(", "),
          variant: "destructive"
        });
      })} className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={previewImage || profile?.photoURL || undefined} />
            <AvatarFallback className="text-2xl">
              {getInitials(profile?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-2">
            <FormLabel>Profile Picture</FormLabel>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        </div>

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

        {profile?.role !== 'supervisor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronouns</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., she/her" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="languagePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language Preference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., English, Spanish" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {profile?.role === 'user' && (
              <FormField
                control={form.control}
                name="preferredSessionFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Session Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in-person">In-person</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {profile?.role === 'user' && (
          <FormField
            control={form.control}
            name="areasOfConcern"
            render={({ field }) => (
              <FormItem className="pt-2">
                <FormLabel>Areas of Concern</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={PREDEFINED_TAGS}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select tags..."
                  />
                </FormControl>
                <FormDescription>Select areas of concern.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                A short biography that will be displayed on your profile.
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
                    <Input type="number" placeholder="e.g., 2023" {...field} value={field.value ?? ''} />
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
                    <MultiSelect
                      options={PREDEFINED_TAGS}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select areas of interest..."
                    />
                  </FormControl>
                  <FormDescription>
                    Select areas you are interested in or specialize in.
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
