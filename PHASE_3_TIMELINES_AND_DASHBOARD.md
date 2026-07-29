# Phase 3 — Timelines + Dashboard Widgets

## Goal

Make the activity data actionable and lovable:
- Per-student timeline page.
- Per-institute timeline page.
- Dashboard widgets showing recent activity, top active students, top active institutes, and action distribution.

> **Scope clarification**: Activity watcher, not API request tracing.

> **Repos changed**: `Backend/` and `super-admin/` only.

> **Prerequisite**: Phase 1 and Phase 2 complete.

> **Note for the implementing AI/agent**: The code samples, file names, enum values, and method signatures below are **recommended starting points, not strict rules**. Adapt them to fit the existing codebase conventions, package structure, and naming patterns. The high-level scope and locked decisions from Phase 1 must be respected.

---

## 1. Backend Changes

### 1.1 New Endpoints in `ActivityLogController`

```java
@GetMapping("/student/{userIdentifier}/timeline")
public ResponseEntity<List<ActivityLog>> getStudentTimeline(
        @PathVariable String userIdentifier,
        @RequestParam(defaultValue = "100") int limit) {
    Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ResponseEntity.ok(activityLogRepository
            .findByActorTypeAndActorIdentifier(ActivityActorType.STUDENT, userIdentifier, pageable)
            .getContent());
}

@GetMapping("/institute/{instituteIdentifier}/timeline")
public ResponseEntity<List<ActivityLog>> getInstituteTimeline(
        @PathVariable String instituteIdentifier,
        @RequestParam(defaultValue = "100") int limit) {
    Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ResponseEntity.ok(activityLogRepository
            .findByInstituteIdentifier(instituteIdentifier, pageable)
            .getContent());
}

@GetMapping("/stats")
public ResponseEntity<ActivityLogStatsResponse> getStats() {
    return ResponseEntity.ok(activityLogService.getStats());
}
```

### 1.2 New Repository Methods

Add to `ActivityLogRepository`:

```java
Page<ActivityLog> findByActorTypeAndActorIdentifier(ActivityActorType actorType, String actorIdentifier, Pageable pageable);
Page<ActivityLog> findByInstituteIdentifier(String instituteIdentifier, Pageable pageable);

@Query("""
    SELECT a.actorIdentifier, a.actorName, COUNT(a)
    FROM ActivityLog a
    WHERE a.actorType = :actorType AND a.createdAt >= :since
    GROUP BY a.actorIdentifier, a.actorName
    ORDER BY COUNT(a) DESC
    """)
List<Object[]> findTopActorsByTypeSince(
    @Param("actorType") ActivityActorType actorType,
    @Param("since") LocalDateTime since,
    Pageable pageable
);

@Query("""
    SELECT a.actionType, COUNT(a)
    FROM ActivityLog a
    WHERE a.createdAt >= :since
    GROUP BY a.actionType
    """)
List<Object[]> countByActionTypeSince(@Param("since") LocalDateTime since);

@Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.createdAt >= :since")
long countSince(@Param("since") LocalDateTime since);
```

### 1.3 Stats Service Method

Add to `ActivityLogServiceImpl`:

```java
public ActivityLogStatsResponse getStats() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime today = now.toLocalDate().atStartOfDay();
    LocalDateTime weekAgo = today.minusDays(7);
    LocalDateTime monthAgo = today.minusDays(30);

    List<TopActor> topStudents = toTopActors(
        activityLogRepository.findTopActorsByTypeSince(ActivityActorType.STUDENT, weekAgo, PageRequest.of(0, 5))
    );

    List<TopActor> topInstitutes = toTopActors(
        activityLogRepository.findTopActorsByTypeSince(ActivityActorType.INSTITUTE_ADMIN, weekAgo, PageRequest.of(0, 5))
    );

    List<ActionCount> actionCounts = toActionCounts(
        activityLogRepository.countByActionTypeSince(weekAgo)
    );

    return ActivityLogStatsResponse.builder()
            .totalToday(activityLogRepository.countSince(today))
            .totalWeek(activityLogRepository.countSince(weekAgo))
            .totalMonth(activityLogRepository.countSince(monthAgo))
            .topStudents(topStudents)
            .topInstitutes(topInstitutes)
            .actionCounts(actionCounts)
            .build();
}
```

### 1.4 DTOs

```java
@Data
@Builder
public class ActivityLogStatsResponse {
    private long totalToday;
    private long totalWeek;
    private long totalMonth;
    private List<TopActor> topStudents;
    private List<TopActor> topInstitutes;
    private List<ActionCount> actionCounts;
}

@Data
@Builder
public class TopActor {
    private String identifier;
    private String name;
    private long count;
}

@Data
@Builder
public class ActionCount {
    private ActivityActionType actionType;
    private long count;
}
```

---

## 2. super-admin UI Changes

### 2.1 New Pages

```
super-admin/src/pages/
  StudentActivityPage.tsx
  InstituteActivityPage.tsx
```

### 2.2 New API Client Methods

Add to `super-admin/src/api/activity-logs.ts`:

