# Phase 2 — Complete Institute Actions + Engagement Logging

## Goal

Extend the activity logging foundation from Phase 1 to cover **every meaningful institute action** in `console-myclasses` plus student engagement actions (bookmarks, reviews, comparisons).

> **Scope clarification**: This remains a **simple activity watcher**, not API request tracing. We log business activities, not HTTP status codes.

> **Repos changed**: `Backend/` and `super-admin/` only.

> **Prerequisite**: Phase 1 must be complete and merged.

> **Note for the implementing AI/agent**: The code samples, file names, enum values, and method signatures below are **recommended starting points, not strict rules**. Adapt them to fit the existing codebase conventions, package structure, and naming patterns. The high-level scope and locked decisions from Phase 1 must be respected.

---

## 1. Backend Changes

### 1.1 Extend `ActivityActionType` enum

Add the following values to `Backend/src/main/java/com/classes/Backend/Domain/activity/ActivityActionType.java`:

```java
// Branch actions
BRANCH_CREATED,
BRANCH_UPDATED,
BRANCH_DELETED,

// Faculty actions
FACULTY_CREATED,
FACULTY_UPDATED,
FACULTY_DELETED,

// Result actions
RESULT_CREATED,
RESULT_UPDATED,
RESULT_DELETED,

// Facility actions
FACILITY_CREATED,
FACILITY_UPDATED,

// FAQ actions
FAQ_CREATED,
FAQ_UPDATED,
FAQ_DELETED,

// Media actions
MEDIA_UPLOADED,
MEDIA_DELETED,

// Review / bookmark
SUBMITTED_REVIEW,
REVIEW_VOTED,
BOOKMARKED,
REMOVED_BOOKMARK,
COMPARED_INSTITUTES,

// Staff association
STAFF_ADDED,
STAFF_REMOVED,
STAFF_ROLE_CHANGED,

// Monetization
CREDITS_GRANTED,
CREDITS_DEDUCTED,
TOP_UP_REQUESTED,
TOP_UP_APPROVED,
TOP_UP_REJECTED,
FEATURED_PURCHASED,
SUBSCRIPTION_CHANGED
```

### 1.2 Wire Logging into Controllers

For each controller below, inject `ActivityLogService` and `ActivityLogActorResolver`. Add a log call after each successful business operation.

#### `BranchController`

- `POST /api/branches` → `BRANCH_CREATED`
- `PUT /api/branches/{identifier}` → `BRANCH_UPDATED`
- `DELETE /api/branches/{identifier}` → `BRANCH_DELETED`

Include `instituteIdentifier` from the branch.

#### `FacultyController`

- `POST /api/faculty` → `FACULTY_CREATED`
- `PUT /api/faculty/{identifier}` → `FACULTY_UPDATED`
- `DELETE /api/faculty/{identifier}` → `FACULTY_DELETED`

#### `ResultController`

- `POST /api/results` → `RESULT_CREATED`
- `PUT /api/results/{identifier}` → `RESULT_UPDATED`
- `DELETE /api/results/{identifier}` → `RESULT_DELETED`

#### `InstituteFacilityController`

- `POST /api/institute-facilities` → `FACILITY_CREATED`
- `PUT /api/institute-facilities/{identifier}` → `FACILITY_UPDATED`

> Facility is typically one-per-institute, so treat create and update similarly.

#### `FaqController`

- `POST /api/faqs` → `FAQ_CREATED`
- `PUT /api/faqs/{identifier}` → `FAQ_UPDATED`
- `DELETE /api/faqs/{identifier}` → `FAQ_DELETED`

#### `MediaController`

- `POST /api/media` → `MEDIA_UPLOADED`
- `DELETE /api/media/{identifier}` → `MEDIA_DELETED`

Metadata should include `mediaType` and `entityType`.

#### `ReviewController`

- `POST /api/reviews` → `SUBMITTED_REVIEW`

Metadata: rating, isAnonymous.

#### `BookmarkController`

- `POST /api/bookmarks` → `BOOKMARKED`
- `DELETE /api/bookmarks/{identifier}` → `REMOVED_BOOKMARK`

Metadata: `entityType`, `entityIdentifier`.

#### `UserInstituteAssociationController`

- `POST /api/user-institute-associations` → `STAFF_ADDED`
- `PUT /api/user-institute-associations/{identifier}` → `STAFF_ROLE_CHANGED`
- `DELETE /api/user-institute-associations/{identifier}` → `STAFF_REMOVED`

#### `CreditController`

- `POST /api/credits/grant` → `CREDITS_GRANTED`

Metadata: amount, description.

#### `CreditTopUpController`

- Create request → `TOP_UP_REQUESTED`
- Approve → `TOP_UP_APPROVED`
- Reject → `TOP_UP_REJECTED`

#### `FeaturedPurchaseController`

- `POST /api/featured-purchases` → `FEATURED_PURCHASED`

Metadata: cost, durationDays.

#### `InstituteSubscriptionController`

- Any subscription change → `SUBSCRIPTION_CHANGED`

Metadata: oldTier, newTier.

### 1.3 Helper: `extractChangedFields`

If not created in Phase 1, add this utility to `ActivityLogServiceImpl` or a new `ActivityLogDiffUtil`:

```java
public static Map<String, Object[]> diff(Object oldObj, Object newObj) {
    ObjectMapper mapper = new ObjectMapper();
    Map<String, Object> oldMap = mapper.convertValue(oldObj, new HashMap<String, Object>().getClass());
    Map<String, Object> newMap = mapper.convertValue(newObj, new HashMap<String, Object>().getClass());
    Map<String, Object[]> changes = new HashMap<>();
    for (String key : newMap.keySet()) {
        Object oldVal = oldMap.get(key);
        Object newVal = newMap.get(key);
        if (!Objects.equals(oldVal, newVal)) {
            changes.put(key, new Object[]{oldVal, newVal});
        }
    }
    return changes;
}
```

