import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-2xl border border-border",
        hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface rounded-2xl border border-border p-6", className)}>
      <div className="shimmer h-48 rounded-xl mb-4" />
      <div className="shimmer h-5 w-3/4 rounded mb-3" />
      <div className="shimmer h-4 w-1/2 rounded mb-2" />
      <div className="shimmer h-4 w-1/3 rounded" />
    </div>
  );
}
