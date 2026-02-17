import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Award, Clock, User, CheckCircle, AlertCircle, MinusCircle, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SubmissionForm from '../components/SubmissionForm';
import SubmissionComments from '../components/SubmissionComments';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  graded: { label: 'Graded', color: 'bg-green-100 text-green-800', icon: Award },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  unsubmitted: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-600', icon: MinusCircle },
};

const AssignmentPage = () => {
  const { courseId, assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignment and enrollments in parallel
        const [assignmentData, enrollmentResult] = await Promise.all([
          api.getAssignment(courseId, assignmentId),
          api.getEnrollments(courseId, 1, 100),
        ]);

        setAssignment(assignmentData);

        const enrollmentList = enrollmentResult.data;
        setEnrollments(enrollmentList);

        // Determine role based on enrollment
        const myEnrollment = enrollmentList.find(
          (e) => e.user_id === user?.id || e.user?.id === user?.id
        );
        const teacherRole = myEnrollment?.type === 'TeacherEnrollment' ||
          myEnrollment?.role === 'TeacherEnrollment' ||
          myEnrollment?.enrollment_type === 'teacher';
        setIsTeacher(teacherRole);

        if (teacherRole) {
          // Teacher: fetch all submissions
          try {
            const submissionResult = await api.getSubmissions(courseId, assignmentId, 1, 100);
            setSubmissions(submissionResult.data || []);
          } catch {
            setSubmissions([]);
          }
        } else {
          // Student: fetch own submission
          try {
            const sub = await api.getSubmission(courseId, assignmentId, user?.id);
            setMySubmission(sub);
          } catch {
            setMySubmission(null);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, assignmentId, user?.id]);

  const handleSubmit = async (submissionData) => {
    const result = await api.createSubmission(courseId, assignmentId, submissionData);
    setMySubmission(result);
    return result;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusConfig = (submission) => {
    const state = submission?.workflow_state || 'unsubmitted';
    return STATUS_CONFIG[state] || STATUS_CONFIG.unsubmitted;
  };

  const getStudentName = (submission) => {
    if (submission.user?.name) return submission.user.name;
    if (submission.user?.display_name) return submission.user.display_name;
    // Try to find in enrollments
    const enrollment = enrollments.find(
      (e) => e.user_id === submission.user_id || e.user?.id === submission.user_id
    );
    return enrollment?.user?.name || `User ${submission.user_id}`;
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading assignment...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
  }
  if (!assignment) {
    return <Layout><div className="text-center py-12">Assignment not found</div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
          ← Back to Course
        </Link>
      </div>

      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{assignment.name}</h2>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Due: {formatDate(assignment.due_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>{assignment.points_possible ?? 0} points</span>
          </div>
          {assignment.submission_types && (
            <div className="text-gray-400">
              Type: {Array.isArray(assignment.submission_types)
                ? assignment.submission_types.join(', ')
                : assignment.submission_types}
            </div>
          )}
        </div>
        {assignment.description && (
          <div
            className="text-gray-700 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: assignment.description }}
          />
        )}
      </div>

      {/* Student View */}
      {!isTeacher && (
        <div className="space-y-6">
          {/* Submission Status */}
          {mySubmission && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-2">
                {(() => {
                  const config = getStatusConfig(mySubmission);
                  const StatusIcon = config.icon;
                  return (
                    <>
                      <StatusIcon className="w-5 h-5" />
                      <span className={`text-sm font-medium px-2 py-1 rounded ${config.color}`}>
                        {config.label}
                      </span>
                      {mySubmission.grade !== null && mySubmission.grade !== undefined && (
                        <span className="ml-auto text-lg font-semibold text-blue-600">
                          {mySubmission.score ?? mySubmission.grade} / {assignment.points_possible}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Submission Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <SubmissionForm
              courseId={courseId}
              assignmentId={assignmentId}
              existingSubmission={mySubmission}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Comments */}
          {mySubmission && mySubmission.workflow_state !== 'unsubmitted' && (
            <div className="bg-white rounded-lg shadow p-6">
              <SubmissionComments
                courseId={courseId}
                assignmentId={assignmentId}
                userId={user?.id}
                isTeacher={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Teacher View */}
      {isTeacher && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Submissions ({submissions.length})</h3>
            <Link
              to={`/courses/${courseId}/assignments/${assignmentId}/speedgrader`}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <Zap className="w-4 h-4" />
              <span>SpeedGrader</span>
            </Link>
          </div>
          {submissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No submissions yet.</div>
          ) : (
            <div className="divide-y">
              {submissions.map((submission) => {
                const config = getStatusConfig(submission);
                const StatusIcon = config.icon;
                return (
                  <div key={submission.id || submission.user_id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {getStudentName(submission)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {submission.submitted_at && (
                          <span className="text-xs text-gray-400">
                            {formatDate(submission.submitted_at)}
                          </span>
                        )}
                        <span className="text-sm font-semibold">
                          {submission.score !== null && submission.score !== undefined
                            ? `${submission.score} / ${assignment.points_possible}`
                            : `- / ${assignment.points_possible}`}
                        </span>
                      </div>
                    </div>

                    {submission.body && (
                      <div
                        className="text-sm text-gray-600 bg-gray-50 rounded p-3 mb-3 prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: submission.body }}
                      />
                    )}

                    {/* Inline comments for each submission */}
                    <div className="mt-3 border-t pt-3">
                      <SubmissionComments
                        courseId={courseId}
                        assignmentId={assignmentId}
                        userId={submission.user_id}
                        isTeacher={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AssignmentPage;
