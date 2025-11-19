'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/40">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <h1 className="text-lg font-semibold md:text-xl">Point de Vente</h1>
            <Button asChild variant="outline" className="ml-auto">
                <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
        </header>
        <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-4 md:col-span-1 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Produits</CardTitle>
                        <CardDescription>Sélectionnez les produits à ajouter à la vente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed border-border">
                            <div className="text-center">
                                <p className="text-muted-foreground">Aucun produit à afficher.</p>
                                <Button variant="link">Ajouter un produit</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-4 md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Vente en cours</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="flex h-64 flex-col items-center justify-center text-center">
                           <p className="text-muted-foreground">Le panier est vide.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                         <div className="flex w-full justify-between font-semibold">
                            <span>Total</span>
                            <span>0.00 €</span>
                        </div>
                        <Button className="w-full" disabled>Paiement</Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    </div>
  );
}
