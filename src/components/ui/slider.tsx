import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { useShameEngine } from "@/hooks/useShameEngine";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, onValueChange, ...props }, ref) => {
  const { trackHesitation, trackActivity, affect } = useShameEngine();
  
  const handleValueChange = React.useCallback((value: number[]) => {
    trackActivity();
    onValueChange?.(value);
  }, [trackActivity, onValueChange]);

  // Visual feedback based on affect
  const affectStyles = React.useMemo(() => {
    const styles: React.CSSProperties = {};
    
    // Hesitation → blur
    if (affect.hesitation > 0.3) {
      styles.filter = `blur(${affect.hesitation * 2}px)`;
    }
    
    // Overactivity → red border flash
    if (affect.overactivity > 0.6) {
      styles.outline = `2px solid hsl(var(--destructive) / ${affect.overactivity})`;
      styles.outlineOffset = '2px';
    }
    
    return styles;
  }, [affect.hesitation, affect.overactivity]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center transition-all", className)}
      onValueChange={handleValueChange}
      style={affectStyles}
      {...props}
      {...trackHesitation}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
