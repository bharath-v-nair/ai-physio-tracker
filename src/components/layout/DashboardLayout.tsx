import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, User, BarChart2, Video, MessageSquare, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, active }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-[#4F8EF7]/10 text-[#4F8EF7] font-medium" 
        : "text-[#475569] hover:bg-gray-100"
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu after navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Live Assessment', icon: Video, path: '/assessment' },
    { label: 'Exercise Library', icon: BookOpen, path: '/exercises' },
    { label: 'Progress Tracker', icon: BarChart2, path: '/progress' },
    { label: 'AI Assistant', icon: MessageSquare, path: '/assistant' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const logo = (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-lg bg-[#4F8EF7] flex items-center justify-center">
        <Activity className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight text-gray-900">PhysioAI</span>
    </div>
  );

  const sidebarContent = (
    <>
      <nav className="flex-1 px-4 space-y-1 mt-6">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            to={item.path}
            active={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          to="/"
          onClick={() => localStorage.removeItem('token')}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#475569] hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-6">{logo}</div>
        {sidebarContent}
      </aside>

      {/* Phone top bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-gray-100 shrink-0">
        {logo}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Phone slide-out menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white flex flex-col shadow-xl">
            <div className="p-4 h-16 flex items-center justify-between border-b border-gray-100">
              {logo}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-lg text-gray-700 hover:bg-gray-100"
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
