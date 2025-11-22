'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { AddCustomProductForm } from '@/components/sell/add-custom-product-form';
import { MinusCircle, PlusCircle, User, XCircle, X, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import Link from 'next/link';
import type { Product, Customer, Sale, Payment, TopProduct } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox } from '@/components/ui/combobox';

interface CartItem extends Product {
    cartQuantity: number;
    isCustom?: boolean;
}

interface Cart {
    customerId: string;
    customerName: string;
...
```