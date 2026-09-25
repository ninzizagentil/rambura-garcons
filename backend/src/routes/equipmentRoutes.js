import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment, assignEquipment, returnEquipment, addMaintenance, equipmentDashboard } from '../controllers/equipmentController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
const equipmentValidation = validateBody({
  assetNumber: { ...rules.code('Asset number'), maxLength: 120 }, name: { ...rules.alnum('Name'), maxLength: 160 },
  type: { enum: ['laptop', 'desktop', 'printer', 'projector', 'network', 'electrical_material', 'other'] },
  brand: { ...rules.alnum('Brand'), maxLength: 100 }, model: { ...rules.alnum('Model'), maxLength: 100 },
  serialNumber: { ...rules.code('Serial number'), maxLength: 120 }, location: { ...rules.alnum('Location'), maxLength: 160 },
  condition: { enum: ['new', 'good', 'fair', 'damaged', 'under_repair', 'retired'] },
  purchaseDate: { validate: (value) => !Number.isNaN(Date.parse(value)), message: 'purchaseDate must be a valid date' },
  warrantyExpiry: { validate: (value, body) => !Number.isNaN(Date.parse(value)) && (!body.purchaseDate || new Date(value) >= new Date(body.purchaseDate)), message: 'warrantyExpiry must be valid and not before purchaseDate' },
  notes: { maxLength: 2000 },
});
router.use(authenticate);
router.get('/dashboard', requirePermission('equipment.view'), asyncHandler(equipmentDashboard));
router.get('/', requirePermission('equipment.view'), asyncHandler(getEquipment));
router.get('/:id', requirePermission('equipment.view'), asyncHandler(getEquipmentById));
router.post('/', requirePermission('equipment.create'), equipmentValidation, asyncHandler(createEquipment));
router.put('/:id', requirePermission('equipment.update'), equipmentValidation, asyncHandler(updateEquipment));
// No permission check on purpose: nobody may delete directly, and the answer explains how to archive instead.
router.delete('/:id', asyncHandler(deleteEquipment));
router.post('/:id/assign', requirePermission('equipment.assign'), validateBody({ userName: rules.name('Assigned user') }), asyncHandler(assignEquipment));
router.post('/:id/return', requirePermission('equipment.assign'), asyncHandler(returnEquipment));
router.post('/:id/maintenance', requirePermission('equipment.maintenance'), validateBody({
  performedBy: rules.name('Performed by'), cost: rules.number('Cost')
}), asyncHandler(addMaintenance));
export default router;
