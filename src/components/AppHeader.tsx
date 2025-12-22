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
  showLogo?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className, leftSlot, rightSlot, showLogo = true }) => {
  return (
    <header className={cn("sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-3 py-2", className)}>
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          {showLogo && <BrandLogo className="shrink-0" compact />}
          {leftSlot}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <UILanguageDropdown compact />
          <div className="flex items-center rounded-lg bg-muted/50 border border-border/50 p-0.5">
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
