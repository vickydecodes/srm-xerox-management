"use client"

import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MonthPicker({
  selected,
  onSelect,
  className,
  buttonVariant = "ghost",
}) {
  const current = selected || new Date()

  const handlePrev = () => {
    const prev = new Date(current)
    prev.setMonth(current.getMonth() - 1)
    onSelect?.(prev)
  }

  const handleNext = () => {
    const next = new Date(current)
    next.setMonth(current.getMonth() + 1)
    onSelect?.(next)
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-md px-4 p-2 bg-background",
        className
      )}
    >
      <Button
        variant={buttonVariant}
        size="icon"
        onClick={handlePrev}
        className="h-4 w-4"
      >
        <ChevronLeftIcon className="size-4 opacity-50" />
      </Button>

      <div className="text-sm w-30 text-center">
        {current.toLocaleString("default", { month: "long" })}{" "}
        {current.getFullYear()}
      </div>

      <Button
        variant={buttonVariant}
        size="icon"
        onClick={handleNext}
        className="h-4 w-4"
      >
        <ChevronRightIcon className="size-4 opacity-50" />
      </Button>
    </div>
  )
}
