import { useAdminStore } from '@/store/adminStore';
import { Search, Filter } from 'lucide-react';

export default function LeadFiltersPanel() {
  const { leadFilters, setLeadFilters, cities, examTypes } = useAdminStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Name or phone..."
              value={leadFilters.search || ''}
              onChange={(e) => setLeadFilters({ ...leadFilters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
          <select
            value={leadFilters.cityIdentifier || ''}
            onChange={(e) => setLeadFilters({ ...leadFilters, cityIdentifier: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.identifier} value={c.identifier}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Exam</label>
          <select
            value={leadFilters.examTypeIdentifier || ''}
            onChange={(e) => setLeadFilters({ ...leadFilters, examTypeIdentifier: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Exams</option>
            {examTypes.map((e) => (
              <option key={e.identifier} value={e.identifier}>{e.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLeadFilters({})}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Filter size={14} /> Clear
        </button>
      </div>
    </div>
  );
}
