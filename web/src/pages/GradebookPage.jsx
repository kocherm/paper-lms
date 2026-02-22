import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Download, Upload, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';
import GradeInput from '../components/GradeInput';
import { getLetterGrade, gradeColor } from '../utils/grading';

const GradebookPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const isTeacher = useIsTeacher(courseId);
  const [course, setCourse] = useState(null);
  const [gradebook, setGradebook] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentGroups, setAssignmentGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradingScale, setGradingScale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [postingAssignment, setPostingAssignment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, assignmentResult, enrollmentResult, assignmentGroupResult] = await Promise.all([
          api.getCourse(courseId),
          api.getAssignments(courseId, 1, 100),
          api.getEnrollments(courseId, 1, 200),
          api.getAssignmentGroups(courseId, 1, 50).catch(() => ({ data: [] })),
        ]);

        setCourse(courseData);
        const assignmentList = assignmentResult.data || [];
        setAssignments(assignmentList);

        // Fetch grading standard for custom scale
        try {
          const standards = await api.getGradingStandards(courseId);
          if (Array.isArray(standards) && standards.length > 0) {
            const latest = standards[standards.length - 1];
            if (Array.isArray(latest.data)) setGradingScale(latest.data);
          }
        } catch {}

        const groupList = assignmentGroupResult.data || [];
        setAssignmentGroups(groupList);

        // Filter to only student enrollments
        const enrollmentList = enrollmentResult.data || [];
        const studentEnrollments = enrollmentList.filter(
          (e) => e.type === 'StudentEnrollment' ||
            e.role === 'StudentEnrollment' ||
            e.enrollment_type === 'student'
        );

        // Deduplicate students by user_id
        const seen = new Set();
        const uniqueStudents = [];
        for (const enrollment of studentEnrollments) {
          const uid = enrollment.user_id || enrollment.user?.id;
          if (uid && !seen.has(uid)) {
            seen.add(uid);
            uniqueStudents.push({
              id: uid,
              name: enrollment.user?.name || enrollment.user?.display_name || `User ${uid}`,
              sortable_name: enrollment.user?.sortable_name || enrollment.user?.name || `User ${uid}`,
            });
          }
        }
        // Sort students alphabetically
        uniqueStudents.sort((a, b) => a.sortable_name.localeCompare(b.sortable_name));
        setStudents(uniqueStudents);

        // Fetch gradebook data (if endpoint exists, otherwise build from bulk submissions)
        try {
          const gb = await api.getGradebook(courseId);
          setGradebook(gb);
        } catch {
          // Fallback: single bulk fetch instead of N+1 per-assignment calls
          const subResult = await api.getCourseSubmissions(courseId);
          const subs = subResult.data || [];
          const gradebookData = {};
          for (const sub of subs) {
            const uid = sub.user_id;
            if (!gradebookData[uid]) gradebookData[uid] = {};
            gradebookData[uid][sub.assignment_id] = {
              score: sub.score,
              grade: sub.grade,
              workflow_state: sub.workflow_state,
              submitted_at: sub.submitted_at,
            };
          }
          setGradebook(gradebookData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const getCellData = (studentId, assignmentId) => {
    if (!gradebook) return null;

    // Handle API format: { submissions: { "studentId": { "assignmentId": {...} } } }
    const subs = gradebook.submissions || gradebook;
    const studentSubs = subs[studentId] || subs[String(studentId)];
    if (studentSubs) {
      const cell = studentSubs[assignmentId] || studentSubs[String(assignmentId)];
      if (cell) return cell;
    }

    return null;
  };

  const getCellColor = (cellData) => {
    if (!cellData) return '';
    if (cellData.workflow_state === 'graded' && cellData.score !== null && cellData.score !== undefined) {
      return 'bg-green-50';
    }
    if (cellData.workflow_state === 'submitted' || cellData.submitted_at) {
      return 'bg-yellow-50';
    }
    if (cellData.workflow_state === 'unsubmitted' || cellData.missing) {
      return 'bg-red-50';
    }
    return '';
  };

  const handleGradeSave = async (studentId, assignmentId, score) => {
    await api.gradeSubmission(courseId, assignmentId, studentId, {
      posted_grade: String(score),
    });

    // Update local state (immutable — deep-copy the relevant slice)
    setGradebook((prev) => {
      if (!prev) return prev;
      const sid = String(studentId);
      const aid = String(assignmentId);
      const hasSubmissions = !!prev.submissions;
      const oldSubs = hasSubmissions ? prev.submissions : prev;
      const oldStudent = oldSubs[sid] || {};
      const newCell = {
        ...(oldStudent[aid] || {}),
        score: parseFloat(score),
        grade: String(score),
        workflow_state: score !== null ? 'graded' : 'unsubmitted',
      };
      const newStudent = { ...oldStudent, [aid]: newCell };
      const newSubs = { ...oldSubs, [sid]: newStudent };
      if (hasSubmissions) {
        return { ...prev, submissions: newSubs };
      }
      return newSubs;
    });
  };

  const calculateStudentTotal = (studentId) => {
    const useWeights = course?.apply_assignment_group_weights && assignmentGroups.length > 0 &&
      assignmentGroups.some(g => g.group_weight > 0);

    if (useWeights) {
      // Weighted grade calculation: per-group percentage * group weight
      let weightedSum = 0;
      let weightTotal = 0;
      let totalEarned = 0;
      let totalPossible = 0;
      const groupedAssignmentIds = new Set();

      for (const group of assignmentGroups) {
        if (!group.group_weight || group.group_weight <= 0) continue;
        const groupAssignments = assignments.filter(a => a.assignment_group_id === group.id);
        groupAssignments.forEach(a => groupedAssignmentIds.add(a.id));
        let groupEarned = 0;
        let groupPossible = 0;

        for (const assignment of groupAssignments) {
          const cell = getCellData(studentId, assignment.id);
          if (cell && cell.score !== null && cell.score !== undefined) {
            groupEarned += parseFloat(cell.score) || 0;
            groupPossible += parseFloat(assignment.points_possible) || 0;
          }
        }

        totalEarned += groupEarned;
        totalPossible += groupPossible;

        if (groupPossible > 0) {
          const groupPct = (groupEarned / groupPossible) * 100;
          weightedSum += groupPct * group.group_weight;
          weightTotal += group.group_weight;
        }
      }

      // Include ungrouped assignments (not in any weighted group) as raw points
      const ungrouped = assignments.filter(a => !groupedAssignmentIds.has(a.id));
      for (const assignment of ungrouped) {
        const cell = getCellData(studentId, assignment.id);
        if (cell && cell.score !== null && cell.score !== undefined) {
          totalEarned += parseFloat(cell.score) || 0;
          totalPossible += parseFloat(assignment.points_possible) || 0;
        }
      }

      if (weightTotal === 0) return { earned: 0, possible: 0, percentage: null, weighted: true };
      return {
        earned: totalEarned,
        possible: totalPossible,
        percentage: (weightedSum / weightTotal).toFixed(1),
        weighted: true,
      };
    }

    // Unweighted: simple point totals
    let earnedPoints = 0;
    let possiblePoints = 0;

    for (const assignment of assignments) {
      const cell = getCellData(studentId, assignment.id);
      if (cell && cell.score !== null && cell.score !== undefined) {
        earnedPoints += parseFloat(cell.score) || 0;
        possiblePoints += parseFloat(assignment.points_possible) || 0;
      }
    }

    if (possiblePoints === 0) return { earned: 0, possible: 0, percentage: null, weighted: false };
    return {
      earned: earnedPoints,
      possible: possiblePoints,
      percentage: ((earnedPoints / possiblePoints) * 100).toFixed(1),
      weighted: false,
    };
  };

  // Group assignments by assignment_group_id
  const getGroupedAssignments = () => {
    if (assignmentGroups.length === 0) {
      return [{ id: null, name: 'Assignments', assignments: assignments }];
    }

    const grouped = assignmentGroups.map((group) => ({
      ...group,
      assignments: assignments.filter((a) => a.assignment_group_id === group.id),
    }));

    // Include ungrouped assignments
    const groupedIds = new Set(assignmentGroups.map((g) => g.id));
    const ungrouped = assignments.filter((a) => !groupedIds.has(a.assignment_group_id));
    if (ungrouped.length > 0) {
      grouped.push({ id: null, name: 'Other', assignments: ungrouped });
    }

    return grouped.filter((g) => g.assignments.length > 0);
  };

  if (isTeacher === false) return <Navigate to={`/courses/${courseId}`} replace />;
  if (isTeacher === null) return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading...
</div></Layout>;

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading gradebook...
</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-center py-12">
  <p className="text-red-600 mb-3">{error}</p>
  <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
</div></Layout>;
  }

  const exportGradebookCSV = () => {
    const escCSV = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ['Student', 'Student ID', ...assignments.map(a => a.name), 'Total Points', 'Total Possible', 'Percentage', 'Letter Grade'];
    const rows = students.map(student => {
      const total = calculateStudentTotal(student.id);
      const cells = assignments.map(a => {
        const cell = getCellData(student.id, a.id);
        return cell && cell.score !== null && cell.score !== undefined ? cell.score : '';
      });
      return [
        student.name || `User ${student.id}`,
        student.id,
        ...cells,
        total.earned,
        total.possible,
        total.percentage ?? '',
        getLetterGrade(total.percentage, gradingScale),
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(escCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook_${course?.course_code || courseId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGradebookCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      const studentIdIdx = headers.findIndex(h => /student\s*id/i.test(h));
      if (studentIdIdx === -1) throw new Error('CSV must include a "Student ID" column');

      // Map assignment names to assignment IDs
      const assignmentMap = {};
      for (const a of assignments) {
        assignmentMap[a.name.toLowerCase().trim()] = a;
      }

      let skipped = 0;
      const gradeData = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
        const studentId = parseInt(cells[studentIdIdx], 10);
        if (!studentId) { skipped++; continue; }

        for (let col = 0; col < headers.length; col++) {
          if (col === 0 || col === studentIdIdx) continue;
          const headerName = headers[col].toLowerCase().trim();
          if (/total|percentage|letter/i.test(headerName)) continue;

          const assignment = assignmentMap[headerName];
          if (!assignment) continue;

          const scoreStr = cells[col];
          if (scoreStr === '' || scoreStr === undefined) continue;

          const score = parseFloat(scoreStr);
          if (isNaN(score)) continue;

          gradeData.push({
            assignment_id: assignment.id,
            user_id: studentId,
            posted_grade: String(score),
          });
        }
      }

      const errors = [];
      let updated = 0;

      // Send in batches of 500 to avoid oversized requests
      for (let i = 0; i < gradeData.length; i += 500) {
        const batch = gradeData.slice(i, i + 500);
        try {
          const result = await api.bulkGrade(courseId, batch);
          const results = result?.results || [];
          for (const r of results) {
            if (r.error) {
              errors.push(`Assignment ${r.assignment_id}, User ${r.user_id}: ${r.error}`);
            } else {
              updated++;
            }
          }
        } catch (err) {
          errors.push(`Batch ${Math.floor(i / 500) + 1}: ${err.message}`);
        }
      }

      setImportResult({
        success: true,
        updated,
        skipped,
        errors,
      });

      // Refresh gradebook data
      try {
        const gb = await api.getGradebook(courseId);
        setGradebook(gb);
      } catch {
        const subResult = await api.getCourseSubmissions(courseId);
        const subs = subResult.data || [];
        const gradebookData = {};
        for (const sub of subs) {
          const uid = sub.user_id;
          if (!gradebookData[uid]) gradebookData[uid] = {};
          gradebookData[uid][sub.assignment_id] = {
            score: sub.score,
            grade: sub.grade,
            workflow_state: sub.workflow_state,
            submitted_at: sub.submitted_at,
          };
        }
        setGradebook(gradebookData);
      }
    } catch (err) {
      setImportResult({ success: false, message: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handlePostGrades = async (assignmentId) => {
    setPostingAssignment(assignmentId);
    try {
      await api.postGrades(courseId, assignmentId);
      setAssignments((prev) =>
        prev.map((a) => a.id === assignmentId ? { ...a, gradesPosted: true } : a)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPostingAssignment(null);
    }
  };

  const handleHideGrades = async (assignmentId) => {
    setPostingAssignment(assignmentId);
    try {
      await api.hideGrades(courseId, assignmentId);
      setAssignments((prev) =>
        prev.map((a) => a.id === assignmentId ? { ...a, gradesPosted: false } : a)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPostingAssignment(null);
    }
  };

  const groupedAssignments = getGroupedAssignments();

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          ← Back to Course
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Gradebook{course ? `: ${course.name}` : ''}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {students.length} {students.length === 1 ? 'student' : 'students'}, {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className={`inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={importGradebookCSV}
                className="hidden"
                disabled={importing}
              />
            </label>
            <button
              onClick={exportGradebookCSV}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span>Graded</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
          <span>Submitted / Ungraded</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span>Missing</span>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          importResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importResult.success ? (
            <div>
              <p className="font-medium">Import complete: {importResult.updated} grade{importResult.updated !== 1 ? 's' : ''} updated{importResult.skipped > 0 ? `, ${importResult.skipped} row${importResult.skipped !== 1 ? 's' : ''} skipped` : ''}</p>
              {importResult.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-yellow-700">{importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}</summary>
                  <ul className="mt-1 text-xs list-disc pl-4">
                    {importResult.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                    {importResult.errors.length > 10 && <li>...and {importResult.errors.length - 10} more</li>}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <p>{importResult.message}</p>
          )}
          <button onClick={() => setImportResult(null)} className="mt-1 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Gradebook Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              {/* Assignment Group Headers */}
              {assignmentGroups.length > 0 && (
                <tr className="bg-gray-100">
                  <th className="sticky left-0 z-20 bg-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b border-r min-w-[200px]">
                    &nbsp;
                  </th>
                  {groupedAssignments.map((group) => (
                    <th
                      key={group.id || 'other'}
                      colSpan={group.assignments.length}
                      className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r bg-gray-100"
                    >
                      {group.name}
                      {group.group_weight ? ` (${group.group_weight}%)` : ''}
                    </th>
                  ))}
                  <th colSpan={2} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b bg-gray-100">
                    Totals
                  </th>
                </tr>
              )}

              {/* Assignment Name Headers */}
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r min-w-[200px]">
                  Student
                </th>
                {groupedAssignments.flatMap((group) =>
                  group.assignments.map((assignment) => (
                    <th
                      key={assignment.id}
                      className="px-2 py-3 text-center text-xs font-medium text-gray-600 border-b border-r min-w-[100px] max-w-[140px]"
                    >
                      <Link
                        to={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="text-blue-600 hover:underline block truncate"
                        title={assignment.name}
                      >
                        {assignment.name}
                      </Link>
                      <div className="text-gray-400 font-normal mt-0.5">
                        {assignment.points_possible ?? 0} pts
                      </div>
                      {assignment.post_policy === 'manual' && (
                        <button
                          onClick={() => assignment.gradesPosted ? handleHideGrades(assignment.id) : handlePostGrades(assignment.id)}
                          disabled={postingAssignment === assignment.id}
                          className={`mt-1 text-xs px-1.5 py-0.5 rounded ${
                            assignment.gradesPosted
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          } transition-colors`}
                          title={assignment.gradesPosted ? 'Hide grades from students' : 'Post grades to students'}
                        >
                          {postingAssignment === assignment.id ? '...' : assignment.gradesPosted ? 'Posted' : 'Post'}
                        </button>
                      )}
                    </th>
                  ))
                )}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-b border-r min-w-[80px]">
                  Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 border-b min-w-[60px]">
                  Grade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={assignments.length + 3}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No students enrolled.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const total = calculateStudentTotal(student.id);
                  const letterGrade = getLetterGrade(total.percentage, gradingScale);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-900 border-r whitespace-nowrap">
                        {student.name}
                      </td>
                      {groupedAssignments.flatMap((group) =>
                        group.assignments.map((assignment) => {
                          const cell = getCellData(student.id, assignment.id);
                          const cellColor = getCellColor(cell);

                          return (
                            <td
                              key={`${student.id}-${assignment.id}`}
                              className={`px-2 py-2 text-center border-r ${cellColor}`}
                            >
                              <GradeInput
                                value={cell?.score ?? null}
                                pointsPossible={assignment.points_possible ?? 0}
                                onSave={(score) => handleGradeSave(student.id, assignment.id, score)}
                              />
                            </td>
                          );
                        })
                      )}
                      <td className="px-3 py-2 text-center text-sm border-r whitespace-nowrap">
                        {total.percentage !== null ? (
                          <span className="font-medium">
                            {total.earned}/{total.possible}
                            <span className="text-gray-400 ml-1">({total.percentage}%)</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-sm whitespace-nowrap">
                        <span className={`font-semibold ${gradeColor(letterGrade)}`}>
                          {letterGrade}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default GradebookPage;
