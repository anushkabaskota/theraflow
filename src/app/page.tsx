'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { 
  HeartHandshake, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import Loading from './loading';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (!profile?.role) {
        router.replace('/role-selection');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || (user && isMounted)) {
    return <Loading />;
  }

  // If user is not logged in, show the landing page
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium">
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="text-sm font-medium">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 lg:py-48">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Accessible therapy for everyone.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
                Connecting those seeking support with supervised psychology trainees providing quality, pro bono care.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base font-medium transition-all hover:scale-105">
                    Start your journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="ghost" size="lg" className="h-12 px-8 text-base font-medium">
                    Learn more
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Subtle background element */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-20 pointer-events-none">
            <div className="h-[400px] w-[600px] rounded-full bg-accent" />
          </div>
        </section>

        {/* How it Works / About Section */}
        <section id="how-it-works" className="border-t border-border/40 py-24 md:py-32 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
              <p className="mt-4 text-muted-foreground">Bridging the gap in mental health access through education and supervision.</p>
            </div>
            
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col items-start p-2 transition-all duration-300">
                <div className="mb-6 rounded-2xl bg-background p-4 shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                  <HeartHandshake className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Pro bono access</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Quality mental health support shouldn't be a luxury. Our platform connects you with free therapy sessions provided by dedicated trainees.
                </p>
              </div>

              <div className="group flex flex-col items-start p-2 transition-all duration-300">
                <div className="mb-6 rounded-2xl bg-background p-4 shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Trained specialists</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Sessions are conducted by psychology students in advanced clinical training who bring the latest evidence-based practices to their work.
                </p>
              </div>

              <div className="group flex flex-col items-start p-2 transition-all duration-300">
                <div className="mb-6 rounded-2xl bg-background p-4 shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Expert oversight</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Every session is supported by licensed supervisors who ensure the highest ethical standards and quality of care for every client.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground text-center md:px-12 md:py-24 shadow-2xl">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to take the first step towards better mental health?
              </h2>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button variant="secondary" size="lg" className="h-12 px-8 text-base font-medium">
                    Create your account
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Subtle visual flair */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 h-32 w-32 bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo />
            <nav className="flex gap-8 text-sm font-medium text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TheraFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
