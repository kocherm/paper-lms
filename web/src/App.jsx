import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import CoursesPage from './pages/CoursesPage';
import AssignmentPage from './pages/AssignmentPage';
import AssignmentsPage from './pages/AssignmentsPage';
const GradebookPage = React.lazy(() => import('./pages/GradebookPage'));
import StudentGradesPage from './pages/StudentGradesPage';
const ContentImportPage = React.lazy(() => import('./pages/ContentImportPage'));
import ModulesPage from './pages/ModulesPage';
import PeoplePage from './pages/PeoplePage';
const AccessTokensPage = React.lazy(() => import('./pages/AccessTokensPage'));
const DeveloperKeysPage = React.lazy(() => import('./pages/DeveloperKeysPage'));
const ExternalToolsPage = React.lazy(() => import('./pages/ExternalToolsPage'));
import DiscussionsPage from './pages/DiscussionsPage';
const DiscussionTopicPage = React.lazy(() => import('./pages/DiscussionTopicPageV2'));
import FilesPage from './pages/FilesPage';
const SISImportPage = React.lazy(() => import('./pages/SISImportPage'));
import PagesPage from './pages/PagesPage';
import PageDetailPage from './pages/PageDetailPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizTakePage from './pages/QuizTakePage';
import QuizReviewPage from './pages/QuizReviewPage';
const QuizEditorPage = React.lazy(() => import('./pages/QuizEditorPage'));
const QuizSubmissionsPage = React.lazy(() => import('./pages/QuizSubmissionsPage'));
const QuizStatisticsPage = React.lazy(() => import('./pages/QuizStatisticsPage'));
const RubricsPage = React.lazy(() => import('./pages/RubricsPage'));
const GradingPeriodsPage = React.lazy(() => import('./pages/GradingPeriodsPage'));
const AssignmentOverridesPage = React.lazy(() => import('./pages/AssignmentOverridesPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const NotificationPreferencesPage = React.lazy(() => import('./pages/NotificationPreferencesPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const SpeedGraderPage = React.lazy(() => import('./pages/SpeedGraderPage'));
const LearningOutcomesPage = React.lazy(() => import('./pages/LearningOutcomesPage'));
const GroupsPage = React.lazy(() => import('./pages/GroupsPage'));
const BlueprintPage = React.lazy(() => import('./pages/BlueprintPage'));
const CoursePacingPage = React.lazy(() => import('./pages/CoursePacingPage'));
const CollaborationsPage = React.lazy(() => import('./pages/CollaborationsPage'));
const ConferencesPage = React.lazy(() => import('./pages/ConferencesPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const GraphiQLPage = React.lazy(() => import('./pages/GraphiQLPage'));
const AuthProvidersPage = React.lazy(() => import('./pages/AuthProvidersPage'));
const AnnouncementsPage = React.lazy(() => import('./pages/AnnouncementsPage'));
const EnrollmentTermsPage = React.lazy(() => import('./pages/EnrollmentTermsPage'));
import SyllabusPage from './pages/SyllabusPage';
const NotificationDeliveryPage = React.lazy(() => import('./pages/NotificationDeliveryPage'));
const AuditLogPage = React.lazy(() => import('./pages/AuditLogPage'));
const CustomRolesPage = React.lazy(() => import('./pages/CustomRolesPage'));
const OneRosterPage = React.lazy(() => import('./pages/OneRosterPage'));
const DocViewerPage = React.lazy(() => import('./pages/DocViewerPage'));
import LoginPageSSO from './pages/LoginPageSSO';
const QuestionBanksPage = React.lazy(() => import('./pages/QuestionBanksPage'));
const AccommodationsPage = React.lazy(() => import('./pages/AccommodationsPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
import ParentalConsentPage from './pages/ParentalConsentPage';
const PortfoliosPage = React.lazy(() => import('./pages/PortfoliosPage'));
const PortfolioEditorPage = React.lazy(() => import('./pages/PortfolioEditorPage'));
const PortfolioPublicPage = React.lazy(() => import('./pages/PortfolioPublicPage'));
const FERPAPage = React.lazy(() => import('./pages/FERPAPage'));
const ObserverDashboardPage = React.lazy(() => import('./pages/ObserverDashboardPage'));
import PublicPageView from './pages/PublicPageView';
import NotFoundPage from './pages/NotFoundPage';
const CourseSettingsPage = React.lazy(() => import('./pages/CourseSettingsPage'));
import ProtectedRoute from './components/ProtectedRoute';
import { CourseUIProvider } from './contexts/CourseUIContext';
import { useAuth } from './contexts/AuthContext';
import { api } from './services/api';
const SetupWizardPage = React.lazy(() => import('./pages/SetupWizardPage'));

const App = () => {
  const { user, loading } = useAuth();
  const [setupComplete, setSetupComplete] = useState(null); // null = loading

  useEffect(() => {
    api.getSetupStatus()
      .then(({ data }) => setSetupComplete(data.setup_complete))
      .catch(() => setSetupComplete(true)); // If the endpoint fails, assume setup is done
  }, []);

  if (loading || setupComplete === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <BrowserRouter>
        <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>}>
          <Routes>
            <Route path="*" element={<SetupWizardPage onSetupComplete={() => setSetupComplete(true)} />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPageSSO />} />
        <Route path="/consent/verify/:token" element={<ParentalConsentPage />} />
        <Route path="/portfolios/public/:slug" element={<PortfolioPublicPage />} />
        <Route path="/courses/:courseId/p/:slug" element={<PublicPageView />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseUIProvider><Outlet /></CourseUIProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<CoursePage />} />
          <Route path="settings" element={<CourseSettingsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/:assignmentId" element={<AssignmentPage />} />
          <Route path="assignments/:assignmentId/overrides" element={<AssignmentOverridesPage />} />
          <Route path="assignments/:assignmentId/speedgrader" element={<SpeedGraderPage />} />
          <Route path="assignments/:assignmentId/submissions/:userId/docviewer" element={<DocViewerPage />} />
          <Route path="gradebook" element={<GradebookPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="pages/:slug" element={<PageDetailPage />} />
          <Route path="quizzes" element={<QuizzesPage />} />
          <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
          <Route path="quizzes/:quizId/edit" element={<QuizEditorPage />} />
          <Route path="quizzes/:quizId/submissions/:submissionId/review" element={<QuizReviewPage />} />
          <Route path="quizzes/:quizId/submissions" element={<QuizSubmissionsPage />} />
          <Route path="quizzes/:quizId/statistics" element={<QuizStatisticsPage />} />
          <Route path="discussions" element={<DiscussionsPage />} />
          <Route path="discussions/:topicId" element={<DiscussionTopicPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="external_tools" element={<ExternalToolsPage />} />
          <Route path="rubrics" element={<RubricsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="syllabus" element={<SyllabusPage />} />
          <Route path="outcomes" element={<LearningOutcomesPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="blueprint" element={<BlueprintPage />} />
          <Route path="pacing" element={<CoursePacingPage />} />
          <Route path="collaborations" element={<CollaborationsPage />} />
          <Route path="conferences" element={<ConferencesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit_log" element={<AuditLogPage />} />
          <Route path="accommodations" element={<AccommodationsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="question_banks" element={<QuestionBanksPage />} />
          <Route path="content_import" element={<ContentImportPage />} />
        </Route>
        <Route
          path="/settings/tokens"
          element={
            <ProtectedRoute>
              <AccessTokensPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/developer_keys"
          element={
            <ProtectedRoute>
              <DeveloperKeysPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sis_import"
          element={
            <ProtectedRoute>
              <SISImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/grading_periods"
          element={
            <ProtectedRoute>
              <GradingPeriodsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/notifications"
          element={
            <ProtectedRoute>
              <NotificationPreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/graphiql"
          element={
            <ProtectedRoute>
              <GraphiQLPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auth_providers"
          element={
            <ProtectedRoute>
              <AuthProvidersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/terms"
          element={
            <ProtectedRoute>
              <EnrollmentTermsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <CustomRolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/oneroster"
          element={
            <ProtectedRoute>
              <OneRosterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/notification_deliveries"
          element={
            <ProtectedRoute>
              <NotificationDeliveryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolios"
          element={
            <ProtectedRoute>
              <PortfoliosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolios/:portfolioId/edit"
          element={
            <ProtectedRoute>
              <PortfolioEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ferpa"
          element={
            <ProtectedRoute>
              <FERPAPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/observer"
          element={
            <ProtectedRoute>
              <ObserverDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default App;