```ts
getStudentTimeline: async (identifier: string, limit = 100): Promise<ActivityLog[]> => {
  const response = await axios.get<ActivityLog[]>(`/activity-logs/student/${identifier}/timeline?limit=${limit}`);
  return response.data;
},

getInstituteTimeline: async (identifier: string, limit = 100): Promise<ActivityLog[]> => {
  const response = await axios.get<ActivityLog[]>(`/activity-logs/institute/${identifier}/timeline?limit=${limit}`);
  return response.data;
},

getStats: async (): Promise<ActivityLogStatsResponse> => {
  const response = await axios.get<ActivityLogStatsResponse>('/activity-logs/stats');
  return response.data;
},
```

### 2.3 New Types

```ts
export interface TopActor {
  identifier: string;
  name: string;
  count: number;
}

export interface ActionCount {
  actionType: ActivityActionType;
  count: number;
}

export interface ActivityLogStatsResponse {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  topStudents: TopActor[];
  topInstitutes: TopActor[];
  actionCounts: ActionCount[];
}
```

### 2.4 Student Activity Page

Route: `/activity-logs/student/:identifier`

**Design — mobile first, beautiful:**

- Header card:
  - Student name, phone (masked), city, current standard.
  - Quick stats row: total searches, institutes viewed, demos booked, inquiries submitted, bookmarks, reviews.
- Timeline section:
  - Vertical timeline with date separators (Today, Yesterday, Earlier).
  - Each item: icon, action badge, description, timestamp.
  - Group consecutive events by minute if many.
- Empty state if no activity.
- Back button to Activity Logs list.

### 2.5 Institute Activity Page

Route: `/activity-logs/institute/:identifier`

**Design — mobile first, beautiful:**

- Header card:
  - Institute name, tier badge, verified badge.
  - Quick stats row: total edits, courses added, leads unlocked, credits spent, featured purchases, staff changes.
- Timeline section:
  - Same vertical timeline as student page.
  - Highlight monetization events (credits, featured, subscriptions) with accent colors.
- Empty state if no activity.
- Back button to Activity Logs list.

### 2.6 Reusable Timeline Component

Create `super-admin/src/components/activity/ActivityTimeline.tsx`:

```tsx
interface ActivityTimelineProps {
  logs: ActivityLog[];
  emptyTitle: string;
  emptyDescription: string;
}
```

- Render vertical timeline.
- Use icons based on action category.
- Show relative time ("2 mins ago", "Today, 10:30 AM").
- On mobile, use full-width cards; on desktop, alternate left/right timeline.

### 2.7 Dashboard Widgets

Update `super-admin/src/pages/DashboardPage.tsx`:

Add a new section at the bottom:

1. **Recent Activity Feed** (latest 10 events)
   - List with icon, actor, action, entity, time.
   - "View all" link to `/activity-logs`.

2. **Top Active Students This Week**
   - Small bar chart or ranked list.
   - Click goes to Student Activity page.

3. **Top Active Institutes This Week**
   - Small bar chart or ranked list.
   - Click goes to Institute Activity page.

4. **Activity by Action Type**
   - Pie or donut chart using Recharts.

Fetch on dashboard load:

```ts
const [activityStats, setActivityStats] = useState<ActivityLogStatsResponse | null>(null);
const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

useEffect(() => {
  Promise.all([
    activityLogsApi.getStats(),
    activityLogsApi.search({ size: 10 }),
  ]).then(([stats, page]) => {
    setActivityStats(stats);
    setRecentActivity(page.content);
  });
}, []);
```

### 2.8 Deep Links

- In Activity Logs table, make actor name clickable:
  - Student → `/activity-logs/student/:actorIdentifier`
  - Institute → `/activity-logs/institute/:instituteIdentifier`
- In Dashboard "Recent Inquiries", add a link "View student activity".
- In Institutes table, add an action "Activity" → `/activity-logs/institute/:identifier`.

### 2.9 Routing

Update `super-admin/src/App.tsx`:

```tsx
import StudentActivityPage from '@/pages/StudentActivityPage';
import InstituteActivityPage from '@/pages/InstituteActivityPage';

<Route path="activity-logs" element={<PageTransition><ActivityLogsPage /></PageTransition>} />
<Route path="activity-logs/student/:identifier" element={<PageTransition><StudentActivityPage /></PageTransition>} />
<Route path="activity-logs/institute/:identifier" element={<PageTransition><InstituteActivityPage /></PageTransition>} />
```

---

## 3. Acceptance Criteria

- [ ] `GET /api/activity-logs/student/:id/timeline` returns the last N student events.
- [ ] `GET /api/activity-logs/institute/:id/timeline` returns the last N institute-scoped events.
- [ ] `GET /api/activity-logs/stats` returns totals, top actors, and action distribution.
- [ ] Student Activity page renders header stats + timeline.
- [ ] Institute Activity page renders header stats + timeline.
- [ ] Dashboard shows Recent Activity, Top Students, Top Institutes, and Action Distribution.
- [ ] All new pages are fully responsive and mobile-friendly.
- [ ] Deep links work from Activity Logs table and Institutes table.
- [ ] Backend compiles and starts.
- [ ] Super-admin builds without TypeScript errors.

---

## 4. Testing Checklist

1. Open a student's timeline → verify events load.
2. Open an institute's timeline → verify events load.
3. Check dashboard stats match recent activity.
4. Click through from Activity Logs table to student/institute timeline.
5. Click "View activity" from Institutes table.
6. Test on mobile width: timeline readable, stats cards stack, no horizontal scroll.

---

*Phase 3 completes the user-facing observability layer. All three phases together give you a full activity watcher for institutes and students.*
