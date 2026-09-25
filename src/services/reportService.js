import { api } from './api';

export async function getCirculationSummary() { const result = await api.get('/reports/library/summary'); return result.data; }
export async function getOverdueSummary() { const result = await api.get('/reports/library/overdue'); return result.data; }
export async function getMostBorrowedBooks(limit = 5) { const result = await api.get('/reports/library/summary'); return (result.data.mostBorrowedBooks || []).slice(0, limit); }
export async function getStockBalanceSummary() { const result = await api.get('/stock/dashboard'); return result.data; }
export async function getStockUsageSummary(limit = 5, days = 150) { const result = await api.get('/reports/stock/analytics', { days }); return { mostUsed: (result.data.mostUsedItems || []).slice(0, limit), leastUsed: (result.data.leastUsedItems || []).slice(0, limit), ...result.data }; }
export async function getEquipmentSummary() { const result = await api.get('/reports/equipment/summary'); return result.data; }

export async function exportReport(reportName, format = 'csv') {
  const path = reportName.toLowerCase().includes('library') ? '/reports/library/circulation' : '/reports/stock/inventory';
  const blob = await api.download(path, { format });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`; link.click(); URL.revokeObjectURL(url);
  return { success: true, reportName };
}
