import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_LANGUAGES, changeUILanguage } from '@/lib/i18n';

interface UILanguageDropdownProps {
  className?: string;
  compact?: boolean;
}

const UILanguageDropdown: React.FC<UILanguageDropdownProps> = ({ className, compact = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = useMemo(
    () => UI_LANGUAGES.find((l) => l.code === i18n.language) || UI_LANGUAGES[0],
    [i18n.language]
  );

  const handleSelect = (code: string) => {
    changeUILanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-colors border border-border bg-muted/40',
          compact ? 'h-10 px-2 hover:bg-muted' : 'px-3 py-2 hover:bg-muted'
        )}
        aria-label="Change app language"
        aria-expanded={isOpen}
      >
        <span aria-hidden className="text-base leading-none">{currentLang.flag}</span>
        {!compact && <span className="text-sm font-medium">{currentLang.nativeName}</span>}
        <ChevronDown
          className={cn('w-4 h-4 transition-transform text-muted-foreground', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted-foreground px-2">App Language</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {UI_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    'w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors',
                    lang.code === i18n.language && 'bg-primary/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="text-lg leading-none">{lang.flag}</span>
                    <div>
                      <p className="font-medium text-sm">{lang.nativeName}</p>
                      <p className="text-xs text-muted-foreground">{lang.name}</p>
                    </div>
                  </div>
                  {lang.code === i18n.language && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UILanguageDropdown;

