
"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfDay, subDays, startOfMonth, endOfMonth, endOfDay, startOfYear, endOfYear } from "date-fns"
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
  date: DateRange | undefined
  setDate: (range?: DateRange) => void
}

export function DateRangePicker({ className, date, setDate }: DateRangePickerProps) {
  const [preset, setPreset] = React.useState<string>("last7");
  const popoverCloseRef = React.useRef<HTMLButtonElement>(null);

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const now = new Date()
    let newRange: DateRange | undefined = undefined;
    switch (value) {
      case "today":
        newRange = { from: startOfDay(now), to: endOfDay(now) }
        break
      case "last7":
        newRange = { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
        break
      case "thisMonth":
        newRange = { from: startOfMonth(now), to: endOfMonth(now) }
        break
      case "thisYear":
        newRange = { from: startOfYear(now), to: endOfYear(now) }
        break
      default:
        // do nothing for custom
    }
    if (newRange) {
        setDate(newRange);
        popoverCloseRef.current?.click();
    }
  }

  const handleDateChange = (newDate?: DateRange) => {
    if (newDate?.from && !newDate.to) {
      newDate.to = newDate.from;
    }
    if (newDate) setDate(newDate);
    setPreset("custom")
    if (newDate?.from && newDate.to) {
        popoverCloseRef.current?.click();
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
              "w-auto justify-start text-left font-normal bg-card/50",
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
            <div className="flex justify-end">
                 <button ref={popoverCloseRef} style={{ display: 'none' }}></button>
            </div>
            <div className="flex items-center space-x-2 p-4">
                <div className="flex-1">
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="last7">7 derniers jours</SelectItem>
                      <SelectItem value="thisMonth">Ce mois-ci</SelectItem>
                      <SelectItem value="thisYear">Cette année</SelectItem>
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
