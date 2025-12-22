import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className, showLabel = false }) => {
  const { settings, toggleDarkMode } = useAppSettings();

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        'p-2 rounded-xl transition-all hover:scale-105',
        settings.darkMode 
          ? 'bg-muted hover:bg-muted/80' 
          : 'bg-banana/10 hover:bg-banana/20',
        className
      )}
      aria-label={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="flex items-center gap-2">
        {settings.darkMode ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-banana-dark" />
        )}
        {showLabel && (
          <span className="text-sm font-medium">
            {settings.darkMode ? 'Dark' : 'Light'}
          </span>
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;
