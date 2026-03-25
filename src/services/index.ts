import { BackupService } from './backup.service';
import { BreadService } from './bread.service';
import { CartService } from './cart.service';
import { CostingService } from './costing.service';
import { CustomerService } from './customer.service';
import { DraftService } from './draft.service';
import { ExpenseService } from './expense.service';
import { PaymentService } from './payment.service';
import { ProductService } from './product.service';
import { ProfileService } from './profile.service';
import { ReturnService } from './return.service';
import { SalesService } from './sales.service';
import { StockService } from './stock.service';
import { ZakatService } from './zakat.service';
import { inventoryService as singletonInventoryService } from './inventory.service';
import { syncService as singletonSyncService } from './sync.service';

export const backupService = new BackupService();
export const breadService = new BreadService();
export const cartService = new CartService();
export const costingService = new CostingService();
export const customerService = new CustomerService();
export const draftService = new DraftService();
export const expenseService = new ExpenseService();
export const paymentService = new PaymentService();
export const productService = new ProductService();
export const profileService = new ProfileService();
export const returnService = new ReturnService();
export const salesService = new SalesService();
export const stockService = new StockService();
export const zakatService = new ZakatService();
export const inventoryService = singletonInventoryService;
export const syncService = singletonSyncService;

// Start the sync engine when the app loads
syncService.startSync();
