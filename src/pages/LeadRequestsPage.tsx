import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  leadRequestsApi,
  institutesApi,
  masterApi,
} from '@/api';
import type { LeadRequest, Institute, ExamType } from '@/types';
import { toast } from 'sonner';
import {
  ClipboardList,
  Search,
  Check,
  X,
  Send,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function LeadRequestsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeadRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'fulfill'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [reqs, insts, exams] = await Promise.all([
          leadRequestsApi.getAll(),
          institutesApi.getAll(),
          masterApi.getExamTypes(),
        ]);
        setRequests(reqs ?? []);
        setInstitutes(insts ?? []);
        setExamTypes(exams ?? []);
      } catch {
        toast.error('Failed to load lead requests');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) => {
        const inst = institutes.find((i) => i.identifier === r.instituteIdentifier);
        return inst?.name.toLowerCase().includes(s);
      });
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, statusFilter, search, institutes]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'PENDING').length, [requests]);

  const handleAction = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        await leadRequestsApi.updateStatus(selectedRequest.identifier, {
          status: 'APPROVED',
          adminNotes,
        });
        toast.success('Lead request approved');
      } else if (actionType === 'reject') {
        await leadRequestsApi.updateStatus(selectedRequest.identifier, {
          status: 'REJECTED',
          adminNotes,
        });
        toast.success('Lead request rejected. Credits refunded.');
      } else if (actionType === 'fulfill') {
        await leadRequestsApi.fulfill(selectedRequest.identifier);
        toast.success('Lead request marked as fulfilled');
      }
      const updated = await leadRequestsApi.getAll();
      setRequests(updated);
      setActionModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch {
      toast.error(`Failed to ${actionType} lead request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionModal = (request: LeadRequest, action: 'approve' | 'reject' | 'fulfill') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setActionModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''} awaiting your action` : 'All requests are up to date'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {filteredRequests.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No lead requests found" description="Requests will appear here when institutes request leads" className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Institute</th>
                  <th className="text-left px-5 py-3 font-medium">Exam Type</th>
                  <th className="text-left px-5 py-3 font-medium">Quantity</th>
                  <th className="text-left px-5 py-3 font-medium">Cost</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const inst = institutes.find((i) => i.identifier === req.instituteIdentifier);
                  const exam = examTypes.find((e) => e.identifier === req.examTypeIdentifier);
                  return (
                    <tr key={req.identifier} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{inst?.name || 'Unknown'}</p>
                        {req.notes && <p className="text-xs text-slate-500 mt-0.5">{req.notes}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{exam?.name || req.examTypeIdentifier}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{req.quantity}</td>
                      <td className="px-5 py-3 text-slate-600">{req.totalCost} credits</td>
                      <td className="px-5 py-3">
                        <RequestStatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openActionModal(req, 'approve')}
                                className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => openActionModal(req, 'reject')}
                                className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                              >
                                <X size={12} /> Reject
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <button
                              onClick={() => openActionModal(req, 'fulfill')}
                              className="px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors flex items-center gap-1"
                            >
                              <Send size={12} /> Fulfill
                            </button>
                          )}
                          {req.status === 'FULFILLED' && (
                            <button
                              onClick={() => navigate('/distribute')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                            >
                              <ArrowRight size={12} /> Distribute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {actionType === 'approve' ? 'Approve Lead Request' : actionType === 'reject' ? 'Reject Lead Request' : 'Mark as Fulfilled'}
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-sm">
                <span className="text-slate-500">Institute:</span>{' '}
                <span className="font-medium text-slate-900">
                  {institutes.find((i) => i.identifier === selectedRequest.instituteIdentifier)?.name}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Quantity:</span>{' '}
                <span className="font-medium text-slate-900">{selectedRequest.quantity} leads</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Cost:</span>{' '}
                <span className="font-medium text-slate-900">{selectedRequest.totalCost} credits</span>
              </p>
            </div>
            {actionType !== 'fulfill' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {actionType === 'reject' ? 'Reason' : 'Notes'} (optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isProcessing}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 ${
                  actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionType === 'fulfill'
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isProcessing
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve'
                  : actionType === 'reject'
                  ? 'Reject'
                  : 'Mark Fulfilled'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-blue-50 text-blue-700',
    FULFILLED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
