import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';

export default function CsvImportButton({ onImport, label = 'Import CSV' }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLoading(true);
    try { await onImport(await file.text()); } finally { setLoading(false); }
  };
  return <><input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleChange} className="hidden" /><Button type="button" variant="secondary" icon={Upload} loading={loading} onClick={() => inputRef.current?.click()}>{label}</Button></>;
}