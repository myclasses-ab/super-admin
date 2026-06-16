import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Send,
  Building2,
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Coins,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'All Leads', icon: Users, path: '/leads' },
  { label: 'Distribute', icon: Send, path: '/distribute' },
  { label: 'Institutes', icon: Building2, path: '/institutes' },
  { label: 'Courses', icon: BookOpen, path: '/courses' },
  { label: 'Credits', icon: Coins, path: '/credits' },
  { label: 'Lead Requests', icon: ClipboardList, path: '/lead-requests' },
  { label: 'Featured', icon: Sparkles, path: '/featured-purchases' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-slate-900 text-white transition-all duration-300 hidden lg:flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-400" />
            <span className="text-lg font-bold truncate">Super Admin</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 ml-auto"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">My Classes Platform</p>
          <p className="text-xs text-slate-600">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
