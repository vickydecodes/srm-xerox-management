"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
  placeholder = "Pick a date",
  className,
  id,
  ...props
}) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value
    try {
      const parsed =
        typeof value === "string" && value.length === 10
          ? new Date(`${value}T00:00:00`)
          : new Date(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    } catch {
      return undefined
    }
  }, [value])

  const min = React.useMemo(() => {
    if (!minDate) return undefined
    if (minDate instanceof Date) return minDate
    try {
      return new Date(`${minDate}T00:00:00`)
    } catch {
      return undefined
    }
  }, [minDate])

  const max = React.useMemo(() => {
    if (!maxDate) return undefined
    if (maxDate instanceof Date) return maxDate
    try {
      return new Date(`${maxDate}T00:00:00`)
    } catch {
      return undefined
    }
  }, [maxDate])

  const handleSelect = (date) => {
    if (!date) {
      onChange?.("")
    } else {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      onChange?.(`${year}-${month}-${day}`)
    }
    setOpen(false)
  }

  const isDateDisabled = (date) => {
    if (disabled === true) return true
    if (typeof disabled === "function" && disabled(date)) return true
    if (min && date < min) return true
    if (max && date > max) return true
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 bg-background",
            !selectedDate && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          {selectedDate ? (
            format(selectedDate, "PPP")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          initialFocus
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
