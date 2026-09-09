import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-950 text-white hover:bg-slate-850",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive:
          "border-transparent bg-rose-500 text-white hover:bg-rose-600",
        outline:
          "border-slate-200/90 text-slate-700 bg-white/80 backdrop-blur-xs shadow-2xs",
        primary: "bg-sky-50 text-sky-800 border-sky-200/80",
        success: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        warning: "bg-amber-50 text-amber-800 border-amber-200/80",
        danger: "bg-rose-50 text-rose-800 border-rose-200/80",
        info: "bg-blue-50 text-blue-800 border-blue-200/80",
        purple: "bg-purple-50 text-purple-800 border-purple-200/80",
        neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
      },
      size: {
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2.5 py-1 text-xs",
        md: "px-3.5 py-1.5 text-sm",
        default: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({ className, variant, size, icon: Icon, children, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 mr-1.5" />}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
export default Badge;
