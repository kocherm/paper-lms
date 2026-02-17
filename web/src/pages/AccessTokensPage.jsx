import React, { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const AccessTokensPage = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const userId = user?.id;

  const fetchTokens = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.getAccessTokens(userId, 1, 100);
      setTokens(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const formData = new FormData(e.target);
    const purpose = formData.get('purpose');
    const scopesRaw = formData.get('scopes');
    const scopes = scopesRaw
      ? scopesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    try {
      const data = await api.createAccessToken(userId, {
        purpose,
        ...(scopes && scopes.length > 0 ? { scopes } : {}),
      });
      setNewToken(data);
      setShowForm(false);
      fetchTokens();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    const tokenString = newToken?.visible_token || newToken?.full_token || newToken?.token;
    if (!tokenString) return;
    try {
      await navigator.clipboard.writeText(tokenString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const textArea = document.createElement('textarea');
      textArea.value = tokenString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (tokenId) => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccessToken(userId, tokenId);
      setDeleteConfirm(null);
      fetchTokens();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal Access Tokens</h2>
          <p className="text-gray-600 mt-1">
            Manage tokens for API access. Tokens allow third-party applications to access the API on your behalf.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setNewToken(null);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Generate New Token
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New Token Display */}
      {newToken && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Token Generated Successfully</h3>
              <p className="text-sm text-gray-600 mb-3">
                Copy your personal access token now. You will not be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-gray-900 break-all">
                  {newToken.visible_token || newToken.full_token || newToken.token}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 text-sm flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <button onClick={() => setNewToken(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Generate New Token</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose <span className="text-red-500">*</span>
              </label>
              <input
                name="purpose"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., CI/CD pipeline, Mobile app, Script"
              />
              <p className="text-xs text-gray-500 mt-1">A description of what this token will be used for.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
              <textarea
                name="scopes"
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., read:courses, write:submissions, read:users"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of scopes. Leave blank for full access.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {creating ? 'Generating...' : 'Generate Token'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this token? Any applications using it will lose access immediately.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tokens...</div>
      ) : tokens.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Access Tokens</h3>
          <p className="text-gray-500 text-sm">
            You have not generated any personal access tokens yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scopes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokens.map((token) => (
                <tr key={token.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">
                        {token.purpose || 'Unnamed token'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      ...{token.token_hint || '****'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {token.scopes && token.scopes.length > 0 ? (
                        token.scopes.map((scope, i) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {scope}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Full access</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(token.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(token.last_used_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setDeleteConfirm(token.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete token"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default AccessTokensPage;
