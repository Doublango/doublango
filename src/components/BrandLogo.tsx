import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className, compact = false }) => {
  return (
    <Link
      to="/home"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label="DoubLango home"
    >
      <span
        aria-hidden
        className={cn(
          "grid place-items-center rounded-xl gradient-primary text-primary-foreground shadow-sm",
          compact ? "h-8 w-8 text-xs font-black" : "h-9 w-9 text-sm font-black"
        )}
      >
        DL
      </span>
      {!compact && <span className="font-extrabold tracking-tight">DoubLango</span>}
    </Link>
  );
};

export default BrandLogo;
