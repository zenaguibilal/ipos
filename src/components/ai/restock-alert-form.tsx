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
import { products } from '@/lib/data';
import {
  generateRestockAlerts,
  type GenerateRestockAlertsOutput,
} from '@/ai/flows/generate-restock-alerts';

export function RestockAlertForm() {
  const [selectedProduct, setSelectedProduct] = useState(products[1]);
  const [result, setResult] = useState<GenerateRestockAlertsOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

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
      console.error('Error generating restock alert:', error);
      // Handle error display to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          AI-Powered Restock Alerts
        </CardTitle>
        <CardDescription>
          Predict when you need to reorder products based on sales velocity and
          lead times.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-5">
            <Label htmlFor="product-select">Select a product to analyze</Label>
            <Select
              onValueChange={handleProductChange}
              defaultValue={selectedProduct.id}
            >
              <SelectTrigger id="product-select">
                <SelectValue placeholder="Select Product" />
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
            <Label htmlFor="currentStockLevel">Current Stock</Label>
            <Input
              id="currentStockLevel"
              name="currentStockLevel"
              type="number"
              defaultValue={selectedProduct.stock}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesVelocity">Sales Velocity (units/day)</Label>
            <Input
              id="salesVelocity"
              name="salesVelocity"
              type="number"
              step="0.1"
              defaultValue={selectedProduct.salesVelocity}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
            <Input
              id="reorderThreshold"
              name="reorderThreshold"
              type="number"
              defaultValue={selectedProduct.reorderThreshold}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadTimeDays">Restock Lead Time (days)</Label>
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
                Analyzing...
              </>
            ) : (
              'Generate Alert'
            )}
          </Button>
          {result && (
            <Alert variant={result.shouldRestock ? 'destructive' : 'default'}>
              <AlertTitle>
                {result.shouldRestock
                  ? `Restock Recommended for ${selectedProduct.name}`
                  : `Stock Levels OK for ${selectedProduct.name}`}
              </AlertTitle>
              <AlertDescription>{result.alertMessage}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
