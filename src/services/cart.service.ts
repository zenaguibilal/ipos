'use client';

import { db } from '@/lib/database';
import type { Cart, CartItem, Product, Customer } from '@/lib/types';
import { CART_ID } from '@/hooks/useCart';

export class CartService {
    
    async initCart(): Promise<void> {
        const existingCart = await db.carts.get(CART_ID);
        if (!existingCart) {
            await db.carts.put({
                id: CART_ID,
                name: 'Panier Principal',
                items: [],
                customerUuid: null,
                customerName: '',
                discount: { type: 'fixed', value: 0 },
            });
        }
    }

    async addProductToCart(cartId: string, product: Product, quantity: number): Promise<void> {
        await db.transaction('rw', db.carts, db.products, async () => {
            const cart = await db.carts.get(cartId);
            if (!cart) return;

            const existingItem = cart.items.find(item => item.id === product.id);

            if (existingItem) {
                const newQuantity = existingItem.cartQuantity + quantity;
                await this.updateCartItemQuantity(cartId, existingItem.id, newQuantity);
            } else {
                const newCartItem: CartItem = { ...product, cartQuantity: quantity, flash: true };
                await db.carts.update(cartId, { items: [...cart.items, newCartItem] });
            }
        });
        setTimeout(() => this.removeFlashFromCartItems(cartId), 500);
    }
    
    async updateCartItemQuantity(cartId: string, itemId: string | number, newQuantity: number): Promise<{ capped: boolean, maxQuantity?: number }> {
        return db.transaction('rw', db.carts, db.products, async () => {
            const cart = await db.carts.get(cartId);
            if (!cart) return { capped: false };

            const itemToUpdate = cart.items.find(item => item.id === itemId);
            if (!itemToUpdate) return { capped: false };
            
            let finalQuantity = newQuantity;
            let result: { capped: boolean, maxQuantity?: number } = { capped: false };
            
            if (typeof itemId === 'number') {
                const product = await db.products.get(itemId);
                if (product && newQuantity > product.quantity) {
                    finalQuantity = product.quantity;
                    result = { capped: true, maxQuantity: product.quantity };
                }
            }

            const updatedItems = cart.items.map(item =>
                item.id === itemId ? { ...item, cartQuantity: Math.max(0, finalQuantity) } : item
            ).filter(item => item.cartQuantity > 0);

            await db.carts.update(cartId, { items: updatedItems });
            return result;
        });
    }

    async removeCartItem(cartId: string, itemId: string | number): Promise<void> {
        await db.carts.where('id').equals(cartId).modify(cart => {
            cart.items = cart.items.filter(item => item.id !== itemId);
        });
    }

    async clearCart(cartId: string): Promise<void> {
        await db.carts.update(cartId, { items: [], discount: { type: 'fixed', value: 0 } });
    }

    async setCartCustomer(cartId: string, customer: Customer | null): Promise<void> {
        await db.carts.update(cartId, {
            customerUuid: customer?.uuid ?? null,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage'
        });
    }
    
    async removeFlashFromCartItems(cartId: string): Promise<void> {
        await db.carts.where('id').equals(cartId).modify(cart => {
            cart.items.forEach(item => { if(item.flash) delete item.flash; });
        });
    }
    
    async setCartDiscount(cartId: string, discount: { type: 'fixed' | 'percentage', value: number }): Promise<void> {
        await db.carts.update(cartId, { "discount.type": discount.type, "discount.value": discount.value });
    }
}
