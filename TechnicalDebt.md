# Paper LMS — Technical Debt Log

Tracking known issues, shortcuts, and improvements to address later. Items are categorized by severity and area.

---

## Critical (Blocks Adoption)

### TD-001: No frontend test coverage
- **Area:** Frontend
- **Files:** `web/src/` (all pages and components)
- **Description:** Zero React unit or integration tests. No component tests, no page tests, no API mock tests. Any refactor risks silent regressions.
- **Effort:** Large — need test framework setup (Vitest + React Testing Library) and incremental coverage

### ~~TD-002: Module item links to Pages are broken~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-003: No grade-posted notifications to students~~ ✅ FIXED (Phase 29)
- Moved to archive

### TD-051: Blueprint course sync is a stub (no content propagation)
- **Area:** Backend — Blueprint Courses
- **Files:** `internal/service/blueprint_service.go` (TriggerSync ~line 128-152)
- **Description:** TriggerSync creates a migration record immediately marked "completed" but does NOT copy any content (modules, assignments, quizzes, pages) to associated courses. Blueprint courses are a core Canvas feature for districts managing multiple sections.
- **Effort:** Large — need full content copy engine with ID mapping, change tracking, and selective sync

### ~~TD-052: Observer/parent role can't view student submissions or grades~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-053: Course pacing calculates dates but doesn't apply them~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-054: Learning outcomes have no assignment alignment~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-004: StudentGradesPage doesn't show quiz scores or review links~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-005: No submission success feedback or attempt counter~~ ✅ FIXED (Phase 29)
- Moved to archive

---

## High (Significant UX/Quality Impact)

### TD-006: Module item drag-and-drop reordering missing
- **Area:** Frontend + Backend
- **Files:** `web/src/pages/ModulesPage.jsx`, backend has `position` field but no batch reorder endpoint
- **Description:** No drag-and-drop for reordering modules or module items. Teachers must delete and re-add items to change order. Canvas supports drag reorder.
- **Effort:** Medium — add batch reorder endpoint, integrate a DnD library (e.g., @dnd-kit)

### ~~TD-007: PWA service worker serves stale builds~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-008: No "recently graded" indicator on StudentGradesPage~~ ✅ FIXED (Phase 29)
- Moved to archive

### TD-009: Discussion reply threading incomplete
- **Area:** Frontend
- **Files:** `web/src/pages/DiscussionTopicPageV2.jsx`
- **Description:** Need to verify that reply-to-reply threading works correctly and that edit history versioning displays properly. The V2 page is 1,186 lines and complex.
- **Effort:** Unknown — needs testing audit

### ~~TD-010: isTeacher detection duplicated across 15+ pages~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-011: AnnouncementsPage teacher detection uses user.role instead of enrollment~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-012: Gradebook CSV import is sequential (slow for large classes)~~ ✅ FIXED (Phase 29)
- Moved to archive

---

## Medium (Quality / Maintainability)

### TD-013: No backend integration tests for API routes
- **Area:** Backend — Testing
- **Files:** `internal/api/v1/handlers/*_test.go` (only submissions_test.go exists with limited coverage)
- **Description:** Only a few handler tests exist. Most of the 358 routes have no test coverage. Unit tests exist for some services but end-to-end route testing is minimal.
- **Effort:** Large — need test database setup, route-level tests

### ~~TD-014: File download endpoint not verified end-to-end~~ ✅ VERIFIED (Phase 29)
- Moved to archive

### ~~TD-015: Course enrollment count not shown on CoursesPage cards~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-016: No search/filter on AssignmentsPage~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-017: Quiz editor description still uses plain textarea~~ ✅ FIXED (Phase 29)
- Moved to archive

### ~~TD-018: No confirmation before navigating away from unsaved forms~~ ✅ FIXED (Phase 29)
- Moved to archive

---

## Low (Nice-to-Have / Polish)

### TD-019: No dark mode support
- **Area:** Frontend — Theming
- **Description:** All pages use hardcoded light theme colors. No dark mode toggle or system preference detection. Many students prefer dark mode.
- **Effort:** Large — Tailwind dark: variants across all components

### TD-020: No keyboard shortcuts
- **Area:** Frontend — Accessibility/Power Users
- **Description:** No keyboard shortcuts for common actions (e.g., `n` for new, `e` for edit, `/` for search). Canvas has keyboard navigation.
- **Effort:** Medium

### TD-021: GraphQL API lacks mutations
- **Area:** Backend — API
- **Files:** `internal/graphql/`
- **Description:** Hand-rolled GraphQL engine supports queries but mutations may be incomplete. Not blocking since REST API is primary.
- **Effort:** Medium

### TD-022: No LTI tool launch tested end-to-end
- **Area:** Backend — Integration
- **Files:** `internal/api/v1/handlers/lti.go`
- **Description:** LTI 1.3 platform endpoints exist but haven't been tested with real external tools (e.g., Turnitin, Khan Academy).
- **Effort:** Medium — need real LTI tool to test against

### TD-023: No automated database backups strategy
- **Area:** Operations
- **Description:** No documented backup/restore strategy for PostgreSQL. Deployment docs don't cover backup schedules.
- **Effort:** Small — document pg_dump strategy, add to docker-compose

### ~~TD-024: Main bundle still >500KB~~ ✅ FIXED (Phase 29)
- Moved to archive

---

## Recently Fixed (Archive)

Items moved here after resolution. Kept for reference.

