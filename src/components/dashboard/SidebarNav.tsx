
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Home,
  MessageSquarePlus,
  CalendarPlus,
  Search,
  Users,
  FileText,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const userLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/explore', label: 'Explore Therapists', icon: MessageSquarePlus },
    { href: '/dashboard/book', label: 'Book Session', icon: CalendarPlus },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  ];

  const traineeLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/find-supervisor', label: 'Find Supervisor', icon: Search },
    { href: '/dashboard/requests', label: 'Session Requests', icon: MessageSquarePlus },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/session-notes', label: 'Session Notes', icon: FileText },
    { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarPlus },
  ];

  const supervisorLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/mentorship-requests', label: 'Mentorship Requests', icon: Users },
    { href: '/dashboard/trainee-notes', label: 'Trainee Notes', icon: FileText },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  ];

  let links = userLinks;
  if (profile?.role === 'trainee') links = traineeLinks;
  if (profile?.role === 'supervisor') links = supervisorLinks;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-2',
            pathname === link.href
              ? 'bg-muted text-primary'
              : 'text-muted-foreground'
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
