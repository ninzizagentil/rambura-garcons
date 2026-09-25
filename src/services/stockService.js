import { api } from './api';
import { hasPermission } from './authService';
import { STOCK_CATEGORIES, EXPIRY_WARNING_DAYS } from '../data/stock';
import { useEffect, useState } from 'react';

let items = [];
let transactions = [];
let damaged = [];
let removed = [];
let suppliers = [];
let loading;
let stockVersion = 0;
let lastLoadedAt = 0;
const CACHE_TTL_MS = 30_000;

function normalizeItem(item) {
  const expiry = getExpiryStatus(item.expiryDate);
  return {
    ...item,
    id: item.id || item._id,
    value: item.value ?? item.stockValue ?? item.quantity * (item.unitPrice || 0),
    expiryStatus: expiry?.status ?? null,
    expiryDaysRemaining: expiry?.daysRemaining ?? null,
  };
}
function normalizeList(result) { return Array.isArray(result?.data) ? result.data : result?.data?.items || []; }
function normalizeTransaction(transaction) {
  const item = transaction.itemId && typeof transaction.itemId === 'object' ? transaction.itemId : null;
  const responsibleUser = transaction.responsibleUser && typeof transaction.responsibleUser === 'object' ? transaction.responsibleUser : null;
  return {
    ...transaction,
    itemId: item?._id || transaction.itemId,
    itemName: transaction.itemName || item?.name || 'Unknown item',
    category: transaction.category || item?.category || 'Other School Materials',
    responsibleUser: responsibleUser?.fullName || responsibleUser?.name || responsibleUser?.email || (typeof transaction.responsibleUser === 'string' && transaction.responsibleUser.length !== 24 ? transaction.responsibleUser : null) || 'Unknown user',
  };
}

function canViewStock() {
  try {
    const user = JSON.parse(localStorage.getItem('rg_auth_session') || 'null');
    return hasPermission(user, 'stock.view');
  } catch {
    return false;
  }
}

export async function refreshStock({ force = false } = {}) {
  if (!canViewStock()) return { items, transactions, damaged, removed, suppliers };
  if (!force && lastLoadedAt && Date.now() - lastLoadedAt < CACHE_TTL_MS) return { items, transactions, damaged, removed, suppliers };
  if (loading) return loading;
  loading = Promise.all([
    api.get('/stock/items', { limit: 100 }),
    api.get('/stock/transactions', { limit: 100 }),
    api.get('/stock/damaged'),
    api.get('/stock/disposed'),
    api.get('/stock/suppliers', { limit: 100 }),
  ]).then(([itemResult, transactionResult, damagedResult, removedResult, supplierResult]) => {
    items = normalizeList(itemResult).map(normalizeItem);
    transactions = normalizeList(transactionResult).map(normalizeTransaction);
    damaged = normalizeList(damagedResult).map((record) => ({ ...record, id: record.id || record._id, itemName: record.itemId?.name || record.itemName, unit: record.itemId?.unit || record.unit, reportedBy: record.reportedBy?.fullName || record.reportedBy?.username || record.reportedBy?.email || record.reportedBy || 'Unknown user' }));
    removed = normalizeList(removedResult).map((record) => ({ ...record, id: record.id || record._id }));
    suppliers = normalizeList(supplierResult).map((supplier) => ({ ...supplier, id: supplier.id || supplier._id }));
    lastLoadedAt = Date.now();
    stockVersion += 1;
    window.dispatchEvent(new Event('rg:stock-updated'));
    return { items, transactions, damaged, removed, suppliers };
  }).finally(() => { loading = null; });
  return loading;
}
if (typeof window !== 'undefined') window.addEventListener('rg:authenticated', () => { refreshStock().catch(() => {}); });

