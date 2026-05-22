import { useState } from 'react';
import { X, Search, Send } from 'lucide-react';
import type { Institute } from '@/types';
import { toast } from 'sonner';

interface LeadDistributionModalProps {
  open: boolean;
  onClose: () => void;
  institutes: Institute[];
  selectedLeadIds: string[];
  onDistribute: (instituteIdentifier: string, notes: string) => void;
}

export default function LeadDistributionModal({
  open,
  onClose,
  institutes,
  selectedLeadIds,
  onDistribute,
}: LeadDistributionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const filtered = institutes.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.cityIdentifier?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedInstitute) {
      toast.error('Please select an institute');
      return;
    }
    setIsLoading(true);
    try {
      await onDistribute(selectedInstitute, notes);
      toast.success(`${selectedLeadIds.length} lead(s) distributed successfully`);
      onClose();
      setSearch('');
      setSelectedInstitute('');
      setNotes('');
    } catch {
      toast.error('Failed to distribute leads');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Distribute {selectedLeadIds.length} Lead{selectedLeadIds.length > 1 ? 's' : ''}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search institutes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl mb-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">No institutes found</p>
          ) : (
            filtered.map((inst) => (
              <button
                key={inst.identifier}
                onClick={() => setSelectedInstitute(inst.identifier)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${
                  selectedInstitute === inst.identifier ? 'bg-primary-50' : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{inst.name}</p>
                <p className="text-xs text-slate-500">{inst.cityIdentifier || '—'} • {inst.subscriptionTier}</p>
              </button>
            ))
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for the institute..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedInstitute}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={14} /> {isLoading ? 'Sending...' : 'Send Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
