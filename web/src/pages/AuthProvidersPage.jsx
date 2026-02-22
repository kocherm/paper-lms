import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, Edit3, AlertTriangle, X, TestTube2, Check } from 'lucide-react';
import Layout from '../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const getHeaders = () => ({
  'Content-Type': 'application/json',
});

const ACCOUNT_ID = 1;

const AUTH_TYPES = [
  { value: 'saml', label: 'SAML' },
  { value: 'ldap', label: 'LDAP' },
  { value: 'cas', label: 'CAS' },
];

const EMPTY_FORM = {
  auth_type: 'saml',
  position: 1,
  // SAML
  idp_entity_id: '',
  log_in_url: '',
  log_out_url: '',
  certificate_fingerprint: '',
  // LDAP
  ldap_host: '',
  ldap_port: '',
  ldap_base: '',
  ldap_filter: '',
  ldap_bind_dn: '',
  ldap_bind_password: '',
  ldap_use_tls: false,
  ldap_login_attribute: 'uid',
  // CAS
  cas_base_url: '',
  cas_login_url: '',
  cas_validate_url: '',
  cas_logout_url: '',
  // General
  jit_provisioning: false,
};

const AuthProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState(null);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/authentication_providers?per_page=100`, {
        credentials: 'include', headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch authentication providers');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (provider) => {
    setFormData({
      auth_type: provider.auth_type || 'saml',
      position: provider.position || 1,
      idp_entity_id: provider.idp_entity_id || '',
      log_in_url: provider.log_in_url || '',
      log_out_url: provider.log_out_url || '',
      certificate_fingerprint: provider.certificate_fingerprint || '',
      ldap_host: provider.ldap_host || '',
      ldap_port: provider.ldap_port || '',
      ldap_base: provider.ldap_base || '',
      ldap_filter: provider.ldap_filter || '',
      ldap_bind_dn: provider.ldap_bind_dn || '',
      ldap_bind_password: '',
      ldap_use_tls: provider.ldap_use_tls || false,
      ldap_login_attribute: provider.ldap_login_attribute || 'uid',
      cas_base_url: provider.cas_base_url || '',
      cas_login_url: provider.cas_login_url || '',
      cas_validate_url: provider.cas_validate_url || '',
      cas_logout_url: provider.cas_logout_url || '',
      jit_provisioning: provider.jit_provisioning || false,
    });
    setEditingId(provider.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const body = { ...formData };
    if (body.ldap_port) {
      body.ldap_port = parseInt(body.ldap_port, 10) || 0;
    }
    body.position = parseInt(body.position, 10) || 1;

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/authentication_providers/${editingId}`, {
          method: 'PUT',
          credentials: 'include', headers: getHeaders(),
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/authentication_providers`, {
          method: 'POST',
          credentials: 'include', headers: getHeaders(),
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.errors?.[0]?.message || 'Failed to save provider');
      }

      setSuccess(editingId ? 'Provider updated successfully.' : 'Provider created successfully.');
      resetForm();
      fetchProviders();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/authentication_providers/${id}`, {
        method: 'DELETE',
        credentials: 'include', headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete provider');
      setDeleteConfirm(null);
      setSuccess('Provider deleted successfully.');
      fetchProviders();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/accounts/${ACCOUNT_ID}/authentication_providers/${id}/test`, {
        method: 'POST',
        credentials: 'include', headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to test connection');
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTestingId(null);
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

  const authTypeLabel = (type) => {
    switch (type) {
      case 'saml': return 'SAML';
      case 'ldap': return 'LDAP';
      case 'cas': return 'CAS';
      default: return type;
    }
  };

  const authTypeBadgeClass = (type) => {
    switch (type) {
      case 'saml': return 'bg-blue-100 text-blue-800';
      case 'ldap': return 'bg-purple-100 text-purple-800';
      case 'cas': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTypeFields = () => {
    switch (formData.auth_type) {
      case 'saml':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IdP Entity ID</label>
              <input
                type="text"
                value={formData.idp_entity_id}
                onChange={(e) => setFormData({ ...formData, idp_entity_id: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://idp.example.com/entity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log In URL</label>
              <input
                type="text"
                value={formData.log_in_url}
                onChange={(e) => setFormData({ ...formData, log_in_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://idp.example.com/sso/saml"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Out URL</label>
              <input
                type="text"
                value={formData.log_out_url}
                onChange={(e) => setFormData({ ...formData, log_out_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://idp.example.com/sso/saml/logout"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Fingerprint</label>
              <input
                type="text"
                value={formData.certificate_fingerprint}
                onChange={(e) => setFormData({ ...formData, certificate_fingerprint: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AB:CD:EF:12:34:56:78:90..."
              />
            </div>
          </>
        );
      case 'ldap':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LDAP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ldap_host}
                  onChange={(e) => setFormData({ ...formData, ldap_host: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ldap.example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LDAP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.ldap_port}
                  onChange={(e) => setFormData({ ...formData, ldap_port: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="389"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LDAP Base DN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ldap_base}
                onChange={(e) => setFormData({ ...formData, ldap_base: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="dc=example,dc=com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LDAP Filter</label>
              <input
                type="text"
                value={formData.ldap_filter}
                onChange={(e) => setFormData({ ...formData, ldap_filter: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(objectClass=person)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bind DN</label>
                <input
                  type="text"
                  value={formData.ldap_bind_dn}
                  onChange={(e) => setFormData({ ...formData, ldap_bind_dn: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="cn=admin,dc=example,dc=com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bind Password</label>
                <input
                  type="password"
                  value={formData.ldap_bind_password}
                  onChange={(e) => setFormData({ ...formData, ldap_bind_password: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={editingId ? '(leave blank to keep current)' : 'Enter password'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login Attribute</label>
              <input
                type="text"
                value={formData.ldap_login_attribute}
                onChange={(e) => setFormData({ ...formData, ldap_login_attribute: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="uid"
              />
              <p className="text-xs text-gray-500 mt-1">The LDAP attribute to use for login (e.g., uid, sAMAccountName, mail).</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ldap_use_tls"
                checked={formData.ldap_use_tls}
                onChange={(e) => setFormData({ ...formData, ldap_use_tls: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ldap_use_tls" className="text-sm font-medium text-gray-700">
                Use TLS (LDAPS)
              </label>
            </div>
          </>
        );
      case 'cas':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAS Base URL</label>
              <input
                type="text"
                value={formData.cas_base_url}
                onChange={(e) => setFormData({ ...formData, cas_base_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://cas.example.com/cas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAS Login URL</label>
              <input
                type="text"
                value={formData.cas_login_url}
                onChange={(e) => setFormData({ ...formData, cas_login_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://cas.example.com/cas/login"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to auto-derive from base URL.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAS Validate URL</label>
              <input
                type="text"
                value={formData.cas_validate_url}
                onChange={(e) => setFormData({ ...formData, cas_validate_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://cas.example.com/cas/serviceValidate"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to auto-derive from base URL.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAS Logout URL</label>
              <input
                type="text"
                value={formData.cas_logout_url}
                onChange={(e) => setFormData({ ...formData, cas_logout_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://cas.example.com/cas/logout"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Authentication Providers</h2>
          <p className="text-gray-600 mt-1">
            Configure SAML, LDAP, and CAS authentication for your institution.
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              setFormData({ ...EMPTY_FORM });
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Provider
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

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">
            {editingId ? 'Edit Authentication Provider' : 'Add Authentication Provider'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                  {AUTH_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, auth_type: type.value })}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        formData.auth_type === type.value
                          ? 'bg-white shadow text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Order in which providers are tried during authentication.</p>
              </div>
            </div>

            <hr className="my-4" />

            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              {formData.auth_type === 'saml' && 'SAML Configuration'}
              {formData.auth_type === 'ldap' && 'LDAP Configuration'}
              {formData.auth_type === 'cas' && 'CAS Configuration'}
            </h4>

            {renderTypeFields()}

            <hr className="my-4" />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="jit_provisioning"
                checked={formData.jit_provisioning}
                onChange={(e) => setFormData({ ...formData, jit_provisioning: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="jit_provisioning" className="text-sm font-medium text-gray-700">
                Enable Just-In-Time (JIT) Provisioning
              </label>
            </div>
            <p className="text-xs text-gray-500 -mt-2 ml-6">
              Automatically create user accounts on first login.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Provider' : 'Create Provider'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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
            <h3 className="font-semibold text-gray-900 mb-2">Delete Authentication Provider</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this authentication provider? Users who rely on this provider will no longer be able to log in through it.
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
                {deleting ? 'Deleting...' : 'Delete Provider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading authentication providers...
</div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Authentication Providers</h3>
          <p className="text-gray-500 text-sm">
            No authentication providers have been configured. Add a SAML, LDAP, or CAS provider to enable single sign-on.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
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
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {provider.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${authTypeBadgeClass(provider.auth_type)}`}>
                      {authTypeLabel(provider.auth_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {provider.auth_type === 'saml' && (
                        <span title={provider.idp_entity_id}>
                          {provider.idp_entity_id ? `IdP: ${provider.idp_entity_id}` : 'SAML (not configured)'}
                        </span>
                      )}
                      {provider.auth_type === 'ldap' && (
                        <span>
                          {provider.ldap_host ? `${provider.ldap_host}:${provider.ldap_port}` : 'LDAP (not configured)'}
                        </span>
                      )}
                      {provider.auth_type === 'cas' && (
                        <span title={provider.cas_base_url}>
                          {provider.cas_base_url || 'CAS (not configured)'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {provider.jit_provisioning ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-gray-400">Disabled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        provider.workflow_state === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {provider.workflow_state || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(provider.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {provider.auth_type === 'ldap' && (
                        <button
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingId === provider.id}
                          className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                          title="Test LDAP Connection"
                        >
                          <TestTube2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(provider)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title="Edit provider"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(provider.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete provider"
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

export default AuthProvidersPage;
