import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import Layout from '../components/Layout';
import CourseNav from '../components/CourseNav';

const QuizStatisticsPage = () => {
  const { courseId, quizId } = useParams();
  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsResult, quizResult] = await Promise.all([
          api.getQuizStatistics(courseId, quizId),
          api.getQuiz(courseId, quizId),
        ]);
        setStats(statsResult?.quiz_statistics || statsResult);
        setQuiz(quizResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, quizId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading statistics...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  const quizLevel = stats?.quiz_level || {};
  const questionStats = stats?.question_statistics || [];

  const formatPercent = (val) => {
    if (val == null || isNaN(val)) return '0%';
    return `${val}%`;
  };

  const getDifficultyColor = (idx) => {
    if (idx >= 80) return 'text-green-700 bg-green-50';
    if (idx >= 60) return 'text-blue-700 bg-blue-50';
    if (idx >= 40) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const getDifficultyLabel = (idx) => {
    if (idx >= 80) return 'Easy';
    if (idx >= 60) return 'Moderate';
    if (idx >= 40) return 'Challenging';
    return 'Difficult';
  };

  return (
    <Layout>
      <CourseNav />
      <div className="mb-6">
        <Link to={`/courses/${courseId}/quizzes`} className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back to Quizzes
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">
          {quiz?.title || 'Quiz'} - Statistics
        </h2>
        <p className="text-sm text-gray-500 mt-1">Item analysis and performance summary</p>
      </div>

      {/* Quiz-Level Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Submissions"
          value={quizLevel.submission_count || 0}
          bgColor="bg-blue-50"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Average Score"
          value={`${quizLevel.average_score ?? 0}${quizLevel.points_possible ? ` / ${quizLevel.points_possible}` : ''}`}
          subtitle={quizLevel.points_possible > 0 ? `${Math.round((quizLevel.average_score / quizLevel.points_possible) * 100)}%` : null}
          bgColor="bg-green-50"
        />
        <SummaryCard
          icon={<Award className="w-5 h-5 text-purple-600" />}
          label="High / Low"
          value={`${quizLevel.high_score ?? 0} / ${quizLevel.low_score ?? 0}`}
          subtitle={`Median: ${quizLevel.median_score ?? 0}`}
          bgColor="bg-purple-50"
        />
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5 text-orange-600" />}
          label="Std. Deviation"
          value={quizLevel.standard_deviation ?? 0}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Score Distribution */}
      {quizLevel.submission_count > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Average</span>
              <p className="font-semibold text-gray-900">{quizLevel.average_score ?? 0}</p>
            </div>
            <div>
              <span className="text-gray-500">Median</span>
              <p className="font-semibold text-gray-900">{quizLevel.median_score ?? 0}</p>
            </div>
            <div>
              <span className="text-gray-500">Highest</span>
              <p className="font-semibold text-green-700">{quizLevel.high_score ?? 0}</p>
            </div>
            <div>
              <span className="text-gray-500">Lowest</span>
              <p className="font-semibold text-red-700">{quizLevel.low_score ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Per-Question Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Question Analysis</h3>
        {questionStats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No question data available yet.
          </div>
        ) : (
          questionStats.map((q, idx) => (
            <QuestionCard key={q.question_id} question={q} index={idx} formatPercent={formatPercent} getDifficultyColor={getDifficultyColor} getDifficultyLabel={getDifficultyLabel} />
          ))
        )}
      </div>
    </Layout>
  );
};

const SummaryCard = ({ icon, label, value, subtitle, bgColor }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const QuestionCard = ({ question, index, formatPercent, getDifficultyColor, getDifficultyLabel }) => {
  const q = question;
  const hasAnswerDistribution = q.answers && q.answers.length > 0;
  const maxCount = hasAnswerDistribution ? Math.max(...q.answers.map(a => a.count), 1) : 1;

  const typeLabel = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    short_answer: 'Short Answer',
    essay: 'Essay',
    matching: 'Matching',
    fill_in_multiple_blanks: 'Fill in Blanks',
    numerical_question: 'Numerical',
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-500">Q{index + 1}</span>
              <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
                {typeLabel[q.question_type] || q.question_type}
              </span>
              <span className="text-xs text-gray-400">{q.points_possible} pt{q.points_possible !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: q.question_text }} />
          </div>
          <div className="flex-shrink-0 text-right">
            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(q.difficulty_index)}`}>
              {formatPercent(q.difficulty_index)} correct
            </span>
            <p className="text-xs text-gray-400 mt-0.5">{getDifficultyLabel(q.difficulty_index)}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Responses</span>
            <p className="font-semibold">{q.responses}</p>
          </div>
          <div>
            <span className="text-gray-500">Correct</span>
            <p className="font-semibold text-green-700">{q.correct}</p>
          </div>
          <div>
            <span className="text-gray-500">Incorrect</span>
            <p className="font-semibold text-red-700">{q.incorrect}</p>
          </div>
          <div>
            <span className="text-gray-500">Avg Score</span>
            <p className="font-semibold">{q.average_score} / {q.points_possible}</p>
          </div>
        </div>

        {/* Answer distribution bars */}
        {hasAnswerDistribution && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Answer Distribution</p>
            {q.answers.map((ans) => {
              const barWidth = maxCount > 0 ? (ans.count / maxCount) * 100 : 0;
              const barColor = ans.correct ? 'bg-green-500' : 'bg-red-400';
              const borderColor = ans.correct ? 'border-green-200' : 'border-gray-100';
              return (
                <div key={ans.id} className={`flex items-center gap-3 p-2 rounded border ${borderColor} ${ans.correct ? 'bg-green-50/50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-800 truncate">{ans.text || ans.id}</span>
                      {ans.correct && (
                        <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.max(barWidth, 1)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[70px]">
                    <span className="text-sm font-semibold text-gray-700">{ans.count}</span>
                    <span className="text-xs text-gray-400 ml-1">({formatPercent(ans.percent)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No answer distribution available for non-MC types */}
        {!hasAnswerDistribution && q.question_type !== 'essay' && (
          <p className="text-xs text-gray-400 italic">Answer distribution not available for this question type.</p>
        )}
        {q.question_type === 'essay' && (
          <p className="text-xs text-gray-400 italic">Essay questions require manual grading.</p>
        )}
      </div>
    </div>
  );
};

export default QuizStatisticsPage;
