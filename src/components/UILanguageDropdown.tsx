import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_LANGUAGES, changeUILanguage } from '@/lib/i18n';

interface UILanguageDropdownProps {
  className?: string;
  compact?: boolean;
}

const UILanguageDropdown: React.FC<UILanguageDropdownProps> = ({ className, compact = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = UI_LANGUAGES.find(l => l.code === i18n.language) || UI_LANGUAGES[0];

  const handleSelect = (code: string) => {
    changeUILanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-colors',
          compact 
            ? 'p-2 hover:bg-muted' 
            : 'px-3 py-2 bg-muted/50 hover:bg-muted'
        )}
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        {!compact && (
          <>
            <span className="text-sm font-medium">{currentLang.nativeName}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden animate-scale-in">
            {UI_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  'w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors',
                  lang.code === i18n.language && 'bg-primary/10'
                )}
              >
                <div>
                  <p className="font-medium text-sm">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>
                {lang.code === i18n.language && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UILanguageDropdown;
