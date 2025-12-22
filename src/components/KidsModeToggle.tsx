import React, { useCallback } from "react";
import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface KidsModeToggleProps {
  className?: string;
}

const KidsModeToggle: React.FC<KidsModeToggleProps> = ({ className }) => {
  const { settings, setKidsMode } = useAppSettings();

  const toggle = useCallback(() => {
    setKidsMode(!settings.kidsMode);
  }, [setKidsMode, settings.kidsMode]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "p-2 rounded-xl transition-colors",
        settings.kidsMode ? "bg-primary/10" : "hover:bg-muted",
        className
      )}
      aria-label={settings.kidsMode ? "Disable kids mode" : "Enable kids mode"}
      aria-pressed={settings.kidsMode}
    >
      <Baby className={cn("h-5 w-5", settings.kidsMode ? "text-primary" : "text-muted-foreground")} />
    </button>
  );
};

export default KidsModeToggle;
