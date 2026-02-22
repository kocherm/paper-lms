# Paper LMS - Implementation History

This file documents the phased implementation history of Paper LMS. For current architecture and development patterns, see [CLAUDE.md](./CLAUDE.md).

## Phase 1: Foundation (COMPLETE)
PostgreSQL, clean architecture, Docker, Canvas API paths, 10 models, ~35 endpoints

## Phase 2: Submissions & Grading (COMPLETE)
Assignment groups, submissions, gradebook, grading standards. +4 models, ~18 endpoints

## Phase 3: OAuth2 & LTI 1.3 (COMPLETE)
OAuth2 authorization code flow, personal access tokens, LTI 1.3 platform (OIDC, AGS, NRPS, Deep Linking). +4 models, ~15 endpoints

## Phase 4: Discussions, Files, SIS (COMPLETE)
Threaded discussions, file management (local storage), SIS CSV import/export. +7 models, ~27 endpoints

## Phase 5: Quiz Engine, Rubrics, Grading Periods (COMPLETE)
Quiz auto-grading, rubric assessments, grading periods, assignment overrides, late policies. +11 models, ~35 endpoints

## Phase 6: Calendar, Messaging, Notifications (COMPLETE)
Calendar events (with iCal export), conversations/inbox, notification preferences. +6 models, ~19 endpoints

## Phase 7: Content Migration, SpeedGrader, Learning Outcomes (COMPLETE)
Content migration tracking (IMSCC/Common Cartridge/Canvas/QTI/Moodle), SpeedGrader UI with inline grading and comments, learning outcomes with outcome groups, mastery gradebook rollups (decaying_average/n_mastery/latest/highest calculation methods). +4 models, ~19 endpoints, +2 frontend pages

## Phase 8: Feature Parity (COMPLETE)
Groups, Blueprint Courses, Course Pacing, Collaborations/Conferences, Analytics, Observer/Parent role, GraphQL API (hand-rolled recursive-descent parser), SAML/CAS/LDAP auth providers, WCAG 2.1 AA accessibility (skip-to-content, focus traps, ARIA landmarks, live regions). +13 models, ~73 endpoints, +9 frontend pages

## Phase 9: Production Readiness (COMPLETE)
Showstopper fixes for real Canvas migration: RBAC/permissions (role-based access on all 284 routes), IMSCC Common Cartridge import (manifest/QTI XML parsing, zip extraction), Discussion Board V2 rewrite (read/unread tracking, edit history with versioning, user profiles/avatars, thread collapse/expand, @mentions, subscribe/unsubscribe, IntersectionObserver auto-read, rich text compose), real SSO protocol implementation (SAML 2.0 SP with metadata/ACS/redirect, LDAP with BER protocol client and JIT provisioning, CAS 2.0 with ticket validation), PWA (manifest, service worker with network-first/cache-first strategies, offline fallback), Batch Operations (course cloning with selective content, bulk date shifting, cross-course bulk messaging, bulk enrollment, bulk assignment date updates). +3 models, +3 repos, +4 services, +4 handlers, ~17 endpoints.

## Phase 10: Canvas Feature Superiority (COMPLETE)
Features that improve on Canvas's shortcomings:
- **10A**: Announcements (with read receipts, acknowledgement tracking, global announcements), Enrollment Terms (with SIS integration, bulk operations), Syllabus (auto-generated from assignments/calendar). +5 models, ~17 endpoints, +3 frontend pages
- **10B**: Email Notification Delivery (SMTP with digest batching and retry logic), Rich Content Editor (zero-dependency contentEditable), Audit Logs (structured course activity + grade change tracking with CSV export). +4 models, ~12 endpoints, +2 frontend pages, +2 shared components
- **10C**: Custom Roles + Granular Permissions (36 permissions in 4 categories), OneRoster 1.1 REST API Consumer, DocViewer/Document Annotations (client-side annotation layer). +7 models, ~28 endpoints, +3 frontend pages, +1 shared component

## Phase 12: Course Home Page Engine + K-2/3-5 UI Modes (COMPLETE)
Intelligent, configurable course home page with adaptive UI modes for K-12:
- **Home Engine**: Smart "Continue where you left off" and "Today's Lesson" buttons, teacher-configurable preset and custom buttons
- **K-2 Mode** (non-readers): No sidebar, icon-only giant buttons, sky-blue background
- **3-5 Mode** (early readers): Simplified sidebar, simplified CourseNav, larger buttons with icons + text
- **Standard Mode**: Full sidebar, full CourseNav with "More" dropdown
+3 models, +3 repos, +1 service, +1 handler, ~11 endpoints, +1 context, +1 page, +12 components, +1 hook, +1 utility

## Phase 13: Performance & QA Hardening (COMPLETE)
Performance optimization, expanded rate limiting, teacher workflow bug fixes, security vulnerability fixes from two rounds of security audits including auth middleware panic fixes, CORS production validation, database indexes, code splitting, and more. +1 endpoint, +2 rate limit functions, 14 files modified

