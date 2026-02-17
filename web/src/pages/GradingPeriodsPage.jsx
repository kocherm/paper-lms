import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';

const GradingPeriodsPage = () => {
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [periods, setPeriods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [showCreatePeriod, setShowCreatePeriod] = useState(null);
  const [newPeriod, setNewPeriod] = useState({ title: '', start_date: '', end_date: '' });

  const accountId = 1;

  const fetchGroups = async () => {
    try {
      const result = await api.getGradingPeriodGroups(accountId, 1, 100);
      setGroups(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async (groupId) => {
    try {
      const data = await api.getGradingPeriods(accountId, groupId);
      setPeriods(prev => ({ ...prev, [groupId]: data }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const isExpanded = !prev[groupId];
      if (isExpanded && !periods[groupId]) {
        fetchPeriods(groupId);
      }
      return { ...prev, [groupId]: isExpanded };
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createGradingPeriodGroup(accountId, { title: newGroupTitle });
      setNewGroupTitle('');
      setShowCreateGroup(false);
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this grading period group?')) return;
    try {
      await api.deleteGradingPeriodGroup(accountId, groupId);
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePeriod = async (e, groupId) => {
    e.preventDefault();
    try {
      await api.createGradingPeriod(accountId, groupId, {
        title: newPeriod.title,
        start_date: new Date(newPeriod.start_date).toISOString(),
        end_date: new Date(newPeriod.end_date).toISOString(),
      });
      setNewPeriod({ title: '', start_date: '', end_date: '' });
      setShowCreatePeriod(null);
      fetchPeriods(groupId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePeriod = async (groupId, periodId) => {
    if (!window.confirm('Delete this grading period?')) return;
    try {
      await api.deleteGradingPeriod(accountId, groupId, periodId);
      fetchPeriods(groupId);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading grading periods...</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold">Grading Periods</h2>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      {showCreateGroup && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <form onSubmit={handleCreateGroup} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Group title"
              value={newGroupTitle}
              onChange={e => setNewGroupTitle(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Create</button>
            <button type="button" onClick={() => setShowCreateGroup(false)} className="text-gray-500 text-sm">Cancel</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No grading period groups yet.</div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleGroup(group.id)}>
                <div className="flex items-center space-x-3">
                  {expandedGroups[group.id] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">{group.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedGroups[group.id] && (
                <div className="border-t px-4 py-3">
                  {periods[group.id]?.length === 0 && (
                    <p className="text-sm text-gray-500 mb-3">No grading periods in this group.</p>
                  )}
                  {periods[group.id]?.map(period => (
                    <div key={period.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{period.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(period.start_date)} - {formatDate(period.end_date)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePeriod(group.id, period.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {showCreatePeriod === group.id ? (
                    <form onSubmit={(e) => handleCreatePeriod(e, group.id)} className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Period title"
                        value={newPeriod.title}
                        onChange={e => setNewPeriod({ ...newPeriod, title: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={newPeriod.start_date}
                          onChange={e => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                          required
                        />
                        <input
                          type="date"
                          value={newPeriod.end_date}
                          onChange={e => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Add</button>
                        <button type="button" onClick={() => setShowCreatePeriod(null)} className="text-gray-500 text-sm">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowCreatePeriod(group.id)}
                      className="mt-2 text-blue-600 hover:underline text-sm"
                    >
                      + Add Grading Period
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default GradingPeriodsPage;
