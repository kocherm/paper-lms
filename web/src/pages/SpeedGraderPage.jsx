import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  MessageSquare,
  FileText,
  Grid,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useIsTeacher from '../hooks/useIsTeacher';
import Layout from '../components/Layout';
import { sanitizeHTML } from '../components/RichContentViewer';
import { useLiveRegion } from '../components/LiveRegion';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, dot: 'bg-blue-500' },
  graded: { label: 'Graded', color: 'bg-green-100 text-green-800', icon: Award, dot: 'bg-green-500' },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock, dot: 'bg-yellow-500' },
  unsubmitted: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-600', icon: MinusCircle, dot: 'bg-gray-400' },
};

const getStatusConfig = (student) => {
  if (!student?.submission) return STATUS_CONFIG.unsubmitted;
  const state = student.submission.workflow_state || 'unsubmitted';
  return STATUS_CONFIG[state] || STATUS_CONFIG.unsubmitted;
};

const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleString() : '');

const initialsOf = (name, fallbackId) => {
  if (!name) return `U${fallbackId ?? ''}`.slice(0, 2).toUpperCase();
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const StudentListItem = React.memo(
  function StudentListItem({ student, isSelected, pointsPossible, onSelect, onKeyDown, itemRef }) {
    const config = getStatusConfig(student);
    const score = student.submission?.score;
    const hasScore = score !== null && score !== undefined;
    return (
      <button
        ref={itemRef}
        onClick={() => onSelect(student.user_id)}
        onKeyDown={onKeyDown}
        role="option"
        aria-selected={isSelected}
        className={`w-full text-left px-3 py-2.5 border-b border-gray-100 flex items-center space-x-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isSelected
            ? 'bg-blue-50 border-l-4 border-l-blue-500'
            : 'hover:bg-gray-50 border-l-4 border-l-transparent'
        }`}
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} aria-hidden="true" />
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {initialsOf(student.user_name, student.user_id)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
            {student.user_name || `User ${student.user_id}`}
          </p>
          <p className="text-xs text-gray-600">
            {hasScore ? `${score}/${pointsPossible ?? 0}` : config.label}
          </p>
        </div>
      </button>
    );
  },
  (prev, next) =>
    prev.student.user_id === next.student.user_id &&
    prev.student.submission?.workflow_state === next.student.submission?.workflow_state &&
    prev.student.submission?.score === next.student.submission?.score &&
    prev.isSelected === next.isSelected &&
    prev.pointsPossible === next.pointsPossible &&
    prev.onSelect === next.onSelect &&
    prev.onKeyDown === next.onKeyDown
);

const RubricCriterionRow = React.memo(
  function RubricCriterionRow({ criterion, score, comment, disabled, onScoreChange, onCommentChange }) {
    const cId = criterion.id || criterion.description;
    const ratings = criterion.ratings || [];
    return (
      <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-700">{criterion.description}</p>
          <Badge variant="outline" className="text-xs">{criterion.points} pts</Badge>
        </div>
        {criterion.long_description && (
          <p className="text-xs text-gray-600 mb-2">{criterion.long_description}</p>
        )}
        {ratings.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {ratings.map((rating) => {
              const isSelected = parseFloat(score) === rating.points;
              return (
                <button
                  key={rating.id || rating.description}
                  type="button"
                  onClick={() => onScoreChange(cId, rating.points)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  title={rating.description}
                  disabled={disabled}
                >
                  {rating.points} - {rating.description}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            min="0"
            max={criterion.points}
            value={score ?? ''}
            onChange={(e) => onScoreChange(cId, e.target.value)}
            placeholder="Pts"
            className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={disabled}
          />
          <input
            type="text"
            value={comment || ''}
            onChange={(e) => onCommentChange(cId, e.target.value)}
            placeholder="Comment..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
      </div>
    );
  },
  (prev, next) => {
    const prevId = prev.criterion.id || prev.criterion.description;
    const nextId = next.criterion.id || next.criterion.description;
    return (
      prevId === nextId &&
      prev.score === next.score &&
      prev.comment === next.comment &&
      prev.disabled === next.disabled &&
      prev.onScoreChange === next.onScoreChange &&
      prev.onCommentChange === next.onCommentChange
    );
  }
);

const SubmissionPreview = React.memo(function SubmissionPreview({ student }) {
  if (!student) {
    return (
      <Card className="flex-1 flex items-center justify-center text-gray-600 p-6">
        <p>Select a student to view their submission</p>
      </Card>
    );
  }

  const config = getStatusConfig(student);
  const sub = student.submission;
  const isUnsubmitted = !sub || sub.workflow_state === 'unsubmitted';

  return (
    <Card className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initialsOf(student.user_name, student.user_id)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">
              {student.user_name || `User ${student.user_id}`}
            </p>
            {sub?.submitted_at && (
              <p className="text-xs text-gray-500">
                Submitted {formatDate(sub.submitted_at)}
                {sub.late && <span className="ml-2 text-red-600 font-medium">LATE</span>}
              </p>
            )}
          </div>
        </div>
        <Badge className={config.color} variant="outline">{config.label}</Badge>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {isUnsubmitted ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">No Submission</p>
            <p className="text-sm">This student has not submitted this assignment.</p>
          </div>
        ) : (
          <div>
            {sub.submission_type && (
              <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>
                  Type: {sub.submission_type}
                  {sub.attempt > 0 && ` (Attempt ${sub.attempt})`}
                </span>
              </div>
            )}

            {sub.body && (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(sub.body) }}
              />
            )}

            {sub.url && (
              <div className="mt-4">
                <a
                  href={sub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {sub.url}
                </a>
              </div>
            )}

            {sub.attachments?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {sub.attachments.map((file, idx) => (
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
                        <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
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

            {!sub.body && !sub.url && !sub.attachments?.length && (
              <p className="text-gray-600 italic">No content available for this submission type.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});

const SpeedGraderSkeleton = () => (
  <Layout>
    <div className="mb-4">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-8 w-48" />
    </div>
    <div className="flex gap-4">
      <div className="w-64 flex-shrink-0 space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
      <div className="w-80 flex-shrink-0 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  </Layout>
);

const SpeedGraderPage = () => {
  const { courseId, assignmentId } = useParams();
  const { user } = useAuth();
  const isTeacher = useIsTeacher(courseId);
  const { announce } = useLiveRegion();
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gradeInput, setGradeInput] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [rubric, setRubric] = useState(null);
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [rubricScores, setRubricScores] = useState({});
  const [rubricExpanded, setRubricExpanded] = useState(true);
  const [rubricSaving, setRubricSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState(null);

  const studentRefs = useRef({});

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedStudent = students[selectedIndex] || null;

  useEffect(() => {
    if (!courseId || !assignmentId) return;
    api.getAssignmentRubric(courseId, assignmentId)
      .then((data) => {
        setRubric(data);
        try {
          const rubricData = data?.rubric?.data;
          const criteria = typeof rubricData === 'string' ? JSON.parse(rubricData) : rubricData;
          setRubricCriteria(Array.isArray(criteria) ? criteria : []);
        } catch {
          setRubricCriteria([]);
        }
      })
      .catch(() => { setRubric(null); setRubricCriteria([]); });
  }, [courseId, assignmentId]);

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
        const existing = assessments.find((a) => a.user_id === selectedStudent.user_id);
        if (existing) {
          setExistingAssessmentId(existing.id);
          try {
            const data = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
            setRubricScores(data || {});
          } catch {
            setRubricScores({});
          }
        } else {
          setExistingAssessmentId(null);
          setRubricScores({});
        }
      })
      .catch(() => { setExistingAssessmentId(null); setRubricScores({}); });
  }, [courseId, rubric, selectedStudent?.user_id]);

  useEffect(() => {
    if (students.length > 0 && students[selectedIndex]) {
      const student = students[selectedIndex];
      const score = student.submission?.score;
      setGradeInput(score !== null && score !== undefined ? String(score) : '');
      setGradeSuccess(false);
    }
  }, [selectedIndex, students]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const an = (a.user_name || `User ${a.user_id}`).toLowerCase();
      const bn = (b.user_name || `User ${b.user_id}`).toLowerCase();
      return an.localeCompare(bn);
    });
  }, [students]);

  const submittedCount = useMemo(
    () => students.filter((s) => s.submission && s.submission.workflow_state !== 'unsubmitted').length,
    [students]
  );
  const gradedCount = useMemo(
    () => students.filter((s) => s.submission && s.submission.workflow_state === 'graded').length,
    [students]
  );

  const rubricTotal = useMemo(
    () => Object.values(rubricScores).reduce((sum, c) => sum + (parseFloat(c.points) || 0), 0),
    [rubricScores]
  );

  const rubricMax = useMemo(
    () => rubric?.rubric?.points_possible ?? rubricCriteria.reduce((s, c) => s + (c.points || 0), 0),
    [rubric, rubricCriteria]
  );

  const isStudentSubmitted = useMemo(
    () => !!selectedStudent?.submission && selectedStudent.submission.workflow_state !== 'unsubmitted',
    [selectedStudent]
  );

  const canPost = useMemo(
    () => !!selectedStudent && gradeInput !== '' && !grading,
    [selectedStudent, gradeInput, grading]
  );

  const handleSelectStudent = useCallback((userId) => {
    const idx = students.findIndex((s) => s.user_id === userId);
    if (idx >= 0) setSelectedIndex(idx);
  }, [students]);

  const handleStudentKeyDown = useCallback((e) => {
    const focusByIndex = (i) => {
      const target = students[i];
      if (!target) return;
      setSelectedIndex(i);
      const node = studentRefs.current[target.user_id];
      if (node) node.focus();
      announce(`${target.user_name || `User ${target.user_id}`} selected.`);
    };
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusByIndex(Math.min(selectedIndex + 1, students.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusByIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusByIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusByIndex(students.length - 1);
    }
  }, [students, selectedIndex, announce]);

  const handleScoreChange = useCallback((e) => setGradeInput(e.target.value), []);
  const handleCommentChange = useCallback((e) => setCommentText(e.target.value), []);

  const handlePost = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedStudent || gradeInput === '') return;

    setGrading(true);
    setGradeSuccess(false);
    try {
      await api.gradeSubmission(courseId, assignmentId, selectedStudent.user_id, {
        posted_grade: gradeInput,
      });

      setStudents((prev) => {
        const updated = [...prev];
        const student = { ...updated[selectedIndex] };
        const base = student.submission || { user_id: student.user_id };
        student.submission = {
          ...base,
          score: parseFloat(gradeInput),
          grade: gradeInput,
          workflow_state: 'graded',
        };
        updated[selectedIndex] = student;
        return updated;
      });
      setGradeSuccess(true);
      announce(`Grade ${gradeInput} saved for ${selectedStudent.user_name || 'student'}.`);
      setTimeout(() => setGradeSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
      announce(`Error saving grade: ${err.message}`, 'assertive');
    } finally {
      setGrading(false);
    }
  }, [courseId, assignmentId, selectedStudent, selectedIndex, gradeInput, announce]);

  const handleAddComment = useCallback(async (e) => {
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

      setStudents((prev) => {
        const updated = [...prev];
        const student = { ...updated[selectedIndex] };
        student.comments = [...(student.comments || []), newComment];
        updated[selectedIndex] = student;
        return updated;
      });
      setCommentText('');
      announce('Comment added.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  }, [courseId, assignmentId, selectedStudent, selectedIndex, commentText, announce]);

  const handleCriterionScoreChange = useCallback((criterionId, value) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], points: value },
    }));
  }, []);

  const handleCriterionCommentChange = useCallback((criterionId, value) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], comments: value },
    }));
  }, []);

  const handleSaveRubric = useCallback(async () => {
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
      setGradeInput(String(rubricTotal));
      announce(`Rubric saved. Total ${rubricTotal} of ${rubricMax}.`);
    } catch (err) {
      setError(err.message);
      announce(`Error saving rubric: ${err.message}`, 'assertive');
    } finally {
      setRubricSaving(false);
    }
  }, [rubric, selectedStudent, rubricScores, existingAssessmentId, courseId, rubricTotal, rubricMax, announce]);

  const navigateStudent = useCallback((direction) => {
    setSelectedIndex((prev) => {
      const next = prev + direction;
      if (next < 0 || next >= students.length) return prev;
      const target = students[next];
      announce(`${target?.user_name || `User ${target?.user_id}`} selected. ${next + 1} of ${students.length}.`);
      return next;
    });
  }, [students, announce]);

  const setStudentRef = useCallback((id) => (node) => {
    if (node) studentRefs.current[id] = node;
    else delete studentRefs.current[id];
  }, []);

  if (isTeacher === false) return <Navigate to={`/courses/${courseId}`} replace />;
  if (isTeacher === null || loading) return <SpeedGraderSkeleton />;

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-3">{error}</p>
          <Button
            variant="link"
            onClick={() => { setError(null); window.location.reload(); }}
            className="text-blue-600"
          >
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  if (!assignment) {
    return <Layout><div className="text-center py-12">Assignment not found</div></Layout>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Layout>
        <div className="mb-4">
          <Link
            to={`/courses/${courseId}/assignments/${assignmentId}`}
            className="text-blue-600 hover:underline text-sm"
          >
            &larr; Back to Assignment
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-bold text-gray-900">SpeedGrader</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {assignment.anonymous_grading && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  Anonymous Grading
                </Badge>
              )}
              <span>{submittedCount}/{students.length} submitted</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{gradedCount}/{students.length} graded</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {assignment.name} &middot; {assignment.points_possible ?? 0} points
          </p>
        </div>

        <div className="flex gap-4 items-start">
          {/* Left rail: sticky student list */}
          <Card
            className="w-64 flex-shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto flex flex-col"
            role="listbox"
            aria-label="Students"
          >
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700">
                Students ({sortedStudents.length})
              </h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {sortedStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No students enrolled</div>
              ) : (
                sortedStudents.map((student) => (
                  <StudentListItem
                    key={student.user_id}
                    student={student}
                    isSelected={selectedStudent?.user_id === student.user_id}
                    pointsPossible={assignment.points_possible}
                    onSelect={handleSelectStudent}
                    onKeyDown={handleStudentKeyDown}
                    itemRef={setStudentRef(student.user_id)}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Center: scrolling submission preview */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <Card className="px-4 py-3 flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateStudent(-1)}
                    disabled={selectedIndex <= 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous student</TooltipContent>
              </Tooltip>
              <span className="text-sm font-medium text-gray-700">
                {students.length > 0 ? `${selectedIndex + 1} of ${students.length}` : 'No students'}
                {selectedStudent && (
                  <span className="text-gray-500">
                    {' '}&mdash; {selectedStudent.user_name || `User ${selectedStudent.user_id}`}
                  </span>
                )}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateStudent(1)}
                    disabled={selectedIndex >= students.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next student</TooltipContent>
              </Tooltip>
            </Card>

            <SubmissionPreview student={selectedStudent} />
          </div>

          {/* Right rail: sticky grade entry & rubric */}
          <div className="w-80 flex-shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto flex flex-col gap-4">
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Grade</span>
                {isStudentSubmitted && (
                  <Badge variant="outline" className="ml-auto text-[10px]">Submitted</Badge>
                )}
              </h3>
              <form onSubmit={handlePost} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={assignment.points_possible ?? undefined}
                    value={gradeInput}
                    onChange={handleScoreChange}
                    placeholder="Score"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedStudent}
                    aria-label="Grade score"
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

                <Button type="submit" disabled={!canPost} className="w-full">
                  {grading ? 'Saving...' : 'Update Grade'}
                </Button>

                {gradeSuccess && (
                  <div className="flex items-center space-x-1 text-green-600 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Grade saved</span>
                  </div>
                )}
              </form>
            </Card>

            {rubricCriteria.length > 0 && (
              <Card className="overflow-hidden">
                <button
                  onClick={() => setRubricExpanded((v) => !v)}
                  className="w-full p-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  aria-expanded={rubricExpanded}
                >
                  <h3 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                    <Grid className="w-4 h-4" />
                    <span>Rubric ({rubricCriteria.length} criteria)</span>
                  </h3>
                  {rubricExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {rubricExpanded && (
                  <div className="p-3 space-y-4">
                    {rubricCriteria.map((criterion) => {
                      const cId = criterion.id || criterion.description;
                      const cs = rubricScores[cId] || {};
                      return (
                        <RubricCriterionRow
                          key={cId}
                          criterion={criterion}
                          score={cs.points}
                          comment={cs.comments}
                          disabled={!selectedStudent}
                          onScoreChange={handleCriterionScoreChange}
                          onCommentChange={handleCriterionCommentChange}
                        />
                      );
                    })}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Total: {rubricTotal} / {rubricMax}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleSaveRubric}
                        disabled={!selectedStudent || rubricSaving}
                      >
                        {rubricSaving ? 'Saving...' : 'Apply Rubric'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    Comments
                    {selectedStudent?.comments?.length > 0 && ` (${selectedStudent.comments.length})`}
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
                {!selectedStudent?.comments?.length ? (
                  <p className="text-sm text-gray-600 text-center py-4">No comments yet</p>
                ) : (
                  selectedStudent.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {comment.author_id === user?.id
                            ? 'You'
                            : comment.author_name || comment.author?.display_name || comment.author?.name
                              || students.find((s) => s.user_id === comment.author_id)?.user_name
                              || `User ${comment.author_id}`}
                        </span>
                        <span className="text-xs text-gray-600">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t bg-gray-50">
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedStudent || submittingComment}
                    aria-label="Comment text"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!selectedStudent || !commentText.trim() || submittingComment}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send comment</TooltipContent>
                  </Tooltip>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
};

export default SpeedGraderPage;
