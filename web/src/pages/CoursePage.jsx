import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, FileText, PenTool, HelpCircle, ExternalLink, Minus, Book, Award, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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

  const renderModuleItem = (item) => {
    const isAssignment = item.type === 'Assignment';
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

    if (isAssignment && item.content_id) {
      return (
        <Link
          key={item.id}
          to={`/courses/${courseId}/assignments/${item.content_id}`}
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

const CoursePage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
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
        setModules(modulesResult.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user?.id]);

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading course...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
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

      {renderContent()}
    </Layout>
  );
};

export default CoursePage;
