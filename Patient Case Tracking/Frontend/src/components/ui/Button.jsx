import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99] select-none",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white hover:bg-slate-800 shadow-sm border border-transparent",
        primary: "bg-slate-950 text-white hover:bg-slate-800 shadow-sm border border-transparent",
        destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-xs",
        danger: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200",
        outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-2xs",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80 border border-slate-200/70",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
        link: "text-sky-600 underline-offset-4 hover:underline",
        glass: "bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-2xs",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        md: "h-10 px-5 py-2.5 text-sm",
        lg: "h-12 rounded-2xl px-7 text-sm sm:text-base font-normal",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </span>
        ) : (
          <>
            {Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0 mr-1.5" />}
            {children}
            {Icon && iconPosition === "right" && <Icon className="w-4 h-4 shrink-0 ml-1.5" />}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
