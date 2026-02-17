import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import GradeInput from '../components/GradeInput';

const GradebookPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [gradebook, setGradebook] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentGroups, setAssignmentGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Fetch gradebook data (if endpoint exists, otherwise build from submissions)
        try {
          const gb = await api.getGradebook(courseId);
          setGradebook(gb);
        } catch {
          // Fallback: build gradebook from individual submissions
          const gradebookData = {};
          await Promise.all(
            assignmentList.map(async (assignment) => {
              try {
                const subResult = await api.getSubmissions(courseId, assignment.id, 1, 200);
                const subs = subResult.data || [];
                for (const sub of subs) {
                  const uid = sub.user_id;
                  if (!gradebookData[uid]) gradebookData[uid] = {};
                  gradebookData[uid][assignment.id] = {
                    score: sub.score,
                    grade: sub.grade,
                    workflow_state: sub.workflow_state,
                    submitted_at: sub.submitted_at,
                  };
                }
              } catch {
                // Skip assignments that fail
              }
            })
          );
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

    // Update local state
    setGradebook((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      // Handle both formats: { submissions: {...} } and flat { studentId: {...} }
      const subs = updated.submissions || updated;
      const sid = String(studentId);
      const aid = String(assignmentId);
      if (!subs[sid]) subs[sid] = {};
      subs[sid] = {
        ...subs[sid],
        [aid]: {
          ...(subs[sid]?.[aid] || {}),
          score: parseFloat(score),
          grade: String(score),
          workflow_state: score !== null ? 'graded' : 'unsubmitted',
        },
      };
      if (updated.submissions) {
        updated.submissions = subs;
      }
      return updated;
    });
  };

  const calculateStudentTotal = (studentId) => {
    let earnedPoints = 0;
    let possiblePoints = 0;

    for (const assignment of assignments) {
      const cell = getCellData(studentId, assignment.id);
      if (cell && cell.score !== null && cell.score !== undefined) {
        earnedPoints += parseFloat(cell.score) || 0;
        possiblePoints += parseFloat(assignment.points_possible) || 0;
      }
    }

    if (possiblePoints === 0) return { earned: 0, possible: 0, percentage: null };
    return {
      earned: earnedPoints,
      possible: possiblePoints,
      percentage: ((earnedPoints / possiblePoints) * 100).toFixed(1),
    };
  };

  const getLetterGrade = (percentage) => {
    if (percentage === null) return '-';
    const pct = parseFloat(percentage);
    if (pct >= 93) return 'A';
    if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 73) return 'C';
    if (pct >= 70) return 'C-';
    if (pct >= 67) return 'D+';
    if (pct >= 63) return 'D';
    if (pct >= 60) return 'D-';
    return 'F';
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

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading gradebook...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
  }

  const groupedAssignments = getGroupedAssignments();

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          ← Back to Course
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">
          Gradebook{course ? `: ${course.name}` : ''}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {students.length} students, {assignments.length} assignments
        </p>
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
                  const letterGrade = getLetterGrade(total.percentage);

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
                        <span className={`font-semibold ${
                          letterGrade === '-' ? 'text-gray-400' :
                          letterGrade.startsWith('A') ? 'text-green-600' :
                          letterGrade.startsWith('B') ? 'text-blue-600' :
                          letterGrade.startsWith('C') ? 'text-yellow-600' :
                          letterGrade.startsWith('D') ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
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
