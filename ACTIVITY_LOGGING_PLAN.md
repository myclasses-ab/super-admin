# Comprehensive Activity Logging & Audit System — Overview

## Goal

Build a centralized, queryable activity/audit logging layer for the entire My Classes platform. The super-admin app becomes the single pane of glass where we observe:

- **Institute actions**: what an institute created, updated, deleted, uploaded, purchased, or changed in `console-myclasses`.
- **Student actions**: what a logged-in student searched, viewed, bookmarked, compared, booked, reviewed, and unlocked.
- **Super-admin actions**: credit grants, top-up approvals, featured approvals, verifications, etc.
- **System actions**: background jobs, credit deductions, expiry events.

> **Important clarification**: This is a **simple activity watcher**, not AWS CloudWatch-style API/request tracing. We log business activities ("Institute X updated profile", "Student Y booked a demo"), not HTTP status codes or request paths.

> **Design priority**: The super-admin UI must be beautiful, lovable, and **fully mobile-friendly**.

> **Repos changed**: `Backend/` and `super-admin/` only.

> Run each phase prompt in **plan mode** so the implementation can be staged and reviewed before code is written.

> **Note for the implementing AI/agent**: The code samples, file names, enum values, and method signatures in this document are **recommended starting points, not strict rules**. Adapt them to fit the existing codebase conventions, package structure, and naming patterns. Only the high-level decisions (authenticated-only, async logging, logs kept forever, Backend + super-admin repos, mobile-friendly UI) should be treated as locked.

## Phase Files (execute in order)

1. **[PHASE_1_FOUNDATION.md](./PHASE_1_FOUNDATION.md)** — `ActivityLog` entity, async service, actor resolver, core controllers (institute/course/inquiry/auth), first super-admin Activity Logs page.
2. **[PHASE_2_COMPLETE_INSTITUTE_ACTIONS.md](./PHASE_2_COMPLETE_INSTITUTE_ACTIONS.md)** — wire all remaining institute-content, monetization, review, bookmark, and staff controllers.
3. **[PHASE_3_TIMELINES_AND_DASHBOARD.md](./PHASE_3_TIMELINES_AND_DASHBOARD.md)** — per-student timeline, per-institute timeline, dashboard widgets.

---

## Decisions Log

| Question | Decision |
|----------|----------|
| Anonymous tracking? | **No** — log authenticated users only. |
| Sync vs async logging? | **Async** via `@Async` task executor. |
| First execution scope? | **Phases 1 and 2** in sequence; Phase 3 optional but recommended. |
| Log retention? | **Forever** — no automatic deletion. |
| What is being logged? | Business activities, not API request traces. |
| Which repos change? | `Backend/` and `super-admin/` only. |
| UI priority? | Beautiful, lovable, and **fully mobile-friendly**. |

---

## 1. Current State (discovered from codebase)

### Backend

- Spring Boot + PostgreSQL + JPA/Hibernate (`spring.jpa.hibernate.ddl-auto=update`).
- JWT auth via `JwtAuthFilter`; token subject is email or phone.
- `SecurityConfig` currently permits all requests, but `SecurityContextHolder` is populated when a Bearer token is present.
- 27 controllers, 44 domain entities.
- **Existing lightweight tracking** already exists:
  - `UserController.trackActivity()` (`POST /api/users/{identifier}/track-activity`) updates `User.searchedCities`, `User.searchedExams`, `User.visitedInstituteIdentifiers`, `User.visitedInstituteNames`.
  - The student frontend (`frontend/`) calls this via `useLeadTracking` for searches and institute visits.

### Frontend Apps

- `frontend/` — student-facing Next.js app.
  - Actions: search, view institute/course/faculty/results/reviews, bookmark, compare, submit inquiry/demo, write review, login.
- `console-myclasses/` — institute console.
  - Pages/routes: profile, branches, courses, faculty, results, reviews, leads, FAQs, facilities, subscription, credits.
  - Token stored as `authToken`.
- `super-admin/` — admin dashboard (this repo).
  - Pages: Dashboard, Institutes, Courses, Credits, Featured Purchases, Analytics.
  - Token stored as `superAdminToken`.

### Gaps

- No unified `ActivityLog` table.
- No historical timeline per actor.
- No diffs of what changed.
- No super-admin UI to browse/filter logs.
- Existing tracking mutates the `User` row and cannot store metadata, timestamps per event, or anonymous actions.

