import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Input, Select } from './FormField';

const ADD_OPTION = '__add_option__';

export default function CreatableSelect({ label, value, onChange, options = [], error, required = false, placeholder, addLabel = '+ Other' }) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [addError, setAddError] = useState('');

  const beginAdding = () => {
    setAdding(true);
    setNewValue('');
    setAddError('');
  };

  const cancelAdding = () => {
    setAdding(false);
    setNewValue('');
    setAddError('');
  };

  const saveOption = () => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      setAddError('Please enter a value.');
      return;
    }
    if (options.some((option) => option.value.toLowerCase() === trimmed.toLowerCase())) {
      setAddError(`"${trimmed}" already exists.`);
      return;
    }
    onChange({ target: { value: trimmed } });
    cancelAdding();
  };

  return adding ? (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Input
          label={label}
          value={newValue}
          onChange={(event) => { setNewValue(event.target.value); setAddError(''); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); saveOption(); }
            if (event.key === 'Escape') cancelAdding();
          }}
          error={addError || error}
          required={required}
          placeholder={addLabel}
          autoFocus
          trailing={(
            <button type="button" onClick={cancelAdding} aria-label="Cancel adding option" title="Cancel" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-dark-gray)]">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        />
      </div>
      <button type="button" onClick={saveOption} aria-label="Save option" title="Save" className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-medium-green)] text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)] focus:ring-offset-2">
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  ) : (
    <Select
      label={label}
      value={value}
      onChange={(event) => event.target.value === ADD_OPTION ? beginAdding() : onChange(event)}
      options={[...options, { value: ADD_OPTION, label: addLabel }]}
      error={error}
      required={required}
      placeholder={placeholder}
    />
  );
}