
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User, UserX } from "lucide-react"

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
    subLabelClassName?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    onSelect: (value: string) => void;
    value: string;
    placeholder: string;
    searchPlaceholder: string;
    notFoundMessage: string;
    onSearchChange?: (search: string) => void;
}


export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(({ options, onSelect, value, placeholder, searchPlaceholder, notFoundMessage, onSearchChange }, ref) => {
  const [open, setOpen] = React.useState(false)
  const selectedOption = React.useMemo(() => options.find(o => o.value === value), [options, value]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2"
        >
            <div className="flex items-center gap-3 overflow-hidden text-left flex-grow">
                {/* Icon */}
                <div className="flex-shrink-0">
                    {selectedOption?.value === 'walk-in' || !selectedOption ? (
                        <UserX className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <User className="h-5 w-5 text-primary" />
                    )}
                </div>
                {/* Text content */}
                <div className="flex-grow truncate">
                  {selectedOption ? (
                    <>
                      <p className="font-medium truncate">{selectedOption.label}</p>
                      {selectedOption.subLabel && <p className={cn("text-xs font-medium truncate", selectedOption.subLabelClassName || 'text-muted-foreground')}>{selectedOption.subLabel}</p>}
                    </>
                  ) : (
                    <p className="font-medium">{placeholder}</p> // Fallback
                  )}
                </div>
            </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} />
           <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    const selected = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase());
                    if (selected) {
                        onSelect(selected.value)
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p>{option.label}</p>
                    {option.subLabel && <p className={cn("text-xs", option.subLabelClassName || 'text-muted-foreground')}>{option.subLabel}</p>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
});
Combobox.displayName = "Combobox";

    
