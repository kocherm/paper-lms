import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

const SubmissionComments = ({ courseId, assignmentId, userId, isTeacher }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [courseId, assignmentId, userId]);

  const fetchComments = async () => {
    try {
      const data = await api.getSubmissionComments(courseId, assignmentId, userId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = {
        text_comment: newComment,
        ...(isTeacher ? { draft: isDraft } : {}),
      };
      const created = await api.createSubmissionComment(courseId, assignmentId, userId, comment);
      setComments(prev => [...prev, created]);
      setNewComment('');
      setIsDraft(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-gray-500" />
        <h4 className="font-semibold text-gray-900">Comments</h4>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-2">Loading comments...</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-2">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-gray-400 py-2">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg p-3 text-sm ${
                comment.draft
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800">
                  {comment.author_name || comment.author?.display_name || 'Unknown'}
                </span>
                <div className="flex items-center space-x-2">
                  {comment.draft && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                      Draft
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-gray-700">{comment.comment || comment.text_comment}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t pt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {isTeacher && (
          <div className="flex items-center space-x-2 mt-2">
            <button
              type="button"
              onClick={() => setIsDraft(!isDraft)}
              className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                isDraft
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {isDraft ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Draft (not visible to student)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Published (visible to student)</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmissionComments;
