import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Save, Check, AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const POLICY_OPTIONS = [
  { value: 'immediately', label: 'Immediately' },
  { value: 'daily', label: 'Daily Summary' },
  { value: 'weekly', label: 'Weekly Summary' },
  { value: 'never', label: 'Never' },
];

const NOTIFICATION_TYPES = [
  {
    key: 'notify_new_message',
    label: 'New Message',
    description: 'Get notified when you receive a new message or conversation reply.',
  },
  {
    key: 'notify_event_start',
    label: 'Calendar Event Reminders',
    description: 'Get reminded when a calendar event is about to start.',
  },
  {
    key: 'notify_submission_grade',
    label: 'Submission Grade Updates',
    description: 'Get notified when an assignment or quiz submission is graded.',
  },
  {
    key: 'notify_new_announcement',
    label: 'New Announcements',
    description: 'Get notified when a new announcement is posted in your courses.',
  },
];

const NotificationPreferencesPage = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const result = await api.getNotificationPreferences();
      setPreferences(result.notification_preferences);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handlePolicyChange = (e) => {
    setPreferences((prev) => ({ ...prev, policy: e.target.value }));
    setSuccess(false);
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await api.updateNotificationPreferences({
        policy: preferences.policy,
        notify_new_message: preferences.notify_new_message,
        notify_event_start: preferences.notify_event_start,
        notify_submission_grade: preferences.notify_submission_grade,
        notify_new_announcement: preferences.notify_new_announcement,
      });
      setPreferences(result.notification_preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading notification preferences...
</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-gray-600 mt-0.5 text-sm">
              Control how and when you receive notifications.
            </p>
          </div>
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
            Notification preferences saved successfully.
          </div>
        )}

        {preferences && (
          <div className="space-y-6">
            {/* Delivery Policy */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Delivery Policy</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Choose how frequently you want to receive notification summaries.
              </p>
              <select
                value={preferences.policy}
                onChange={handlePolicyChange}
                className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {POLICY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Types */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Types</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enable or disable specific notification categories.
              </p>
              <div className="divide-y divide-gray-100">
                {NOTIFICATION_TYPES.map((type) => (
                  <div key={type.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(type.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences[type.key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={preferences[type.key]}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>Saving...</>
                ) : success ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationPreferencesPage;