---

## 2. Recommended Architecture

### Principle

**Log everything important, but never block the user-facing API path.**

All logging writes should be asynchronous (`@Async`) so a slow log insert cannot slow down searches, inquiries, or institute saves.

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│  frontend / console-myclasses / super-admin                 │
│  (call existing REST APIs; no extra client work needed)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Controllers                                        │
│  - perform the business operation                           │
│  - call ActivityLogService.log(...) or publish event        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ActivityLogService / ActivityLogEventListener (@Async)     │
│  - resolves actor from SecurityContextHolder or request     │
│  - enriches IP, user-agent, metadata                        │
│  - persists to PostgreSQL activity_logs table               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ActivityLogController + super-admin UI                     │
│  - filter, search, paginate, aggregate                      │
│  - per-student / per-institute timelines                    │
└─────────────────────────────────────────────────────────────┘
```

### Logging Strategy per Controller

For each meaningful write endpoint, add a single call immediately after the business save succeeds:

```java
activityLogService.log(ActivityLogRequest.builder()
    .actionType(ActivityActionType.INSTITUTE_UPDATED)
    .entityType(ActivityEntityType.INSTITUTE)
    .entityIdentifier(institute.getIdentifier())
    .entityName(institute.getName())
    .metadata(Map.of("changedFields", changedFields))
    .build());
```

For **anonymous but important** actions (e.g., public search), either:

- Option A: accept an optional `Authorization` header and log only when a student is authenticated (simplest).
- Option B: create a lightweight `POST /api/activity-logs/track` endpoint callable from the frontend even when anonymous, storing `actorType = ANONYMOUS`.

**Recommendation**: start with Option A for authenticated students only, then add Option B later if you want anonymous search analytics.

---

## 3. Data Model

### New Entity: `ActivityLog`

```java
@Entity
@Table(name = "activity_logs", indexes = {
    @Index(name = "idx_al_actor", columnList = "actor_type, actor_identifier"),
    @Index(name = "idx_al_entity", columnList = "entity_type, entity_identifier"),
    @Index(name = "idx_al_action", columnList = "action_type"),
    @Index(name = "idx_al_created", columnList = "created_at"),
    @Index(name = "idx_al_institute", columnList = "institute_identifier")
})
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class ActivityLog {

    @Id
    @Column(name = "identifier")
    private String identifier = UUID.randomUUID().toString();

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false)
    private ActivityActorType actorType;   // STUDENT, INSTITUTE, SUPER_ADMIN, SYSTEM

    @Column(name = "actor_identifier", length = 100)
    private String actorIdentifier;        // user_identifier or institute_identifier

    @Column(name = "actor_name", length = 300)
    private String actorName;              // fullName or institute name for display

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActivityActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private ActivityEntityType entityType;

    @Column(name = "entity_identifier", length = 100)
    private String entityIdentifier;

    @Column(name = "entity_name", length = 500)
    private String entityName;

    @Column(name = "institute_identifier", length = 100)
    private String instituteIdentifier;    // denormalized for fast institute-scoped queries

    @Column(name = "description", length = 1000)
    private String description;            // human-readable summary

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;               // JSON snapshot before change

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;               // JSON snapshot after change

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;               // JSON: searchQuery, city, filters, source, etc.

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "source", length = 50)
    private String source;                 // FRONTEND, CONSOLE, SUPER_ADMIN, SYSTEM

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### Enums

