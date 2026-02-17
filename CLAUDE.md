# Paper LMS - CLAUDE.md

## Project Overview
Paper LMS is a production-ready, Canvas LMS-backwards-compatible learning management system for K-12 schools. Built with Go (backend) and React (frontend), targeting exact Canvas API compatibility so teachers can migrate from Canvas without losing content, LTI tools, or SIS integrations.

## Architecture
- **Backend**: Go 1.23.6 + Fiber v2.52.6 + GORM v1.25.10 + PostgreSQL
- **Frontend**: React 18 + React Router 7 + Tailwind CSS 3.4.1 + Vite
- **Module path**: `github.com/kocherm/paper-lms`

### Project Structure
```
paper-LMS/
  cmd/server/main.go                    # Composition root (wires repos, services, handlers)
  internal/
    config/config.go                    # Centralized env config
    domain/models/                      # Canvas-compatible model structs (81 files)
    repository/
      interfaces.go                     # All repository interfaces
      postgres/                         # GORM implementations (78 files)
    service/                            # Business logic layer (51 files)
    auth/                               # SSO protocol implementations (SAML, LDAP, CAS)
    graphql/                            # Hand-rolled GraphQL engine (schema parser + resolver)
    api/v1/
      router.go                         # Route registration (341 routes)
      middleware/                        # Auth, pagination, RBAC permissions
      handlers/                         # HTTP handlers (58 files)
      responses/                        # Pagination, error format helpers
    db/postgres.go                      # PostgreSQL connection + AutoMigrate
  web/src/
    pages/                              # React pages (40 files)
    components/                         # Layout, ProtectedRoute, WCAG helpers, RCE, DocViewer
    services/api.js                     # API client with Canvas Link-header pagination
    contexts/AuthContext.jsx            # JWT auth context
  deployments/docker/                   # Docker Compose setup
```

### Key Patterns
- **Repository pattern**: Interfaces in `interfaces.go`, GORM implementations in `postgres/`
- **Service layer**: Business logic with dependency injection of repository interfaces
- **Canvas API compatibility**: All endpoints under `/api/v1/`, Canvas JSON format, Link-header pagination (RFC 5988)
- **Error format**: `{"errors": [{"message": "..."}]}`
- **Auth**: JWT (HS256) + OAuth2 + Personal Access Tokens + SAML/LDAP/CAS SSO via `middleware.AuthMiddleware`
- **RBAC**: `middleware.PermissionMiddleware` — admin/instructor/enrolled/selfOrAdmin guards on all routes
- **Soft delete**: Via `workflow_state` field (set to "deleted"), not hard delete
- **Pagination**: `repository.PaginatedResult[T]` generics, `middleware.GetPagination`, `responses.SetPaginationHeaders`

## Build Commands
```bash
# Backend
go build ./...
go vet ./...
go test ./...

# Frontend
cd web && npm run build
cd web && npm run dev    # development server
```

## Implementation Phases

### Phase 1: Foundation (COMPLETE)
PostgreSQL, clean architecture, Docker, Canvas API paths, 10 models, ~35 endpoints

### Phase 2: Submissions & Grading (COMPLETE)
Assignment groups, submissions, gradebook, grading standards. +4 models, ~18 endpoints

### Phase 3: OAuth2 & LTI 1.3 (COMPLETE)
OAuth2 authorization code flow, personal access tokens, LTI 1.3 platform (OIDC, AGS, NRPS, Deep Linking). +4 models, ~15 endpoints

### Phase 4: Discussions, Files, SIS (COMPLETE)
Threaded discussions, file management (local storage), SIS CSV import/export. +7 models, ~27 endpoints

### Phase 5: Quiz Engine, Rubrics, Grading Periods (COMPLETE)
Quiz auto-grading, rubric assessments, grading periods, assignment overrides, late policies. +11 models, ~35 endpoints

### Phase 6: Calendar, Messaging, Notifications (COMPLETE)
Calendar events (with iCal export), conversations/inbox, notification preferences. +6 models, ~19 endpoints

