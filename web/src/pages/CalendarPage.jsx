import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Plus, Trash2, Edit2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const CalendarPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    all_day: false,
    location_name: '',
    location_address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthName = currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = courseId
        ? await api.getCourseCalendarEvents(courseId, 1, 100)
        : await api.getCalendarEvents(1, 100);
      setEvents(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventsForMonth = events.filter((e) => {
    const d = new Date(e.start_at);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const eventsGroupedByDate = {};
  eventsForMonth.forEach((e) => {
    const dateKey = new Date(e.start_at).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!eventsGroupedByDate[dateKey]) {
      eventsGroupedByDate[dateKey] = [];
    }
    eventsGroupedByDate[dateKey].push(e);
  });

  const sortedDateKeys = Object.keys(eventsGroupedByDate).sort((a, b) => {
    const aFirst = eventsGroupedByDate[a][0];
    const bFirst = eventsGroupedByDate[b][0];
    return new Date(aFirst.start_at) - new Date(bFirst.start_at);
  });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_at: '',
      end_at: '',
      all_day: false,
      location_name: '',
      location_address: '',
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event) => {
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setFormData({
      title: event.title || '',
      description: event.description || '',
      start_at: formatDateTime(event.start_at),
      end_at: formatDateTime(event.end_at),
      all_day: event.all_day || false,
      location_name: event.location_name || '',
      location_address: event.location_address || '',
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        all_day: formData.all_day,
        location_name: formData.location_name,
        location_address: formData.location_address,
      };

      if (!editingEvent) {
        payload.context_type = courseId ? 'Course' : 'User';
        payload.context_id = courseId ? parseInt(courseId, 10) : user?.id;
      }

      if (editingEvent) {
        await api.updateCalendarEvent(editingEvent.id, payload);
      } else {
        await api.createCalendarEvent(payload);
      }
      resetForm();
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteCalendarEvent(eventId);
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = () => {
    const url = api.getCalendarICalUrl();
    const token = localStorage.getItem('token');
    window.open(`${url}?token=${encodeURIComponent(token)}`, '_blank');
  };

  const formatTime = (dateStr, allDay) => {
    if (!dateStr) return '';
    if (allDay) return 'All day';
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading calendar events...</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        {courseId && (
          <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
            &larr; Back to Course
          </Link>
        )}
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Calendar
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export iCal</span>
            </button>
            <button
              onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? 'Cancel' : 'New Event'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
                <input
                  type={formData.all_day ? 'date' : 'datetime-local'}
                  value={formData.all_day && formData.start_at ? formData.start_at.substring(0, 10) : formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
                <input
                  type={formData.all_day ? 'date' : 'datetime-local'}
                  value={formData.all_day && formData.end_at ? formData.end_at.substring(0, 10) : formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="all_day"
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="all_day" className="text-sm text-gray-700">All day event</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Room 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                <input
                  type="text"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 123 Main St"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Month navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Events list */}
        {sortedDateKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No events this month.</div>
        ) : (
          <div className="divide-y">
            {sortedDateKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">{dateKey}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {eventsGroupedByDate[dateKey].map((event) => (
                    <div key={event.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center space-x-3 min-w-0">
                        <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(event.start_at, event.all_day)}
                            {event.end_at && !event.all_day && (
                              <span> - {formatTime(event.end_at, false)}</span>
                            )}
                            {event.location_name && (
                              <span className="ml-2 text-gray-400">| {event.location_name}</span>
                            )}
                          </div>
                          {event.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
