'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Calendar, FileText } from 'lucide-react';
import type { DB } from "@/lib/types";

interface BackupStatsProps {
  backupData: Partial<DB>;
  onNext: () => void;
}

const tableColors: { [key: string]: string } = {
    products:       'text-primary',
    customers:      'text-blue-400',
    suppliers:      'text-purple-400',
    sales:          'text-green-400',
    stockIntakes:   'text-yellow-400',
    expenses:       'text-red-400',
    clients_pain:   'text-pink-400',
    commandes_pain: 'text-fuchsia-400',
    settings:       'text-gray-400',
};

export function BackupStats({ backupData, onNext }: BackupStatsProps) {
  const tables = Object.entries(backupData);
  const totalRecords = tables.reduce((acc, [, records]) =>
    acc + (Array.isArray(records) ? records.length : (records ? 1 : 0)), 0
  );

  const getBackupDate = () => {
      const profile = backupData.companyProfile;
      if (profile && profile.lastSyncDate) return profile.lastSyncDate;
      const sales = backupData.sales;
      if (sales && sales.length > 0) return sales[0].createdAt?.toString();
      return 'Date Inconnue';
  }
  const backupDate = getBackupDate();

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <Box className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{tables.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Enregistrements</CardTitle>
          </CardHeader>
          <CardContent>
            <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Date de la sauvegarde</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-xl font-bold">{new Date(backupDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric'})}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail par table</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tables.map(([name, records]) => {
            const count = Array.isArray(records) ? records.length : (records ? 1 : 0);
            const color = tableColors[name] || 'text-gray-400';
            const percent = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
            if (count === 0) return null;

            return (
              <div key={name} className="flex items-center gap-4 text-sm">
                <div className={`w-28 flex-shrink-0 font-semibold ${color}`}>
                  {name}
                </div>
                <div className="flex-grow bg-muted rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="w-24 text-right text-muted-foreground font-mono">
                  {count.toLocaleString()}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">
          Suivant — Sélectionner les tables <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
