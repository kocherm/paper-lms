import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  FolderOpen,
  BarChart3,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';

const CALCULATION_METHODS = [
  { value: 'decaying_average', label: 'Decaying Average', description: 'Average of scores weighted toward recent results' },
  { value: 'n_mastery', label: 'n Number of Times', description: 'Must achieve mastery n times' },
  { value: 'latest', label: 'Most Recent Score', description: 'Uses the most recent score' },
  { value: 'highest', label: 'Highest Score', description: 'Uses the highest score achieved' },
  { value: 'average', label: 'Average', description: 'Simple average of all scores' },
];

const DEFAULT_RATINGS = [
  { description: 'Exceeds Mastery', points: 4, color: 'bg-green-500' },
  { description: 'Mastery', points: 3, color: 'bg-blue-500' },
  { description: 'Near Mastery', points: 2, color: 'bg-yellow-500' },
  { description: 'Below Mastery', points: 1, color: 'bg-orange-500' },
  { description: 'No Evidence', points: 0, color: 'bg-red-500' },
];

const getRatingColor = (index, total) => {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  if (total <= colors.length) {
    return colors[index] || colors[colors.length - 1];
  }
  const colorIndex = Math.floor((index / (total - 1)) * (colors.length - 1));
  return colors[colorIndex] || colors[colors.length - 1];
};

