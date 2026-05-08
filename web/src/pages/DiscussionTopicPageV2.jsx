import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronRight,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Edit3,
  X,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  Pin,
  CornerDownRight,
  History,
  Bold,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import RichContentViewer, { sanitizeHTML } from '../components/RichContentViewer';
import DiscussionCheckpointsPanel from '../components/DiscussionCheckpointsPanel';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function fullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function countAllReplies(entry) {
  if (!entry.replies || entry.replies.length === 0) return 0;
  let count = entry.replies.length;
  for (const reply of entry.replies) {
    count += countAllReplies(reply);
  }
  return count;
}

function countUnread(entries) {
  let count = 0;
  for (const entry of entries) {
    if (entry.read_state === 'unread') count++;
    if (entry.replies) count += countUnread(entry.replies);
  }
  return count;
}

/** Get initials from a name string, up to 2 characters. */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Stable color from a string (for avatar backgrounds). */
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-lime-600',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Highlight @mentions in an HTML string.
 * This is deliberately simple: it wraps @word tokens in a styled span.
 * Since the content comes from the server pre-sanitized, we do light post-processing.
 */
function highlightMentions(html) {
  if (!html) return '';
  return html.replace(
    /(@\w+)/g,
    '<span class="bg-blue-100 text-blue-700 rounded px-0.5 font-medium">$1</span>'
  );
}

// ---------------------------------------------------------------------------
// UserAvatar component
// ---------------------------------------------------------------------------

