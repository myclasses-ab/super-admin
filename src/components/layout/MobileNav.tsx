import { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';

const mobileItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Leads', icon: Users, path: '/leads' },
  { label: 'Distribute', icon: Send, path: '/distribute' },
  { label: 'Institutes', icon: Building2, path: '/institutes' },
  { label: 'More', icon: Menu, path: null as string | null },
];

const moreItems = [
  { label: 'Courses', path: '/courses' },
  { label: 'Analytics', path: '/analytics' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mobileNavOpen, setMobileNavOpen } = useAdminStore();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 lg:hidden">
        <div className="flex justify-around items-center h-14">
          {mobileItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  } else {
                    setShowMore(true);
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1 px-3 text-xs',
                  isActive ? 'text-primary-600' : 'text-slate-500'
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Menu Drawer */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-14 left-0 right-0 z-50 bg-white rounded-t-2xl border-t border-slate-200 p-4 lg:hidden max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">More Options</h3>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setShowMore(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    'text-left px-4 py-3 rounded-lg text-sm font-medium',
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 shadow-xl lg:hidden text-white">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
              <span className="text-lg font-bold text-primary-400">Super Admin</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <nav className="p-2 space-y-0.5">
              {[
                { label: 'Dashboard', path: '/' },
                { label: 'All Leads', path: '/leads' },
                { label: 'Distribute', path: '/distribute' },
                { label: 'Institutes', path: '/institutes' },
                { label: 'Courses', path: '/courses' },
                { label: 'Analytics', path: '/analytics' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    'block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium',
                    location.pathname === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
