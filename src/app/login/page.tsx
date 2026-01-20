'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOauthSubmitting, setIsOauthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsOauthSubmitting(true);
    try {
        await signInWithGoogle();
    } catch (error: any) {
        toast({
            title: 'Authentication Error',
            description: error.message || 'Could not sign in with Google.',
            variant: 'destructive',
        });
        setIsOauthSubmitting(false);
    }
  }

  const handleEmailAuth = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signInWithEmail(data.email, data.password);
      } else {
        await signUpWithEmail(data.email, data.password);
        toast({
          title: 'Account Created!',
          description: 'You can now sign in.',
        });
        setAuthMode('signin');
        form.reset();
      }
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code) {
        switch(error.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            description = 'Incorrect email or password. Please try again.';
            break;
          case 'auth/wrong-password':
            description = 'Incorrect password. Please try again.';
            break;
          case 'auth/email-already-in-use':
            description = 'An account with this email already exists.';
            break;
          default:
            description = error.message;
        }
      }
      toast({
        title: 'Authentication Error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || (user && !isOauthSubmitting)) {
    return null;
  }

  const anySubmitting = isSubmitting || isOauthSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center justify-center text-center p-6">
          <Logo />
          <CardTitle className="pt-4 text-2xl font-bold">
            {authMode === 'signin' ? 'Sign In' : 'Create an Account'}
          </CardTitle>
          <CardDescription>
            to continue to TheraFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEmailAuth)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} disabled={anySubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={anySubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={anySubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={anySubmitting}
          >
            {isOauthSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2" />
            )}
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                form.reset();
              }}
              disabled={anySubmitting}
            >
              {authMode === 'signin' ? 'Sign up' : 'Sign in'}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
