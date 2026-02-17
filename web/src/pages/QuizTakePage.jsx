import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';

const QuizTakePage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const quizData = await api.getQuiz(courseId, quizId);
        setQuiz(quizData);

        // Start submission
        const sub = await api.startQuizSubmission(courseId, quizId);
        setSubmission(sub);

        if (sub.workflow_state === 'complete') {
          setCompleted(true);
          setLoading(false);
          return;
        }

        // Calculate time left
        if (sub.end_at) {
          const endAt = new Date(sub.end_at);
          const now = new Date();
          setTimeLeft(Math.max(0, Math.floor((endAt - now) / 1000)));
        }

        // Load questions
        const { data: qs } = await api.getQuizQuestions(courseId, quizId, 1, 100);
        setQuestions(qs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, quizId]);

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
  }, [timeLeft, completed]);

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

  const handleSubmit = async () => {
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
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Layout><div className="text-center py-12 text-gray-500">Loading quiz...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-red-600 text-center py-12">{error}</div></Layout>;
  }

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
            <Link
              to={`/courses/${courseId}`}
              className="text-blue-600 hover:underline"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Course
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
            <div className="mb-4 text-gray-800" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />

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
