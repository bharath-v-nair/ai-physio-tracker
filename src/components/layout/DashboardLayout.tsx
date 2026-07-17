import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, User, BarChart2, Video, MessageSquare, BookOpen, LogOut } from 'lucide-react';
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

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Live Assessment', icon: Video, path: '/assessment' },
    { label: 'Exercise Library', icon: BookOpen, path: '/exercises' },
    { label: 'Progress Tracker', icon: BarChart2, path: '/progress' },
    { label: 'AI Assistant', icon: MessageSquare, path: '/assistant' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#4F8EF7] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">PhysioAI</span>
        </div>
        
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
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#475569] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
