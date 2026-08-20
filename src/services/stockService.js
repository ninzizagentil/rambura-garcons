import { SEED_ITEMS, SEED_TRANSACTIONS, STOCK_CATEGORIES } from '../data/stock';
import { loadCollection, saveCollection, genId } from '../utils/storage';

const ITEMS_KEY = 'rg_stock_items';
const TRANSACTIONS_KEY = 'rg_stock_transactions';

export function isLowStock(item) {
  return item.quantity <= item.minLevel;
}

function withStatus(item) {
  return { ...item, status: isLowStock(item) ? 'low-stock' : 'normal' };
}

export function getItems() {
  return loadCollection(ITEMS_KEY, SEED_ITEMS).map(withStatus);
}

export function getItemById(id) {
  return getItems().find((i) => i.id === id) || null;
}

export function createItem({ name, category, unit, quantity, minLevel, description }) {
  if (!STOCK_CATEGORIES.includes(category)) {
    return { success: false, error: 'Category must be Foods or Electronic Devices.' };
  }
  const items = loadCollection(ITEMS_KEY, SEED_ITEMS);
  const duplicate = items.some((i) => i.name.toLowerCase() === name.toLowerCase() && i.category === category);
  if (duplicate) return { success: false, error: 'An item with this name already exists in this category.' };

  const newItem = {
    id: genId('i'),
    name,
    category,
    unit,
    quantity: Number(quantity),
    minLevel: Number(minLevel),
    description: description || '',
  };
  saveCollection(ITEMS_KEY, [newItem, ...items]);
  return { success: true, item: withStatus(newItem) };
}

export function updateItem(id, updates) {
  const items = loadCollection(ITEMS_KEY, SEED_ITEMS);
  if (updates.category && !STOCK_CATEGORIES.includes(updates.category)) {
    return { success: false, error: 'Category must be Foods or Electronic Devices.' };
  }
  const next = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
  saveCollection(ITEMS_KEY, next);
  return { success: true };
}

export function getTransactions() {
  return loadCollection(TRANSACTIONS_KEY, SEED_TRANSACTIONS);
}

export function getTransactionsForItem(itemId) {
  return getTransactions().filter((t) => t.itemId === itemId);
}

export function stockIn({ itemId, quantity, date, party, responsibleUser, notes }) {
  const items = loadCollection(ITEMS_KEY, SEED_ITEMS);
  const item = items.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'Item not found.' };
  const qty = Number(quantity);
  if (!qty || qty <= 0) return { success: false, error: 'Enter a valid quantity.' };

  const updatedItems = items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + qty } : i));
  saveCollection(ITEMS_KEY, updatedItems);

  const transactions = loadCollection(TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  const tx = {
    id: genId('t'),
    itemId,
    itemName: item.name,
    category: item.category,
    type: 'in',
    quantity: qty,
    date,
    party,
    responsibleUser,
    notes: notes || '',
  };
  saveCollection(TRANSACTIONS_KEY, [tx, ...transactions]);

  return { success: true, transaction: tx, newQuantity: item.quantity + qty };
}

export function stockOut({ itemId, quantity, date, party, responsibleUser, notes }) {
  const items = loadCollection(ITEMS_KEY, SEED_ITEMS);
  const item = items.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'Item not found.' };
  const qty = Number(quantity);
  if (!qty || qty <= 0) return { success: false, error: 'Enter a valid quantity.' };
  if (qty > item.quantity) {
    return { success: false, error: `Insufficient Stock — only ${item.quantity} ${item.unit} of "${item.name}" available.` };
  }

  const updatedItems = items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - qty } : i));
  saveCollection(ITEMS_KEY, updatedItems);

  const transactions = loadCollection(TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  const tx = {
    id: genId('t'),
    itemId,
    itemName: item.name,
    category: item.category,
    type: 'out',
    quantity: qty,
    date,
    party,
    responsibleUser,
    notes: notes || '',
  };
  saveCollection(TRANSACTIONS_KEY, [tx, ...transactions]);

  return { success: true, transaction: tx, newQuantity: item.quantity - qty };
}

export function getLowStockItems() {
  return getItems().filter(isLowStock);
}

/** Usage = total quantity stocked OUT per item, used for most/least-used analytics. */
export function getUsageByItem() {
  const transactions = getTransactions();
  const items = getItems();
  return items
    .map((item) => {
      const used = transactions
        .filter((t) => t.itemId === item.id && t.type === 'out')
        .reduce((sum, t) => sum + t.quantity, 0);
      return { ...item, used };
    })
    .sort((a, b) => b.used - a.used);
}