| ID | Description | Fixed In |
|----|-------------|----------|
| TD-002 | Module item links to Pages broken | Phase 29 |
| TD-005 | No submission success feedback or attempt counter | Phase 29 |
| TD-008 | No "recently graded" indicator on StudentGradesPage | Phase 29 |
| TD-011 | AnnouncementsPage teacher detection uses user.role | Phase 29 |
| TD-025 | Quiz timer stale closure — auto-submit silently failed | Phase 29 |
| TD-026 | SpeedGrader comment author showed raw "User {id}" | Phase 29 |
| TD-027 | Dashboard upcoming assignments had no submission status | Phase 29 |
| TD-028 | "On Paper"/"No Submission" assignments showed submit form | Phase 29 |
| TD-029 | No pre-quiz landing page — accidental starts consumed attempts | Phase 29 |
| TD-030 | Bulk submissions endpoint blocked for students (instructor guard) | Phase 29 |
| TD-031 | Inbox reply message showed "User #N" instead of sender name | Phase 29 |
| TD-032 | GroupsPage had no role-based access control | Phase 29 |
| TD-033 | CalendarPage had no role guard on event controls | Phase 29 |
| TD-034 | AttendancePage heatmap always red (missing total field) | Phase 29 |
| TD-035 | Quiz submission auth bypass — students could view others' answers | Phase 29 |
| TD-036 | File submission silently dropped invalid file IDs | Phase 29 |
| TD-037 | Discussion/Page/Announcement creation accepted blank titles | Phase 29 |
| TD-038 | File download auth bypass — any user could download any file | Phase 29 |
| TD-039 | Quiz attempt limits never enforced — unlimited retakes | Phase 29 |
| TD-040 | Quiz answer ownership bypass — students could modify others' answers | Phase 29 |
| TD-041 | Weighted grade calculation excluded ungrouped assignments | Phase 29 |
| TD-042 | SMTP not-enabled warning missing for production | Phase 29 |
| TD-043 | Submission comment API response missing author_name | Phase 29 |
| TD-044 | 7 pages crashed with null .data from API (missing || []) | Phase 29 |
| TD-003 | No grade-posted notifications to students | Phase 29 |
| TD-045 | SIS enrollment import created duplicates on re-import | Phase 29 |
| TD-046 | Late policy enforcement was config-only (no deductions applied) | Phase 29 |
| TD-047 | Quiz question cloning only copied quiz shell, not questions | Phase 29 |
| TD-048 | LTI AGS grade passback scaled to 100 instead of assignment points | Phase 29 |
| TD-049 | Grading periods had zero enforcement on grade changes | Phase 29 |
| TD-050 | SIS enrollment import created duplicates on re-import | Phase 29 |
| TD-004 | StudentGradesPage missing quiz scores and review links | Phase 29 |
| TD-052 | Observer/parent role can now view student submissions and grades | Phase 29 |
| TD-053 | Course pacing now applies computed dates to assignments on publish | Phase 29 |
| TD-054 | Learning outcome assignment alignment + auto-result on grading | Phase 29 |
| TD-010 | isTeacher detection duplicated across 25 pages → shared useIsTeacher hook | Phase 29 |
| TD-012 | Gradebook CSV import sequential → bulk grading endpoint (500/batch) | Phase 29 |
| TD-007 | PWA service worker stale builds → build-hash cache versioning + stale-while-revalidate | Phase 29 |
| TD-015 | Course enrollment count on cards → batch CountByCourseIDs + total_students in API | Phase 29 |
| TD-016 | No search/filter on AssignmentsPage → client-side search bar + status filter | Phase 29 |
| TD-017 | Quiz create form plain textarea → RichContentEditor | Phase 29 |
| TD-018 | No unsaved changes prompt → useUnsavedChanges hook (beforeunload + React Router blocker) | Phase 29 |
| TD-014 | File download endpoint verified — auth check + filename sanitization working correctly | Phase 29 |
| TD-024 | Main bundle 633KB→267KB (58% reduction) — 40 pages lazy-loaded via React.lazy() | Phase 29 |
| TD-055 | FERPA export IDOR — GetExportRequest didn't verify export belongs to URL's user_id | Phase 29 |
| TD-056 | Conversation IDOR (CRITICAL) — no participant check on Get/Update/ListMessages/CreateMessage | Phase 29 |
| TD-057 | Accommodation IDOR (CRITICAL) — GetAccommodation had no auth; any user could read IEP/504 data | Phase 29 |
| TD-058 | Assignment override IDOR — override_id not validated against assignment_id, cross-course access | Phase 29 |
| TD-059 | Quiz submission IDOR — submission_id not validated against quiz_id, cross-course access | Phase 29 |
| TD-060 | Calendar event auth — Update/Delete had no authorization; any user could modify any event | Phase 29 |
| TD-061 | Bulk message auth bypass — POST /conversations/bulk had no role guard; any user could mass-message courses | Phase 29 |
| — | GradebookPage CSV export broken field names | Phase 28 |
| — | Quiz no review page after submission | Phase 28 |
| — | File attachments not stored in submissions | Phase 28 |
| — | No course setup guidance for new teachers | Phase 28 |
| — | Students can't see quiz status on QuizzesPage | Phase 28 |
| — | Announcement read receipts show user IDs | Phase 28 |
| — | No gradebook CSV import | Phase 28 |
| — | All content types missing edit operations | Phase 27 |
| — | Role-based access bypass via direct URL | Phase 20 |
| — | Auth middleware panic on malformed JWT | Phase 17 |
| — | SAML signature verification skipped | Phase 17 |
| — | localStorage JWT token XSS theft vector | Phase 13 |
| — | SVG/HTML upload stored XSS | Phase 13 |
| — | RequireSelfOrAdmin middleware bypass | Phase 13 |
