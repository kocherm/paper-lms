import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';
import { sanitizeHTML } from '../components/RichContentViewer';
import { Clock, CheckCircle, AlertTriangle, Megaphone, Calendar, BookOpen, Users } from 'lucide-react';

const COURSE_COLORS = [
  '#0374B5', '#127A1B', '#8B2252', '#BF3E1B',
  '#6425AE', '#0B6E99', '#C23C0E', '#1770AB',
  '#2D7E2D', '#9B2783', '#D04423', '#4938BA',
];

const DashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const fetchData = async () => {
      try {
        const { data: courseData } = await api.getCourses(1, 50);
        setCourses(courseData || []);
        setLoading(false); // Show courses immediately

        // Fetch upcoming assignments and announcements in parallel across courses
        const now = new Date();
        const allAssignments = [];
        const allAnnouncements = [];

        // Limit to first 8 courses to avoid excessive API calls
        const coursesToFetch = (courseData || []).slice(0, 8);

        const fetches = coursesToFetch.map(async (course) => {
          const [assignResult, announcementResult, subResult] = await Promise.allSettled([
            api.getAssignments(course.id, 1, 20),
            api.getCourseAnnouncements(course.id, 1, 5),
            api.getCourseSubmissions(course.id, 1, 10000, 'self').catch(() => ({ data: [] })),
          ]);

          // Build submission lookup for this course
          const subMap = {};
          if (subResult.status === 'fulfilled') {
            const subs = subResult.value?.data || subResult.value || [];
            for (const s of (Array.isArray(subs) ? subs : [])) {
              if (s.assignment_id) subMap[s.assignment_id] = s;
            }
          }

          if (assignResult.status === 'fulfilled') {
            const assignments = assignResult.value.data || [];
            assignments.forEach(a => {
              if (a.due_at) {
                const dueDate = new Date(a.due_at);
                if (dueDate >= now) {
                  const sub = subMap[a.id];
                  allAssignments.push({
                    ...a,
                    course_name: course.name,
                    course_id: course.id,
                    submission_state: sub?.workflow_state || null,
                    submitted_at: sub?.submitted_at || null,
                  });
                }
              }
            });
          }

          if (announcementResult.status === 'fulfilled') {
            const anns = announcementResult.value.data || [];
            anns.forEach(a => {
              allAnnouncements.push({ ...a, course_name: course.name, course_id: course.id });
            });
          }
        });

        await Promise.allSettled(fetches);

        // Sort assignments by due date (soonest first), take top 8
        allAssignments.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
        setUpcomingAssignments(allAssignments.slice(0, 8));

        // Sort announcements by created_at (newest first), take top 5
        allAnnouncements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAnnouncements(allAnnouncements.slice(0, 5));

        // Fetch calendar events
        try {
          const calResult = await api.getCalendarEvents(1, 10);
          const upcoming = (calResult.data || []).filter(e => new Date(e.start_at) >= now);
          upcoming.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
          setCalendarEvents(upcoming.slice(0, 5));
        } catch { /* Calendar events are optional */ }

        setDetailsLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setDetailsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDueDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getDueUrgency = (dateStr) => {
    const diffMs = new Date(dateStr) - new Date();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'text-red-600 bg-red-50';
    if (diffDays <= 3) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatTimeAgo = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading dashboard...
</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-12">
  <p className="text-red-600 mb-3">{error}</p>
  <button onClick={() => { setError(null); setLoading(true); fetchData(); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
</div></Layout>;
  }

  if (courses.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Welcome to Paper LMS!</p>
          <p className="text-gray-400 mb-6">You don't have any courses yet.</p>
          <Link
            to="/courses"
            className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      </div>

      {/* Top row: Upcoming + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Upcoming Assignments</h3>
          </div>
          {detailsLoading ? (
            <div className="flex items-center justify-center p-6 gap-2 text-gray-400">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              Loading assignments...
            </div>
          ) : upcomingAssignments.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p>All caught up! No upcoming assignments.</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAssignments.map((a) => {
                const isSubmitted = a.submission_state === 'submitted' || a.submission_state === 'graded' || a.submission_state === 'pending_review';
                const isGraded = a.submission_state === 'graded';
                return (
                  <Link
                    key={`${a.course_id}-${a.id}`}
                    to={`/courses/${a.course_id}/assignments/${a.id}`}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${isSubmitted ? 'opacity-70' : ''}`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      {isGraded ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : isSubmitted ? (
                        <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : null}
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>{a.name}</div>
                        <div className="text-xs text-gray-500 truncate">{a.course_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {isGraded ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">Graded</span>
                      ) : isSubmitted ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Submitted</span>
                      ) : (
                        <>
                          {a.points_possible > 0 && (
                            <span className="text-xs text-gray-400">{a.points_possible} pts</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDueUrgency(a.due_at)}`}>
                            {formatDueDate(a.due_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Announcements + Calendar */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Announcements</h3>
            </div>
            {detailsLoading ? (
              <div className="flex items-center justify-center p-4 gap-2 text-gray-400 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                Loading...
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No recent announcements.</div>
            ) : (
              <div className="divide-y">
                {announcements.map((a) => (
                  <Link
                    key={a.id}
                    to={`/courses/${a.course_id}/announcements`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{a.title}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-between mt-0.5">
                      <span className="truncate">{a.course_name}</span>
                      <span className="flex-shrink-0 ml-2">{formatTimeAgo(a.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          {calendarEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <div className="divide-y">
                {calendarEvents.map((e) => (
                  <Link
                    key={e.id}
                    to="/calendar"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{e.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(e.start_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">My Courses ({courses.length})</h3>
        <Link to="/courses" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          All Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {courses.map((course, index) => {
          const color = COURSE_COLORS[index % COURSE_COLORS.length];
          return (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="h-36 relative"
                style={{ backgroundColor: color }}
              >
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
                  <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">
                    {course.name}
                  </h3>
                  <p className="text-white/80 text-xs mt-1">{course.course_code}</p>
                </div>
              </div>
              <div className="p-4">
                {course.syllabus_body ? (
                  <p
                    className="text-gray-500 text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(course.syllabus_body) }}
                  />
                ) : (
                  <p className="text-gray-400 text-sm italic">No syllabus</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {course.total_students != null && course.total_students > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {course.total_students}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                    View Course →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export default DashboardPage;
