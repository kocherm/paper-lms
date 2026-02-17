import React, { useState } from 'react';
import { Send, Clock, CheckCircle } from 'lucide-react';

const SubmissionForm = ({ courseId, assignmentId, existingSubmission, onSubmit }) => {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ submission_type: 'online_text_entry', body });
      setBody('');
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
      {existingSubmission && existingSubmission.workflow_state !== 'unsubmitted' && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Previous Submission</span>
            </h4>
            {existingSubmission.attempt && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Attempt {existingSubmission.attempt}
              </span>
            )}
          </div>
          {existingSubmission.submitted_at && (
            <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
              <Clock className="w-3 h-3" />
              <span>Submitted {formatDate(existingSubmission.submitted_at)}</span>
            </div>
          )}
          {existingSubmission.body && (
            <div
              className="text-sm text-gray-700 prose max-w-none bg-white p-3 rounded border"
              dangerouslySetInnerHTML={{ __html: existingSubmission.body }}
            />
          )}
          {existingSubmission.grade !== null && existingSubmission.grade !== undefined && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-gray-700">Grade: </span>
              <span className="text-blue-600 font-semibold">{existingSubmission.grade}</span>
              {existingSubmission.score !== null && existingSubmission.score !== undefined && (
                <span className="text-gray-500"> ({existingSubmission.score} pts)</span>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {existingSubmission && existingSubmission.workflow_state !== 'unsubmitted'
            ? 'Resubmit'
            : 'Your Submission'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          placeholder="Enter your submission text here..."
          disabled={submitting}
        />
        {error && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Assignment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;
