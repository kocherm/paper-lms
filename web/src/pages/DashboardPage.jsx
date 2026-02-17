import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../components/Layout';

const COURSE_COLORS = [
  'border-l-blue-500', 'border-l-green-500', 'border-l-purple-500',
  'border-l-red-500', 'border-l-yellow-500', 'border-l-pink-500',
  'border-l-indigo-500', 'border-l-teal-500',
];

const DashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.getCourses(1, 50);
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome to Paper LMS</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading courses...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-12">{error}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No courses yet.</p>
          <Link
            to="/courses"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 ${COURSE_COLORS[index % COURSE_COLORS.length]}`}
            >
              <h3 className="text-lg font-semibold mb-1">{course.name}</h3>
              <p className="text-gray-500 text-sm mb-3">{course.course_code}</p>
              {course.syllabus_body && (
                <p className="text-gray-600 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: course.syllabus_body }} />
              )}
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;
