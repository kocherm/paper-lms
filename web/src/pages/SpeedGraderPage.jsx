import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  MinusCircle,
  Send,
  Award,
  User,
  MessageSquare,
  FileText,
  Grid,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import { sanitizeHTML } from '../components/RichContentViewer';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, dot: 'bg-blue-500' },
  graded: { label: 'Graded', color: 'bg-green-100 text-green-800', icon: Award, dot: 'bg-green-500' },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock, dot: 'bg-yellow-500' },
  unsubmitted: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-600', icon: MinusCircle, dot: 'bg-gray-400' },
};

const getStatusConfig = (student) => {
  if (!student.submission) return STATUS_CONFIG.unsubmitted;
  const state = student.submission.workflow_state || 'unsubmitted';
  return STATUS_CONFIG[state] || STATUS_CONFIG.unsubmitted;
};

const SpeedGraderPage = () => {
  const { courseId, assignmentId } = useParams();
  const { user } = useAuth();
  const isTeacher = useIsTeacher(courseId);
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Grading state
  const [gradeInput, setGradeInput] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Rubric state
  const [rubric, setRubric] = useState(null); // {rubric, rubric_association}
  const [rubricCriteria, setRubricCriteria] = useState([]); // parsed criteria array
  const [rubricScores, setRubricScores] = useState({}); // {criterion_id: {points, comments}}
  const [rubricExpanded, setRubricExpanded] = useState(true);
  const [rubricSaving, setRubricSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getSpeedGraderData(courseId, assignmentId);
      setAssignment(result.assignment);
      setStudents(result.students || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedStudent = students[selectedIndex] || null;

  // Fetch rubric for this assignment
  useEffect(() => {
    if (!courseId || !assignmentId) return;
    api.getAssignmentRubric(courseId, assignmentId)
      .then((data) => {
        setRubric(data);
        try {
          const rubricData = data?.rubric?.data;
          const criteria = typeof rubricData === 'string'
            ? JSON.parse(rubricData)
            : rubricData;
          setRubricCriteria(Array.isArray(criteria) ? criteria : []);
        } catch {
          setRubricCriteria([]);
        }
      })
      .catch(() => {
        setRubric(null);
        setRubricCriteria([]);
      });
  }, [courseId, assignmentId]);

  // Load existing rubric assessment when student changes
  useEffect(() => {
    if (!rubric || !selectedStudent) {
      setRubricScores({});
      setExistingAssessmentId(null);
      return;
    }
    const assocId = rubric.rubric_association?.id;
    if (!assocId) return;

    api.getRubricAssessments(courseId, assocId, 1, 200)
      .then((result) => {
        const assessments = result.data || [];
        const existing = assessments.find(
          (a) => a.user_id === selectedStudent.user_id
        );
        if (existing) {
          setExistingAssessmentId(existing.id);
          try {
            const data = typeof existing.data === 'string'
              ? JSON.parse(existing.data)
              : existing.data;
            setRubricScores(data || {});
          } catch {
            setRubricScores({});
          }
        } else {
          setExistingAssessmentId(null);
          setRubricScores({});
        }
      })
      .catch(() => {
        setExistingAssessmentId(null);
        setRubricScores({});
      });
  }, [courseId, rubric, selectedStudent?.user_id]);

  // Update grade input when selected student changes
  useEffect(() => {
    if (students.length > 0 && students[selectedIndex]) {
      const student = students[selectedIndex];
      if (student.submission?.score !== null && student.submission?.score !== undefined) {
        setGradeInput(String(student.submission.score));
      } else {
        setGradeInput('');
      }
      setGradeSuccess(false);
    }
  }, [selectedIndex, students]);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent || gradeInput === '') return;

    setGrading(true);
    setGradeSuccess(false);
    try {
      await api.gradeSubmission(courseId, assignmentId, selectedStudent.user_id, {
        posted_grade: gradeInput,
      });

      // Update local state
      setStudents((prev) => {
        const updated = [...prev];
        const student = { ...updated[selectedIndex] };
        if (student.submission) {
          student.submission = {
            ...student.submission,
            score: parseFloat(gradeInput),
            grade: gradeInput,
            workflow_state: 'graded',
          };
        } else {
          student.submission = {
            user_id: student.user_id,
            score: parseFloat(gradeInput),
            grade: gradeInput,
            workflow_state: 'graded',
          };
        }
        updated[selectedIndex] = student;
        return updated;
      });
      setGradeSuccess(true);
      setTimeout(() => setGradeSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGrading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.createSubmissionComment(
        courseId,
        assignmentId,
        selectedStudent.user_id,
        { text_comment: commentText }
      );

      // Update local state
      setStudents((prev) => {
        const updated = [...prev];
        const student = { ...updated[selectedIndex] };
        student.comments = [...(student.comments || []), newComment];
        updated[selectedIndex] = student;
        return updated;
      });
      setCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const rubricTotal = Object.values(rubricScores).reduce(
    (sum, c) => sum + (parseFloat(c.points) || 0), 0
  );

  const handleRubricCriterionChange = (criterionId, field, value) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], [field]: value },
    }));
  };

  const handleSaveRubric = async () => {
    if (!rubric || !selectedStudent || !rubric.rubric_association?.id) return;
    const assocId = rubric.rubric_association.id;
    setRubricSaving(true);
    try {
      const dataStr = JSON.stringify(rubricScores);
      if (existingAssessmentId) {
        await api.updateRubricAssessment(courseId, assocId, existingAssessmentId, {
          data: dataStr,
          assessment_type: 'grading',
        });
      } else {
        const created = await api.createRubricAssessment(courseId, assocId, {
          user_id: selectedStudent.user_id,
          data: dataStr,
          assessment_type: 'grading',
        });
        setExistingAssessmentId(created.id);
      }
      // Auto-fill grade input with rubric total
      setGradeInput(String(rubricTotal));
    } catch (err) {
      setError(err.message);
    } finally {
      setRubricSaving(false);
    }
  };

  const navigateStudent = (direction) => {
    const newIndex = selectedIndex + direction;
    if (newIndex >= 0 && newIndex < students.length) {
      setSelectedIndex(newIndex);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };

  if (isTeacher === false) return <Navigate to={`/courses/${courseId}`} replace />;
  if (isTeacher === null) return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading...
</div></Layout>;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
          Loading SpeedGrader...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={() => { setError(null); window.location.reload(); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
        </div>
      </Layout>
    );
  }

  if (!assignment) {
    return (
      <Layout>
        <div className="text-center py-12">Assignment not found</div>
      </Layout>
    );
  }

  const submittedCount = students.filter(
    (s) => s.submission && s.submission.workflow_state !== 'unsubmitted'
  ).length;
  const gradedCount = students.filter(
    (s) => s.submission && s.submission.workflow_state === 'graded'
  ).length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-4">
        <Link
          to={`/courses/${courseId}/assignments/${assignmentId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          &larr; Back to Assignment
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">SpeedGrader</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {assignment.anonymous_grading && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Anonymous Grading
              </span>
            )}
            <span>{submittedCount}/{students.length} submitted</span>
            <span>{gradedCount}/{students.length} graded</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {assignment.name} &middot; {assignment.points_possible ?? 0} points
        </p>
      </div>

      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
        {/* Left Sidebar: Student List */}
        <div className="w-64 flex-shrink-0 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-700">
              Students ({students.length})
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {students.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No students enrolled</div>
            ) : (
              students.map((student, index) => {
                const config = getStatusConfig(student);
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={student.user_id}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-100 flex items-center space-x-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'
                        }`}
                      >
                        {student.user_name || `User ${student.user_id}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {student.submission?.score !== null &&
                        student.submission?.score !== undefined
                          ? `${student.submission.score}/${assignment.points_possible ?? 0}`
                          : config.label}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Navigation Bar */}
          <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigateStudent(-1)}
              disabled={selectedIndex <= 0}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="text-sm font-medium text-gray-700">
              {students.length > 0
                ? `${selectedIndex + 1} of ${students.length}`
                : 'No students'}
              {selectedStudent && (
                <span className="text-gray-500">
                  {' '}&mdash; {selectedStudent.user_name || `User ${selectedStudent.user_id}`}
                </span>
              )}
            </span>
            <button
              onClick={() => navigateStudent(1)}
              disabled={selectedIndex >= students.length - 1}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Submission Content */}
          {selectedStudent ? (
            <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
              {/* Submission Header */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedStudent.user_name || `User ${selectedStudent.user_id}`}
                    </p>
                    {selectedStudent.submission?.submitted_at && (
                      <p className="text-xs text-gray-500">
                        Submitted {formatDate(selectedStudent.submission.submitted_at)}
                        {selectedStudent.submission.late && (
                          <span className="ml-2 text-red-600 font-medium">LATE</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {(() => {
                    const config = getStatusConfig(selectedStudent);
                    return (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Submission Body */}
              <div className="p-6 flex-1 overflow-y-auto">
                {!selectedStudent.submission ||
                selectedStudent.submission.workflow_state === 'unsubmitted' ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <AlertCircle className="w-12 h-12 mb-3" />
                    <p className="text-lg font-medium">No Submission</p>
                    <p className="text-sm">This student has not submitted this assignment.</p>
                  </div>
                ) : (
                  <div>
                    {selectedStudent.submission.submission_type && (
                      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span>
                          Type: {selectedStudent.submission.submission_type}
                          {selectedStudent.submission.attempt > 0 &&
                            ` (Attempt ${selectedStudent.submission.attempt})`}
                        </span>
                      </div>
                    )}

                    {selectedStudent.submission.body && (
                      <div
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHTML(selectedStudent.submission.body),
                        }}
                      />
                    )}

                    {selectedStudent.submission.url && (
                      <div className="mt-4">
                        <a
                          href={selectedStudent.submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {selectedStudent.submission.url}
                        </a>
                      </div>
                    )}

                    {selectedStudent.submission.attachments?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedStudent.submission.attachments.map((file, idx) => (
                            <a
                              key={file.id || idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                            >
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-blue-600 truncate">{file.display_name || file.filename}</span>
                              {file.size && (
                                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                  {file.size > 1048576
                                    ? `${(file.size / 1048576).toFixed(1)} MB`
                                    : `${Math.round(file.size / 1024)} KB`}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedStudent.submission.body &&
                      !selectedStudent.submission.url &&
                      !selectedStudent.submission.attachments?.length && (
                        <p className="text-gray-400 italic">
                          No content available for this submission type.
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow flex-1 flex items-center justify-center text-gray-400">
              <p>Select a student to view their submission</p>
            </div>
          )}
        </div>

        {/* Right Panel: Grading & Comments */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Grade Input */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Grade</span>
            </h3>
            <form onSubmit={handleGrade} className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={assignment.points_possible ?? undefined}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Score"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedStudent}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  / {assignment.points_possible ?? 0}
                </span>
              </div>

              {assignment.points_possible > 0 && gradeInput !== '' && (
                <div className="text-xs text-gray-500">
                  {((parseFloat(gradeInput) / assignment.points_possible) * 100).toFixed(1)}%
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedStudent || gradeInput === '' || grading}
                className="w-full bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {grading ? 'Saving...' : 'Update Grade'}
              </button>

              {gradeSuccess && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>Grade saved</span>
                </div>
              )}
            </form>
          </div>

          {/* Rubric Scoring */}
          {rubricCriteria.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => setRubricExpanded(!rubricExpanded)}
                className="w-full p-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                  <Grid className="w-4 h-4" />
                  <span>Rubric ({rubricCriteria.length} criteria)</span>
                </h3>
                {rubricExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {rubricExpanded && (
                <div className="p-3 space-y-4">
                  {rubricCriteria.map((criterion) => {
                    const cId = criterion.id || criterion.description;
                    const currentScore = rubricScores[cId] || {};
                    const ratings = criterion.ratings || [];
                    return (
                      <div key={cId} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-700">{criterion.description}</p>
                          <span className="text-xs text-gray-400">{criterion.points} pts</span>
                        </div>
                        {criterion.long_description && (
                          <p className="text-xs text-gray-400 mb-2">{criterion.long_description}</p>
                        )}
                        {/* Rating buttons */}
                        {ratings.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {ratings.map((rating) => {
                              const isSelected = parseFloat(currentScore.points) === rating.points;
                              return (
                                <button
                                  key={rating.id || rating.description}
                                  type="button"
                                  onClick={() => handleRubricCriterionChange(cId, 'points', rating.points)}
                                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    isSelected
                                      ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                  title={rating.description}
                                  disabled={!selectedStudent}
                                >
                                  {rating.points} - {rating.description}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {/* Custom points + comments */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max={criterion.points}
                            value={currentScore.points ?? ''}
                            onChange={(e) => handleRubricCriterionChange(cId, 'points', e.target.value)}
                            placeholder="Pts"
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={!selectedStudent}
                          />
                          <input
                            type="text"
                            value={currentScore.comments || ''}
                            onChange={(e) => handleRubricCriterionChange(cId, 'comments', e.target.value)}
                            placeholder="Comment..."
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={!selectedStudent}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Rubric total + save */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-semibold text-gray-700">
                      Total: {rubricTotal} / {rubric?.rubric?.points_possible ?? rubricCriteria.reduce((s, c) => s + (c.points || 0), 0)}
                    </span>
                    <button
                      onClick={handleSaveRubric}
                      disabled={!selectedStudent || rubricSaving}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {rubricSaving ? 'Saving...' : 'Apply Rubric'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>
                  Comments
                  {selectedStudent?.comments?.length > 0 &&
                    ` (${selectedStudent.comments.length})`}
                </span>
              </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
              {!selectedStudent?.comments?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
              ) : (
                selectedStudent.comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {comment.author_id === user?.id
                          ? 'You'
                          : comment.author_name || comment.author?.display_name || comment.author?.name
                            || students.find(s => s.user_id === comment.author_id)?.user_name
                            || `User ${comment.author_id}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <div className="p-3 border-t bg-gray-50">
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedStudent || submittingComment}
                />
                <button
                  type="submit"
                  disabled={!selectedStudent || !commentText.trim() || submittingComment}
                  className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SpeedGraderPage;
