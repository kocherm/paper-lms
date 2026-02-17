import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import CoursesPage from './pages/CoursesPage';
import AssignmentPage from './pages/AssignmentPage';
import GradebookPage from './pages/GradebookPage';
import AccessTokensPage from './pages/AccessTokensPage';
import DeveloperKeysPage from './pages/DeveloperKeysPage';
import ExternalToolsPage from './pages/ExternalToolsPage';
import DiscussionsPage from './pages/DiscussionsPage';
import DiscussionTopicPage from './pages/DiscussionTopicPage';
import FilesPage from './pages/FilesPage';
import SISImportPage from './pages/SISImportPage';
import QuizTakePage from './pages/QuizTakePage';
import QuizSubmissionsPage from './pages/QuizSubmissionsPage';
import RubricsPage from './pages/RubricsPage';
import GradingPeriodsPage from './pages/GradingPeriodsPage';
import AssignmentOverridesPage from './pages/AssignmentOverridesPage';
import CalendarPage from './pages/CalendarPage';
import InboxPage from './pages/InboxPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import SpeedGraderPage from './pages/SpeedGraderPage';
import LearningOutcomesPage from './pages/LearningOutcomesPage';
import GroupsPage from './pages/GroupsPage';
import BlueprintPage from './pages/BlueprintPage';
import CoursePacingPage from './pages/CoursePacingPage';
import CollaborationsPage from './pages/CollaborationsPage';
import ConferencesPage from './pages/ConferencesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GraphiQLPage from './pages/GraphiQLPage';
import AuthProvidersPage from './pages/AuthProvidersPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
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
              <CoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/assignments/:assignmentId"
          element={
            <ProtectedRoute>
              <AssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/gradebook"
          element={
            <ProtectedRoute>
              <GradebookPage />
            </ProtectedRoute>
          }
        />
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
          path="/courses/:courseId/external_tools"
          element={
            <ProtectedRoute>
              <ExternalToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/discussions"
          element={
            <ProtectedRoute>
              <DiscussionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/discussions/:topicId"
          element={
            <ProtectedRoute>
              <DiscussionTopicPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/files"
          element={
            <ProtectedRoute>
              <FilesPage />
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
          path="/courses/:courseId/quizzes/:quizId/take"
          element={
            <ProtectedRoute>
              <QuizTakePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/quizzes/:quizId/submissions"
          element={
            <ProtectedRoute>
              <QuizSubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/rubrics"
          element={
            <ProtectedRoute>
              <RubricsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/assignments/:assignmentId/overrides"
          element={
            <ProtectedRoute>
              <AssignmentOverridesPage />
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
          path="/courses/:courseId/calendar"
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
          path="/settings/notifications"
          element={
            <ProtectedRoute>
              <NotificationPreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/assignments/:assignmentId/speedgrader"
          element={
            <ProtectedRoute>
              <SpeedGraderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/outcomes"
          element={
            <ProtectedRoute>
              <LearningOutcomesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/groups"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/blueprint"
          element={
            <ProtectedRoute>
              <BlueprintPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/pacing"
          element={
            <ProtectedRoute>
              <CoursePacingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/collaborations"
          element={
            <ProtectedRoute>
              <CollaborationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/conferences"
          element={
            <ProtectedRoute>
              <ConferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