```java
public enum ActivityActorType {
    STUDENT,
    PARENT,
    INSTITUTE,
    INSTITUTE_ADMIN,
    INSTITUTE_STAFF,
    SUPER_ADMIN,
    SYSTEM,
    ANONYMOUS
}

public enum ActivityActionType {
    // Auth
    LOGIN, LOGIN_OTP, LOGOUT, TOKEN_REFRESH,

    // Institute lifecycle
    INSTITUTE_CREATED, INSTITUTE_UPDATED, INSTITUTE_DELETED,
    INSTITUTE_VERIFIED, INSTITUTE_UNVERIFIED,
    INSTITUTE_FEATURED, INSTITUTE_UNFEATURED,
    INSTITUTE_ACTIVATED, INSTITUTE_DEACTIVATED,

    // Institute content
    BRANCH_CREATED, BRANCH_UPDATED, BRANCH_DELETED,
    COURSE_CREATED, COURSE_UPDATED, COURSE_DELETED,
    FACULTY_CREATED, FACULTY_UPDATED, FACULTY_DELETED,
    RESULT_CREATED, RESULT_UPDATED, RESULT_DELETED,
    FACILITY_CREATED, FACILITY_UPDATED, FACILITY_DELETED,
    FAQ_CREATED, FAQ_UPDATED, FAQ_DELETED,
    MEDIA_UPLOADED, MEDIA_DELETED,

    // Student engagement
    STUDENT_REGISTERED, STUDENT_PROFILE_UPDATED,
    SEARCHED_INSTITUTES, VIEWED_INSTITUTE, VIEWED_COURSE,
    BOOKMARKED, REMOVED_BOOKMARK,
    COMPARED_INSTITUTES,
    SUBMITTED_INQUIRY, BOOKED_DEMO, UNLOCKED_LEAD,
    SUBMITTED_REVIEW, REVIEW_VOTED,

    // Monetization
    CREDITS_GRANTED, CREDITS_DEDUCTED,
    TOP_UP_REQUESTED, TOP_UP_APPROVED, TOP_UP_REJECTED,
    FEATURED_PURCHASED, SUBSCRIPTION_CHANGED,

    // Association / staff
    STAFF_ADDED, STAFF_REMOVED, STAFF_ROLE_CHANGED
}

public enum ActivityEntityType {
    USER, INSTITUTE, BRANCH, COURSE, FACULTY, RESULT,
    REVIEW, BOOKMARK, INQUIRY, FACILITY, FAQ, MEDIA,
    CREDIT, CREDIT_TRANSACTION, FEATURED_PURCHASE,
    SUBSCRIPTION, USER_INSTITUTE_ASSOCIATION, SYSTEM
}
```

### DTOs / Request

```java
@Data
@Builder
public class ActivityLogRequest {
    private ActivityActorType actorType;
    private String actorIdentifier;
    private String actorName;
    private ActivityActionType actionType;
    private ActivityEntityType entityType;
    private String entityIdentifier;
    private String entityName;
    private String instituteIdentifier;
    private String description;
    private Object oldValue;   // service serializes to JSON
    private Object newValue;
    private Map<String, Object> metadata;
}
```

---

## 4. Backend Implementation Plan

### 4.1 New Files

```
Backend/src/main/java/com/classes/Backend/
├── Domain/activity/
│   ├── ActivityLog.java
│   ├── ActivityActorType.java
│   ├── ActivityActionType.java
│   └── ActivityEntityType.java
├── dto/activity/
│   ├── ActivityLogRequest.java
│   └── ActivityLogFilterRequest.java
├── Repository/activity/
│   └── ActivityLogRepository.java
├── Service/activity/
│   ├── ActivityLogService.java
│   └── ActivityLogServiceImpl.java
├── Controller/activity/
│   └── ActivityLogController.java
└── config/
    └── AsyncConfig.java
```

### 4.2 Repository Methods

```java
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {
    Page<ActivityLog> findByActorTypeAndActorIdentifier(ActivityActorType actorType, String actorIdentifier, Pageable pageable);
    Page<ActivityLog> findByInstituteIdentifier(String instituteIdentifier, Pageable pageable);
    Page<ActivityLog> findByActionType(ActivityActionType actionType, Pageable pageable);
    Page<ActivityLog> findByEntityTypeAndEntityIdentifier(ActivityEntityType entityType, String entityIdentifier, Pageable pageable);

    @Query("""
        SELECT a FROM ActivityLog a
        WHERE (:actorType IS NULL OR a.actorType = :actorType)
          AND (:actionType IS NULL OR a.actionType = :actionType)
          AND (:entityType IS NULL OR a.entityType = :entityType)
          AND (:actorIdentifier IS NULL OR a.actorIdentifier = :actorIdentifier)
          AND (:instituteIdentifier IS NULL OR a.instituteIdentifier = :instituteIdentifier)
          AND (:fromDate IS NULL OR a.createdAt >= :fromDate)
          AND (:toDate IS NULL OR a.createdAt <= :toDate)
          AND (:search IS NULL OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<ActivityLog> searchLogs(
        @Param("actorType") ActivityActorType actorType,
        @Param("actionType") ActivityActionType actionType,
        @Param("entityType") ActivityEntityType entityType,
        @Param("actorIdentifier") String actorIdentifier,
        @Param("instituteIdentifier") String instituteIdentifier,
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        @Param("search") String search,
        Pageable pageable
    );

    // Summary / dashboard counts
    long countByActionTypeAndCreatedAtAfter(ActivityActionType actionType, LocalDateTime since);

    @Query("SELECT a.actionType, COUNT(a) FROM ActivityLog a WHERE a.createdAt >= :since GROUP BY a.actionType")
    List<Object[]> countByActionTypeSince(@Param("since") LocalDateTime since);
}
```

