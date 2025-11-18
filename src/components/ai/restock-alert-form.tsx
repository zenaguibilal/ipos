'use client';
import { useState } from 'react';
import { BrainCircuit, Loader } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProducts } from '@/lib/data';
import {
  generateRestockAlerts,
  type GenerateRestockAlertsOutput,
} from '@/ai/flows/generate-restock-alerts';
import type { Product } from '@/lib/types';

export function RestockAlertForm() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [result, setResult] = useState<GenerateRestockAlertsOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useState(() => {
    if (products && products.length > 0) {
      setSelectedProduct(products[1]);
    }
  });

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      productName: formData.get('productName') as string,
      currentStockLevel: Number(formData.get('currentStockLevel')),
      salesVelocity: Number(formData.get('salesVelocity')),
      reorderThreshold: Number(formData.get('reorderThreshold')),
      leadTimeDays: Number(formData.get('leadTimeDays')),
    };

    try {
      const response = await generateRestockAlerts(input);
      setResult(response);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'alerte de réapprovisionnement:', error);
      // Gérer l'affichage de l'erreur à l'utilisateur
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingProducts) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    Alertes de Réapprovisionnement IA
                </CardTitle>
                 <CardDescription>
                    Chargement des données produits...
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Loader className="animate-spin" />
            </CardContent>
        </Card>
    )
  }
  
  if (!selectedProduct) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    Alertes de Réapprovisionnement IA
                </CardTitle>
                 <CardDescription>
                    Aucun produit trouvé à analyser.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Alertes de Réapprovisionnement IA
        </CardTitle>
        <CardDescription>
          Prédisez quand vous devez réapprovisionner les produits en fonction de la vélocité des ventes et des délais.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-5">
            <Label htmlFor="product-select">Sélectionnez un produit à analyser</Label>
            <Select
              onValueChange={handleProductChange}
              defaultValue={selectedProduct.id}
            >
              <SelectTrigger id="product-select">
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="hidden"
            name="productName"
            value={selectedProduct.name}
          />
          <div className="space-y-2">
            <Label htmlFor="currentStockLevel">Stock Actuel</Label>
            <Input
              id="currentStockLevel"
              name="currentStockLevel"
              type="number"
              defaultValue={selectedProduct.quantity}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesVelocity">Vélocité des ventes (unités/jour)</Label>
            <Input
              id="salesVelocity"
              name="salesVelocity"
              type="number"
              step="0.1"
              defaultValue={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderThreshold">Seuil de Réapprovisionnement</Label>
            <Input
              id="reorderThreshold"
              name="reorderThreshold"
              type="number"
              defaultValue={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadTimeDays">Délai de Réapprovisionnement (jours)</Label>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              type="number"
              defaultValue={14}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex-col items-start gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              'Générer l\'Alerte'
            )}
          </Button>
          {result && (
            <Alert variant={result.shouldRestock ? 'destructive' : 'default'}>
              <AlertTitle>
                {result.shouldRestock
                  ? `Réapprovisionnement Recommandé pour ${selectedProduct.name}`
                  : `Niveaux de Stock OK pour ${selectedProduct.name}`}
              </AlertTitle>
              <AlertDescription>{result.alertMessage}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
