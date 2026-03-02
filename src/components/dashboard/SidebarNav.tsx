
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
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const userLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/book', label: 'Book Session', icon: MessageSquarePlus },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  ];

  const traineeLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarPlus },
  ];

  const supervisorLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
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
