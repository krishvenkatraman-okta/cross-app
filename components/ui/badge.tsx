import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

function getBadgeClasses(variant?: string) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden"

  let variantClasses = ""
  switch (variant) {
    case "secondary":
      variantClasses = "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90"
      break
    case "destructive":
      variantClasses =
        "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
      break
    case "outline":
      variantClasses = "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
      break
    default:
      variantClasses = "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90"
  }

  return `${baseClasses} ${variantClasses}`
}

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(getBadgeClasses(variant), className)} {...props} />
}

export { Badge }
