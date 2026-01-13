
"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, startOfDay, subDays, startOfMonth, endOfMonth, endOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onUpdate: (range?: DateRange) => void
}

export function DateRangePicker({ className, onUpdate }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  })
  const [preset, setPreset] = React.useState<string>("last7")

  React.useEffect(() => {
    onUpdate(date)
  }, [date, onUpdate])

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const now = new Date()
    switch (value) {
      case "today":
        setDate({ from: startOfDay(now), to: endOfDay(now) })
        break
      case "last7":
        setDate({ from: startOfDay(subDays(now, 6)), to: endOfDay(now) })
        break
      case "last30":
        setDate({ from: startOfDay(subDays(now, 29)), to: endOfDay(now) })
        break
      case "thisMonth":
        setDate({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      default:
        setDate(undefined)
    }
  }

  const handleDateChange = (newDate?: DateRange) => {
    // When a date is selected, make sure the time is set to the end of the day for the 'to' date
    if (newDate?.to) {
        newDate.to = endOfDay(newDate.to);
    }
    setDate(newDate)
    if (newDate) {
      // Logic to check if the selected range matches a preset
      // This is optional but improves UX. For simplicity, we can set to custom.
      setPreset("custom")
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-auto justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d LLL, y", { locale: fr })} -{" "}
                  {format(date.to, "d LLL, y", { locale: fr })}
                </>
              ) : (
                format(date.from, "d LLL, y", { locale: fr })
              )
            ) : (
              <span>Choisissez une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex items-center space-x-2 p-4">
            <div className="flex-1">
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="last7">7 derniers jours</SelectItem>
                  <SelectItem value="last30">30 derniers jours</SelectItem>
                  <SelectItem value="thisMonth">Ce mois-ci</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t border-muted">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
              locale={fr}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
