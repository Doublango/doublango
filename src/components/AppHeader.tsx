import React from "react";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import KidsModeToggle from "@/components/KidsModeToggle";
import UILanguageDropdown from "@/components/UILanguageDropdown";

interface AppHeaderProps {
  className?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className, leftSlot, rightSlot }) => {
  return (
    <header className={cn("sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="shrink-0" />
          {leftSlot}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UILanguageDropdown compact />
          <div className="flex items-center gap-1 rounded-xl bg-muted/40 border border-border px-1">
            <DarkModeToggle />
            <KidsModeToggle />
          </div>
          {rightSlot}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
