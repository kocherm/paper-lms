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
    domain/models/                      # Canvas-compatible model structs (62 files)
    repository/
      interfaces.go                     # All repository interfaces
      postgres/                         # GORM implementations (63 files)
    service/                            # Business logic layer (38 files)
    graphql/                            # Hand-rolled GraphQL engine (schema parser + resolver)
    api/v1/
      router.go                         # Route registration (~267 routes)
      middleware/                        # Auth, pagination
      handlers/                         # HTTP handlers (45 files)
      responses/                        # Pagination, error format helpers
    db/postgres.go                      # PostgreSQL connection + AutoMigrate
  web/src/
    pages/                              # React pages (32 files)
    components/                         # Layout, ProtectedRoute, WCAG helpers
    services/api.js                     # API client with Canvas Link-header pagination
    contexts/AuthContext.jsx            # JWT auth context
  deployments/docker/                   # Docker Compose setup
```

### Key Patterns
- **Repository pattern**: Interfaces in `interfaces.go`, GORM implementations in `postgres/`
- **Service layer**: Business logic with dependency injection of repository interfaces
- **Canvas API compatibility**: All endpoints under `/api/v1/`, Canvas JSON format, Link-header pagination (RFC 5988)
- **Error format**: `{"errors": [{"message": "..."}]}`
- **Auth**: JWT (HS256) + OAuth2 + Personal Access Tokens via `middleware.AuthMiddleware`
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

## Current State
- **62 models**, **63 repository implementations**, **38 services**, **45 handlers**
- **~267 API routes** under `/api/v1/`
- **32 frontend pages**
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
