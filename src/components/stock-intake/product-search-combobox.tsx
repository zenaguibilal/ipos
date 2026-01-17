
'use client';

import * as React from "react"
import { Check, ChevronsUpDown, Package } from "lucide-react"
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
import type { Product } from "@/lib/types";

interface ProductSearchComboboxProps {
    products: Product[];
    onProductSelect: (productId: string) => void;
    disabled?: boolean;
}

export function ProductSearchCombobox({ products, onProductSelect, disabled }: ProductSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
          disabled={disabled}
        >
          <span className="text-muted-foreground line-clamp-1 text-left font-normal">Rechercher un produit...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un produit par nom..." />
          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onProductSelect(product.id)
                    setOpen(false)
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <div>
                    <p>{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                        Qté: {product.quantity} | Prix Achat: {product.purchasePrice.toFixed(2)} DA
                    </p>
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