const UserAvatar = ({ name, avatarUrl, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name || 'User'} avatar`}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ComposeArea - inline rich compose (toolbar + contentEditable)
// ---------------------------------------------------------------------------

const ComposeArea = ({ initialValue = '', onSubmit, onCancel, submitLabel = 'Post', placeholder = 'Write your reply...', autoFocus = false }) => {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialValue) {
      editorRef.current.innerHTML = initialValue;
      setIsEmpty(false);
    }
  }, [initialValue]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = () => {
    const text = editorRef.current?.textContent?.trim() || '';
    setIsEmpty(text.length === 0);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleSubmit = async () => {
    const html = editorRef.current?.innerHTML?.trim() || '';
    if (!html || html === '<br>' || html === '<div><br></div>') return;
    setSubmitting(true);
    try {
      await onSubmit(html);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setIsEmpty(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toolbarButton = (label, icon, action) => (
    <button
      type="button"
      onClick={action}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label={label}
      title={label}
      tabIndex={-1}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 bg-gray-50" role="toolbar" aria-label="Text formatting">
        {toolbarButton('Bold', <Bold className="w-4 h-4" />, () => execCommand('bold'))}
        {toolbarButton('Italic', <Italic className="w-4 h-4" />, () => execCommand('italic'))}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        {toolbarButton('Bulleted list', <List className="w-4 h-4" />, () => execCommand('insertUnorderedList'))}
        {toolbarButton('Numbered list', <ListOrdered className="w-4 h-4" />, () => execCommand('insertOrderedList'))}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        {toolbarButton('Insert link', <LinkIcon className="w-4 h-4" />, handleInsertLink)}
      </div>

      {/* Editor */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-2 left-3 text-sm text-gray-400 pointer-events-none select-none" aria-hidden="true">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          className="min-h-[80px] max-h-[300px] overflow-y-auto px-3 py-2 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-400">
          {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to submit
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// VersionHistoryModal
// ---------------------------------------------------------------------------

const VersionHistoryModal = ({ versions, onClose }) => {
  const backdropRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Edit history"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            Edit History
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close edit history"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {!versions || versions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No edit history available.</p>
          ) : (
            versions.map((version, index) => (
              <div key={version.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Version {versions.length - index}
                  </span>
                  <span className="text-xs text-gray-500" title={fullDate(version.created_at)}>
                    {relativeTime(version.created_at)}
                  </span>
                </div>
                <RichContentViewer content={version.message} className="text-sm text-gray-800" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DeleteConfirmModal
// ---------------------------------------------------------------------------

const DeleteConfirmModal = ({ onConfirm, onCancel }) => {
  const backdropRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === backdropRef.current && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm delete"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delete Entry</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EntryItem - recursive entry component
// ---------------------------------------------------------------------------

const EntryItem = ({
  entry,
  depth = 0,
  courseId,
  topicId,
  currentUserId,
  onReply,
  onRate,
  onDelete,
  onEdit,
  onMarkRead,
  collapsedThreads,
  toggleCollapse,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const entryRef = useRef(null);

  const isOwnEntry = currentUserId && (entry.user_id === currentUserId || String(entry.user_id) === String(currentUserId));
  const isUnread = entry.read_state === 'unread';
  const hasReplies = entry.replies && entry.replies.length > 0;
  const replyCount = countAllReplies(entry);
  const isCollapsed = collapsedThreads.has(entry.id);
  const wasEdited = entry.version_count > 1;

  // IntersectionObserver: mark as read when scrolled into view
  useEffect(() => {
    if (!isUnread || !entryRef.current) return;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          onMarkRead(entry.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(entryRef.current);
    return () => observer.disconnect();
  }, [isUnread, entry.id, onMarkRead]);

  const handleReplySubmit = async (html) => {
    await onReply(entry.id, html);
    setShowReplyForm(false);
  };

  const handleEditSubmit = async (html) => {
    await onEdit(entry.id, html);
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    await onDelete(entry.id);
    setShowDeleteConfirm(false);
  };

  const handleShowVersions = async () => {
    setLoadingVersions(true);
    try {
      const data = await api.getDiscussionEntryVersions(courseId, topicId, entry.id);
      setVersions(Array.isArray(data) ? data : data?.data || []);
      setShowVersionHistory(true);
    } catch {
      // silently fail
    } finally {
      setLoadingVersions(false);
    }
  };

  // Depth color bands for visual thread indication
  const depthColors = [
    'border-blue-400',
    'border-emerald-400',
    'border-violet-400',
    'border-amber-400',
    'border-rose-400',
    'border-cyan-400',
  ];
  const borderColor = depth === 0 ? 'border-blue-400' : depthColors[depth % depthColors.length];

  return (
    <article
      ref={entryRef}
      className={`group ${depth > 0 ? 'ml-6 sm:ml-10' : ''}`}
      aria-label={`Post by ${entry.user_name || 'Unknown user'}`}
    >
      <div
        className={`relative border-l-[3px] ${borderColor} rounded-r-lg pl-4 pr-4 py-3 transition-colors ${
          isUnread ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50/50'
        }`}
      >
        {/* Unread indicator dot */}
        {isUnread && (
          <span
            className="absolute -left-[7px] top-5 w-[11px] h-[11px] bg-blue-500 rounded-full border-2 border-white"
            aria-label="Unread"
          />
        )}

        {/* Header row: avatar + name + time + actions */}
        <div className="flex items-start gap-3">
          <UserAvatar
            name={entry.user_name}
            avatarUrl={entry.user_avatar_url}
            size={depth === 0 ? 'md' : 'sm'}
          />

          <div className="flex-1 min-w-0">
            {/* Name + time row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {entry.user_name || `User ${entry.user_id}`}
              </span>
              <span
                className="text-xs text-gray-400"
                title={fullDate(entry.created_at)}
              >
                {relativeTime(entry.created_at)}
              </span>
              {wasEdited && (
                <button
                  onClick={handleShowVersions}
                  disabled={loadingVersions}
                  className="text-xs text-gray-400 hover:text-blue-600 italic inline-flex items-center gap-0.5 transition-colors"
                  aria-label="View edit history"
                >
                  {loadingVersions ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <History className="w-3 h-3" />
                  )}
                  edited
                </button>
              )}
            </div>

            {/* Message body */}
            {showEditForm ? (
              <div className="mt-2">
                <ComposeArea
                  initialValue={entry.message}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setShowEditForm(false)}
                  submitLabel="Save"
                  placeholder="Edit your message..."
                  autoFocus
                />
              </div>
            ) : (
              <RichContentViewer content={highlightMentions(entry.message)} className="mt-1 text-sm text-gray-800 break-words" />
            )}

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2">
              {/* Like */}
              <button
                onClick={() => onRate(entry.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  entry.rating_sum > 0
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                }`}
                aria-label={`Like (${entry.rating_sum || 0} likes)`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {entry.rating_sum > 0 && <span>{entry.rating_sum}</span>}
              </button>

              {/* Reply */}
              <button
                onClick={() => {
                  setShowReplyForm(!showReplyForm);
                  setShowEditForm(false);
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  showReplyForm
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                }`}
                aria-label="Reply to this post"
                aria-expanded={showReplyForm}
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Reply
              </button>

              {/* Edit (own entries only) */}
              {isOwnEntry && !showEditForm && (
                <button
                  onClick={() => {
                    setShowEditForm(true);
                    setShowReplyForm(false);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Edit this post"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}

              {/* Delete (own entries only) */}
              {isOwnEntry && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label="Delete this post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Collapse/expand toggle for threads */}
              {hasReplies && (
                <button
                  onClick={() => toggleCollapse(entry.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? `Expand ${replyCount} replies` : 'Collapse thread'}
                >
                  {isCollapsed ? (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Collapse</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Inline reply form */}
            {showReplyForm && (
              <div className="mt-3" role="region" aria-label="Reply form">
                <ComposeArea
                  onSubmit={handleReplySubmit}
                  onCancel={() => setShowReplyForm(false)}
                  submitLabel="Reply"
                  placeholder="Write a reply..."
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-1 space-y-1" role="list" aria-label="Replies">
          {entry.replies.map((reply) => (
            <EntryItem
              key={reply.id}
              entry={reply}
              depth={depth + 1}
              courseId={courseId}
              topicId={topicId}
              currentUserId={currentUserId}
              onReply={onReply}
              onRate={onRate}
              onDelete={onDelete}
              onEdit={onEdit}
              onMarkRead={onMarkRead}
              collapsedThreads={collapsedThreads}
              toggleCollapse={toggleCollapse}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showVersionHistory && (
        <VersionHistoryModal
          versions={versions}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </article>
  );
};

// ---------------------------------------------------------------------------
// DiscussionTopicPageV2 - main component
// ---------------------------------------------------------------------------

const DiscussionTopicPageV2 = () => {
  const { courseId, topicId } = useParams();
  const { user } = useAuth();
  const isTeacher = useIsTeacher(courseId);

  // Phase 5 Wave 1: api adapter for the DiscussionCheckpointsPanel.
  // The panel uses a slim shape ({list, replace, update, remove, progress})
  // so it can stay decoupled from any specific HTTP client.
  const checkpointsApi = React.useMemo(() => ({
    list: (tId) => api.getDiscussionCheckpoints(courseId, tId),
    replace: (tId, payload) => api.createDiscussionCheckpoints(courseId, tId, payload),
    update: (tId, id, body) => api.updateDiscussionCheckpoint(courseId, tId, id, body),
    remove: (tId, id) => api.deleteDiscussionCheckpoint(courseId, tId, id),
    progress: (tId, uId) => api.getDiscussionCheckpointProgress(courseId, tId, uId),
  }), [courseId]);

  const [topic, setTopic] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [togglingSubscription, setTogglingSubscription] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [collapsedThreads, setCollapsedThreads] = useState(new Set());
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  // Fetch all discussion data
  const fetchData = useCallback(async () => {
    try {
      const result = await api.getDiscussionFullViewV2(courseId, topicId);
      const data = result?.data || result;
      setTopic(data.topic);
      setEntries(data.entries || []);
      // Compute unread from the entries themselves
      setUnreadCount(countUnread(data.entries || []));
      setSubscribed(data.topic?.subscribed || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, topicId]);

  // Also fetch unread count from dedicated endpoint
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await api.getDiscussionUnreadCount(courseId, topicId);
      const data = result?.data || result;
      if (typeof data === 'number') {
        setUnreadCount(data);
      } else if (data?.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
    } catch {
      // fall back to computed count from entries
    }
  }, [courseId, topicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) fetchUnreadCount();
  }, [loading, fetchUnreadCount]);

  // --- Handlers ---

  const handleReply = useCallback(async (entryId, message) => {
    await api.createDiscussionReply(courseId, topicId, entryId, message);
    await fetchData();
  }, [courseId, topicId, fetchData]);

  const handleNewEntry = useCallback(async (message) => {
    await api.createDiscussionEntry(courseId, topicId, message);
    setShowNewEntryForm(false);
    await fetchData();
  }, [courseId, topicId, fetchData]);

  const handleRate = useCallback(async (entryId) => {
    try {
      await api.rateDiscussionEntry(courseId, topicId, entryId, 1);
      await fetchData();
    } catch {
      // silently fail
    }
  }, [courseId, topicId, fetchData]);

  const handleDelete = useCallback(async (entryId) => {
    await api.deleteDiscussionEntry(courseId, topicId, entryId);
    await fetchData();
  }, [courseId, topicId, fetchData]);

  const handleEdit = useCallback(async (entryId, message) => {
    await api.updateDiscussionEntryV2(courseId, topicId, entryId, message);
    await fetchData();
  }, [courseId, topicId, fetchData]);

  const handleMarkRead = useCallback(async (entryId) => {
    try {
      await api.markDiscussionEntryRead(courseId, topicId, entryId);
      setEntries((prev) => markEntryRead(prev, entryId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, [courseId, topicId]);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAllRead(true);
    try {
      await api.markDiscussionTopicRead(courseId, topicId);
      setEntries((prev) => markAllEntriesRead(prev));
      setUnreadCount(0);
    } catch {
      // silently fail
    } finally {
      setMarkingAllRead(false);
    }
  }, [courseId, topicId]);

  const handleToggleSubscription = useCallback(async () => {
    setTogglingSubscription(true);
    try {
      await api.toggleDiscussionSubscription(courseId, topicId, !subscribed);
      setSubscribed((prev) => !prev);
    } catch {
      // silently fail
    } finally {
      setTogglingSubscription(false);
    }
  }, [courseId, topicId, subscribed]);

  const toggleCollapse = useCallback((entryId) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    const ids = new Set();
    const collect = (list) => {
      for (const entry of list) {
        if (entry.replies && entry.replies.length > 0) {
          ids.add(entry.id);
          collect(entry.replies);
        }
      }
    };
    collect(entries);
    setCollapsedThreads(ids);
  }, [entries]);

  const expandAll = useCallback(() => {
    setCollapsedThreads(new Set());
  }, []);

  // Total entry count (flat)
  const totalEntries = useMemo(() => {
    const count = (list) => {
      let n = list.length;
      for (const e of list) {
        if (e.replies) n += count(e.replies);
      }
      return n;
    };
    return count(entries);
  }, [entries]);

  // --- Render ---

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-3" role="status" aria-label="Loading discussion">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-gray-500 text-sm">Loading discussion...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-3" role="alert">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-red-600 text-sm">{error}</span>
          <button
            onClick={() => { setError(null); setLoading(true); fetchData(); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  if (!topic) {
    return (
      <Layout>
        <div className="text-center py-24 text-gray-500">Discussion not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <Link
            to={`/courses/${courseId}/discussions`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discussions
          </Link>
        </nav>

        {/* Topic header card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={topic.user_name}
                avatarUrl={topic.user_avatar_url}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {topic.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                  <h1 className="text-xl font-bold text-gray-900">{topic.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {topic.user_name || `User ${topic.user_id}`}
                  </span>
                  <span title={fullDate(topic.created_at)}>{relativeTime(topic.created_at)}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                    {topic.discussion_type === 'threaded' ? 'Threaded' : 'Side Comment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Topic body */}
            {topic.message && (
              <RichContentViewer content={highlightMentions(topic.message)} className="mt-4 text-sm text-gray-800" />
            )}

            {/* Phase 5 Wave 1: Discussion checkpoints (only render once role
                is known so teacher/student UIs don't flicker). */}
            {isTeacher !== null && (
              <div className="mt-4">
                <DiscussionCheckpointsPanel
                  api={checkpointsApi}
                  topicId={Number(topicId)}
                  isTeacher={!!isTeacher}
                  userId={user?.id}
                />
              </div>
            )}
          </div>

          {/* Topic action bar */}
          <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            {/* Subscribe toggle */}
            <button
              onClick={handleToggleSubscription}
              disabled={togglingSubscription}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subscribed
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={subscribed ? 'Unsubscribe from notifications' : 'Subscribe to notifications'}
              aria-pressed={subscribed}
            >
              {togglingSubscription ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : subscribed ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>

            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label={`Mark all ${unreadCount} entries as read`}
              >
                {markingAllRead ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark All Read
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                  {unreadCount}
                </span>
              </button>
            )}

            <div className="flex-1" />

            {/* Collapse / Expand all */}
            <button
              onClick={collapseAll}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label="Collapse all threads"
            >
              Collapse All
            </button>
            <button
              onClick={expandAll}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label="Expand all threads"
            >
              Expand All
            </button>
          </div>
        </div>

        {/* Entries section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Replies
              <span className="text-sm font-normal text-gray-400">({totalEntries})</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold" aria-label={`${unreadCount} unread`}>
                  {unreadCount} unread
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              aria-expanded={showNewEntryForm}
            >
              <MessageSquare className="w-4 h-4" />
              New Reply
            </button>
          </div>

          {/* New entry form (top) */}
          {showNewEntryForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50/30" role="region" aria-label="New reply form">
              <ComposeArea
                onSubmit={handleNewEntry}
                onCancel={() => setShowNewEntryForm(false)}
                submitLabel="Post Reply"
                placeholder="Share your thoughts..."
                autoFocus
              />
            </div>
          )}

          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="py-16 text-center" role="status">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No replies yet. Be the first to respond!</p>
              {!showNewEntryForm && (
                <button
                  onClick={() => setShowNewEntryForm(true)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Write a reply
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-2" role="list" aria-label="Discussion entries">
              {entries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  depth={0}
                  courseId={courseId}
                  topicId={topicId}
                  currentUserId={user?.id}
                  onReply={handleReply}
                  onRate={handleRate}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onMarkRead={handleMarkRead}
                  collapsedThreads={collapsedThreads}
                  toggleCollapse={toggleCollapse}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom compose area (shown when there are entries) */}
        {entries.length > 0 && !showNewEntryForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-400" />
                Post a Reply
              </h3>
              <ComposeArea
                onSubmit={handleNewEntry}
                submitLabel="Post Reply"
                placeholder="Share your thoughts..."
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// ---------------------------------------------------------------------------
// Helper functions for immutable state updates
// ---------------------------------------------------------------------------

function markEntryRead(entries, entryId) {
  return entries.map((entry) => {
    if (entry.id === entryId) {
      return { ...entry, read_state: 'read' };
    }
    if (entry.replies) {
      return { ...entry, replies: markEntryRead(entry.replies, entryId) };
    }
    return entry;
  });
}

function markAllEntriesRead(entries) {
  return entries.map((entry) => ({
    ...entry,
    read_state: 'read',
    replies: entry.replies ? markAllEntriesRead(entry.replies) : entry.replies,
  }));
}

export default DiscussionTopicPageV2;
