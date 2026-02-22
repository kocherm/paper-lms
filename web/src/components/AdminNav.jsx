import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText, GraduationCap, ClipboardCheck, Upload, KeyRound,
  Shield, UserCog, RefreshCw, Key, Bell, Code
} from 'lucide-react';

const adminLinks = [
  { to: '/admin/ferpa', icon: FileText, label: 'FERPA' },
  { to: '/admin/terms', icon: GraduationCap, label: 'Terms' },
  { to: '/admin/grading_periods', icon: ClipboardCheck, label: 'Grading Periods' },
  { to: '/admin/sis_import', icon: Upload, label: 'SIS Import' },
  { to: '/admin/developer_keys', icon: KeyRound, label: 'Developer Keys' },
  { to: '/admin/auth_providers', icon: Shield, label: 'Auth Providers' },
  { to: '/admin/roles', icon: UserCog, label: 'Custom Roles' },
  { to: '/admin/oneroster', icon: RefreshCw, label: 'OneRoster' },
  { to: '/settings/tokens', icon: Key, label: 'Access Tokens' },
  { to: '/settings/notifications', icon: Bell, label: 'Notifications' },
  { to: '/graphiql', icon: Code, label: 'GraphiQL' },
];

const AdminNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="fixed inset-y-0 left-16 z-20 w-[216px] bg-white border-r border-gray-200 overflow-y-auto"
      role="navigation"
      aria-label="Admin navigation"
    >
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Admin</h2>
      </div>
      <nav className="py-2">
        {adminLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors
              ${isActive(to)
                ? 'border-l-3 border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                : 'border-l-3 border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default AdminNav;
