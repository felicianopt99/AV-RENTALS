import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60",
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 shadow-sm border border-blue-600/20",
        secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 shadow-sm border border-red-600/20",
        outline: "border border-slate-300 dark:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        ghost: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
        accentGhost: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/50",
        link: "text-slate-700 dark:text-slate-300 underline-offset-4 hover:underline hover:text-slate-900 dark:hover:text-slate-100",
        glass: "bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-white/30 dark:border-slate-700/40 backdrop-blur-sm",
        navigation: "bg-blue-600/95 text-white hover:bg-blue-700/95 focus:bg-blue-700 border border-blue-600/30 shadow-sm backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