### 4.3 Async Logging Service

```java
@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    @Async("activityLogTaskExecutor")
    @Override
    public void log(ActivityLogRequest request) {
        try {
            ActivityLog log = new ActivityLog();
            log.setActorType(request.getActorType());
            log.setActorIdentifier(request.getActorIdentifier());
            log.setActorName(request.getActorName());
            log.setActionType(request.getActionType());
            log.setEntityType(request.getEntityType());
            log.setEntityIdentifier(request.getEntityIdentifier());
            log.setEntityName(request.getEntityName());
            log.setInstituteIdentifier(request.getInstituteIdentifier());
            log.setDescription(request.getDescription());
            log.setOldValue(toJson(request.getOldValue()));
            log.setNewValue(toJson(request.getNewValue()));
            log.setMetadata(toJson(request.getMetadata()));
            log.setIpAddress(request.getIpAddress());
            log.setUserAgent(request.getUserAgent());
            log.setSource(request.getSource());
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Never throw; logging failures must not break business operations.
            log.error("Failed to persist activity log", e);
        }
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"serialization_failed\"}";
        }
    }
}
```

### 4.4 Actor Resolution Helper

Because `SecurityConfig` permits all, we cannot rely on `@AuthenticationPrincipal`. Create a helper that reads the JWT from the `Authorization` header when available:

```java
@Component
@RequiredArgsConstructor
public class ActivityLogActorResolver {

    private final JwtService jwtService;
    private final UserService userService;
    private final InstituteService instituteService;

    public ResolvedActor resolve(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResolvedActor.anonymous();
        }
        String username = jwtService.extractUsername(authHeader.substring(7));
        // Try user
        User user = userService.findByEmail(username)
                .orElseGet(() -> userService.findByPhone(username).orElse(null));
        if (user != null) {
            return ResolvedActor.user(user);
        }
        // Super admin hardcoded account
        if ("aditya@gmail.com".equals(username)) {
            return ResolvedActor.superAdmin();
        }
        return ResolvedActor.anonymous();
    }
}
```

### 4.5 Controller Logging Points

Inject `ActivityLogService` into the controllers listed below and add a log call after each business operation.

#### Institute actions (`InstituteController`)

- `POST /api/institutes` → `INSTITUTE_CREATED`
- `PUT /api/institutes/{identifier}` → `INSTITUTE_UPDATED` (include changed fields in metadata)
- `DELETE /api/institutes/{identifier}` → `INSTITUTE_DELETED`

#### Branch actions (`BranchController`)

- Create → `BRANCH_CREATED`
- Update → `BRANCH_UPDATED`
- Delete → `BRANCH_DELETED`

#### Course actions (`InstituteCourseController`)

- Create → `COURSE_CREATED`
- Update → `COURSE_UPDATED`
- Delete → `COURSE_DELETED`

#### Faculty actions (`FacultyController`)

- Create → `FACULTY_CREATED`
- Update → `FACULTY_UPDATED`
- Delete → `FACULTY_DELETED`

#### Result actions (`ResultController`)

- Create → `RESULT_CREATED`
- Update → `RESULT_UPDATED`
- Delete → `RESULT_DELETED`

#### Facility actions (`InstituteFacilityController`)

- Create/Update → `FACILITY_UPDATED`

#### FAQ actions (`FaqController`)

- Create → `FAQ_CREATED`
- Update → `FAQ_UPDATED`
- Delete → `FAQ_DELETED`

#### Student engagement

- `BookmarkController.saveBookmark` → `BOOKMARKED`
- `BookmarkController.deleteBookmarkById` → `REMOVED_BOOKMARK`
- `InquiryController.saveInquiry` → `SUBMITTED_INQUIRY` / `BOOKED_DEMO` (infer from source)
- `InquiryController.unlockInquiry` → `UNLOCKED_LEAD`
- `ReviewController.saveReview` → `SUBMITTED_REVIEW`
- `AuthController.login`, `verifyOtp` → `LOGIN` / `STUDENT_REGISTERED` for new OTP users