export function getItems() { return items; }
export function useStockVersion() {
  const [version, setVersion] = useState(stockVersion);
  useEffect(() => {
    const bump = () => setVersion(stockVersion);
    window.addEventListener('rg:stock-updated', bump);
    return () => window.removeEventListener('rg:stock-updated', bump);
  }, []);
  return version;
}
export function getItemById(id) { return items.find((item) => item.id === id) || null; }
export function getTransactions() { return transactions; }
export function getTransactionsForItem(itemId) { return transactions.filter((tx) => tx.itemId === itemId || tx.itemId?._id === itemId); }
export function isLowStock(item) { return item.quantity <= item.minLevel; }
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const daysRemaining = Math.round((new Date(expiryDate) - new Date()) / 86400000);
  return { status: daysRemaining < 0 ? 'expired' : daysRemaining <= EXPIRY_WARNING_DAYS ? 'expiring-soon' : 'valid', daysRemaining };
}
export function getLowStockItems() { return items.filter((item) => item.quantity <= item.minLevel); }
export function getOutOfStockItems() { return items.filter((item) => item.quantity <= 0); }
export function getExpiredItems() { return items.filter((item) => getExpiryStatus(item.expiryDate)?.status === 'expired'); }
export function getExpiringSoonItems() { return items.filter((item) => getExpiryStatus(item.expiryDate)?.status === 'expiring-soon'); }
export function getTotalStockValue() { return items.reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0); }
export function getStockValueByCategory() { return STOCK_CATEGORIES.map((category) => ({ category, value: items.filter((item) => item.category === category).reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0), count: items.filter((item) => item.category === category).length })); }
export function getDamagedItems() { return damaged.filter((record) => record.status === 'reported'); }
export function getRemovedItems() { return removed; }
export function getUsageByItem() {
  const usageByItem = new Map();
  transactions.forEach((transaction) => {
    if (transaction.type !== 'out') return;
    const itemId = typeof transaction.itemId === 'object' ? transaction.itemId?._id : transaction.itemId;
    usageByItem.set(itemId, (usageByItem.get(itemId) || 0) + transaction.quantity);
  });
  return items.map((item) => ({ ...item, used: usageByItem.get(item.id) || 0 })).sort((a, b) => b.used - a.used);
}

async function mutate(method, path, data, key) {
  try {
    const result = await api[method](path, data);
    try { await refreshStock({ force: true }); } catch (refreshError) { console.error('[stock] refresh after mutation failed:', refreshError); }
    return { success: true, [key]: result.data, ...(result.data && typeof result.data === 'object' ? result.data : {}) };
  }
  catch (error) {
    const detail = error.errors?.length ? error.errors.map((e) => e.message).join(' ') : '';
    return { success: false, error: detail ? `${error.message}: ${detail}` : error.message };
  }
}
export function createItem(data) { if (!STOCK_CATEGORIES.includes(data.category)) return Promise.resolve({ success: false, error: 'Select a valid stock category.' }); return mutate('post', '/stock/items', data, 'item'); }
export function updateItem(id, data) { return mutate('put', `/stock/items/${id}`, data, 'item'); }
export function deleteItem(id) { return mutate('delete', `/stock/items/${id}`, {}, 'item'); }
export function stockIn(data) { return mutate('post', '/stock/transactions/in', data, 'transaction'); }
export function stockOut(data) { return mutate('post', '/stock/transactions/out', data, 'transaction'); }
export function stockAdjustment(data) { return mutate('post', '/stock/transactions/adjustment', data, 'transaction'); }
export function stockTransfer(data) { return mutate('post', '/stock/transactions/transfer', data, 'transaction'); }
export function reportDamage(data) { return mutate('post', '/stock/damaged', data, 'record'); }
export function disposeStock(data) { return mutate('post', '/stock/disposed', data, 'entry'); }
export function disposeDamagedItem(data) { return mutate('post', '/stock/disposed', data, 'entry'); }
export function getSuppliers() { return suppliers; }
export function getSupplierById(id) { return suppliers.find((supplier) => supplier.id === id) || null; }
export async function getSupplyHistoryForSupplier(id) { try { const result = await api.get(`/stock/suppliers/${id}/history`); return result.data; } catch { return []; } }
export function createSupplier(data) { return mutate('post', '/stock/suppliers', data, 'supplier'); }
export function updateSupplier(id, data) { return mutate('put', `/stock/suppliers/${id}`, data, 'supplier'); }
export function deleteSupplier(id) { return mutate('delete', `/stock/suppliers/${id}`, {}, 'supplier'); }

// ── Stock Archive Workflow ─────────────────────────────────────────────────────
export async function requestStockArchive(data) {
  const { api: apiClient } = await import('./api.js');
  return apiClient.post('/stock/archive-requests', data);
}
export async function getStockArchiveRequests(params = {}) {
  const { api: apiClient } = await import('./api.js');
  return apiClient.get('/stock/archive-requests/my', params);
}