const LearningOutcomesPage = () => {
  const { courseId } = useParams();
  const [groups, setGroups] = useState([]);
  const [groupOutcomes, setGroupOutcomes] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create group form
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Create outcome form
  const [showCreateOutcome, setShowCreateOutcome] = useState(null); // group ID or null
  const [newOutcomeTitle, setNewOutcomeTitle] = useState('');
  const [newOutcomeDescription, setNewOutcomeDescription] = useState('');
  const [newOutcomeMasteryPoints, setNewOutcomeMasteryPoints] = useState(3);
  const [newOutcomeCalcMethod, setNewOutcomeCalcMethod] = useState('decaying_average');
  const [newOutcomeCalcInt, setNewOutcomeCalcInt] = useState(65);
  const [newOutcomeRatings, setNewOutcomeRatings] = useState(
    DEFAULT_RATINGS.map((r) => ({ ...r }))
  );

  // Rollup view
  const [showRollup, setShowRollup] = useState(false);
  const [rollupData, setRollupData] = useState(null);
  const [rollupLoading, setRollupLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getCourseOutcomeGroups(courseId);
      const groupList = Array.isArray(result) ? result : result.data || [];
      setGroups(groupList);

      // Auto-expand and load outcomes for each group
      const expanded = {};
      const outcomes = {};
      for (const group of groupList) {
        expanded[group.id] = true;
        try {
          const outcomeResult = await api.getOutcomeGroupOutcomes(courseId, group.id);
          outcomes[group.id] = Array.isArray(outcomeResult)
            ? outcomeResult
            : outcomeResult.data || [];
        } catch {
          outcomes[group.id] = [];
        }
      }
      setExpandedGroups(expanded);
      setGroupOutcomes(outcomes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggleGroup = async (groupId) => {
    const isExpanding = !expandedGroups[groupId];
    setExpandedGroups((prev) => ({ ...prev, [groupId]: isExpanding }));

    // Fetch outcomes if expanding and not yet loaded
    if (isExpanding && !groupOutcomes[groupId]) {
      try {
        const result = await api.getOutcomeGroupOutcomes(courseId, groupId);
        setGroupOutcomes((prev) => ({
          ...prev,
          [groupId]: Array.isArray(result) ? result : result.data || [],
        }));
      } catch {
        setGroupOutcomes((prev) => ({ ...prev, [groupId]: [] }));
      }
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createOutcomeGroup(courseId, {
        title: newGroupTitle,
        description: newGroupDescription,
      });
      setNewGroupTitle('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this outcome group and all its outcomes?')) return;
    try {
      await api.deleteOutcomeGroup(courseId, groupId);
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOutcome = async (e) => {
    e.preventDefault();
    const groupId = showCreateOutcome;
    try {
      await api.createOutcome(courseId, groupId, {
        title: newOutcomeTitle,
        description: newOutcomeDescription,
        mastery_points: parseFloat(newOutcomeMasteryPoints) || 3,
        calculation_method: newOutcomeCalcMethod,
        calculation_int: parseInt(newOutcomeCalcInt) || 65,
        ratings: JSON.stringify(newOutcomeRatings),
      });

      // Reset form
      setNewOutcomeTitle('');
      setNewOutcomeDescription('');
      setNewOutcomeMasteryPoints(3);
      setNewOutcomeCalcMethod('decaying_average');
      setNewOutcomeCalcInt(65);
      setNewOutcomeRatings(DEFAULT_RATINGS.map((r) => ({ ...r })));
      setShowCreateOutcome(null);

      // Refresh outcomes for this group
      try {
        const result = await api.getOutcomeGroupOutcomes(courseId, groupId);
        setGroupOutcomes((prev) => ({
          ...prev,
          [groupId]: Array.isArray(result) ? result : result.data || [],
        }));
      } catch {
        // Ignore
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteOutcome = async (groupId, outcomeId) => {
    if (!window.confirm('Delete this outcome?')) return;
    try {
      await api.deleteOutcome(courseId, groupId, outcomeId);
      // Refresh outcomes for this group
      try {
        const result = await api.getOutcomeGroupOutcomes(courseId, groupId);
        setGroupOutcomes((prev) => ({
          ...prev,
          [groupId]: Array.isArray(result) ? result : result.data || [],
        }));
      } catch {
        setGroupOutcomes((prev) => ({ ...prev, [groupId]: [] }));
      }
      if (selectedOutcome?.id === outcomeId) {
        setSelectedOutcome(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewRollup = async () => {
    setShowRollup(!showRollup);
    if (!showRollup && !rollupData) {
      setRollupLoading(true);
      try {
        const result = await api.getOutcomeRollup(courseId);
        setRollupData(result);
      } catch (err) {
        setError('Could not load outcome rollup: ' + err.message);
      } finally {
        setRollupLoading(false);
      }
    }
  };

  const addRating = () => {
    setNewOutcomeRatings([
      ...newOutcomeRatings,
      { description: '', points: 0 },
    ]);
  };

  const updateRating = (index, field, value) => {
    const updated = [...newOutcomeRatings];
    updated[index] = { ...updated[index], [field]: value };
    setNewOutcomeRatings(updated);
  };

  const removeRating = (index) => {
    if (newOutcomeRatings.length <= 2) return;
    setNewOutcomeRatings(newOutcomeRatings.filter((_, i) => i !== index));
  };

  const parseRatings = (outcome) => {
    if (!outcome.ratings) return DEFAULT_RATINGS;
    if (Array.isArray(outcome.ratings)) return outcome.ratings;
    try {
      const parsed = JSON.parse(outcome.ratings);
      return Array.isArray(parsed) ? parsed : DEFAULT_RATINGS;
    } catch {
      return DEFAULT_RATINGS;
    }
  };

  const getCalcMethodLabel = (method) => {
    const found = CALCULATION_METHODS.find((m) => m.value === method);
    return found ? found.label : method || 'Decaying Average';
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-500">Loading outcomes...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          &larr; Back to Course
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">Learning Outcomes</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleViewRollup}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm border ${
                showRollup
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Mastery Rollup</span>
            </button>
            <button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateGroup && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Create Outcome Group</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                placeholder="e.g., Common Core Math Standards"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe this group of outcomes..."
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Create Group
              </button>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rollup View */}
      {showRollup && (
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b bg-purple-50">
            <h3 className="font-semibold text-purple-800 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Mastery Gradebook Summary</span>
            </h3>
            <p className="text-sm text-purple-600 mt-1">
              Overview of student mastery across all outcomes
            </p>
          </div>
          {rollupLoading ? (
            <div className="p-8 text-center text-gray-500">Loading rollup data...</div>
          ) : rollupData ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-r min-w-[200px]">
                      Student
                    </th>
                    {(rollupData.outcomes || []).map((outcome) => (
                      <th
                        key={outcome.id}
                        className="px-3 py-3 text-center text-xs font-medium text-gray-500 border-b border-r min-w-[120px]"
                      >
                        <span className="block truncate" title={outcome.title}>
                          {outcome.title}
                        </span>
                        <span className="text-gray-400 font-normal">
                          {outcome.mastery_points || 3} pts
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(rollupData.students || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={(rollupData.outcomes?.length || 0) + 1}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No rollup data available yet.
                      </td>
                    </tr>
                  ) : (
                    (rollupData.students || []).map((student) => (
                      <tr key={student.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r whitespace-nowrap">
                          {student.user_name || `User ${student.user_id}`}
                        </td>
                        {(rollupData.outcomes || []).map((outcome) => {
                          const score = student.scores?.[outcome.id];
                          const mastery = outcome.mastery_points || 3;
                          const isMastered = score !== null && score !== undefined && score >= mastery;
                          return (
                            <td
                              key={`${student.user_id}-${outcome.id}`}
                              className={`px-3 py-2 text-center text-sm border-r ${
                                score === null || score === undefined
                                  ? ''
                                  : isMastered
                                  ? 'bg-green-50'
                                  : 'bg-red-50'
                              }`}
                            >
                              {score !== null && score !== undefined ? (
                                <div className="flex items-center justify-center space-x-1">
                                  {isMastered ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  )}
                                  <span
                                    className={`font-medium ${
                                      isMastered ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {score}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No rollup data available. Outcomes must be assessed to view results.
            </div>
          )}
        </div>
      )}

      {/* Main Content: Groups & Outcomes + Detail Panel */}
      <div className="flex gap-4">
        {/* Groups & Outcomes List */}
        <div className="flex-1">
          {groups.length === 0 && !showCreateGroup ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No outcome groups yet.</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                Create your first outcome group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Group Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {expandedGroups[group.id] ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <FolderOpen className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-semibold text-gray-900">{group.title}</p>
                        {group.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {(groupOutcomes[group.id] || []).length} outcomes
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateOutcome(
                            showCreateOutcome === group.id ? null : group.id
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Add outcome"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Outcomes List */}
                  {expandedGroups[group.id] && (
                    <div>
                      {/* Create Outcome Form */}
                      {showCreateOutcome === group.id && (
                        <div className="p-4 border-b bg-blue-50">
                          <h4 className="font-medium text-sm text-blue-800 mb-3">
                            New Outcome in "{group.title}"
                          </h4>
                          <form onSubmit={handleCreateOutcome} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  value={newOutcomeTitle}
                                  onChange={(e) => setNewOutcomeTitle(e.target.value)}
                                  placeholder="Outcome title"
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <textarea
                                  value={newOutcomeDescription}
                                  onChange={(e) => setNewOutcomeDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  rows={2}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Calculation Method
                                </label>
                                <select
                                  value={newOutcomeCalcMethod}
                                  onChange={(e) => setNewOutcomeCalcMethod(e.target.value)}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {CALCULATION_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                      {m.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Mastery Points
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={newOutcomeMasteryPoints}
                                    onChange={(e) =>
                                      setNewOutcomeMasteryPoints(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                {(newOutcomeCalcMethod === 'decaying_average' ||
                                  newOutcomeCalcMethod === 'n_mastery') && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      {newOutcomeCalcMethod === 'decaying_average'
                                        ? 'Decay %'
                                        : 'N Count'}
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={
                                        newOutcomeCalcMethod === 'decaying_average'
                                          ? 99
                                          : 10
                                      }
                                      value={newOutcomeCalcInt}
                                      onChange={(e) => setNewOutcomeCalcInt(e.target.value)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ratings */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Ratings
                              </label>
                              <div className="space-y-2">
                                {newOutcomeRatings.map((rating, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <div
                                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getRatingColor(
                                        idx,
                                        newOutcomeRatings.length
                                      )}`}
                                    />
                                    <input
                                      type="text"
                                      value={rating.description}
                                      onChange={(e) =>
                                        updateRating(idx, 'description', e.target.value)
                                      }
                                      placeholder="Rating description"
                                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={rating.points}
                                      onChange={(e) =>
                                        updateRating(
                                          idx,
                                          'points',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <span className="text-xs text-gray-400">pts</span>
                                    {newOutcomeRatings.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeRating(idx)}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={addRating}
                                className="text-blue-600 hover:underline text-xs mt-1"
                              >
                                + Add Rating
                              </button>
                            </div>

                            <div className="flex space-x-3">
                              <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Create Outcome</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCreateOutcome(null)}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Outcomes */}
                      {(groupOutcomes[group.id] || []).length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                          No outcomes in this group.{' '}
                          <button
                            onClick={() => setShowCreateOutcome(group.id)}
                            className="text-blue-500 hover:underline"
                          >
                            Add one
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {(groupOutcomes[group.id] || []).map((outcome) => {
                            const ratings = parseRatings(outcome);
                            const isSelected = selectedOutcome?.id === outcome.id;
                            return (
                              <div
                                key={outcome.id}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                }`}
                                onClick={() =>
                                  setSelectedOutcome(isSelected ? null : outcome)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-sm text-gray-900">
                                        {outcome.title}
                                      </p>
                                      {outcome.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                          {outcome.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                      {ratings.slice(0, 5).map((r, idx) => (
                                        <div
                                          key={idx}
                                          className={`w-2 h-2 rounded-full ${getRatingColor(
                                            idx,
                                            ratings.length
                                          )}`}
                                          title={`${r.description}: ${r.points} pts`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                      Mastery: {outcome.mastery_points ?? 3}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteOutcome(group.id, outcome.id);
                                      }}
                                      className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedOutcome && (
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-lg shadow sticky top-4">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Outcome Details</h3>
                  <button
                    onClick={() => setSelectedOutcome(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedOutcome.title}
                  </h4>
                  {selectedOutcome.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedOutcome.description}
                    </p>
                  )}
                </div>

                {/* Calculation Method */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Calculation Method
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {getCalcMethodLabel(selectedOutcome.calculation_method)}
                  </p>
                  {selectedOutcome.calculation_int && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedOutcome.calculation_method === 'decaying_average'
                        ? `${selectedOutcome.calculation_int}% weighted to most recent`
                        : selectedOutcome.calculation_method === 'n_mastery'
                        ? `Must achieve mastery ${selectedOutcome.calculation_int} times`
                        : ''}
                    </p>
                  )}
                </div>

                {/* Mastery */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-600 uppercase mb-1">
                    Mastery Threshold
                  </p>
                  <p className="text-lg font-bold text-blue-800">
                    {selectedOutcome.mastery_points ?? 3} points
                  </p>
                </div>

                {/* Ratings */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Proficiency Ratings
                  </p>
                  <div className="space-y-2">
                    {parseRatings(selectedOutcome).map((rating, idx) => {
                      const ratings = parseRatings(selectedOutcome);
                      const isMastery =
                        rating.points >= (selectedOutcome.mastery_points ?? 3);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center space-x-3 p-2 rounded ${
                            isMastery ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 ${getRatingColor(
                              idx,
                              ratings.length
                            )}`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {rating.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-700">
                              {rating.points}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">pts</span>
                          </div>
                          {isMastery && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual: Ratings bar */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Proficiency Scale
                  </p>
                  <div className="flex rounded-full overflow-hidden h-3">
                    {parseRatings(selectedOutcome).map((rating, idx) => {
                      const ratings = parseRatings(selectedOutcome);
                      return (
                        <div
                          key={idx}
                          className={`flex-1 ${getRatingColor(idx, ratings.length)}`}
                          title={`${rating.description}: ${rating.points} pts`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Low</span>
                    <span className="text-xs text-gray-400">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LearningOutcomesPage;
