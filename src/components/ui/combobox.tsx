"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


export interface ComboboxOption {
    value: string;
    label: string;
    subLabel?: string;
    disabled?: boolean;
}

interface ComboboxProps {
    options: ComboboxOption[];
    onSelect: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    notFoundMessage: string;
}


export function Combobox({ options, onSelect, placeholder, searchPlaceholder, notFoundMessage}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">{placeholder}</span>
            </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
           <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    // Find the original option to get the correct value
                    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase());
                    if (selectedOption) {
                        onSelect(selectedOption.value)
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      "opacity-0"
                    )}
                  />
                  <div>
                    <p>{option.label}</p>
                    {option.subLabel && <p className="text-xs text-destructive">{option.subLabel}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
