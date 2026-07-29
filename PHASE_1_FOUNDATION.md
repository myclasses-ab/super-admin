# Phase 1 — Activity Logging Foundation

## Goal

Build the foundation of the platform-wide activity audit system:
- New `ActivityLog` entity, enums, async service, and repository.
- Actor resolution from the JWT header.
- Logging wired into the **3 most important controllers**: institutes, courses, and inquiries.
- New REST endpoints to query logs.
- A beautiful, mobile-first **Activity Logs** page in `super-admin` with filtering and pagination.

> **Scope clarification**: This is a **simple activity watcher**, not AWS CloudWatch-style API/request tracing. We log business activities ("Institute X updated profile", "Student Y searched JEE in Mumbai", "Demo booked"), not HTTP status codes or request paths.

> **Repos changed**: `Backend/` and `super-admin/` only.

> **Decisions locked**: authenticated users only, async logging, logs retained forever.

> **Note for the implementing AI/agent**: The code samples, file names, enum values, and method signatures below are **recommended starting points, not strict rules**. Adapt them to fit the existing codebase conventions, package structure, and naming patterns. The locked decisions above must be respected.

---

## 1. Backend Changes

### 1.1 New Files

Create the following files under `Backend/src/main/java/com/classes/Backend/`:

```
Domain/activity/
  ActivityLog.java
  ActivityActorType.java
  ActivityActionType.java
  ActivityEntityType.java

dto/activity/
  ActivityLogRequest.java
  ActivityLogFilterRequest.java
  ActivityLogPageResponse.java

Repository/activity/
  ActivityLogRepository.java

Service/activity/
  ActivityLogService.java
  ActivityLogServiceImpl.java

Controller/activity/
  ActivityLogController.java

config/
  AsyncConfig.java

Service/activity/ (helper)
  ActivityLogActorResolver.java
  ResolvedActor.java
```

### 1.2 Enums

`ActivityActorType.java`:

```java
public enum ActivityActorType {
    STUDENT,
    INSTITUTE_ADMIN,
    INSTITUTE_STAFF,
    SUPER_ADMIN,
    SYSTEM
}
```

`ActivityEntityType.java`:

```java
public enum ActivityEntityType {
    USER, INSTITUTE, BRANCH, COURSE, FACULTY, RESULT,
    REVIEW, BOOKMARK, INQUIRY, FACILITY, FAQ, MEDIA,
    CREDIT, CREDIT_TRANSACTION, FEATURED_PURCHASE,
    SUBSCRIPTION, USER_INSTITUTE_ASSOCIATION
}
```

`ActivityActionType.java` (subset for Phase 1):

```java
public enum ActivityActionType {
    LOGIN,
    LOGIN_OTP,
    STUDENT_REGISTERED,

    INSTITUTE_CREATED,
    INSTITUTE_UPDATED,
    INSTITUTE_DELETED,
    INSTITUTE_VERIFIED,
    INSTITUTE_UNVERIFIED,
    INSTITUTE_FEATURED,
    INSTITUTE_UNFEATURED,

    COURSE_CREATED,
    COURSE_UPDATED,
    COURSE_DELETED,

    SUBMITTED_INQUIRY,
    BOOKED_DEMO,
    UNLOCKED_LEAD
}
```

### 1.3 `ActivityLog` Entity

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
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @Column(name = "identifier")
    private String identifier = UUID.randomUUID().toString();

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false)
    private ActivityActorType actorType;

    @Column(name = "actor_identifier", length = 100)
    private String actorIdentifier;

    @Column(name = "actor_name", length = 300)
    private String actorName;

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
    private String instituteIdentifier;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### 1.4 DTOs

`ActivityLogRequest.java`:

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private Object oldValue;
    private Object newValue;
    private Map<String, Object> metadata;
    private String ipAddress;
    private String userAgent;
    private String source;
}
```

`ActivityLogFilterRequest.java`:

```java
@Data
public class ActivityLogFilterRequest {
    private ActivityActorType actorType;
    private ActivityActionType actionType;
    private ActivityEntityType entityType;
    private String actorIdentifier;
    private String instituteIdentifier;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private String search;
    private int page = 0;
    private int size = 25;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
}
```

`ActivityLogPageResponse.java`:

```java
@Data
@Builder
public class ActivityLogPageResponse {
    private List<ActivityLog> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
```

### 1.5 Async Configuration

`AsyncConfig.java`:

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "activityLogTaskExecutor")
    public Executor activityLogTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("activity-log-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

### 1.6 Actor Resolver

`ResolvedActor.java`:

```java
@Data
@Builder
public class ResolvedActor {
    private ActivityActorType type;
    private String identifier;
    private String name;
    private boolean authenticated;
}
```

`ActivityLogActorResolver.java`:

```java
@Component
@RequiredArgsConstructor
public class ActivityLogActorResolver {

