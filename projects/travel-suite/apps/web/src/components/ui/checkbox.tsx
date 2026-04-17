"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer shrink-0 rounded-[5px] border transition-colors",
            // 24×24 hit-box to comfortably clear the 44px mobile target when
            // combined with the label row padding.
            "h-[22px] w-[22px]",
            "border-white/25 bg-white/[0.04]",
            "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator
            className={cn("flex items-center justify-center text-[#040d09]")}
        >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