## Phase 14: UX & Adoption Blockers (COMPLETE)
Student Grades Page, assignment publish/unpublish toggle, page creation, ErrorBoundary, mobile hamburger menu, role-aware CourseNav, Content Import Page, document annotation authorization. +3 pages, +1 ErrorBoundary, 10 files modified

## Phase 15: Core Feature Completeness (COMPLETE)
Modules Page, Module Item CRUD, Calendar Grid View rewrite, Dashboard upgrade, People Page, Course Settings Dates. +3 pages, +2 backend endpoints, +2 API methods, 12 files modified

## Phase 16: Auth & Data Integrity Fixes (COMPLETE)
Full password reset flow, course listing security fix (user-enrolled courses only by default). +2 API endpoints, +2 frontend API methods, 10 files modified

## Phase 17: Code Quality & Reliability Fixes (COMPLETE)
Auth middleware panic fix, assignment submission_types serialization fix, announcements N+1 query fix, gradebook immutability fix, SAML signature bypass fix, input validation. 8 files modified

## Phase 18: Polish, UX Fixes & Adoption Blockers (COMPLETE)
Pluralization fixes, discussion author names, gradebook CSV export, multi-type student submissions, observer/parent course viewing, announcement read receipt names. 9 files modified

## Phase 19: Role-Based UI Access Control (COMPLETE)
Systematic fix for teacher-only controls shown to students across all course pages. Sidebar role filtering, login response role field, CourseNav role detection bug fix. 11 files modified

## Phase 20: Teacher-Only Page Access Guards (COMPLETE)
URL-based access enforcement via redirect guards on 7 teacher-only pages. GradebookPage and SpeedGraderPage critical security guards. 12 files modified

## Phase 21: UX Polish & Inbox Improvements (COMPLETE)
Inbox recipient search picker with searchable user picker. User search API with ILIKE. 4 files modified

## Phase 22: Session Expiry Auto-Logout & Assignment Fix (COMPLETE)
401 auto-logout via custom event, assignment creation submission_types type mismatch fix. 3 files modified

## Phase 23: Quiz Editor, Weighted Grading & Gradebook Fixes (COMPLETE)
Full quiz editor UI, weighted grading implementation, quiz submission API unwrapping, grade-without-submission fix. +1 page (QuizEditorPage), 7 files modified

## Phase 24: Browser Testing & Bug Fixes (COMPLETE)
Logout button fix, portfolios page crash fix, FERPA page fix, notification preferences fix, discussion type labels. 5 files modified

## Phase 25: Late Policy UI & Configurable Grading Scale (COMPLETE)
Late policy configuration UI, configurable grading scale, shared grading utility, backend grading scale support. +2 API endpoints, +4 frontend API methods, +1 shared utility, 14 files modified

## Phase 26: Adoption Blocker Fixes (COMPLETE)
Rubric scoring in SpeedGrader, section assignment dates on AssignmentPage, attendance CSV export fix. +1 API endpoint, 7 files modified

## Phase 27: Content CRUD Completeness & RichContentEditor Deployment (COMPLETE)
Assignment edit, page edit, discussion edit/delete, module name edit, RichContentEditor integration across 6 pages, user search picker for PeoplePage. 11 frontend files modified

## Phase 28: Student Experience & Teacher Onboarding (COMPLETE)
Quiz review page, file attachment support in submissions, course setup checklist, quizzes student view with status badges, gradebook CSV import. +1 API endpoint, +1 page (QuizReviewPage), 15 files modified

## Phase 29: Security & Adoption Blocker Sweep (COMPLETE)
Massive sweep: 25+ security fixes (IDOR fixes for conversations, accommodations, assignment overrides, quiz submissions, calendar events, file downloads, bulk messages, FERPA exports), role-based UI guards, loading spinners on all 45 pages, error retry buttons on 22+ pages, mobile responsiveness, ARIA accessibility, code splitting (633KB→267KB main bundle), useIsTeacher shared hook, bulk grading endpoint, PWA versioned caching, course enrollment counts, assignment search/filter, unsaved changes prompt, and more. +4 API endpoints, +1 model, +3 hooks, ~100 files modified

## Phase 30: Operational Maturity (COMPLETE)
Production readiness infrastructure:
- **30A**: Versioned Database Migrations (golang-migrate v4, CLI tool, Makefile targets)
- **30B**: Backend Integration Tests (auth, RBAC, grading, quiz, late policy)
- **30C**: S3-Compatible File Storage (pluggable backend interface with local + S3/MinIO/R2)
- **30D**: CI/CD Pipeline (GitHub Actions: lint, test, build, docker)
- **30E**: Structured Logging & Observability (slog, request IDs, health probes)
