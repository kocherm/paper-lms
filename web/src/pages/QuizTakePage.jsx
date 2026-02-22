import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, FileText, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import RichContentViewer, { sanitizeHTML } from '../components/RichContentViewer';

const QuizTakePage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const [lastSubmission, setLastSubmission] = useState(null);

  // Phase 1: Load quiz info and check existing submissions (does NOT start an attempt)
  useEffect(() => {
    const init = async () => {
      try {
        const quizData = await api.getQuiz(courseId, quizId);
        setQuiz(quizData);

        // Check for existing submissions
        try {
          const subResult = await api.getQuizSubmissions(courseId, quizId);
          const subs = subResult.data || [];
          if (subs.length > 0) {
            // Sort by attempt number descending
            subs.sort((a, b) => (b.attempt || 0) - (a.attempt || 0));
            const latest = subs[0];
            setPreviousAttempts(subs.filter(s => s.workflow_state === 'complete').length);
            setLastSubmission(latest);

            // If there's an in-progress submission, go straight to quiz
            if (latest.workflow_state === 'untaken' || latest.workflow_state === 'pending') {
              setSubmission(latest);
              if (latest.end_at) {
                const endAt = new Date(latest.end_at);
                const now = new Date();
                setTimeLeft(Math.max(0, Math.floor((endAt - now) / 1000)));
              }
              const { data: qs } = await api.getQuizQuestions(courseId, quizId, 1, 100);
              setQuestions(qs);
              setStarted(true);
            } else if (latest.workflow_state === 'complete') {
              // All attempts complete — check if more are allowed
              const allowed = quizData.allowed_attempts || -1;
              if (allowed !== -1 && subs.filter(s => s.workflow_state === 'complete').length >= allowed) {
                setCompleted(true);
                setSubmission(latest);
              }
            }
          }
        } catch {
          // No existing submissions — that's fine
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, quizId]);

  // Phase 2: Student clicks "Begin Quiz" — NOW start the submission
  const handleBeginQuiz = async () => {
    setStarting(true);
    setError(null);
    try {
      const sub = await api.startQuizSubmission(courseId, quizId);
      setSubmission(sub);

      if (sub.workflow_state === 'complete') {
        setCompleted(true);
        setStarting(false);
        return;
      }

      if (sub.end_at) {
        const endAt = new Date(sub.end_at);
        const now = new Date();
        setTimeLeft(Math.max(0, Math.floor((endAt - now) / 1000)));
      }

      const { data: qs } = await api.getQuizQuestions(courseId, quizId, 1, 100);
      setQuestions(qs);
      setStarted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || completed) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, completed, handleSubmit]);

  const handleAnswer = useCallback(async (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (submission) {
      try {
        await api.answerQuizQuestion(courseId, quizId, submission.id, questionId, answer);
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }
  }, [courseId, quizId, submission]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !submission) return;
    setSubmitting(true);
    try {
      const result = await api.completeQuizSubmission(courseId, quizId, submission.id);
      setSubmission(result);
      setCompleted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [courseId, quizId, submission, submitting]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12 gap-2 text-gray-500">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
  Loading quiz...
</div></Layout>;
  }
  if (error && !quiz) {
    return <Layout><div className="text-center py-12">
  <p className="text-red-600 mb-3">{error}</p>
  <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
</div></Layout>;
  }

  // Completed screen
  if (completed) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Submitted</h2>
            {submission?.score !== null && submission?.score !== undefined && (
              <p className="text-lg text-gray-700 mb-4">
                Score: <span className="font-semibold">{submission.score}</span>
                {quiz?.points_possible && ` / ${quiz.points_possible}`}
              </p>
            )}
            {submission?.workflow_state === 'pending_review' && (
              <p className="text-gray-500 mb-4">Some questions require manual grading.</p>
            )}
            <div className="flex items-center justify-center gap-4">
              {submission?.id && (
                <Link
                  to={`/courses/${courseId}/quizzes/${quizId}/submissions/${submission.id}/review`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Review Answers
                </Link>
              )}
              <Link
                to={`/courses/${courseId}`}
                className="text-blue-600 hover:underline text-sm"
              >
                Back to Course
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Pre-quiz landing page (not yet started)
  if (!started) {
    const allowedAttempts = quiz?.allowed_attempts || -1;
    const attemptsRemaining = allowedAttempts === -1 ? 'Unlimited' : Math.max(0, allowedAttempts - previousAttempts);
    const canStart = allowedAttempts === -1 || previousAttempts < allowedAttempts;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
              &larr; Back to Course
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 px-6 py-5">
              <h2 className="text-2xl font-bold text-white">{quiz?.title}</h2>
              {quiz?.quiz_type && (
                <span className="text-blue-100 text-sm capitalize">{quiz.quiz_type.replace('_', ' ')}</span>
              )}
            </div>

            <div className="p-6">
              {quiz?.description && (
                <RichContentViewer content={quiz.description} className="mb-6" />
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Points</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {quiz?.points_possible ?? 0}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Time Limit</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    {quiz?.time_limit ? (
                      <><Clock className="w-4 h-4 text-gray-400" /> {quiz.time_limit} minutes</>
                    ) : (
                      'None'
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Questions</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {quiz?.question_count || '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Attempts</div>
                  <div className="text-lg font-semibold text-gray-900 mt-1">
                    {previousAttempts > 0 && (
                      <span className="text-sm text-gray-500 font-normal mr-1">{previousAttempts} used /</span>
                    )}
                    {allowedAttempts === -1 ? 'Unlimited' : `${attemptsRemaining} remaining`}
                  </div>
                </div>
              </div>

              {/* Previous attempt info */}
              {lastSubmission && lastSubmission.workflow_state === 'complete' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">Previous Attempt</div>
                    <div className="text-xs text-green-600 mt-0.5">
                      Score: {lastSubmission.score !== null && lastSubmission.score !== undefined
                        ? `${lastSubmission.score}/${quiz?.points_possible ?? 0}`
                        : 'Pending review'}
                    </div>
                  </div>
                  {lastSubmission.id && (
                    <Link
                      to={`/courses/${courseId}/quizzes/${quizId}/submissions/${lastSubmission.id}/review`}
                      className="text-sm text-green-700 hover:underline font-medium"
                    >
                      Review Answers
                    </Link>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {canStart ? (
                <div className="text-center">
                  {quiz?.time_limit && (
                    <p className="text-sm text-amber-600 mb-3 flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Once you begin, the {quiz.time_limit}-minute timer will start and cannot be paused.
                    </p>
                  )}
                  <button
                    onClick={handleBeginQuiz}
                    disabled={starting}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold transition-colors"
                  >
                    {starting ? (
                      <>Starting...</>
                    ) : previousAttempts > 0 ? (
                      <><RotateCcw className="w-5 h-5" /> Retake Quiz</>
                    ) : (
                      <><FileText className="w-5 h-5" /> Begin Quiz</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="font-medium">No attempts remaining.</p>
                  <p className="text-sm mt-1">You have used all {allowedAttempts} allowed attempt{allowedAttempts !== 1 ? 's' : ''}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Active quiz taking screen
  const currentQuestion = questions[currentIdx];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
            &larr; Back to Course
          </Link>
          {timeLeft !== null && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">{quiz?.title}</h2>

        {/* Question navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded text-sm font-medium ${
                idx === currentIdx
                  ? 'bg-blue-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentIdx + 1} of {questions.length}
              </span>
              {currentQuestion.points_possible && (
                <span className="text-sm text-gray-500">{currentQuestion.points_possible} pts</span>
              )}
            </div>
            <div className="mb-4 text-gray-800" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentQuestion.question_text) }} />

            {/* Answer options based on question type */}
            {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && (
              <div className="space-y-2">
                {JSON.parse(currentQuestion.answers || '[]').map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center space-x-3 p-3 rounded border cursor-pointer ${
                      answers[currentQuestion.id] === opt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={answers[currentQuestion.id] === opt.id}
                      onChange={() => handleAnswer(currentQuestion.id, opt.id)}
                      className="text-blue-600"
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
              <textarea
                className="w-full border border-gray-300 rounded p-3 min-h-[100px]"
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                rows={currentQuestion.question_type === 'essay' ? 8 : 3}
              />
            )}

            {currentQuestion.question_type === 'numerical_question' && (
              <input
                type="number"
                className="w-full border border-gray-300 rounded p-3"
                placeholder="Enter a number..."
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="flex items-center space-x-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuizTakePage;
