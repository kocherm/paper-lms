import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  UserPlus,
  UserMinus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Calendar,
  Bell,
  X,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const ENROLLMENT_STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  invited: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-700',
  deleted: 'bg-red-100 text-red-800',
};

const ObserverDashboardPage = () => {
  const { user } = useAuth();

  // Core data
  const [observees, setObservees] = useState([]);
  const [coursesByObservee, setCoursesByObservee] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expanded student cards
  const [expandedStudents, setExpandedStudents] = useState({});
  const [coursesLoading, setCoursesLoading] = useState({});

  // Link student form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Unlink confirmation
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  // Fetch observees
  const fetchObservees = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await api.getObservees(user.id);
      const list = Array.isArray(data) ? data : data?.data || [];
      setObservees(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchObservees();
  }, [fetchObservees]);

  // Fetch courses for a specific student
  const fetchCoursesForStudent = useCallback(async (observeeId) => {
    if (!user?.id) return;
    setCoursesLoading((prev) => ({ ...prev, [observeeId]: true }));
    try {
      const data = await api.getObserveeCourses(user.id, observeeId);
      const courses = Array.isArray(data) ? data : data?.data || [];
      setCoursesByObservee((prev) => ({ ...prev, [observeeId]: courses }));
    } catch {
      setCoursesByObservee((prev) => ({ ...prev, [observeeId]: [] }));
    } finally {
      setCoursesLoading((prev) => ({ ...prev, [observeeId]: false }));
    }
  }, [user?.id]);

  // Toggle student expand/collapse
  const toggleStudent = (observeeId) => {
    setExpandedStudents((prev) => {
      const isExpanding = !prev[observeeId];
      if (isExpanding && !coursesByObservee[observeeId]) {
        fetchCoursesForStudent(observeeId);
      }
      return { ...prev, [observeeId]: isExpanding };
    });
  };

  // Link a new student
  const handleLinkStudent = async (e) => {
    e.preventDefault();
    if (!linkInput.trim() || !user?.id) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      await api.linkObservee(user.id, linkInput.trim());
      setLinkInput('');
      setShowLinkForm(false);
      setLoading(true);
      await fetchObservees();
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  // Unlink a student
  const handleUnlinkStudent = async () => {
    if (!unlinkTarget || !user?.id) return;
    setUnlinkLoading(true);
    try {
      await api.unlinkObservee(user.id, unlinkTarget.id);
      setUnlinkTarget(null);
      setCoursesByObservee((prev) => {
        const next = { ...prev };
        delete next[unlinkTarget.id];
        return next;
      });
      setExpandedStudents((prev) => {
        const next = { ...prev };
        delete next[unlinkTarget.id];
        return next;
      });
      setLoading(true);
      await fetchObservees();
    } catch (err) {
      setError(err.message);
      setUnlinkTarget(null);
    } finally {
      setUnlinkLoading(false);
    }
  };

  // Computed stats
  const totalStudents = observees.length;
  const totalCourses = Object.values(coursesByObservee).reduce(
    (sum, courses) => sum + (courses?.length || 0),
    0
  );

  // Enrollment status label
  const getEnrollmentStatus = (course) => {
    const state = course.enrollment_state || course.workflow_state || 'active';
    return state;
  };

  const getStatusStyle = (status) => {
    return ENROLLMENT_STATUS_STYLES[status] || ENROLLMENT_STATUS_STYLES.active;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading your students...
</div>
      </Layout>
    );
  }

  if (error && observees.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchObservees(); }}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-1">
          <Eye className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Parent / Observer Dashboard</h2>
        </div>
        <p className="text-gray-600 mt-1">Monitor your linked students and their courses</p>
      </div>

      {/* Error banner (non-fatal) */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between" role="alert">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 3: Quick Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Linked Students</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Courses Observed</p>
            <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-900">&mdash;</p>
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Bell className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Announcements</p>
            <p className="text-2xl font-bold text-gray-900">&mdash;</p>
            <p className="text-xs text-gray-400">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Section 1: My Students */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span>My Students</span>
          </h3>
          <button
            onClick={() => { setShowLinkForm(!showLinkForm); setLinkError(null); setLinkInput(''); }}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            <span>Link Student</span>
          </button>
        </div>

        {/* Link Student Form */}
        {showLinkForm && (
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Link a New Student</h4>
              <button onClick={() => { setShowLinkForm(false); setLinkError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLinkStudent} className="flex items-end space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="link-student-input">
                  Student User ID or Pairing Code
                </label>
                <input
                  id="link-student-input"
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Enter user ID or pairing code"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={linkLoading || !linkInput.trim()}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>{linkLoading ? 'Linking...' : 'Link'}</span>
              </button>
            </form>
            {linkError && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}
          </div>
        )}

        {/* Student List */}
        {observees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No students linked yet.</p>
            <p className="text-gray-400 text-sm">
              Use the &ldquo;Link Student&rdquo; button above to start monitoring a student&apos;s courses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {observees.map((student) => {
              const isExpanded = expandedStudents[student.id];
              const courses = coursesByObservee[student.id] || [];
              const isCoursesLoading = coursesLoading[student.id];

              return (
                <div key={student.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Student Header (clickable to expand) */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleStudent(student.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${student.name || 'Student'}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStudent(student.id); } }}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="bg-blue-100 p-2 rounded-full">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.name || student.short_name || `Student #${student.id}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.email || student.login_id || `ID: ${student.id}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {coursesByObservee[student.id] && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setUnlinkTarget(student); }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                        title={`Unlink ${student.name || 'student'}`}
                        aria-label={`Unlink ${student.name || 'student'}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Student Course View (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                      {isCoursesLoading ? (
                        <div className="text-center py-6 text-gray-500 text-sm">Loading courses...</div>
                      ) : courses.length === 0 ? (
                        <div className="text-center py-6">
                          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No courses found for this student.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                          {courses.map((course) => {
                            const status = getEnrollmentStatus(course);
                            return (
                              <Link
                                key={course.id}
                                to={`/courses/${course.id}`}
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyle(status)}`}>
                                    {status}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                  {course.name}
                                </h4>
                                {course.course_code && (
                                  <p className="text-xs text-gray-500">{course.course_code}</p>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Placeholder: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
          </div>
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Announcements from your students&apos; courses will appear here.
            </p>
            <p className="text-gray-300 text-xs mt-1">Coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
          </div>
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Upcoming due dates for your students will appear here.
            </p>
            <p className="text-gray-300 text-xs mt-1">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Unlink Confirmation Modal */}
      {unlinkTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Unlink Student</h3>
              <button
                onClick={() => setUnlinkTarget(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={unlinkLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                <UserMinus className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    {unlinkTarget.name || `Student #${unlinkTarget.id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {unlinkTarget.email || unlinkTarget.login_id || `ID: ${unlinkTarget.id}`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to unlink this student? You will no longer be able to view
                their courses or monitor their progress. You can re-link them later if needed.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setUnlinkTarget(null)}
                disabled={unlinkLoading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkStudent}
                disabled={unlinkLoading}
                className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                <UserMinus className="w-4 h-4" />
                <span>{unlinkLoading ? 'Unlinking...' : 'Unlink Student'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ObserverDashboardPage;
