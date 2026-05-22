import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';
import { Bell, LogOut, Menu, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function TopHeader() {
  const { user, logout, sidebarCollapsed, setMobileNavOpen } = useAdminStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            Super Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Manage the entire platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user?.fullName || 'Super Admin'}
            </span>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