#### Monetization / super-admin

- `CreditController.grantCredits` → `CREDITS_GRANTED`
- `CreditTopUpController.approve` → `TOP_UP_APPROVED`
- `FeaturedPurchaseController.create` → `FEATURED_PURCHASED`

> **Note on `oldValue`/`newValue`**: for updates, capture only the changed fields, not the full entity, to keep row size small. Use a utility that diffs two maps/JSON objects.

### 4.6 New REST Endpoints

```
GET  /api/activity-logs
     Query params: page, size, sort, actorType, actionType, entityType,
                   actorIdentifier, instituteIdentifier, fromDate, toDate, search
     Response: Page<ActivityLog>

GET  /api/activity-logs/{identifier}
     Response: ActivityLog

GET  /api/activity-logs/student/{userIdentifier}/timeline
     Response: List<ActivityLog> (last N, e.g., 100)

GET  /api/activity-logs/institute/{instituteIdentifier}/timeline
     Response: List<ActivityLog> (last N)

GET  /api/activity-logs/stats
     Response: {
         totalToday, totalWeek, totalMonth,
         topActions: [{ actionType, count }],
         mostActiveInstitutes: [{ identifier, name, count }],
         mostActiveStudents: [{ identifier, name, count }]
     }

POST /api/activity-logs/track   (optional, for explicit frontend events)
     Body: ActivityLogRequest (without actor; resolved from JWT)
```

### 4.7 Security Notes

- Current `SecurityConfig` permits all. These new endpoints should still work because logging reads the JWT header directly.
- If you later tighten security, restrict `GET /api/activity-logs/**` to `SUPER_ADMIN`.
- Avoid logging passwords, OTPs, or full credit-card/transaction details in `metadata`/`oldValue`/`newValue`.

---

## 5. super-admin UI Implementation Plan

### 5.1 New Pages

1. **Activity Logs page** (`/activity-logs`)
   - Filters: actor type, action type, entity type, date range, actor/institute identifier, free-text search.
   - Paginated table: time, actor, action, entity, description.
   - Row click opens a detail drawer/modal showing old/new values and metadata JSON.

2. **Student Activity Detail page** (`/activity-logs/student/:identifier`)
   - Header: student name, phone, city, total events.
   - Timeline of all actions.
   - Stats: searches, institutes viewed, demos booked, bookmarks, reviews.

3. **Institute Activity Detail page** (`/activity-logs/institute/:identifier`)
   - Header: institute name, tier, verified status.
   - Timeline of all actions performed by/on the institute.
   - Stats: content edits, leads unlocked, credits spent, featured purchases.

### 5.2 Dashboard Enhancements (`/`)

Add a new section at the bottom or a new row:

- Recent platform activity feed (last 10 events).
- Top active institutes today/this week.
- Top active students today/this week.
- Action-type distribution chart (Pie/Bar).

### 5.3 Sidebar Update

Add a new nav item in `Sidebar.tsx`:

```ts
{ label: 'Activity Logs', icon: Activity, path: '/activity-logs' },
```

### 5.4 New API Client

Create `super-admin/src/api/activity-logs.ts`:

```ts
export interface ActivityLog {
  identifier: string;
  actorType: ActivityActorType;
  actorIdentifier: string;
  actorName: string;
  actionType: ActivityActionType;
  entityType: ActivityEntityType;
  entityIdentifier: string;
  entityName: string;
  instituteIdentifier: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  source: string;
  createdAt: string;
}

export const activityLogsApi = {
  search: async (params: ActivityLogSearchParams): Promise<Paginated<ActivityLog>> => { ... },
  getById: async (identifier: string): Promise<ActivityLog> => { ... },
  getStudentTimeline: async (identifier: string): Promise<ActivityLog[]> => { ... },
  getInstituteTimeline: async (identifier: string): Promise<ActivityLog[]> => { ... },
  getStats: async (): Promise<ActivityLogStats> => { ... },
};
```

### 5.5 Types to Add

Extend `super-admin/src/types/index.ts` with `ActivityLog`, `ActivityActorType`, `ActivityActionType`, `ActivityEntityType`.

---

## 6. Optional Frontend Enhancements

The backend logging covers most institute actions automatically because `console-myclasses` calls REST APIs. For richer student behavior, optionally extend the existing `frontend/hooks/useLeadTracking.ts`:

