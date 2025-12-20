import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, RotateCcw, Trophy, User, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/review', icon: RotateCcw, label: 'Review' },
  { path: '/leaderboard', icon: Trophy, label: 'League' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  // Don't show navigation on auth or onboarding pages
  if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/lesson')) {
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
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;