import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  creditsApi,
  institutesApi,
  creditTopUpsApi,
} from '@/api';
import type { InstituteCredit, Institute, CreditTopUpRequest, CreditTransaction } from '@/types';
import { toast } from 'sonner';
import {
  Coins,
  Search,
  Plus,
  Eye,
  Check,
  X,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';

export default function CreditsPage() {
  const { user } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [creditBalances, setCreditBalances] = useState<Record<string, InstituteCredit>>({});
  const [topUps, setTopUps] = useState<CreditTopUpRequest[]>([]);
  const [transactions, setTransactions] = useState<Record<string, CreditTransaction[]>>({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'topups'>('balances');

  // Grant modal state
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantInstituteId, setGrantInstituteId] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantDescription, setGrantDescription] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  // Transaction modal state
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnInstituteId, setTxnInstituteId] = useState('');

  // Approve/Reject modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<CreditTopUpRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [insts, topUpData] = await Promise.all([
          institutesApi.getAll(),
          creditTopUpsApi.getAll(),
        ]);
        setInstitutes(insts ?? []);
        setTopUps(topUpData ?? []);

        // Fetch credit balances for all institutes
        const balanceMap: Record<string, InstituteCredit> = {};
        await Promise.all(
          (insts ?? []).map(async (inst) => {
            try {
              const credit = await creditsApi.getBalance(inst.identifier);
              balanceMap[inst.identifier] = credit;
            } catch {
              // Institute may not have a credit record yet
            }
          })
        );
        setCreditBalances(balanceMap);
      } catch {
        toast.error('Failed to load credits data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredInstitutes = useMemo(() => {
    if (!search) return institutes;
    const s = search.toLowerCase();
    return institutes.filter((i) => i.name.toLowerCase().includes(s));
  }, [institutes, search]);

  const totalCredits = useMemo(() => {
    return Object.values(creditBalances).reduce((sum, c) => sum + (c?.balance || 0), 0);
  }, [creditBalances]);

  const pendingTopUpsCount = useMemo(() => {
    return topUps.filter((t) => t.status === 'PENDING').length;
  }, [topUps]);

  const handleGrant = async () => {
    const amount = parseInt(grantAmount);
    if (!grantInstituteId || !amount || amount <= 0) {
      toast.error('Please select an institute and enter a valid amount');
      return;
    }
    setIsGranting(true);
    try {
      const credit = await creditsApi.grant({
        instituteIdentifier: grantInstituteId,
        amount,
        description: grantDescription || `Granted ${amount} credits by super admin`,
      });
      setCreditBalances((prev) => ({ ...prev, [grantInstituteId]: credit }));
      toast.success(`${amount} credits granted successfully`);
      setGrantModalOpen(false);
      setGrantInstituteId('');
      setGrantAmount('');
      setGrantDescription('');
    } catch {
      toast.error('Failed to grant credits');
    } finally {
      setIsGranting(false);
    }
  };

  const openTransactions = async (instituteId: string) => {
    setTxnInstituteId(instituteId);
    setTxnModalOpen(true);
    if (!transactions[instituteId]) {
      try {
        const txns = await creditsApi.getTransactions(instituteId);
        setTransactions((prev) => ({ ...prev, [instituteId]: txns }));
      } catch {
        toast.error('Failed to load transactions');
      }
    }
  };

  const handleApproveTopUp = async () => {
    if (!selectedTopUp) return;
    setIsProcessing(true);
    try {
      await creditTopUpsApi.approve(selectedTopUp.identifier, {
        approvedBy: user?.identifier || '',
        adminNotes,
      });
      // Refresh balance for this institute
      const credit = await creditsApi.getBalance(selectedTopUp.instituteIdentifier);
      setCreditBalances((prev) => ({ ...prev, [selectedTopUp.instituteIdentifier]: credit }));
      // Refresh top-ups
      const updated = await creditTopUpsApi.getAll();
      setTopUps(updated);
      toast.success('Top-up approved and credits granted');
      setApproveModalOpen(false);
      setSelectedTopUp(null);
      setAdminNotes('');
    } catch {
      toast.error('Failed to approve top-up');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTopUp = async () => {
    if (!selectedTopUp) return;
    setIsProcessing(true);
    try {
      await creditTopUpsApi.reject(selectedTopUp.identifier, adminNotes);
      const updated = await creditTopUpsApi.getAll();
      setTopUps(updated);
      toast.success('Top-up rejected');
      setRejectModalOpen(false);
      setSelectedTopUp(null);
      setAdminNotes('');
    } catch {
      toast.error('Failed to reject top-up');
    } finally {
      setIsProcessing(false);
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Credits Management</h1>
        <button
          onClick={() => setGrantModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Grant Credits
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Coins size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Credits in System</p>
              <p className="text-2xl font-bold text-slate-900">{totalCredits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <IndianRupee size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Top-Up Requests</p>
              <p className="text-2xl font-bold text-slate-900">{pendingTopUpsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Institutes with Credits</p>
              <p className="text-2xl font-bold text-slate-900">{Object.keys(creditBalances).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'balances'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Credit Balances
        </button>
        <button
          onClick={() => setActiveTab('topups')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'topups'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Top-Up Requests
          {pendingTopUpsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              {pendingTopUpsCount}
            </span>
          )}
        </button>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search institutes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {filteredInstitutes.length === 0 ? (
            <EmptyState icon={Coins} title="No institutes found" description="" className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Institute</th>
                    <th className="text-left px-5 py-3 font-medium">Credit Balance</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInstitutes.map((inst) => {
                    const credit = creditBalances[inst.identifier];
                    return (
                      <tr key={inst.identifier} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{inst.name}</p>
                          <p className="text-xs text-slate-500">{inst.cityIdentifier || '—'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-lg font-semibold text-slate-900">
                            {credit?.balance ?? 0}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">credits</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (credit?.balance ?? 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(credit?.balance ?? 0) > 0 ? 'Active' : 'No Balance'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openTransactions(inst.identifier)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                              title="View transactions"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setGrantInstituteId(inst.identifier);
                                setGrantModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-primary-600"
                              title="Grant credits"
                            >
                              <Plus size={16} />
                            </button>
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
      )}

      {/* Top-Ups Tab */}
      {activeTab === 'topups' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {topUps.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No top-up requests" description="Institutes will appear here when they request credits" className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Institute</th>
                    <th className="text-left px-5 py-3 font-medium">Credits</th>
                    <th className="text-left px-5 py-3 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 font-medium">Transaction ID</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topUps.map((topUp) => {
                    const inst = institutes.find((i) => i.identifier === topUp.instituteIdentifier);
                    return (
                      <tr key={topUp.identifier} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{inst?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{new Date(topUp.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{topUp.requestedCredits}</td>
                        <td className="px-5 py-3 text-slate-600">₹{topUp.amountInRupees.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">...{topUp.transactionIdLast6}</span>
                        </td>
                        <td className="px-5 py-3">
                          <TopUpStatusBadge status={topUp.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          {topUp.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTopUp(topUp);
                                  setAdminNotes('');
                                  setApproveModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTopUp(topUp);
                                  setAdminNotes('');
                                  setRejectModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grant Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Grant Credits</h2>
            {!grantInstituteId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institute</label>
                <select
                  value={grantInstituteId}
                  onChange={(e) => setGrantInstituteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select institute</option>
                  {institutes.map((inst) => (
                    <option key={inst.identifier} value={inst.identifier}>{inst.name}</option>
                  ))}
                </select>
              </div>
            )}
            {grantInstituteId && (
              <p className="text-sm text-slate-600">
                Institute: <span className="font-medium text-slate-900">{institutes.find((i) => i.identifier === grantInstituteId)?.name}</span>
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                min={1}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="Enter credit amount"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={grantDescription}
                onChange={(e) => setGrantDescription(e.target.value)}
                placeholder="e.g. Welcome bonus"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setGrantModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGrant}
                disabled={isGranting}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isGranting ? 'Granting...' : 'Grant Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {txnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
              <button onClick={() => setTxnModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {institutes.find((i) => i.identifier === txnInstituteId)?.name}
            </p>
            <div className="flex-1 overflow-y-auto">
              {(transactions[txnInstituteId] || []).length === 0 ? (
                <EmptyState icon={Coins} title="No transactions" description="" className="py-8" />
              ) : (
                <div className="space-y-2">
                  {(transactions[txnInstituteId] || []).map((txn) => (
                    <div key={txn.identifier} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{txn.description || txn.type}</p>
                        <p className="text-xs text-slate-500">{new Date(txn.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-sm font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalOpen && selectedTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Approve Top-Up Request</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-sm"><span className="text-slate-500">Institute:</span> <span className="font-medium text-slate-900">{institutes.find((i) => i.identifier === selectedTopUp.instituteIdentifier)?.name}</span></p>
              <p className="text-sm"><span className="text-slate-500">Credits:</span> <span className="font-medium text-slate-900">{selectedTopUp.requestedCredits}</span></p>
              <p className="text-sm"><span className="text-slate-500">Amount:</span> <span className="font-medium text-slate-900">₹{selectedTopUp.amountInRupees.toLocaleString()}</span></p>
              <p className="text-sm"><span className="text-slate-500">Transaction ID:</span> <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">...{selectedTopUp.transactionIdLast6}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveTopUp}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Approving...' : 'Approve & Grant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Reject Top-Up Request</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Transaction ID not found"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTopUp}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopUpStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
