import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Award } from 'lucide-react';
import { api } from '../services/api';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';

const RubricsPage = () => {
  const { courseId } = useParams();
  const isTeacher = useIsTeacher(courseId);
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState([
    { id: 'c1', description: '', points: 0, ratings: [{ id: 'r1', description: 'Full Marks', points: 0 }, { id: 'r2', description: 'No Marks', points: 0 }] }
  ]);

  const fetchRubrics = async () => {
    try {
      const result = await api.getCourseRubrics(courseId, 1, 100);
      setRubrics(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRubrics(); }, [courseId]);

  const addCriterion = () => {
    const id = `c${Date.now()}`;
    setCriteria([...criteria, {
      id, description: '', points: 0,
      ratings: [{ id: `r${Date.now()}a`, description: 'Full Marks', points: 0 }, { id: `r${Date.now()}b`, description: 'No Marks', points: 0 }]
    }]);
  };

  const updateCriterion = (idx, field, value) => {
    const updated = [...criteria];
    updated[idx] = { ...updated[idx], [field]: value };
    setCriteria(updated);
  };

  const removeCriterion = (idx) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitle('');
    setCriteria([{ id: 'c1', description: '', points: 0, ratings: [{ id: 'r1', description: 'Full Marks', points: 0 }, { id: 'r2', description: 'No Marks', points: 0 }] }]);
    setEditingId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const totalPoints = criteria.reduce((sum, c) => sum + (parseFloat(c.points) || 0), 0);
      const payload = {
        title,
        data: JSON.stringify(criteria),
        points_possible: totalPoints,
      };
      if (editingId) {
        await api.updateCourseRubric(courseId, editingId, payload);
      } else {
        await api.createCourseRubric(courseId, payload);
      }
      resetForm();
      setShowCreate(false);
      fetchRubrics();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (rubric) => {
    setTitle(rubric.title || '');
    // Parse rubric data — it's stored as JSONB
    let parsedCriteria;
    try {
      parsedCriteria = typeof rubric.data === 'string' ? JSON.parse(rubric.data) : rubric.data;
    } catch {
      parsedCriteria = [];
    }
    if (Array.isArray(parsedCriteria) && parsedCriteria.length > 0) {
      setCriteria(parsedCriteria);
    } else {
      setCriteria([{ id: 'c1', description: '', points: rubric.points_possible || 0, ratings: [{ id: 'r1', description: 'Full Marks', points: rubric.points_possible || 0 }, { id: 'r2', description: 'No Marks', points: 0 }] }]);
    }
    setEditingId(rubric.id);
    setShowCreate(true);
  };

  const handleDelete = async (rubricId) => {
    if (!window.confirm('Delete this rubric?')) return;
    try {
      await api.deleteCourseRubric(courseId, rubricId);
      fetchRubrics();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading rubrics...
</div></Layout>;
  }

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">← Back to Course</Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold">Rubrics</h2>
          {isTeacher && (
            <button
              onClick={() => {
                if (showCreate) { resetForm(); }
                setShowCreate(!showCreate);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              {showCreate ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
              <span>{showCreate ? 'Cancel' : 'New Rubric'}</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Rubric' : 'Create Rubric'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Rubric title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />

            {criteria.map((c, idx) => (
              <div key={c.id} className="border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Criterion {idx + 1}</span>
                  {criteria.length > 1 && (
                    <button type="button" onClick={() => removeCriterion(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Description"
                    value={c.description}
                    onChange={e => updateCriterion(idx, 'description', e.target.value)}
                    className="col-span-3 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Points"
                    value={c.points}
                    onChange={e => updateCriterion(idx, 'points', parseFloat(e.target.value) || 0)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={addCriterion} className="text-blue-600 hover:underline text-sm">
              + Add Criterion
            </button>

            <div className="flex space-x-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                {editingId ? 'Update Rubric' : 'Create Rubric'}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowCreate(false); }} className="text-gray-500 hover:text-gray-700 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {rubrics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No rubrics yet.</div>
        ) : (
          rubrics.map(rubric => (
            <div key={rubric.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">{rubric.title}</p>
                  <p className="text-sm text-gray-500">{rubric.points_possible} points</p>
                </div>
              </div>
              {isTeacher && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rubric)}
                    className="text-gray-400 hover:text-blue-600"
                    title="Edit rubric"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rubric.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete rubric"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default RubricsPage;
