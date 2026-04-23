import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-white/90 px-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus-visible:ring-4 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
