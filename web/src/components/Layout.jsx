import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, User, LogOut, Key, KeyRound, Upload, Calendar, Mail, Settings, Shield, Code } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SkipToContent from './SkipToContent';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipToContent />
      <header className="bg-white shadow" role="banner">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <Menu className="h-6 w-6 text-gray-600" />
                <h1 className="ml-4 text-xl font-semibold">Paper LMS</h1>
              </Link>
              <nav className="hidden md:flex space-x-4 ml-8" aria-label="Main navigation">
                <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/courses" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Courses
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/settings/tokens" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  Access Tokens
                </Link>
                <Link to="/admin/developer_keys" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  Developer Keys
                </Link>
                <Link to="/admin/sis_import" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  SIS Import
                </Link>
                <Link to="/admin/grading_periods" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Grading Periods
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/calendar" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Calendar
                </Link>
                <Link to="/inbox" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Inbox
                </Link>
                <Link to="/settings/notifications" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  Notifications
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/admin/auth_providers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Auth Providers
                </Link>
                <Link to="/graphiql" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" />
                  GraphiQL
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-500 cursor-pointer" />
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
