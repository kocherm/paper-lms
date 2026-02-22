import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Pin, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import RichContentEditor from '../components/RichContentEditor';
import useCrossCourseCheck from '../hooks/useCrossCourseCheck';
import CrossCourseWarningDialog from '../components/CrossCourseWarningDialog';

const DiscussionsPage = () => {
  const { courseId } = useParams();
  const isTeacher = useIsTeacher(courseId);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    discussion_type: 'side_comment',
    pinned: false,
  });
  const [creating, setCreating] = useState(false);
  const { issues: crossCourseIssues, checkAndSave, dismiss: dismissCrossCourse, confirm: confirmCrossCourse } = useCrossCourseCheck(courseId);

  const fetchTopics = async () => {
    try {
      const result = await api.getDiscussionTopics(courseId);
      setTopics(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  const resetForm = () => {
    setFormData({ title: '', message: '', discussion_type: 'side_comment', pinned: false });
    setEditingId(null);
  };

  const doCreate = async () => {
    setCreating(true);
    try {
      if (editingId) {
        await api.updateDiscussionTopic(courseId, editingId, formData);
      } else {
        await api.createDiscussionTopic(courseId, formData);
      }
      resetForm();
      setShowForm(false);
      setLoading(true);
      await fetchTopics();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    checkAndSave(formData.message, doCreate);
  };

  const handleEdit = (topic) => {
    setFormData({
      title: topic.title || '',
      message: topic.message || '',
      discussion_type: topic.discussion_type || 'side_comment',
      pinned: topic.pinned || false,
    });
    setEditingId(topic.id);
    setShowForm(true);
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Delete this discussion topic?')) return;
    try {
      await api.deleteDiscussionTopic(courseId, topicId);
      setLoading(true);
      await fetchTopics();
    } catch (err) {
      setError(err.message);
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
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading discussions...
</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-center py-12">
  <p className="text-red-600 mb-3">{error}</p>
  <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
</div></Layout>;
  }

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          &larr; Back to Course
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">Discussions</h2>
          {isTeacher && (
            <button
              onClick={() => {
                if (showForm) { resetForm(); }
                setShowForm(!showForm);
              }}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? 'Cancel' : 'New Discussion'}</span>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Discussion Topic' : 'Create Discussion Topic'}</h3>
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
              <RichContentEditor
                value={formData.message}
                onChange={(html) => setFormData((prev) => ({ ...prev, message: html }))}
                placeholder="Discussion topic content..."
                minHeight="160px"
                courseId={courseId}
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
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Saving...' : editingId ? 'Update Topic' : 'Create Topic'}
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
              <div key={topic.id} className="flex items-center justify-between p-4 hover:bg-gray-50 group">
                <Link
                  to={`/courses/${courseId}/discussions/${topic.id}`}
                  className="flex items-center space-x-3 min-w-0 flex-1"
                >
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 truncate">{topic.title}</span>
                      {topic.pinned && (
                        <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {topic.discussion_type === 'side_comment' ? 'Side Comment' : topic.discussion_type === 'threaded' ? 'Threaded' : topic.discussion_type}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">
                    {formatDate(topic.created_at)}
                  </span>
                  {isTeacher && (
                    <>
                      <button
                        onClick={(e) => { e.preventDefault(); handleEdit(topic); }}
                        className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(topic.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CrossCourseWarningDialog issues={crossCourseIssues} onGoBack={dismissCrossCourse} onSaveAnyway={confirmCrossCourse} />
    </Layout>
  );
};

export default DiscussionsPage;
