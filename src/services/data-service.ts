import { db } from '@/lib/database';
import type { Table } from 'dexie';
import type { SaleItem, SalePayment } from '@/lib/types';

// Définir un type pour les noms de table valides
type TableName = 'products' | 'customers' | 'sales' | 'payments' | 'stockIntakes' | 'returns' | 'breadCustomers' | 'dailyBreadOrders';

class DataService {

  /**
   * Sauvegarde un nouvel enregistrement dans une table.
   * Les champs `createdAt` et `updatedAt` sont gérés par un hook Dexie.
   * @param table Le nom de la table.
   * @param data L'objet de données à sauvegarder. Ne doit pas contenir d'ID.
   * @returns La clé primaire du nouvel enregistrement.
   */
  async save<T>(table: TableName, data: Omit<T, 'id'>): Promise<number> {
    return await db.table(table).add(data);
  }

  /**
   * Récupère tous les enregistrements d'une table.
   * @param table Le nom de la table.
   * @returns Un tableau de tous les enregistrements.
   */
  async getAll<T>(table: TableName): Promise<T[]> {
    return await db.table(table).toArray();
  }

  /**
   * Récupère un enregistrement par son ID.
   * @param table Le nom de la table.
   * @param id L'ID de l'enregistrement.
   * @returns L'enregistrement ou `undefined` s'il n'est pas trouvé.
   */
  async getById<T>(table: TableName, id: number): Promise<T | undefined> {
    return await db.table(table).get(id);
  }

  /**
   * Met à jour un enregistrement existant.
   * Le champ `updatedAt` est géré par un hook Dexie.
   * @param table Le nom de la table.
   * @param id L'ID de l'enregistrement à mettre à jour.
   * @param newData Un objet contenant les champs à mettre à jour.
   * @returns Le nombre d'enregistrements mis à jour (0 ou 1).
   */
  async update<T>(table: TableName, id: number, newData: Partial<T>): Promise<number> {
    return await db.table(table).update(id, newData);
  }

  /**
   * Supprime un enregistrement par son ID.
   * @param table Le nom de la table.
   * @param id L'ID de l'enregistrement à supprimer.
   */
  async remove(table: TableName, id: number): Promise<void> {
    await db.table(table).delete(id);
  }

  /**
   * Exécute une transaction de vente, mettant à jour le stock et créant un enregistrement de vente.
   */
  async finalizeSale(saleData: {
    items: SaleItem[];
    subtotal: number;
    discountType?: 'fixed' | 'percentage';
    discountAmount?: number;
    total: number;
    amountPaid: number;
    payments: SalePayment[];
    customerId?: number;
    customerName?: string;
  }): Promise<void> {
    await db.transaction('rw', db.products, db.sales, async () => {
      // 1. Mettre à jour le stock des produits
      for (const item of saleData.items) {
        if (!String(item.id).startsWith('custom-')) { // Ne pas traiter les produits personnalisés
          const productId = Number(item.id);
          const product = await db.products.get(productId);
          if (product) {
            if (product.quantity < item.quantity) {
              throw new Error(`Stock insuffisant pour ${product.name}.`);
            }
            await db.products.update(productId, {
              quantity: product.quantity - item.quantity,
            });
          }
        }
      }

      // 2. Créer l'enregistrement de vente
      const newSale = {
        ...saleData,
        invoiceNumber: `INV-${Date.now()}`,
        remainingBalance: saleData.total - saleData.amountPaid,
        paymentStatus: saleData.total - saleData.amountPaid <= 0.01 ? 'paid' as const : saleData.amountPaid > 0 ? 'partial' as const : 'unpaid' as const,
      };

      await db.sales.add(newSale);
    });
  }

  /**
   * Vide toutes les tables de la base de données.
   */
  async resetDatabase(): Promise<void> {
    await Promise.all(db.tables.map(table => table.clear()));
    // Réinitialiser le profil de l'entreprise si nécessaire
    await db.companyProfile.add({ id: 1, companyName: "Mon Magasin", country: "France" });
  }

  /**
   * Exporte toutes les données de la base de données en chaîne JSON.
   */
  async exportData(): Promise<string> {
    const data: { [key: string]: any[] } = {};
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importe des données depuis une chaîne JSON, écrasant toutes les données existantes.
   */
  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    await db.transaction('rw', db.tables, async () => {
      // Vider toutes les tables avant l'importation
      await Promise.all(db.tables.map(table => table.clear()));
      
      // Importer les données table par table
      for (const table of db.tables) {
        if (data[table.name]) {
          // Convertir les chaînes de date ISO en objets Date
          const itemsWithDates = data[table.name].map((item: any) => {
            const newItem = { ...item };
            if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
            if (newItem.updatedAt) newItem.updatedAt = new Date(newItem.updatedAt);
            if (newItem.invoiceDate) newItem.invoiceDate = new Date(newItem.invoiceDate);
            return newItem;
          });
          await table.bulkAdd(itemsWithDates);
        }
      }
    });
  }
}

// Exporter une instance singleton du service
export const dataService = new DataService();
