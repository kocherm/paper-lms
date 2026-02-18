import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ChevronDown, Home, CheckSquare, BarChart2 } from 'lucide-react';
import { useCourseUI } from '../contexts/CourseUIContext';

const primaryTabs = [
  { path: '', label: 'Home' },
  { path: '/announcements', label: 'Announcements' },
  { path: '/modules', label: 'Modules' },
  { path: '/gradebook', label: 'Grades' },
];

const simplifiedTabs = [
  { path: '', label: 'Home', icon: Home },
  { path: '/gradebook', label: 'My Work', icon: CheckSquare },
  { path: '/gradebook', label: 'Grades', icon: BarChart2 },
];

const moreTabs = [
  { path: '/discussions', label: 'Discussions' },
  { path: '/files', label: 'Files' },
  { path: '/pages', label: 'Pages' },
  { path: '/rubrics', label: 'Rubrics' },
  { path: '/outcomes', label: 'Outcomes' },
  { path: '/groups', label: 'Groups' },
  { path: '/blueprint', label: 'Blueprint' },
  { path: '/pacing', label: 'Pacing' },
  { path: '/collaborations', label: 'Collaborations' },
  { path: '/conferences', label: 'Conferences' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/syllabus', label: 'Syllabus' },
  { path: '/attendance', label: 'Attendance' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/audit_log', label: 'Audit Log' },
  { path: '/external_tools', label: 'External Tools' },
  { path: '/settings', label: 'Settings' },
];

const CourseNav = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const { isK2, is35 } = useCourseUI();

  if (!courseId) return null;

  // K-2 mode: no course navigation at all
  if (isK2) return null;

  const basePath = `/courses/${courseId}`;

  const isTabActive = (tabPath) => {
    const fullPath = basePath + tabPath;
    if (tabPath === '') return location.pathname === basePath;
    return location.pathname.startsWith(fullPath);
  };

  const isMoreActive = moreTabs.some((tab) => isTabActive(tab.path));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3-5 mode: simplified tabs with icons
  if (is35) {
    const tabClass35 = (active) =>
      `px-4 py-2 text-base font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`;

    return (
      <div className="border-b border-gray-200 bg-white -mx-6 px-6 mb-6">
        <div className="flex items-center">
          <nav className="flex items-center space-x-2" aria-label="Course navigation">
            {simplifiedTabs.map((tab) => (
              <Link
                key={tab.path + tab.label}
                to={basePath + tab.path}
                className={tabClass35(isTabActive(tab.path))}
              >
                {tab.icon && <tab.icon className="w-5 h-5" />}
                {tab.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  // Standard mode
  const tabClass = (active) =>
    `px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="border-b border-gray-200 bg-white -mx-6 px-6 mb-6">
      <div className="flex items-center">
        <nav className="flex items-center space-x-1" aria-label="Course navigation">
          {primaryTabs.map((tab) => (
            <Link
              key={tab.path}
              to={basePath + tab.path}
              className={tabClass(isTabActive(tab.path))}
            >
              {tab.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`${tabClass(isMoreActive && !primaryTabs.some(t => isTabActive(t.path)))} inline-flex items-center gap-1`}
            >
              More
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-40">
                {moreTabs.map((tab) => (
                  <Link
                    key={tab.path}
                    to={basePath + tab.path}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 text-sm ${
                      isTabActive(tab.path)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right spacer for future gamification */}
        <div className="flex-1" />
      </div>
    </div>
  );
};

export default CourseNav;
