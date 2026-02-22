import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Users } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchCourses = async () => {
    try {
      const { data } = await api.getAllCourses(1, 100);
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.target);
    try {
      await api.createCourse({
        name: formData.get('name'),
        course_code: formData.get('course_code'),
      });
      setShowCreate(false);
      fetchCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Courses</h2>
          <p className="text-gray-600 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Course
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Create New Course</h3>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input id="course-name" name="name" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Introduction to Mathematics" />
            </div>
            <div className="w-40">
              <label htmlFor="course-code" className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input id="course-code" name="course_code" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="MATH101" />
            </div>
            <button type="submit" disabled={creating} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm">
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
          Loading courses...
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchCourses(); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No courses found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">{course.name}</h3>
                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <span>{course.course_code}</span>
                    {course.total_students != null && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.total_students} student{course.total_students !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                course.workflow_state === 'available' ? 'bg-green-100 text-green-800' :
                course.workflow_state === 'unpublished' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {course.workflow_state}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default CoursesPage;
