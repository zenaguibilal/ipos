'use client';

import React, { useRef, useEffect } from 'react';
import type { Product } from '@/lib/types';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
  product: Product;
}

export function BarcodeLabel({ product }: BarcodeLabelProps) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && product.barcodes && product.barcodes.length > 0) {
      try {
        JsBarcode(barcodeRef.current, product.barcodes[0], {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch (e) {
        
      }
    }
  }, [product.barcodes]);

  return (
    <div className="barcode-label p-2 border border-dashed border-black break-inside-avoid text-black bg-white">
      <p className="text-center font-bold text-sm truncate">{product.name}</p>
      <p className="text-center text-xs mb-1">Prix: <span className="font-bold">{product.price.toFixed(1)} DA</span></p>
      {product.barcodes && product.barcodes.length > 0 ? (
        <svg ref={barcodeRef} className="mx-auto max-w-full"></svg>
      ) : (
        <p className="text-center text-xs text-red-500 h-[40px] flex items-center justify-center">Pas de code-barres</p>
      )}
    </div>
  );
}