    private final JwtService jwtService;
    private final UserService userService;

    public ResolvedActor resolve(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResolvedActor.builder()
                    .type(ActivityActorType.STUDENT)
                    .authenticated(false)
                    .build();
        }
        try {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);

            if ("aditya@gmail.com".equals(username)) {
                return ResolvedActor.builder()
                        .type(ActivityActorType.SUPER_ADMIN)
                        .identifier("super-admin")
                        .name("Super Admin")
                        .authenticated(true)
                        .build();
            }

            User user = userService.findByEmail(username)
                    .orElseGet(() -> userService.findByPhone(username).orElse(null));

            if (user == null) {
                return ResolvedActor.builder().authenticated(false).build();
            }

            ActivityActorType actorType = mapRole(user.getRole());
            return ResolvedActor.builder()
                    .type(actorType)
                    .identifier(user.getIdentifier())
                    .name(user.getFullName())
                    .authenticated(true)
                    .build();
        } catch (Exception e) {
            return ResolvedActor.builder().authenticated(false).build();
        }
    }

    private ActivityActorType mapRole(UserRole role) {
        if (role == null) return ActivityActorType.STUDENT;
        return switch (role) {
            case INSTITUTE_ADMIN -> ActivityActorType.INSTITUTE_ADMIN;
            case INSTITUTE_STAFF -> ActivityActorType.INSTITUTE_STAFF;
            case SUPER_ADMIN, CONTENT_MANAGER -> ActivityActorType.SUPER_ADMIN;
            default -> ActivityActorType.STUDENT;
        };
    }
}
```

### 1.7 Repository

`ActivityLogRepository.java`:

```java
public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {

    @Query("""
        SELECT a FROM ActivityLog a
        WHERE (:actorType IS NULL OR a.actorType = :actorType)
          AND (:actionType IS NULL OR a.actionType = :actionType)
          AND (:entityType IS NULL OR a.entityType = :entityType)
          AND (:actorIdentifier IS NULL OR a.actorIdentifier = :actorIdentifier)
          AND (:instituteIdentifier IS NULL OR a.instituteIdentifier = :instituteIdentifier)
          AND (:fromDate IS NULL OR a.createdAt >= :fromDate)
          AND (:toDate IS NULL OR a.createdAt <= :toDate)
          AND (:search IS NULL OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.actorName) LIKE LOWER(CONCAT('%', :search, '%')))
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
}
```

### 1.8 Service

`ActivityLogService.java`:

```java
public interface ActivityLogService {
    void log(ActivityLogRequest request);
    ActivityLogPageResponse search(ActivityLogFilterRequest request);
    ActivityLog getById(String identifier);
}
```

`ActivityLogServiceImpl.java`:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    @Async("activityLogTaskExecutor")
    @Override
    public void log(ActivityLogRequest request) {
        try {
            ActivityLog activityLog = ActivityLog.builder()
                    .actorType(request.getActorType())
                    .actorIdentifier(request.getActorIdentifier())
                    .actorName(request.getActorName())
                    .actionType(request.getActionType())
                    .entityType(request.getEntityType())
                    .entityIdentifier(request.getEntityIdentifier())
                    .entityName(request.getEntityName())
                    .instituteIdentifier(request.getInstituteIdentifier())
                    .description(request.getDescription())
                    .oldValue(toJson(request.getOldValue()))
                    .newValue(toJson(request.getNewValue()))
                    .metadata(toJson(request.getMetadata()))
                    .ipAddress(request.getIpAddress())
                    .userAgent(request.getUserAgent())
                    .source(request.getSource())
                    .build();
            activityLogRepository.save(activityLog);
        } catch (Exception e) {
            log.error("Failed to persist activity log", e);
        }
    }

    @Override
    public ActivityLogPageResponse search(ActivityLogFilterRequest request) {
        Sort sort = Sort.by(request.getSortDirection().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                request.getSortBy());
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        Page<ActivityLog> page = activityLogRepository.searchLogs(
                request.getActorType(),
                request.getActionType(),
                request.getEntityType(),
                request.getActorIdentifier(),
                request.getInstituteIdentifier(),
                request.getFromDate(),
                request.getToDate(),
                request.getSearch(),
                pageable
        );
        return ActivityLogPageResponse.builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public ActivityLog getById(String identifier) {
        return activityLogRepository.findById(identifier)
                .orElseThrow(() -> new RuntimeException("Activity log not found"));
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize activity log value", e);
            return "{\"error\":\"serialization_failed\"}";
        }
    }
}
```

### 1.9 Controller

`ActivityLogController.java`:

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ActivityLogPageResponse> search(ActivityLogFilterRequest request) {
        return ResponseEntity.ok(activityLogService.search(request));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<ActivityLog> getById(@PathVariable String identifier) {
        return ResponseEntity.ok(activityLogService.getById(identifier));
    }
}
```

### 1.10 Logging in Existing Controllers

Add `private final ActivityLogService activityLogService;` and `private final ActivityLogActorResolver actorResolver;` to each controller below, and add the log calls described.

#### `InstituteController`

**Create** (`POST /api/institutes`):

```java
ResolvedActor actor = actorResolver.resolve(request);
if (actor.isAuthenticated()) {
    activityLogService.log(ActivityLogRequest.builder()
            .actorType(actor.getType())
            .actorIdentifier(actor.getIdentifier())
            .actorName(actor.getName())
            .actionType(ActivityActionType.INSTITUTE_CREATED)
            .entityType(ActivityEntityType.INSTITUTE)
            .entityIdentifier(saved.getIdentifier())
            .entityName(saved.getName())
            .description("Created institute " + saved.getName())
            .source("CONSOLE")
            .build());
}
```

**Update** (`PUT /api/institutes/{identifier}`):

```java
ResolvedActor actor = actorResolver.resolve(request);
if (actor.isAuthenticated()) {
    activityLogService.log(ActivityLogRequest.builder()
            .actorType(actor.getType())
            .actorIdentifier(actor.getIdentifier())
            .actorName(actor.getName())
            .actionType(ActivityActionType.INSTITUTE_UPDATED)
            .entityType(ActivityEntityType.INSTITUTE)
            .entityIdentifier(updated.getIdentifier())
            .entityName(updated.getName())
            .instituteIdentifier(updated.getIdentifier())
            .description("Updated institute profile")
            .metadata(Map.of("changedFields", extractChangedFields(existing, updated)))
            .source("CONSOLE")
            .build());
}
```

> Add a private helper `extractChangedFields(Object oldObj, Object newObj)` that uses `ObjectMapper` to convert to `Map<String, Object>` and returns only keys with different values.

**Delete** (`DELETE /api/institutes/{identifier}`):

```java
ResolvedActor actor = actorResolver.resolve(request);
if (actor.isAuthenticated()) {
    activityLogService.log(ActivityLogRequest.builder()
            .actorType(actor.getType())
            .actorIdentifier(actor.getIdentifier())
            .actorName(actor.getName())
            .actionType(ActivityActionType.INSTITUTE_DELETED)
            .entityType(ActivityEntityType.INSTITUTE)
            .entityIdentifier(identifier)
            .entityName(nameBeforeDelete)
            .description("Deleted institute " + nameBeforeDelete)
            .source("SUPER_ADMIN")
            .build());
}
```

#### `InstituteCourseController`

Log `COURSE_CREATED`, `COURSE_UPDATED`, `COURSE_DELETED` with `entityType = COURSE` and `instituteIdentifier` set from the course's `instituteIdentifier`.

#### `InquiryController`

**Create inquiry** (`POST /api/inquiries`):

```java
ResolvedActor actor = actorResolver.resolve(request);
if (actor.isAuthenticated() && saved.getUserIdentifier() != null) {
    ActivityActionType action = saved.getSource() == InquirySource.CALLBACK_REQUEST
            ? ActivityActionType.BOOKED_DEMO
            : ActivityActionType.SUBMITTED_INQUIRY;
    activityLogService.log(ActivityLogRequest.builder()
            .actorType(ActivityActorType.STUDENT)
            .actorIdentifier(saved.getUserIdentifier())
            .actionType(action)
            .entityType(ActivityEntityType.INQUIRY)
            .entityIdentifier(saved.getIdentifier())
            .entityName(saved.getName())
            .instituteIdentifier(saved.getInstituteIdentifier())
            .description((action == BOOKED_DEMO ? "Booked a demo" : "Submitted inquiry") + " for " + instituteName)
            .metadata(Map.of(
                    "studentName", saved.getName(),
                    "phone", maskPhone(saved.getPhone()),
                    "targetExam", saved.getTargetExam(),
                    "standard", saved.getStandard(),
                    "source", saved.getSource()
            ))
            .source("FRONTEND")
            .build());
}
```

> Note: only log when `userIdentifier` is present (authenticated). Mask phone in metadata if displayed in super-admin.

**Unlock lead** (`POST /api/inquiries/{identifier}/unlock`):

```java
activityLogService.log(ActivityLogRequest.builder()
        .actorType(ActivityActorType.INSTITUTE_ADMIN)
        .actorIdentifier(user.getIdentifier())
        .actorName(user.getFullName())
        .actionType(ActivityActionType.UNLOCKED_LEAD)
        .entityType(ActivityEntityType.INQUIRY)
        .entityIdentifier(identifier)
        .instituteIdentifier(instituteIdentifier)
        .description("Unlocked lead contact")
        .source("CONSOLE")
        .build());
```

#### `AuthController`

**Login** (`POST /api/auth/login`):

```java
activityLogService.log(ActivityLogRequest.builder()
        .actorType(mapRole(user.getRole()))
        .actorIdentifier(user.getIdentifier())
        .actorName(user.getFullName())
        .actionType(ActivityActionType.LOGIN)
        .entityType(ActivityEntityType.USER)
        .entityIdentifier(user.getIdentifier())
        .description("Logged in with email")
        .source(sourceFromUserAgent(request))
        .build());
```

**OTP verify** (`POST /api/auth/verify-otp`):

```java
if (isNewUser) {
    activityLogService.log(...STUDENT_REGISTERED...);
} else {
    activityLogService.log(...LOGIN_OTP...);
}
```

---

## 2. super-admin UI Changes

### 2.1 New Files

```
super-admin/src/
├── api/activity-logs.ts
├── types/activity.ts
├── pages/ActivityLogsPage.tsx
└── components/activity/
    ├── ActivityLogFilters.tsx
    ├── ActivityLogDetailModal.tsx
    └── ActivityLogTable.tsx
```

### 2.2 Types

Add to `super-admin/src/types/index.ts` or a new `super-admin/src/types/activity.ts`:

```ts
export enum ActivityActorType {
  STUDENT = 'STUDENT',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  INSTITUTE_STAFF = 'INSTITUTE_STAFF',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum ActivityEntityType {
  USER = 'USER',
  INSTITUTE = 'INSTITUTE',
  BRANCH = 'BRANCH',
  COURSE = 'COURSE',
  FACULTY = 'FACULTY',
  RESULT = 'RESULT',
  REVIEW = 'REVIEW',
  BOOKMARK = 'BOOKMARK',
  INQUIRY = 'INQUIRY',
  FACILITY = 'FACILITY',
  FAQ = 'FAQ',
  MEDIA = 'MEDIA',
  CREDIT = 'CREDIT',
  CREDIT_TRANSACTION = 'CREDIT_TRANSACTION',
  FEATURED_PURCHASE = 'FEATURED_PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  USER_INSTITUTE_ASSOCIATION = 'USER_INSTITUTE_ASSOCIATION',
}

export enum ActivityActionType {
  LOGIN = 'LOGIN',
  LOGIN_OTP = 'LOGIN_OTP',
  STUDENT_REGISTERED = 'STUDENT_REGISTERED',
  INSTITUTE_CREATED = 'INSTITUTE_CREATED',
  INSTITUTE_UPDATED = 'INSTITUTE_UPDATED',
  INSTITUTE_DELETED = 'INSTITUTE_DELETED',
  INSTITUTE_VERIFIED = 'INSTITUTE_VERIFIED',
  INSTITUTE_UNVERIFIED = 'INSTITUTE_UNVERIFIED',
  INSTITUTE_FEATURED = 'INSTITUTE_FEATURED',
  INSTITUTE_UNFEATURED = 'INSTITUTE_UNFEATURED',
  COURSE_CREATED = 'COURSE_CREATED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  COURSE_DELETED = 'COURSE_DELETED',
  SUBMITTED_INQUIRY = 'SUBMITTED_INQUIRY',
  BOOKED_DEMO = 'BOOKED_DEMO',
  UNLOCKED_LEAD = 'UNLOCKED_LEAD',
}

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

export interface ActivityLogPageResponse {
  content: ActivityLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ActivityLogSearchParams {
  page?: number;
  size?: number;
  actorType?: ActivityActorType;
  actionType?: ActivityActionType;
  entityType?: ActivityEntityType;
  actorIdentifier?: string;
  instituteIdentifier?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}
```

### 2.3 API Client

`super-admin/src/api/activity-logs.ts`:

```ts
import axios from './axios-helper';
import type { ActivityLog, ActivityLogPageResponse, ActivityLogSearchParams } from '@/types';

export const activityLogsApi = {
  search: async (params: ActivityLogSearchParams): Promise<ActivityLogPageResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    if (params.actorType) query.append('actorType', params.actorType);
    if (params.actionType) query.append('actionType', params.actionType);
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.actorIdentifier) query.append('actorIdentifier', params.actorIdentifier);
    if (params.instituteIdentifier) query.append('instituteIdentifier', params.instituteIdentifier);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.search) query.append('search', params.search);
    const response = await axios.get<ActivityLogPageResponse>(`/activity-logs?${query.toString()}`);
    return response.data;
  },

  getById: async (identifier: string): Promise<ActivityLog> => {
    const response = await axios.get<ActivityLog>(`/activity-logs/${identifier}`);
    return response.data;
  },
};
```

### 2.4 Sidebar

Add to `super-admin/src/components/layout/Sidebar.tsx`:

```ts
import { Activity } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Institutes', icon: Building2, path: '/institutes' },
  { label: 'Courses', icon: BookOpen, path: '/courses' },
  { label: 'Credits', icon: Coins, path: '/credits' },
  { label: 'Featured', icon: Sparkles, path: '/featured-purchases' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Activity Logs', icon: Activity, path: '/activity-logs' },
];
```

### 2.5 Routing

Add to `super-admin/src/App.tsx`:

```tsx
import ActivityLogsPage from '@/pages/ActivityLogsPage';

<Route path="activity-logs" element={<PageTransition><ActivityLogsPage /></PageTransition>} />
```

### 2.6 Activity Logs Page

Create `super-admin/src/pages/ActivityLogsPage.tsx`.

**Requirements — design first, mobile first:**

- Header with title "Activity Logs" and a short subtitle.
- A clean filter bar that collapses on mobile into an accordion or bottom sheet.
  - Filters: actor type, action type, entity type, date range (from/to), free-text search.
- A responsive data table for desktop (reuse `DataTable` if possible).
- Mobile card list: each card shows time, actor badge, action badge, entity name, description.
- Pagination controls at the bottom.
- Clicking a row/card opens a detail modal (`ActivityLogDetailModal`) showing:
  - All fields
  - Pretty-printed JSON for `metadata`, `oldValue`, `newValue`
- Use Tailwind, Lucide icons, Sonner toast for errors.
- Empty state with `EmptyState` component.
- Loading state with `LoadingSpinner`.

Make it look as polished as the existing Institutes and Dashboard pages.

### 2.7 Detail Modal

Create `super-admin/src/components/activity/ActivityLogDetailModal.tsx`.

- Show actor, action, entity, time, source.
- Show human-readable description.
- Show `metadata` JSON in a collapsible code block.
- Show `oldValue` / `newValue` side-by-side in a diff-like view when both are present.

---

## 3. Acceptance Criteria

- [ ] `ActivityLog` table is created automatically by Hibernate.
- [ ] Creating/updating/deleting an institute logs an `INSTITUTE_*` event.
- [ ] Creating/updating/deleting a course logs a `COURSE_*` event.
- [ ] Submitting an inquiry/demo and unlocking a lead logs an `INQUIRY`/`DEMO`/`UNLOCKED_LEAD` event.
- [ ] Logging does not block the main API response (async).
- [ ] Only authenticated actors are logged; anonymous actions are ignored.
- [ ] `GET /api/activity-logs` returns paginated, filterable results.
- [ ] Super-admin sidebar has an "Activity Logs" item.
- [ ] Activity Logs page loads and displays logs on desktop and mobile.
- [ ] Filters work and update the table.
- [ ] Detail modal opens and shows JSON metadata cleanly.
- [ ] Backend compiles and starts without errors.
- [ ] Super-admin builds without TypeScript errors.

---

## 4. Testing Checklist

1. Create an institute via console → check super-admin Activity Logs.
2. Update institute profile → check metadata contains changed fields.
3. Add a course → check `COURSE_CREATED`.
4. Submit an inquiry from frontend as logged-in student → check `SUBMITTED_INQUIRY`.
5. Unlock a lead from console → check `UNLOCKED_LEAD`.
6. Apply filters in super-admin and confirm pagination.
7. Shrink browser to mobile width and verify cards layout.

---

*Phase 1 of the activity logging system. Phase 2 will wire the remaining institute-content and monetization controllers.*
