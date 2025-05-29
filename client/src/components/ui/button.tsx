import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import "@material/web/button/filled-button.js"
import "@material/web/button/outlined-button.js"
import "@material/web/button/text-button.js"
import "@material/web/button/filled-tonal-button.js"
import "@material/web/button/elevated-button.js"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10 p-0",
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
    VariantProps<typeof buttonVariants> {}

const tagMap = {
  default: "md-filled-button",
  destructive: "md-filled-button",
  outline: "md-outlined-button",
  secondary: "md-filled-tonal-button",
  ghost: "md-text-button",
  link: "md-text-button",
} as const

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant = "default", size, children, ...props }, ref) => {
    const Comp = tagMap[variant as keyof typeof tagMap] as any
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLElement>}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
