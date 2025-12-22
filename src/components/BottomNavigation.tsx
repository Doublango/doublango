import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, RotateCcw, Mic2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

const navItems: NavItem[] = [
  { path: '/home', icon: Home, labelKey: 'nav.home' },
  { path: '/learn', icon: BookOpen, labelKey: 'nav.learn' },
  { path: '/speech', icon: Mic2, labelKey: 'nav.speech' },
  { path: '/review', icon: RotateCcw, labelKey: 'nav.review' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  // Don't show navigation on auth, onboarding, lesson, or landing pages
  if (
    location.pathname === '/' ||
    location.pathname.startsWith('/auth') || 
    location.pathname.startsWith('/onboarding') || 
    location.pathname.startsWith('/lesson') ||
    location.pathname.startsWith('/timed-challenge')
  ) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'nav-item flex-1',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
