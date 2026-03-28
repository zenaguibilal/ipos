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
import { History, ArrowRight, Scale, Coins, CheckCircle2, Printer } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '../ui/badge';

interface ZakatHistoryTableProps {
  history: SavedZakatCalculation[];
  onViewDetails: (h: SavedZakatCalculation) => void;
  onPrint: (h: SavedZakatCalculation) => void;
}

export function ZakatHistoryTable({ history, onViewDetails, onPrint }: ZakatHistoryTableProps) {
  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground py-6 px-10">Instantané Temporel</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Assiette Nette</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Réf. Or Marché</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-10">Zakat Due (2.5%)</TableHead>
            <TableHead className="w-[140px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
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
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner">
                        <History className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight">{format(new Date(h.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                        <span className="text-[9px] font-mono text-muted-foreground opacity-40 uppercase tracking-widest">Audit à {format(new Date(h.createdAt), 'HH:mm')}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                    <span className="font-bold text-sm tracking-tighter">{formatCurrency(h.zakatBase)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500/60 bg-emerald-500/5 px-2.5 h-6">
                    <Coins className="h-3 w-3 mr-1.5 opacity-40" />
                    {formatCurrency(h.details?.goldPrice || 0)}/g
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-10">
                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-emerald-500 tracking-tighter">
                        {formatCurrency(h.zakatAmount)}
                    </span>
                    <span className="text-[8px] font-black uppercase text-emerald-500/40 tracking-[0.2em] flex items-center gap-1">
                        <CheckCircle2 className="h-2 w-2" /> Certifié iPOS
                    </span>
                </div>
              </TableCell>
              <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-500/10 text-emerald-500" onClick={() => onPrint(h)}>
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-emerald-500/10" onClick={() => onViewDetails(h)}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
