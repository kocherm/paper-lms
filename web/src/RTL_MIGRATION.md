# RTL Migration Audit

The `tailwindcss-logical` plugin is enabled and exposes logical-property utilities
that should replace physical directional spacing. Migrating swaps:

| Physical (LTR-only) | Logical (RTL-aware) |
| ------------------- | ------------------- |
| `ml-*`              | `ms-*`              |
| `mr-*`              | `me-*`              |
| `pl-*`              | `ps-*`              |
| `pr-*`              | `pe-*`              |
| `left-*`            | `start-*`           |
| `right-*`           | `end-*`             |
| `text-left`         | `text-start`        |
| `text-right`        | `text-end`          |
| `border-l-*`        | `border-s-*`        |
| `border-r-*`        | `border-e-*`        |
| `rounded-l-*`       | `rounded-s-*`       |
| `rounded-r-*`       | `rounded-e-*`       |

`ms-*` = margin-inline-start, `me-*` = margin-inline-end (likewise for padding).
Under `dir="rtl"` the start/end edges flip automatically.

## Top 20 components to migrate

Ranked by count of `ml-` / `mr-` / `pl-` / `pr-` occurrences. Migrate in order;
each file is small enough for a single PR.

Phase 5 Item 4 status: `tailwindcss-logical@^3.0.1` plugin re-enabled in
`web/tailwind.config.js`. Files marked `[x]` have been migrated to logical
utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`,
`text-start`/`text-end`, `border-s`/`border-e`).

| Rank | Hits | File | Status |
| ---- | ---- | ---- | ------ |
| 1    | 21   | `src/pages/OneRosterPage.jsx` | [x] migrated |
| 2    | 10   | `src/components/Layout.jsx` | owned by main thread |
| 3    | 8    | `src/pages/QuestionBanksPage.jsx` | [x] migrated |
| 4    | 7    | `src/components/ui/dropdown-menu.jsx` | pending |
| 5    | 6    | `src/pages/ModulesPage.jsx` | pending |
| 6    | 6    | `src/pages/GraphiQLPage.jsx` | pending |
| 7    | 6    | `src/pages/AttendancePage.jsx` | pending |
| 8    | 5    | `src/pages/CourseSettingsPage.jsx` | pending |
| 9    | 5    | `src/pages/CoursePacingPage.jsx` | pending |
| 10   | 4    | `src/pages/StudentGradesPage.jsx` | pending |
| 11   | 4    | `src/pages/SISImportPage.jsx` | pending |
| 12   | 4    | `src/pages/PeoplePage.jsx` | [x] migrated |
| 13   | 4    | `src/pages/InboxPage.jsx` | pending |
| 14   | 4    | `src/pages/CustomRolesPage.jsx` | pending |
| 15   | 4    | `src/pages/CalendarPage.jsx` | [x] migrated |
| 16   | 3    | `src/pages/PortfolioEditorPage.jsx` | pending |
| 17   | 3    | `src/pages/DiscussionTopicPageV2.jsx` | pending |
| 18   | 3    | `src/pages/BlueprintPage.jsx` | pending |
| 19   | 3    | `src/pages/AuthProvidersPage.jsx` | pending |
| 20   | 3    | `src/pages/AssignmentsPage.jsx` | owned by Item 3 (RCE) |

### Phase 5 Item 4 — additional migrations (not in original top 20)

| File | Status |
| ---- | ------ |
| `src/components/CourseNav.jsx` | [x] migrated |
| `src/components/MobileBottomNav.jsx` | [x] migrated |
| `src/components/NotificationBell.jsx` | [x] migrated |
| `src/components/ModuleSettingsModal.jsx` | [x] no physical classes (verified) |
| `src/pages/CoursesPage.jsx` | [x] no physical classes (verified) |
| `src/pages/DashboardPage.jsx` | [x] migrated |
| `src/pages/RubricsPage.jsx` | [x] no physical classes (verified) |

## Notes

- `src/components/ui/dropdown-menu.jsx` is shadcn-generated; upstream uses physical
  classes. Patch in place rather than re-generating.
- Icon-only `mr-2` / `ml-2` patterns inside buttons (e.g. `<Icon className="mr-2" />`)
  almost always mean "icon-end-of-text gap" and should become `gap-2` on the parent
  rather than `me-2` on the icon.
- After migration, set `<html dir>` from i18n locale (LTR/RTL) and add a visual
  smoke test under `dir="rtl"`.
- Layout primitives (`flex`, `grid`, `gap-*`, `space-x-*`) are already direction-
  agnostic and need no changes.
