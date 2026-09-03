import StockReconciliation from '../models/StockReconciliation.js';
import StockItem from '../models/StockItem.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

/**
 * Create a new stock reconciliation checklist
 */
export async function createReconciliation(req, res) {
  const { title, location, scheduledDate } = req.body;

  if (!title || !location || !scheduledDate) {
    return fail(res, 'Title, location, and scheduled date are required', 422);
  }

  try {
    const reconciliation = await StockReconciliation.create({
      title,
      location,
      scheduledDate: new Date(scheduledDate),
      createdBy: req.user._id,
      status: 'planned',
      items: []
    });

    await recordAudit(req, {
      action: 'Reconciliation created',
      module: 'Stock',
      resourceType: 'StockReconciliation',
      resourceId: reconciliation._id,
      description: `Created reconciliation: ${title} for ${location}`
    });

    return ok(res, reconciliation, 'Reconciliation checklist created', 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

/**
 * Get all reconciliations with pagination
 */
export async function getReconciliations(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));

  const [data, total] = await Promise.all([
    StockReconciliation.find()
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    StockReconciliation.countDocuments()
  ]);

  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

/**
 * Get a specific reconciliation
 */
export async function getReconciliation(req, res) {
  const reconciliation = await StockReconciliation.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!reconciliation) return fail(res, 'Reconciliation not found', 404);

  return ok(res, reconciliation);
}

/**
 * Start/resume a reconciliation (change status to in-progress)
 */
export async function startReconciliation(req, res) {
  const reconciliation = await StockReconciliation.findById(req.params.id);
  if (!reconciliation) return fail(res, 'Reconciliation not found', 404);
  if (reconciliation.status !== 'planned') return fail(res, 'Only planned reconciliations can be started', 409);

  reconciliation.status = 'in-progress';
  reconciliation.startedAt = new Date();
  await reconciliation.save();

  await recordAudit(req, {
    action: 'Reconciliation started',
    module: 'Stock',
    resourceType: 'StockReconciliation',
    resourceId: reconciliation._id,
    description: `Started reconciliation: ${reconciliation.title}`
  });

  return ok(res, reconciliation, 'Reconciliation started');
}

/**
 * Complete a reconciliation with items and submit for approval
 */
export async function completeReconciliation(req, res) {
  const { items, totalItems, totalVariances } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return fail(res, 'At least one item must be recorded', 422);
  }

  const reconciliation = await StockReconciliation.findById(req.params.id);
  if (!reconciliation) return fail(res, 'Reconciliation not found', 404);
  if (reconciliation.status !== 'in-progress') return fail(res, 'Only in-progress reconciliations can be completed', 409);

  reconciliation.items = items;
  reconciliation.totalItems = totalItems;
  reconciliation.totalVariances = totalVariances;
  reconciliation.status = 'pending-approval';
  reconciliation.completedAt = new Date();
  await reconciliation.save();

  await recordAudit(req, {
    action: 'Reconciliation submitted for approval',
    module: 'Stock',
    resourceType: 'StockReconciliation',
    resourceId: reconciliation._id,
    description: `Submitted reconciliation: ${reconciliation.title} with ${totalVariances} variance(s)`
  });

  return ok(res, reconciliation, 'Reconciliation submitted for approval', 200);
}

/**
 * Approve a reconciliation and apply adjustments
 */
export async function approveReconciliation(req, res) {
  const { approvalNotes } = req.body;

  const reconciliation = await StockReconciliation.findById(req.params.id);
  if (!reconciliation) return fail(res, 'Reconciliation not found', 404);
  if (reconciliation.status !== 'pending-approval') return fail(res, 'Only pending-approval reconciliations can be approved', 409);

  try {
    // Apply adjustments to inventory
    for (const item of reconciliation.items) {
      if (item.adjustmentNeeded && item.variance !== 0) {
        await StockItem.findByIdAndUpdate(
          item.itemId,
          { $inc: { quantity: item.variance } },
          { new: true }
        );
      }
    }

    reconciliation.status = 'completed';
    reconciliation.approvedBy = req.user._id;
    reconciliation.approvalNotes = approvalNotes;
    await reconciliation.save();

    await recordAudit(req, {
      action: 'Reconciliation approved',
      module: 'Stock',
      resourceType: 'StockReconciliation',
      resourceId: reconciliation._id,
      description: `Approved reconciliation: ${reconciliation.title} and applied ${reconciliation.totalVariances} adjustment(s)`
    });

    return ok(res, reconciliation, 'Reconciliation approved and adjustments applied', 200);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

/**
 * Reject a reconciliation
 */
export async function rejectReconciliation(req, res) {
  const { rejectionReason } = req.body;

  const reconciliation = await StockReconciliation.findById(req.params.id);
  if (!reconciliation) return fail(res, 'Reconciliation not found', 404);
  if (reconciliation.status !== 'pending-approval') return fail(res, 'Only pending-approval reconciliations can be rejected', 409);

  reconciliation.status = 'planned';
  reconciliation.approvalNotes = rejectionReason;
  reconciliation.items = [];
  reconciliation.completedAt = null;
  await reconciliation.save();

  await recordAudit(req, {
    action: 'Reconciliation rejected',
    module: 'Stock',
    resourceType: 'StockReconciliation',
    resourceId: reconciliation._id,
    description: `Rejected reconciliation: ${reconciliation.title}`
  });

  return ok(res, reconciliation, 'Reconciliation rejected and returned to planned status', 200);
}
