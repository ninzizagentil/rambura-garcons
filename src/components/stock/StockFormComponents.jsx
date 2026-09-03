import { useState } from 'react';
import { AlertCircle, Check, Loader } from 'lucide-react';
import Modal from '../../modals/Modal';
import Button from '../../common/Button';
import { useToast } from '../../../context/ToastContext';

/**
 * Professional Stock Transaction Form - Stock In/Out/Adjustment
 * Features: Multi-step workflow, validation, professional styling
 */
export function StockTransactionForm({
  open,
  onClose,
  title,
  subtitle,
  fields,
  onSubmit,
  loading = false,
  successMessage,
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = () => {
    const stepErrors = {};
    const currentFields = fields.filter(f => f.step === step);
    
    currentFields.forEach(field => {
      if (field.required && !formData[field.name]) {
        stepErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep()) {
      try {
        await onSubmit(formData);
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setStep(1);
          setFormData({});
          setSubmitted(false);
        }, 2000);
      } catch (error) {
        showToast(error.message || 'Failed to process transaction', 'error');
      }
    }
  };

  const currentFields = fields.filter(f => f.step === step);
  const totalSteps = Math.max(...fields.map(f => f.step || 1));

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="stock-modal-header">
        <h2 className="stock-modal-title">{title}</h2>
        {subtitle && <p className="stock-modal-subtitle">{subtitle}</p>}
        <div className="mt-3 flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i + 1}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-[var(--color-medium-green)]' : 'bg-[var(--color-border-gray)]'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-status-green-bg)] flex items-center justify-center">
              <Check className="w-6 h-6 text-[var(--color-status-green)]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-dark-gray)] mb-1">Transaction Complete</h3>
          <p className="text-[var(--color-mid-gray)]">{successMessage || 'Transaction processed successfully'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentFields.map(field => (
              <div key={field.name} className="stock-form-group">
                <label className={`stock-form-label ${field.required ? 'required' : ''}`}>
                  {field.label}
                </label>
                
                {field.type === 'text' || field.type === 'number' ? (
                  <input
                    type={field.type}
                    className="stock-form-input"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    min={field.min}
                    max={field.max}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="stock-form-select"
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="stock-form-textarea"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                  />
                ) : null}

                {errors[field.name] && (
                  <div className="mt-1.5 flex items-center gap-2 text-[var(--color-status-red)] text-sm">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors[field.name]}
                  </div>
                )}
                {field.hint && <p className="stock-form-hint">{field.hint}</p>}
              </div>
            ))}
          </div>

          <div className="stock-modal-footer">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Complete Transaction'}
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

/**
 * Professional confirmation modal for stock operations
 */
export function StockConfirmModal({
  open,
  onClose,
  title,
  message,
  details,
  onConfirm,
  loading = false,
  isDanger = false,
}) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="stock-modal-header">
        <h2 className="stock-modal-title">{title}</h2>
      </div>

      <div className="space-y-4">
        <p className="text-[var(--color-mid-gray)]">{message}</p>
        
        {details && (
          <div className="bg-[var(--color-light-green)] border border-[var(--color-border-gray)] rounded-lg p-3 space-y-1.5">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-[var(--color-mid-gray)]">{key}:</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stock-modal-footer">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          loading={loading}
          variant={isDanger ? 'danger' : 'primary'}
          className="flex-1"
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
