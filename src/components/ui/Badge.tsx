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
  success: "bg-green-800 text-white border-green-900 font-bold shadow-md",
  danger: "bg-red-800 text-white border-red-900 font-bold shadow-md",
  warning: "bg-yellow-600 text-white border-yellow-700 font-bold shadow-md",
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
