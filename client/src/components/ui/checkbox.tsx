import * as React from "react"
import "@material/web/checkbox/checkbox.js"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Checkbox component implemented with Material Web's `<md-checkbox>`.
 */
const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    const Comp = "md-checkbox" as any
    return (
      <Comp
        ref={ref as React.Ref<HTMLElement>}
        className={cn(className)}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