### Phase 7: Content Migration, SpeedGrader, Learning Outcomes (COMPLETE)
Content migration tracking (IMSCC/Common Cartridge/Canvas/QTI/Moodle), SpeedGrader UI with inline grading and comments, learning outcomes with outcome groups, mastery gradebook rollups (decaying_average/n_mastery/latest/highest calculation methods). +4 models, ~19 endpoints, +2 frontend pages

### Phase 8: Feature Parity (COMPLETE)
Groups, Blueprint Courses, Course Pacing, Collaborations/Conferences, Analytics, Observer/Parent role, GraphQL API (hand-rolled recursive-descent parser), SAML/CAS/LDAP auth providers, WCAG 2.1 AA accessibility (skip-to-content, focus traps, ARIA landmarks, live regions). +13 models, ~73 endpoints, +9 frontend pages

### Phase 9: Production Readiness (COMPLETE)
Showstopper fixes for real Canvas migration: RBAC/permissions (role-based access on all 284 routes), IMSCC Common Cartridge import (manifest/QTI XML parsing, zip extraction), Discussion Board V2 rewrite (read/unread tracking, edit history with versioning, user profiles/avatars, thread collapse/expand, @mentions, subscribe/unsubscribe, IntersectionObserver auto-read, rich text compose), real SSO protocol implementation (SAML 2.0 SP with metadata/ACS/redirect, LDAP with BER protocol client and JIT provisioning, CAS 2.0 with ticket validation), PWA (manifest, service worker with network-first/cache-first strategies, offline fallback), Batch Operations (course cloning with selective content, bulk date shifting, cross-course bulk messaging, bulk enrollment, bulk assignment date updates). +3 models, +3 repos, +4 services, +4 handlers, ~17 endpoints.

### Phase 10: Canvas Feature Superiority (COMPLETE)
Features that improve on Canvas's shortcomings:
- **10A**: Announcements (with read receipts, acknowledgement tracking, global announcements — Canvas lacks read tracking), Enrollment Terms (with SIS integration, bulk operations), Syllabus (auto-generated from assignments/calendar — Canvas requires manual creation). +5 models, ~17 endpoints, +3 frontend pages
- **10B**: Email Notification Delivery (SMTP with digest batching — immediate/hourly/daily/weekly — and retry logic; Canvas uses external email service), Rich Content Editor (zero-dependency contentEditable with toolbar, link/image/table/equation/media insertion, accessibility checker, HTML source view — Canvas depends on TinyMCE), Audit Logs (structured course activity + grade change tracking with CSV export — Canvas buries this in admin console). +4 models, ~12 endpoints, +2 frontend pages, +2 shared components
- **10C**: Custom Roles + Granular Permissions (36 permissions in 4 categories with permission presets/templates — Canvas has overwhelming 80+ permission grid), OneRoster 1.1 REST API Consumer (incremental sync via REST — Canvas only supports CSV bulk import), DocViewer/Document Annotations (client-side annotation layer with highlight/comment/strikethrough/freehand/point types, threaded replies, resolve/unresolve — Canvas uses closed-source DocViewer that frequently goes down). +7 models, ~28 endpoints, +3 frontend pages, +1 shared component

## Current State
- **81 models**, **78 repository implementations**, **51 services**, **58 handlers**
- **341 API routes** under `/api/v1/` (+ 6 public SSO routes)
- **40 frontend pages**, **14 shared components**
- **5 auth protocol files** (SAML, LDAP, CAS, SSO handler, sso_handler)
- **3 middleware** (auth, pagination, RBAC permissions)
- PWA with service worker, offline support, install prompt
- WCAG 2.1 AA accessibility (skip-to-content, focus traps, ARIA landmarks, live regions)
- All builds pass cleanly (`go build`, `go vet`, `npm run build`)

## Parallel Agent Strategy
When implementing a new phase, use 3 parallel agents for independent domain files (models, repos, services, handlers, pages) while the main thread modifies shared files:
- `internal/repository/interfaces.go`
- `internal/db/postgres.go` (AutoMigrate)
- `internal/api/v1/router.go` (routes)
- `cmd/server/main.go` (wiring)
- `web/src/services/api.js` (API methods)
- `web/src/App.jsx` (React routes)
- `web/src/components/Layout.jsx` (nav links)

Agents should ONLY create new files. All shared file edits happen in the main thread to avoid conflicts.
