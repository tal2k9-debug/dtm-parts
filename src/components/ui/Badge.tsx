import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success/20 text-success border-success/30 font-semibold",
  danger: "bg-danger/20 text-danger border-danger/30 font-semibold",
  warning: "bg-warning/20 text-yellow-700 border-warning/30 font-semibold",
  info: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
  neutral: "bg-gray-400",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