- `trackCourseView(courseIdentifier, courseName, instituteIdentifier)`
- `trackCompare(instituteIdentifiers[])`
- `trackBookmark(entityType, entityIdentifier, instituteIdentifier)`

These would call `POST /api/activity-logs/track` if you decide to add it, or keep using the existing `/api/users/{id}/track-activity` endpoint if you extend it.

**Recommendation**: first implement backend logging for all API mutations; then add frontend-side event tracking only if needed.

---

## 7. Execution Order

Run each phase as a separate plan-mode prompt:

1. **[PHASE_1_FOUNDATION.md](./PHASE_1_FOUNDATION.md)**
2. **[PHASE_2_COMPLETE_INSTITUTE_ACTIONS.md](./PHASE_2_COMPLETE_INSTITUTE_ACTIONS.md)**
3. **[PHASE_3_TIMELINES_AND_DASHBOARD.md](./PHASE_3_TIMELINES_AND_DASHBOARD.md)**

Because logs are retained forever, monitor table growth after launch. If the table becomes large, add DB partitioning or a read-replica later without changing the application code.

---

## 8. Remaining Design Decisions

The major decisions are locked (see Decisions Log above). Please confirm the last two before Phase 1 starts:

1. **Keep existing `User.searchedCities` / `visitedInstituteIdentifiers`?**
   - These are currently used for lead filtering in the console/super-admin.
   - **Recommended**: keep them for backward compatibility AND write richer events to `ActivityLog`.

2. **Sensitive data redaction?**
   - Should we mask phone/email in logs shown to super-admin, or keep them for operational debugging?
   - **Recommended**: mask phone/email in the UI; store them in the DB only if required for support.

---

## 9. Success Criteria

After implementation, the super-admin app should let you:

- See a chronological list of every institute profile update, course add/edit/delete, branch change, faculty change, result change, FAQ change, facility change, media upload, and monetization event.
- See a chronological list of every logged-in student's searches, institute views, course views, bookmarks, comparisons, demo bookings, inquiry submissions, review submissions, and lead unlocks.
- Filter by actor, action, entity, date range, and institute.
- Click into a single student or institute and see a full activity timeline.
- View dashboard widgets showing top active students/institutes and recent platform events.

---

## 10. Appendix — Suggested Action Type Coverage Matrix

| Area | Actions to log |
|------|----------------|
| Auth | LOGIN, LOGIN_OTP, LOGOUT, TOKEN_REFRESH, STUDENT_REGISTERED |
| Institute profile | INSTITUTE_CREATED, INSTITUTE_UPDATED, INSTITUTE_DELETED, INSTITUTE_VERIFIED, INSTITUTE_UNVERIFIED, INSTITUTE_FEATURED, INSTITUTE_UNFEATURED, INSTITUTE_ACTIVATED, INSTITUTE_DEACTIVATED |
| Branches | BRANCH_CREATED, BRANCH_UPDATED, BRANCH_DELETED |
| Courses | COURSE_CREATED, COURSE_UPDATED, COURSE_DELETED |
| Faculty | FACULTY_CREATED, FACULTY_UPDATED, FACULTY_DELETED |
| Results | RESULT_CREATED, RESULT_UPDATED, RESULT_DELETED |
| Facilities | FACILITY_CREATED, FACILITY_UPDATED |
| FAQs | FAQ_CREATED, FAQ_UPDATED, FAQ_DELETED |
| Media | MEDIA_UPLOADED, MEDIA_DELETED |
| Reviews | SUBMITTED_REVIEW, REVIEW_VOTED |
| Bookmarks | BOOKMARKED, REMOVED_BOOKMARK |
| Inquiries/Demos | SUBMITTED_INQUIRY, BOOKED_DEMO, UNLOCKED_LEAD |
| Credits | CREDITS_GRANTED, CREDITS_DEDUCTED, TOP_UP_REQUESTED, TOP_UP_APPROVED, TOP_UP_REJECTED |
| Featured/Subscriptions | FEATURED_PURCHASED, SUBSCRIPTION_CHANGED |
| Staff | STAFF_ADDED, STAFF_REMOVED, STAFF_ROLE_CHANGED |
| Student behavior | SEARCHED_INSTITUTES, VIEWED_INSTITUTE, VIEWED_COURSE, COMPARED_INSTITUTES, STUDENT_PROFILE_UPDATED |

---

*Prepared after reviewing Backend, console-myclasses, frontend, and super-admin codebases.*
