import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-lg border border-border bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus-visible:ring-4 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
