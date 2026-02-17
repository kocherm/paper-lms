import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, X, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';

const ACCOUNT_ID = 1;

const DeveloperKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchKeys = useCallback(async () => {
    try {
      const { data } = await api.getDeveloperKeys(ACCOUNT_ID, 1, 100);
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const formData = new FormData(e.target);

    const redirectUrisRaw = formData.get('redirect_uris');
    const redirectUris = redirectUrisRaw
      ? redirectUrisRaw.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const scopesRaw = formData.get('scopes');
    const scopes = scopesRaw
      ? scopesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const developerKey = {
      name: formData.get('name'),
      email: formData.get('email') || undefined,
      redirect_uri: formData.get('redirect_uri') || undefined,
      redirect_uris: redirectUris,
      notes: formData.get('notes') || undefined,
      scopes: scopes,
    };

    // Remove undefined fields
    Object.keys(developerKey).forEach(
      (k) => developerKey[k] === undefined && delete developerKey[k]
    );

    try {
      const data = await api.createDeveloperKey(ACCOUNT_ID, developerKey);
      setNewKeyData(data);
      setShowForm(false);
      fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggle = async (key) => {
    setToggling(key.id);
    setError(null);
    const newState = key.workflow_state === 'active' ? 'inactive' : 'active';
    try {
      await api.updateDeveloperKey(ACCOUNT_ID, key.id, { workflow_state: newState });
      fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (keyId) => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteDeveloperKey(ACCOUNT_ID, keyId);
      setDeleteConfirm(null);
      fetchKeys();
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
    });
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Developer Keys</h2>
          <p className="text-gray-600 mt-1">
            Manage OAuth2 client credentials for third-party application integrations.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setNewKeyData(null);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Developer Key
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

      {/* New Key Credentials Display */}
      {newKeyData && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Developer Key Created</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save these credentials now. The client secret will not be shown again.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Client ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-gray-900 break-all">
                      {newKeyData.api_key || newKeyData.client_id || newKeyData.id}
                    </code>
                    <button
                      onClick={() => handleCopy(String(newKeyData.api_key || newKeyData.client_id || newKeyData.id), 'client_id')}
                      className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 text-sm flex-shrink-0"
                    >
                      {copiedField === 'client_id' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Client Secret</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-gray-900 break-all">
                      {newKeyData.api_secret || newKeyData.client_secret || 'N/A'}
                    </code>
                    <button
                      onClick={() => handleCopy(String(newKeyData.api_secret || newKeyData.client_secret || ''), 'client_secret')}
                      className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50 text-sm flex-shrink-0"
                    >
                      {copiedField === 'client_secret' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setNewKeyData(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Add Developer Key</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Application"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Email
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="developer@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URI
              </label>
              <input
                name="redirect_uri"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/oauth2/callback"
              />
              <p className="text-xs text-gray-500 mt-1">Primary redirect URI for OAuth2 flow.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Redirect URIs
              </label>
              <textarea
                name="redirect_uris"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={"https://example.com/callback1\nhttps://example.com/callback2"}
              />
              <p className="text-xs text-gray-500 mt-1">One URI per line.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Internal notes about this developer key..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
              <textarea
                name="scopes"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={"url:GET|/api/v1/courses\nurl:POST|/api/v1/courses/:id/assignments"}
              />
              <p className="text-xs text-gray-500 mt-1">
                One scope per line. Leave blank to allow all scopes.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Key'}
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
            <h3 className="font-semibold text-gray-900 mb-2">Delete Developer Key</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this developer key? All applications using these credentials will stop working.
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
                {deleting ? 'Deleting...' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Keys List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading developer keys...</div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <KeyRound className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Developer Keys</h3>
          <p className="text-gray-500 text-sm">
            No developer keys have been created yet. Create one to enable OAuth2 integrations.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Redirect URI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{key.name || 'Unnamed'}</span>
                        {key.email && (
                          <p className="text-xs text-gray-500">{key.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {key.api_key || key.client_id || key.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 break-all max-w-xs block truncate" title={key.redirect_uri}>
                      {key.redirect_uri || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        key.workflow_state === 'active'
                          ? 'bg-green-100 text-green-800'
                          : key.workflow_state === 'inactive'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {key.workflow_state || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {key.is_lti_key ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        LTI
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        OAuth2
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(key)}
                        disabled={toggling === key.id}
                        className="text-gray-500 hover:text-gray-700 p-1 disabled:opacity-50"
                        title={key.workflow_state === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {key.workflow_state === 'active' ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(key.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default DeveloperKeysPage;
