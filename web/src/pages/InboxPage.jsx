import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Plus, MessageSquare, Check, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const InboxPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newConv, setNewConv] = useState({ subject: '', recipients: '', body: '' });
  const [creating, setCreating] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    setError(null);
    try {
      const { data } = await api.getConversationMessages(conv.id);
      setMessages(data);
      // Mark as read
      await api.markConversationAsRead(conv.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      const newMsg = await api.createConversationMessage(selectedConv.id, replyText);
      setMessages((prev) => [...prev, newMsg]);
      setReplyText('');
      // Refresh conversation list to update last_message_at
      fetchConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const recipientIDs = newConv.recipients
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const conv = await api.createConversation({
        subject: newConv.subject,
        recipients: recipientIDs,
      });

      // Send initial message if provided
      if (newConv.body.trim()) {
        await api.createConversationMessage(conv.id, newConv.body);
      }

      setNewConv({ subject: '', recipients: '', body: '' });
      setShowNewForm(false);
      setLoading(true);
      await fetchConversations();
      // Select the newly created conversation
      setSelectedConv(conv);
      if (newConv.body.trim()) {
        const { data } = await api.getConversationMessages(conv.id);
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-500">Loading inbox...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Inbox
        </h2>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            if (showNewForm) setNewConv({ subject: '', recipients: '', body: '' });
          }}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          {showNewForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showNewForm ? 'Cancel' : 'New Conversation'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-md p-3 mb-4 text-sm">{error}</div>
      )}

      {showNewForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">New Conversation</h3>
          <form onSubmit={handleCreateConversation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={newConv.subject}
                onChange={(e) => setNewConv({ ...newConv, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Conversation subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient IDs (comma-separated)
              </label>
              <input
                type="text"
                value={newConv.recipients}
                onChange={(e) => setNewConv({ ...newConv, recipients: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g. 2, 3, 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={newConv.body}
                onChange={(e) => setNewConv({ ...newConv, body: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write your first message..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Conversation'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Left panel - conversation list */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No conversations yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.subject || '(No subject)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        From user #{conv.created_by_user_id}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel - message thread */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {selectedConv.subject || '(No subject)'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Started by user #{selectedConv.created_by_user_id}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              User #{msg.user_id}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-200' : 'text-gray-400'
                            }`}
                          >
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply area */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendReply} className="flex items-end space-x-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Mail className="w-12 h-12 mb-3" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InboxPage;
