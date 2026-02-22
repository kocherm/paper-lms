import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, FileText, PenTool, HelpCircle, ExternalLink, Minus, Book, Award, Calendar, CheckCircle, Circle, Users, Settings, Megaphone, Layout as LayoutIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import HomeEngine from '../components/home/HomeEngine';
import K2Layout from '../components/home/K2Layout';
import { sanitizeHTML } from '../components/RichContentViewer';

const ITEM_ICONS = {
  Page: FileText,
  Assignment: PenTool,
  Quiz: HelpCircle,
  ExternalUrl: ExternalLink,
  SubHeader: Minus,
};

const ModuleList = ({ courseId, modules }) => {
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    const expanded = {};
    modules.forEach(m => { expanded[m.id] = true; });
    setExpandedModules(expanded);
  }, [modules]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const getItemIcon = (type) => {
    const Icon = ITEM_ICONS[type] || Book;
    return <Icon className="w-4 h-4 text-gray-500" />;
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getItemLink = (item) => {
    if (item.type === 'Assignment' && item.content_id) {
      return `/courses/${courseId}/assignments/${item.content_id}`;
    }
    if (item.type === 'Quiz' && item.content_id) {
      return `/courses/${courseId}/quizzes/${item.content_id}/take`;
    }
    if (item.type === 'Page' && item.content_id) {
      return `/courses/${courseId}/pages/${item.content_id}`;
    }
    if (item.type === 'Discussion' && item.content_id) {
      return `/courses/${courseId}/discussions/${item.content_id}`;
    }
    if (item.type === 'ExternalUrl' && item.url) {
      return item.url;
    }
    return null;
  };

  const renderModuleItem = (item) => {
    const isAssignment = item.type === 'Assignment';
    const link = getItemLink(item);
    const isExternal = item.type === 'ExternalUrl';
    const content = (
      <>
        {getItemIcon(item.type)}
        <span className="text-sm flex-1">{item.title}</span>
        {isAssignment && item.content_details && (
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            {item.content_details.points_possible !== undefined && (
              <span className="flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>{item.content_details.points_possible} pts</span>
              </span>
            )}
            {item.content_details.due_at && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Due {formatDueDate(item.content_details.due_at)}</span>
              </span>
            )}
          </div>
        )}
      </>
    );

    if (link) {
      return isExternal ? (
        <a
          key={item.id}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 py-2 px-6 hover:bg-gray-100"
          style={{ paddingLeft: `${1.5 + item.indent * 1.5}rem` }}
        >
          {content}
        </a>
      ) : (
        <Link
          key={item.id}
          to={link}
          className="flex items-center space-x-3 py-2 px-6 hover:bg-gray-100"
          style={{ paddingLeft: `${1.5 + item.indent * 1.5}rem` }}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={item.id}
        className="flex items-center space-x-3 py-2 px-6 hover:bg-gray-100"
        style={{ paddingLeft: `${1.5 + item.indent * 1.5}rem` }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Modules</h3>
      </div>
      {modules.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No modules yet.</div>
      ) : (
        <div className="divide-y">
          {modules.map((module) => (
            <div key={module.id}>
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                onClick={() => toggleModule(module.id)}
              >
                <span className="font-medium">{module.name}</span>
                {expandedModules[module.id] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedModules[module.id] && module.items && (
                <div className="bg-gray-50 border-t">
                  {module.items.map((item) => renderModuleItem(item))}
                  {module.items.length === 0 && (
                    <div className="py-3 px-6 text-sm text-gray-400">No items</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SetupChecklist = ({ courseId, course, modules }) => {
  const [assignments, setAssignments] = useState(null);
  const [enrollments, setEnrollments] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.getAssignments(courseId, 1, 1),
      api.getEnrollments(courseId, 1, 5),
    ]).then(([aResult, eResult]) => {
      setAssignments(aResult.status === 'fulfilled' ? (aResult.value?.data || []) : []);
      setEnrollments(eResult.status === 'fulfilled' ? (eResult.value?.data || []) : []);
    });
  }, [courseId]);

  const hasModules = modules && modules.length > 0;
  const hasAssignments = assignments && assignments.length > 0;
  const hasStudents = enrollments && enrollments.some(e =>
    e.type === 'StudentEnrollment' || e.enrollment_type === 'student'
  );
  const hasSyllabus = !!course.syllabus_body;

  const items = [
    {
      label: 'Create your first module',
      done: hasModules,
      link: `/courses/${courseId}/modules`,
      icon: LayoutIcon,
    },
    {
      label: 'Add an assignment',
      done: hasAssignments,
      link: `/courses/${courseId}/assignments`,
      icon: PenTool,
    },
    {
      label: 'Enroll students',
      done: hasStudents,
      link: `/courses/${courseId}/people`,
      icon: Users,
    },
    {
      label: 'Add syllabus or course description',
      done: hasSyllabus,
      link: `/courses/${courseId}/syllabus`,
      icon: FileText,
    },
    {
      label: 'Configure course settings',
      done: false, // Always available as a link
      link: `/courses/${courseId}/settings`,
      icon: Settings,
    },
  ];

  const completedCount = items.filter(i => i.done).length;
  const stillLoading = assignments === null || enrollments === null;

  if (stillLoading) return null;

  // Don't show if most items are done
  if (completedCount >= 4) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Get Started with Your Course</h3>
        <span className="ml-auto text-xs text-blue-600 font-medium">
          {completedCount} of {items.length - 1} complete
        </span>
      </div>
      <p className="text-sm text-blue-700 mb-4">Complete these steps to set up your course for students.</p>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.link}
              className={`flex items-center gap-3 p-2.5 rounded-md transition-colors ${
                item.done
                  ? 'bg-green-50 text-green-700'
                  : 'bg-white text-gray-700 hover:bg-blue-100'
              }`}
            >
              {item.done ? (
                <CheckCircle className="w-4.5 h-4.5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className={`text-sm ${item.done ? 'line-through' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const CoursePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const isTeacher = useIsTeacher(courseId);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, modulesResult] = await Promise.all([
          api.getCourse(courseId),
          api.getModules(courseId, 1, 100, true),
        ]);
        setCourse(courseData);
        setModules(modulesResult.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading course...
</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-center py-12">
  <p className="text-red-600 mb-3">{error}</p>
  <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
</div></Layout>;
  }
  if (!course) {
    return <Layout><div className="text-center py-12">Course not found</div></Layout>;
  }

  const isK2 = course.ui_mode === 'k2';
  const defaultView = course.default_view || 'modules';

  // K-2 mode with home engine: use K2Layout, no CourseNav
  if (isK2 && defaultView === 'home_engine') {
    return (
      <K2Layout>
        <HomeEngine />
      </K2Layout>
    );
  }

  const renderContent = () => {
    switch (defaultView) {
      case 'home_engine':
        return <HomeEngine />;
      case 'syllabus':
        return course.syllabus_body ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Syllabus</h3>
            <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(course.syllabus_body) }} />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No syllabus content.</div>
        );
      case 'modules':
      default:
        return (
          <>
            {course.syllabus_body && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="font-semibold mb-2">Syllabus</h3>
                <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(course.syllabus_body) }} />
              </div>
            )}
            <ModuleList courseId={courseId} modules={modules} />
          </>
        );
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Back to Dashboard</Link>
        <div className="mt-2">
          <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
          <p className="text-gray-500">{course.course_code}</p>
        </div>
      </div>

      <CourseNav />

      {isTeacher && <SetupChecklist courseId={courseId} course={course} modules={modules} />}

      {renderContent()}
    </Layout>
  );
};

export default CoursePage;
