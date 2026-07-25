import * as React from "react"

import { cn } from "#/lib/utils.ts"

/**
 * Renders a styled card container.
 *
 * @param className - Additional CSS classes to apply to the card.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the header section of a card.
 *
 * @param className - Additional CSS classes to apply to the header.
 * @param props - Additional properties forwarded to the underlying `div`.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled title within a card.
 *
 * @param className - Additional CSS classes to apply to the title.
 * @param props - Additional properties forwarded to the underlying `div`.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders muted descriptive text within a card.
 *
 * @param className - Additional CSS classes to apply to the description.
 * @param props - Additional properties forwarded to the underlying `div`.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders an action area within a card.
 *
 * @param className - Additional CSS classes to apply to the action area.
 * @returns The card action area element.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the main content section of a card.
 *
 * @param className - Optional additional CSS classes for the content section
 * @param props - Additional properties forwarded to the underlying `div`
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * Renders the footer section of a card.
 *
 * @param className - Additional classes to apply to the footer.
 * @param props - Properties forwarded to the underlying `<div>` element.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
