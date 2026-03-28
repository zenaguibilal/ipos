'use client';

import React from 'react';
import type { SavedZakatCalculation } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { History, ArrowRight, Scale, Coins } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ZakatHistoryTableProps {
  history: SavedZakatCalculation[];
  onViewDetails: (h: SavedZakatCalculation) => void;
}

export function ZakatHistoryTable({ history, onViewDetails }: ZakatHistoryTableProps) {
  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground py-6 px-10">Instantané Temporel</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Assiette Nette</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Réf. Or Lot</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-10">Zakat Due (2.5%)</TableHead>
            <TableHead className="w-[100px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h) => (
            <TableRow 
              key={h.uuid} 
              className="hover:bg-emerald-500/5 transition-all border-white/5 cursor-pointer group h-20"
              onClick={() => onViewDetails(h)}
            >
              <TableCell className="px-10">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <History className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-sm uppercase">{format(new Date(h.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                        <span className="text-[9px] font-mono text-muted-foreground opacity-40">{format(new Date(h.createdAt), 'HH:mm')}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                    <span className="font-bold text-sm">{formatCurrency(h.zakatBase)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                    <Coins className="h-3 w-3 opacity-40" />
                    {formatCurrency(h.details?.goldPrice || 0)}/g
                </div>
              </TableCell>
              <TableCell className="text-right pr-10">
                <span className="text-xl font-black text-emerald-500 tracking-tighter">
                    {formatCurrency(h.zakatAmount)}
                </span>
              </TableCell>
              <TableCell className="text-right px-8">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all group-hover:translate-x-1">
                    <ArrowRight className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