Store the diff as `metadata.changedFields` with the structure:

```json
{
  "changedFields": {
    "name": ["Old Name", "New Name"],
    "phonePrimary": [null, "+91 98765 43210"]
  }
}
```

### 1.4 Add Optional: Explicit Tracking Endpoint

Create `POST /api/activity-logs/track` for actions that do not naturally hit a backend mutation, such as comparing institutes from the frontend.

```java
@PostMapping("/track")
public ResponseEntity<Void> track(@RequestBody ActivityLogRequest request, HttpServletRequest httpRequest) {
    ResolvedActor actor = actorResolver.resolve(httpRequest);
    if (!actor.isAuthenticated()) {
        return ResponseEntity.noContent().build();
    }
    ActivityLogRequest enriched = ActivityLogRequest.builder()
            .actorType(actor.getType())
            .actorIdentifier(actor.getIdentifier())
            .actorName(actor.getName())
            .actionType(request.getActionType())
            .entityType(request.getEntityType())
            .entityIdentifier(request.getEntityIdentifier())
            .entityName(request.getEntityName())
            .instituteIdentifier(request.getInstituteIdentifier())
            .description(request.getDescription())
            .metadata(request.getMetadata())
            .ipAddress(httpRequest.getRemoteAddr())
            .userAgent(httpRequest.getHeader("User-Agent"))
            .source(request.getSource())
            .build();
    activityLogService.log(enriched);
    return ResponseEntity.accepted().build();
}
```

This is optional for Phase 2 but recommended for `COMPARED_INSTITUTES`.

---

## 2. super-admin UI Enhancements

### 2.1 Update Types

Extend `super-admin/src/types/activity.ts` (or `index.ts`) with the new enum values.

### 2.2 Enhanced Filters

Update `ActivityLogFilters.tsx` to include new action categories with grouped selects:

- **Actor**: Student, Institute Admin, Institute Staff, Super Admin, System
- **Action**: group by category (Auth, Institute, Content, Engagement, Monetization, Staff)
- **Entity**: Institute, Branch, Course, Faculty, Result, Facility, FAQ, Media, Review, Bookmark, Inquiry, Credit, Subscription

Make filters responsive: on mobile, use a bottom sheet or collapsible panel.

### 2.3 Action Badges

Create a helper component `ActivityLogBadge.tsx` that renders each `actionType` with a color/icon:

| Category | Color | Icon |
|----------|-------|------|
| CREATE | green | Plus |
| UPDATE | blue | Pencil |
| DELETE | red | Trash2 |
| AUTH | purple | LogIn |
| ENGAGEMENT | amber | Heart / MessageSquare |
| MONETIZATION | emerald | Coins / Sparkles |

Use these badges in both the table and mobile cards.

### 2.4 Detail Modal Improvements

`ActivityLogDetailModal.tsx`:

- Detect `metadata.changedFields` and render a clean diff table:
  - Field name
  - Old value (strikethrough or muted)
  - New value (highlighted)
- For `oldValue`/`newValue` snapshots, render collapsible JSON.
- Add a "Copy JSON" button for support/debugging.

---

## 3. Frontend Optional Hook Update (only if needed)

If you want to log `COMPARED_INSTITUTES`, update `frontend/hooks/useComparison.ts`:

```ts
import { activityLogsApi } from '@/api-client';

const trackCompare = useCallback(async (slugs: string[]) => {
  if (slugs.length < 2) return;
  try {
    await activityLogsApi.track({
      actionType: ActivityActionType.COMPARED_INSTITUTES,
      entityType: ActivityEntityType.INSTITUTE,
      description: `Compared ${slugs.length} institutes`,
      metadata: { slugs },
      source: 'FRONTEND',
    });
  } catch { /* ignore */ }
}, []);
```

> This is the only change in `frontend/` if you choose to include it. Otherwise Phase 2 is backend + super-admin only.

---

## 4. Acceptance Criteria

- [ ] All Phase 1 functionality still works.
- [ ] Branch create/update/delete logs appear.
- [ ] Faculty create/update/delete logs appear.
- [ ] Result create/update/delete logs appear.
- [ ] Facility update logs appear.
- [ ] FAQ create/update/delete logs appear.
- [ ] Media upload/delete logs appear.
- [ ] Review submission logs appear.
- [ ] Bookmark add/remove logs appear.
- [ ] Staff add/remove/role-change logs appear.
- [ ] Credit grant, top-up request/approve/reject, featured purchase, subscription change logs appear.
- [ ] Super-admin filters include all new action/entity types.
- [ ] Detail modal shows changed-field diff table.
- [ ] Mobile layout remains usable.
- [ ] Backend compiles and starts.
- [ ] Super-admin builds without TypeScript errors.

---

## 5. Testing Checklist

1. In console, add/edit/delete a branch → verify logs.
2. Add/edit/delete a faculty member → verify logs.
3. Add/edit/delete a result → verify logs.
4. Update facilities → verify log.
5. Add/delete an FAQ → verify logs.
6. Upload/delete media → verify logs.
7. As a student, submit a review → verify log.
8. As a student, bookmark/remove bookmark → verify logs.
9. As super-admin, grant credits → verify log.
10. Request/approve a top-up from console → verify logs.
11. Purchase featured listing → verify log.
12. Use filters in super-admin to isolate each action type.

---

*Phase 2 completes the core backend logging coverage. Phase 3 will add per-student and per-institute timeline pages and dashboard widgets.*
