import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/doublango-logo.png";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className, compact = false }) => {
  return (
    <Link
      to="/home"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label="DoubLango home"
    >
      <img 
        src={logoImage} 
        alt="DoubLango" 
        className={cn(
          "object-contain",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
      />
      {!compact && (
        <span className="font-extrabold tracking-tight text-foreground">DoubLango</span>
      )}
    </Link>
  );
};

export default BrandLogo;
