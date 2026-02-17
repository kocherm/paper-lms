import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';

const QuizSubmissionsPage = () => {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizData, subsResult] = await Promise.all([
          api.getQuiz(courseId, quizId),
          api.getQuizSubmissions(courseId, quizId, 1, 100),
        ]);
        setQuiz(quizData);
        setSubmissions(subsResult.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, quizId]);

  const stateIcon = (state) => {
    switch (state) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_review': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading submissions...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">← Back to Course</Link>
        <h2 className="text-2xl font-bold mt-2">{quiz?.title} - Submissions</h2>
        <p className="text-gray-500">
          {quiz?.points_possible ? `${quiz.points_possible} points` : 'Ungraded'}
          {quiz?.time_limit ? ` · ${quiz.time_limit} min time limit` : ''}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Attempt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Finished</th>
              <th className="px-4 py-3">Time Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No submissions yet.</td>
              </tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">User #{sub.user_id}</td>
                  <td className="px-4 py-3 text-sm">{sub.attempt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {stateIcon(sub.workflow_state)}
                      <span className="text-sm capitalize">{sub.workflow_state?.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {sub.score !== null && sub.score !== undefined ? sub.score : '-'}
                    {sub.score !== null && quiz?.points_possible ? ` / ${quiz.points_possible}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sub.started_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sub.finished_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDuration(sub.time_spent)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default QuizSubmissionsPage;
