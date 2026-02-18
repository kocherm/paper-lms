import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Mail, User, LogOut,
  Briefcase, Eye, Settings, Home, Inbox
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourseUI } from '../contexts/CourseUIContext';
import SkipToContent from './SkipToContent';
import InstallPrompt from './InstallPrompt';
import OfflineIndicator from './OfflineIndicator';
import AdminNav from './AdminNav';

const primaryNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/inbox', icon: Mail, label: 'Inbox' },
  { to: '/portfolios', icon: Briefcase, label: 'Portfolios' },
  { to: '/observer', icon: Eye, label: 'Observer' },
  { to: '/admin/ferpa', icon: Settings, label: 'Admin' },
];

const simplifiedNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inbox', icon: Inbox, label: 'Inbox' },
];

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`relative group flex items-center justify-center w-10 h-10 rounded-md transition-colors
      ${active
        ? 'bg-white/15 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }
    `}
  >
    <Icon className="w-5 h-5" />
    <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
      {label}
    </span>
  </Link>
);

const SimplifiedNavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center w-20 py-2 rounded-md transition-colors
      ${active
        ? 'bg-white/15 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }
    `}
  >
    <Icon className="w-7 h-7" />
    <span className="text-xs mt-1">{label}</span>
  </Link>
);

const isAdminRoute = (pathname) =>
  pathname.startsWith('/admin/') ||
  pathname.startsWith('/settings/') ||
  pathname === '/graphiql';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showAdminNav = isAdminRoute(location.pathname);
  const { isK2, is35 } = useCourseUI();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/admin/ferpa') return isAdminRoute(location.pathname);
    return location.pathname.startsWith(path);
  };

  // K-2 mode: hide sidebar entirely
  if (isK2) {
    return (
      <div className="min-h-screen bg-sky-50">
        <OfflineIndicator />
        <SkipToContent />
        <div className="flex-1">
          <main id="main-content" className="max-w-7xl mx-auto px-6 py-8" role="main">
            {children}
          </main>
        </div>
        <InstallPrompt />
      </div>
    );
  }

  // 3-5 mode: simplified sidebar with larger icons and text labels
  if (is35) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <OfflineIndicator />
        <SkipToContent />

        <aside
          className="fixed inset-y-0 left-0 z-30 flex flex-col items-center w-20 bg-[#2D3B45]"
          role="navigation"
          aria-label="Global navigation"
        >
          <div className="flex items-center justify-center h-14 border-b border-white/10 w-full">
            <Link to="/" className="text-white" title="Paper LMS">
              <BookOpen className="w-7 h-7 text-red-400" />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 space-y-1 flex flex-col items-center">
            {simplifiedNav.map((item) => (
              <SimplifiedNavItem key={item.to + item.label} {...item} active={isActive(item.to)} />
            ))}
          </nav>

          <div className="border-t border-white/10 py-2 flex flex-col items-center w-full">
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex flex-col items-center justify-center w-20 py-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="w-7 h-7" />
              <span className="text-xs mt-1">Logout</span>
            </button>
          </div>
        </aside>

        {showAdminNav && <AdminNav />}

        <div className={`flex-1 ${showAdminNav ? 'ml-[284px]' : 'ml-20'}`}>
          <main id="main-content" className="max-w-7xl mx-auto px-6 py-8" role="main">
            {children}
          </main>
        </div>

        <InstallPrompt />
      </div>
    );
  }

  // Standard mode
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <OfflineIndicator />
      <SkipToContent />

      {/* Icon-only sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col items-center w-16 bg-[#2D3B45]"
        role="navigation"
        aria-label="Global navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-white/10 w-full">
          <Link to="/" className="text-white relative group" title="Paper LMS">
            <BookOpen className="w-6 h-6 text-red-400" />
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Paper LMS
            </span>
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 flex flex-col items-center">
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/10 py-2 space-y-1 flex flex-col items-center w-full">
          <div className="relative group flex items-center justify-center w-10 h-10">
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              {user?.name || user?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="relative group flex items-center justify-center w-10 h-10 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Admin sub-nav panel */}
      {showAdminNav && <AdminNav />}

      {/* Main content area */}
      <div className={`flex-1 ${showAdminNav ? 'ml-[280px]' : 'ml-16'}`}>
        <main id="main-content" className="max-w-7xl mx-auto px-6 py-8" role="main">
          {children}
        </main>
      </div>

      <InstallPrompt />
    </div>
  );
};

export default Layout;
