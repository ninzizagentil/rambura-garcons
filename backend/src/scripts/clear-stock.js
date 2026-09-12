import { connectDatabase } from '../config/database.js';
import StockItem from '../models/StockItem.js';
import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';

await connectDatabase();

const results = await Promise.all([
  StockItem.deleteMany({}),
  Supplier.deleteMany({}),
  StockTransaction.deleteMany({}),
  DamagedStock.deleteMany({}),
  DisposedStock.deleteMany({}),
]);

const [items, suppliers, transactions, damaged, disposed] = results;
console.log(`Cleared stock data: ${items.deletedCount} items, ${suppliers.deletedCount} suppliers, ${transactions.deletedCount} transactions, ${damaged.deletedCount} damaged records, ${disposed.deletedCount} disposed records.`);
process.exit(0);
