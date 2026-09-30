import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, BarChart2, Video, MessageSquare, BookOpen, LogOut, Menu, X, Timer } from 'lucide-react';
import { cn } from '../../utils/cn';

// Brand mark: a head over a level shoulder line and spine, the three things the posture check measures
export const BrandMark = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
    <rect width="26" height="26" rx="6" fill="#00806E" />
    <circle cx="13" cy="7.5" r="2.6" fill="#fff" />
    <path d="M7 12.5h12M13 12.5v9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    aria-current={active ? 'page' : undefined}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-colors duration-150",
      active
        ? "bg-white text-ink font-semibold shadow-[inset_3px_0_0_var(--color-primary)]"
        : "text-muted hover:bg-faint hover:text-ink"
    )}
  >
    <Icon className={cn("w-[18px] h-[18px]", active ? "text-primary" : "")} aria-hidden="true" />
    <span>{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('token');

  // A saved login can expire (after 24 hours): check it once, and send the user to sign in again
  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login?expired=1', { replace: true });
        }
      })
      .catch(() => { /* offline: let the page show its own error */ });
  }, [token, navigate]);

  // Close the phone menu after navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Posture check', icon: Video, path: '/assessment' },
    { label: 'Exercise library', icon: BookOpen, path: '/exercises' },
    { label: 'Focus mode', icon: Timer, path: '/focus' },
    { label: 'Progress', icon: BarChart2, path: '/progress' },
    { label: 'Assistant', icon: MessageSquare, path: '/assistant' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  // Exercise pages live under /dashboard/exercises but belong to the library; otherwise pick the longest matching path
  const path = location.pathname.startsWith('/dashboard/exercises') ? '/exercises' : location.pathname;
  const activePath = navItems
    .filter(item => path === item.path || path.startsWith(item.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  const logo = (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-lg font-bold text-ink">PhysioAI</span>
    </Link>
  );

  const sidebarContent = (
    <>
      <nav className="flex-1 px-3 space-y-0.5 mt-4" aria-label="Main">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            to={item.path}
            active={item.path === activePath}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-rule">
        <Link
          to="/"
          onClick={() => localStorage.removeItem('token')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-muted hover:bg-faint hover:text-ink transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
          <span>Sign out</span>
        </Link>
      </div>
    </>
  );

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-paper">
      {/* Sidebar */}
      <aside className="w-60 border-r border-rule flex-col hidden md:flex">
        <div className="px-6 pt-7 pb-4">{logo}</div>
        {sidebarContent}
      </aside>

      {/* Phone top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-rule shrink-0">
        {logo}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 rounded-[6px] text-ink hover:bg-faint"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Phone slide-out menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-paper flex flex-col shadow-xl">
            <div className="p-4 h-16 flex items-center justify-between border-b border-rule bg-white">
              {logo}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-[6px] text-ink hover:bg-faint"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 md:px-11 md:py-9 max-w-[1240px]">
          {children}
        </div>
      </main>
    </div>
  );
};
