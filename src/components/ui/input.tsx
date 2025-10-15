import * as React from "react";

import { cn } from "@/lib/utils";
import { useShameEngine } from "@/hooks/useShameEngine";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    const { trackActivity, trackHesitation, affect } = useShameEngine();

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      trackActivity();
      onChange?.(e);
    }, [trackActivity, onChange]);

    const affectStyles = React.useMemo(() => {
      const styles: React.CSSProperties = {};
      
      if (affect.hesitation > 0.3) {
        styles.filter = `blur(${affect.hesitation * 0.5}px)`;
      }
      
      if (affect.overactivity > 0.6) {
        styles.borderColor = `hsl(var(--destructive) / ${affect.overactivity})`;
      }
      
      return styles;
    }, [affect.hesitation, affect.overactivity]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        style={affectStyles}
        {...trackHesitation}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
