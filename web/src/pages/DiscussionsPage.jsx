import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Pin, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const DiscussionsPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    discussion_type: 'side_comment',
    pinned: false,
  });
  const [creating, setCreating] = useState(false);

  const fetchTopics = async () => {
    try {
      const result = await api.getDiscussionTopics(courseId);
      setTopics(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createDiscussionTopic(courseId, formData);
      setFormData({ title: '', message: '', discussion_type: 'side_comment', pinned: false });
      setShowForm(false);
      setLoading(true);
      await fetchTopics();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading discussions...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          &larr; Back to Course
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">Discussions</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel' : 'New Discussion'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Create Discussion Topic</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discussion Type</label>
                <select
                  value={formData.discussion_type}
                  onChange={(e) => setFormData({ ...formData, discussion_type: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="side_comment">Side Comment</option>
                  <option value="threaded">Threaded</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="pinned" className="text-sm text-gray-700">Pinned</label>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Topic'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Topics</h3>
        </div>
        {topics.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No discussions yet.</div>
        ) : (
          <div className="divide-y">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/courses/${courseId}/discussions/${topic.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 truncate">{topic.title}</span>
                      {topic.pinned && (
                        <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{topic.discussion_type}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                  {formatDate(topic.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DiscussionsPage;
