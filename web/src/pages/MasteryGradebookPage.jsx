import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, Settings } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import ProficiencyDot from '../components/mastery/ProficiencyDot';

const ROW_HEIGHT = 44;
const COL_WIDTH = 140;
const STUDENT_COL_WIDTH = 220;

/**
 * MasteryGradebookPage shows a students × outcomes grid of proficiency dots.
 * Reuses the styling vocabulary of GradebookPage but renders cells via the
 * ProficiencyDot component. The grid is windowed only when the row count grows
 * beyond a threshold (most K-12 classrooms are < 40 students so a plain table
 * is fine and accessibility-friendly).
 */
const MasteryGradebookPage = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLearningMasteryGradebook(courseId);
      setData(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load mastery gradebook');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const cellLookup = useMemo(() => {
    if (!data) return {};
    const map = {};
    for (const c of data.cells || []) {
      map[`${c.user_id}-${c.outcome_id}`] = c;
    }
    return map;
  }, [data]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.students;
    return data.students.filter(
      (s) => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <Layout>
      <CourseNav courseId={courseId} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Mastery Gradebook</h1>
              <p className="text-sm text-gray-600">
                Each cell shows the student's current proficiency level for an outcome, computed from
                their most recent aligned submission.
              </p>
            </div>
          </div>
          <Link
            to={`/courses/${courseId}/outcomes/proficiency`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" /> Edit Scale
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={load} className="text-red-700 underline">Try Again</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : !data || (data.outcomes || []).length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No outcomes yet. Add outcomes to your course to populate the mastery gradebook.
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-gray-200 bg-white p-3">
              <span className="text-xs font-semibold uppercase text-gray-500">Legend</span>
              {(data.proficiency?.ratings || []).map((r) => (
                <div key={r.id || r.description} className="flex items-center gap-1.5 text-sm">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: r.color }}
                    aria-hidden
                  />
                  <span className={r.mastery ? 'font-semibold' : ''}>{r.description}</span>
                  {r.mastery && <span className="text-xs text-blue-600">(mastery)</span>}
                </div>
              ))}
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-sm rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 z-10"
                      style={{ minWidth: STUDENT_COL_WIDTH }}
                    >
                      Student
                    </th>
                    {data.outcomes.map((o) => (
                      <th
                        key={o.id}
                        className="px-3 py-3 text-center text-xs font-semibold uppercase text-gray-600"
                        style={{ minWidth: COL_WIDTH }}
                        title={o.title}
                      >
                        <div className="truncate max-w-[140px] mx-auto">{o.display_name || o.title}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50" style={{ height: ROW_HEIGHT }}>
                      <td
                        className="sticky left-0 bg-white px-4 py-2 text-sm font-medium text-gray-900 z-10"
                        style={{ minWidth: STUDENT_COL_WIDTH }}
                      >
                        <div>{s.name}</div>
                        <div className="text-xs text-gray-500">{s.email}</div>
                      </td>
                      {data.outcomes.map((o) => {
                        const cell = cellLookup[`${s.id}-${o.id}`];
                        return (
                          <td key={o.id} className="px-3 py-2 text-center" style={{ minWidth: COL_WIDTH }}>
                            <ProficiencyDot
                              rating={cell?.rating}
                              score={cell?.score}
                              possible={cell?.possible}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'} ·{' '}
              {data.outcomes.length} outcome{data.outcomes.length === 1 ? '' : 's'}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MasteryGradebookPage;
