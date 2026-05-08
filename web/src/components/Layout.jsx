import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Mail, User, LogOut,
  Briefcase, Eye, Settings, Home, Inbox, Menu, X, AlertTriangle, Library
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourseUI } from '../contexts/CourseUIContext';
import { api } from '../services/api';
import SkipToContent from './SkipToContent';
import InstallPrompt from './InstallPrompt';
import OfflineIndicator from './OfflineIndicator';
import AdminNav from './AdminNav';
import NotificationBell from './NotificationBell';
import MobileBottomNav from './MobileBottomNav';

const baseNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/inbox', icon: Mail, label: 'Inbox' },
  { to: '/portfolios', icon: Briefcase, label: 'Portfolios' },
  { to: '/commons', icon: Library, label: 'Commons' },
];

const adminNav = [
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

// Masquerade banner shown when an admin is acting as another user
const MasqueradeBanner = ({ userName, onStopMasquerade, stopping }) => (
  <div
    className="fixed top-0 left-0 right-0 z-[60] bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center gap-3 shadow-md"
    role="alert"
    aria-live="polite"
  >
    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    <span className="text-sm font-medium">
      Acting as <strong>{userName}</strong>
    </span>
    <button
      onClick={onStopMasquerade}
      disabled={stopping}
      className="ml-2 px-3 py-1 text-xs font-semibold bg-yellow-900 text-yellow-100 rounded hover:bg-yellow-800 disabled:opacity-50 transition-colors"
    >
      {stopping ? 'Restoring...' : 'Stop Masquerading'}
    </button>
  </div>
);

const Layout = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showAdminNav = isAdminRoute(location.pathname);
  const { isK2, is35 } = useCourseUI();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stoppingMasquerade, setStoppingMasquerade] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isMasquerading = !!user?.masquerading_as;
  const primaryNav = isAdmin ? [...baseNav, ...adminNav] : baseNav;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleStopMasquerade = async () => {
    setStoppingMasquerade(true);
    try {
      await api.endMasquerade();
      await refreshUser();
      navigate('/');
    } catch (err) {
      console.error('Failed to stop masquerading:', err);
    } finally {
      setStoppingMasquerade(false);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/admin/ferpa') return isAdminRoute(location.pathname);
    return location.pathname.startsWith(path);
  };

  // Masquerade banner offset — when masquerading, push content down to make room for the banner
  const masqueradePadding = isMasquerading ? 'pt-10' : '';

  // K-2 mode: hide sidebar entirely
  if (isK2) {
    return (
      <div className={`min-h-screen bg-sky-50 ${masqueradePadding}`}>
        {isMasquerading && (
          <MasqueradeBanner
            userName={user.masquerading_as}
            onStopMasquerade={handleStopMasquerade}
            stopping={stoppingMasquerade}
          />
        )}
        <OfflineIndicator />
        <SkipToContent />
        <div className="flex-1">
          <main id="main-content" className="max-w-7xl mx-auto px-6 py-8 pb-16 md:pb-0" role="main">
            {children}
          </main>
        </div>
        <MobileBottomNav />
        <InstallPrompt />
      </div>
    );
  }

  // 3-5 mode: simplified sidebar with larger icons and text labels
  if (is35) {
    return (
      <div className={`min-h-screen bg-gray-50 flex ${masqueradePadding}`}>
        {isMasquerading && (
          <MasqueradeBanner
            userName={user.masquerading_as}
            onStopMasquerade={handleStopMasquerade}
            stopping={stoppingMasquerade}
          />
        )}
        <OfflineIndicator />
        <SkipToContent />

        <aside
          className="fixed inset-y-0 left-0 z-30 flex flex-col items-center w-20 bg-[#2D3B45]"
          style={isMasquerading ? { top: '40px' } : undefined}
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
          <main id="main-content" className="max-w-7xl mx-auto px-6 py-8 pb-16 md:pb-0" role="main">
            {children}
          </main>
        </div>

        <MobileBottomNav />
        <InstallPrompt />
      </div>
    );
  }

  // Standard mode
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-white/10 w-full">
        <Link to="/" className="text-white relative group" title="Paper LMS" onClick={() => setMobileMenuOpen(false)}>
          <BookOpen className="w-6 h-6 text-red-400" />
          <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 hidden md:block">
            Paper LMS
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 flex flex-col items-center">
        {primaryNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileMenuOpen(false)}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-md transition-colors
              ${isActive(item.to)
                ? 'bg-white/15 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-white/10 py-2 space-y-1 flex flex-col items-center w-full">
        <NotificationBell />
        <div className="relative group flex items-center justify-center w-10 h-10">
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 hidden md:block">
            {user?.name || user?.email}
          </span>
        </div>
        <button
          onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
          title="Logout"
          className="relative group flex items-center justify-center w-10 h-10 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 hidden md:block">
            Logout
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen bg-gray-50 flex ${masqueradePadding}`}>
      {isMasquerading && (
        <MasqueradeBanner
          userName={user.masquerading_as}
          onStopMasquerade={handleStopMasquerade}
          stopping={stoppingMasquerade}
        />
      )}
      <OfflineIndicator />
      <SkipToContent />

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className={`fixed ${isMasquerading ? 'top-13' : 'top-3'} left-3 z-40 md:hidden p-2 rounded-md bg-[#2D3B45] text-white shadow-lg`}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col items-center w-16 bg-[#2D3B45]"
            style={isMasquerading ? { top: '40px' } : undefined}
            role="navigation"
            aria-label="Global navigation"
          >
            {sidebarContent}
          </aside>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="fixed top-3 left-[72px] z-50 p-1 rounded-full bg-white/90 text-gray-700 shadow"
            style={isMasquerading ? { top: '50px' } : undefined}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col items-center w-16 bg-[#2D3B45]"
        style={isMasquerading ? { top: '40px' } : undefined}
        role="navigation"
        aria-label="Global navigation"
      >
        {sidebarContent}
      </aside>

      {/* Admin sub-nav panel */}
      {showAdminNav && <AdminNav />}

      {/* Main content area */}
      <div className={`flex-1 ${showAdminNav ? 'md:ml-[280px] ml-0' : 'md:ml-16 ml-0'}`}>
        <main id="main-content" className={`max-w-7xl mx-auto px-6 py-8 pb-16 md:pb-0 ${isMasquerading ? 'pt-6' : 'pt-14'} md:pt-8`} role="main">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <InstallPrompt />
    </div>
  );
};

export default Layout;
