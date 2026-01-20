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

  const patientLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/book', label: 'Book Session', icon: MessageSquarePlus },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  ];

  const therapistLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/availability', label: 'Set Availability', icon: CalendarPlus },
  ];

  const links = profile?.role === 'patient' ? patientLinks : therapistLinks;

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
