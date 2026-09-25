import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';

/**
 * Calculate ABC classification for inventory items
 * A = High-value, high-priority (top 20% by value)
 * B = Medium-value, medium-priority (middle 30% by value)
 * C = Low-value, low-priority (bottom 50% by value)
 */
export async function calculateABCClassification() {
  const items = await StockItem.find({ active: true });

  if (items.length === 0) return [];

  const itemsWithValue = items.map((item) => ({
    _id: item._id,
    name: item.name,
    value: item.stockValue // quantity × unitPrice
  }));

  itemsWithValue.sort((a, b) => b.value - a.value);

  const totalValue = itemsWithValue.reduce((sum, item) => sum + item.value, 0);
  let cumulativeValue = 0;
  const classified = [];

  for (const item of itemsWithValue) {
    cumulativeValue += item.value;
    const percentageOfTotal = (cumulativeValue / totalValue) * 100;

    let classification = 'C';
    if (percentageOfTotal <= 20) {
      classification = 'A';
    } else if (percentageOfTotal <= 50) {
      classification = 'B';
    }

    classified.push({
      ...item,
      classification,
      percentageOfTotal: percentageOfTotal.toFixed(2)
    });

    await StockItem.findByIdAndUpdate(item._id, { abcClassification: classification });
  }

  return classified;
}

/**
 * Get ABC classification report with statistics
 */
export async function getABCReport() {
  await calculateABCClassification();

  const items = await StockItem.find({ active: true }).select(
    'code name category quantity minLevel unitPrice abcClassification expiryDate location'
  );

  const classified = {
    A: { items: [], count: 0, totalValue: 0, percentage: 0 },
    B: { items: [], count: 0, totalValue: 0, percentage: 0 },
    C: { items: [], count: 0, totalValue: 0, percentage: 0 }
  };

  for (const item of items) {
    const itemValue = item.quantity * item.unitPrice;
    const cls = item.abcClassification;

    classified[cls].items.push({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minLevel: item.minLevel,
      value: itemValue,
      location: item.location,
      expiryDate: item.expiryDate
    });
    classified[cls].count += 1;
    classified[cls].totalValue += itemValue;
  }

  const grandTotal = classified.A.totalValue + classified.B.totalValue + classified.C.totalValue;

  return {
    summary: {
      totalItems: items.length,
      totalValue: grandTotal.toFixed(2),
      lastCalculated: new Date()
    },
    classifications: {
      A: {
        label: 'High-Value Items',
        description: 'First 20% of cumulative inventory value - Critical inventory control',
        count: classified.A.count,
        percentage: grandTotal > 0 ? ((classified.A.totalValue / grandTotal) * 100).toFixed(2) : 0,
        totalValue: classified.A.totalValue.toFixed(2),
        items: classified.A.items
      },
      B: {
        label: 'Medium-Value Items',
        description: '20% to 50% of cumulative inventory value - Regular monitoring',
        count: classified.B.count,
        percentage: grandTotal > 0 ? ((classified.B.totalValue / grandTotal) * 100).toFixed(2) : 0,
        totalValue: classified.B.totalValue.toFixed(2),
        items: classified.B.items
      },
      C: {
        label: 'Low-Value Items',
        description: 'Remaining cumulative inventory value - Standard controls',
        count: classified.C.count,
        percentage: grandTotal > 0 ? ((classified.C.totalValue / grandTotal) * 100).toFixed(2) : 0,
        totalValue: classified.C.totalValue.toFixed(2),
        items: classified.C.items
      }
    }
  };
}

/**
 * Get fast-moving items (high usage rate)
 */
export async function getFastMovingItems(limit = 10) {
  const movements = await StockTransaction.aggregate([
    { $match: { type: 'out' } },
    {
      $group: {
        _id: '$itemId',
        totalQuantity: { $sum: '$quantity' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'stockitems',
        localField: '_id',
        foreignField: '_id',
        as: 'itemDetails'
      }
    }
  ]);

  return movements.map((m) => ({
    itemId: m._id,
    itemName: m.itemDetails[0]?.name || 'Unknown',
    category: m.itemDetails[0]?.category,
    totalIssued: m.totalQuantity,
    transactionCount: m.transactionCount,
    averagePerTransaction: (m.totalQuantity / m.transactionCount).toFixed(2)
  }));
}

/**
 * Get slow-moving items (low usage rate)
 */
export async function getSlowMovingItems(limit = 10) {
  const allItems = await StockItem.find({ active: true }).select('_id name category quantity');

  const movements = await StockTransaction.aggregate([
    { $match: { type: 'out' } },
    {
      $group: {
        _id: '$itemId',
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  const movedItemIds = new Set(movements.map((m) => m._id.toString()));

  const slowItems = allItems.filter((item) => !movedItemIds.has(item._id.toString())).slice(0, limit / 2);

  const minimalMovements = movements.sort((a, b) => a.totalQuantity - b.totalQuantity).slice(0, limit / 2);

  const slowMovementDetails = minimalMovements.map((m) => {
    const item = allItems.find((i) => i._id.toString() === m._id.toString());
    return {
      itemId: m._id,
      itemName: item?.name || 'Unknown',
      category: item?.category,
      totalIssued: m.totalQuantity,
      currentQuantity: item?.quantity || 0
    };
  });

  const neverMovedDetails = slowItems.map((item) => ({
    itemId: item._id,
    itemName: item.name,
    category: item.category,
    totalIssued: 0,
    currentQuantity: item.quantity,
    status: 'Never Issued'
  }));

  return [...neverMovedDetails, ...slowMovementDetails].slice(0, limit);
}
