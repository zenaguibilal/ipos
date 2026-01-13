
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScanLine } from 'lucide-react';

interface ScannerInputProps {
    onScan: (value: string) => void;
}

export function ScannerInput({ onScan }: ScannerInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onScan(inputValue.trim());
            setInputValue(''); // Clear input after scan/enter
        }
    };

    return (
        <form onSubmit={handleFormSubmit}>
            <Label htmlFor="scanner-input">Scanner un code-barres ou rechercher un produit</Label>
            <div className="relative mt-1">
                <ScanLine className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="scanner-input"
                    placeholder="Entrez un code-barres ou un nom et appuyez sur Entrée..."
                    className="pl-10 text-base h-12"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </div>
        </form>
    );
}
