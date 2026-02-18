import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#f97316] text-white hover:bg-[#ea580c]",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
        outline: "text-gray-900 border-gray-300",
        success:
          "border-transparent bg-green-100 text-green-700 hover:bg-green-200",
        danger:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
