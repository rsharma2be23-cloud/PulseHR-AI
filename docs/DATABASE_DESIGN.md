# PulseHR AI Database Design

## Purpose

This document describes the MongoDB foundation for PulseHR AI. The design keeps login identity separate from workforce data, and keeps growing historical records in their own collections.

## Relationship diagram

```text
User
  | 1 : 0..1
  v
Employee -----------------> Department
  |                              |
  | manager                       | manager
  +----------------------------> Employee
  |
  +---- Attendance
  +---- PerformanceReview <----- User (reviewer)
  +---- Survey
  +---- Feedback
  +---- AttritionPrediction
```

All arrows between collections are MongoDB `ObjectId` references. An Employee refers to one User and one Department. A manager is another Employee, allowing a straightforward reporting hierarchy.

## Collections

### Users

Stores system identity and later authorization data: `name`, normalized unique `email`, `passwordHash`, `role`, and `isActive`. Roles are `employee`, `manager`, `hr`, and `admin`.

`passwordHash` is intentionally not a password and is excluded from ordinary query results. Authentication and hashing logic are not part of this phase.

**Index:** a unique index on `email` prevents duplicate login identities.

### Departments

Stores `name`, optional `description`, and optional `manager`. The manager references an **Employee**, rather than a User, because managing a department is a workforce relationship and the Employee profile contains the department/workforce context.

**Index:** a unique index on `name` prevents accidentally creating the same department twice.

### Employees

Stores workforce information: linked `user`, unique `employeeCode`, `department`, optional self-referencing `manager`, designation, joining date, age, salary, employment status, and optional promotion date.

**Indexes:** `user` is unique to enforce at most one workforce profile per identity; `employeeCode` is unique; `department` and `manager` are indexed for later department and team queries.

### Attendance

Stores one aggregate record for each employee/month. `period` must be the first day of its month in UTC (for example, `2026-07-01T00:00:00.000Z`). It contains working, present, and absent days plus overtime hours.

**Index:** unique `{ employee, period }` prevents a second aggregate for the same employee and month and supports chronological attendance lookup.

### PerformanceReviews

Stores an employee reference, the reviewing **User**, a textual review period, rating, and optional comments. The reviewer points to User because an HR or admin user may perform a review without being the employee's manager.

**Index:** `{ employee, reviewPeriod }` supports review-history lookups for an employee.

### Surveys

Stores an employee's five 1–5 satisfaction scores and `submittedAt`.

**Index:** `{ employee, submittedAt }` supports retrieving an employee's survey trend in time order.

### Feedback

Stores feedback text and submission time. `sentimentLabel` and `sentimentScore` are nullable until the later sentiment-analysis phase. A score, when present, uses the documented -1 to 1 convention.

**Index:** `{ employee, submittedAt }` supports chronological feedback analysis.

### AttritionPredictions

Stores prediction history: employee, `riskScore` in the 0–1 probability range, risk level, model version, simplified future SHAP factors, and prediction time. `topFactors` is an array of small `{ feature, contribution }` values; it is not a historical child collection.

**Index:** `{ employee, predictedAt }` supports showing the latest prediction and historical risk trend.

## Validation rules

- User roles and employee status/risk level use fixed enums.
- Email is trimmed and lowercased; employee codes are trimmed and uppercased.
- Age is 16–100; salary and attendance totals cannot be negative.
- Attendance requires `presentDays + absentDays <= workingDays`.
- Performance and survey ratings are each 1–5.
- Feedback text cannot be empty; sentiment fields can be null.
- Attrition `riskScore` is 0–1.

Mongoose schema validation protects the database model. Zod request validation will be introduced only when API input endpoints are built.

## Why User and Employee are separate

User answers “who can sign in and what system role do they have?” Employee answers “what is this person's workforce profile?” Separating them prevents duplicating email, password hash, and role in workforce documents. It also leaves room for future HR/admin accounts that do not need an Employee profile.

## Why historical records are separate collections

Attendance, reviews, surveys, feedback, and predictions grow over time. Embedding them as arrays in Employee would make an employee document larger on every record, complicate pagination, and make time-based queries less focused. Separate collections keep Employee small and make indexes such as `{ employee, submittedAt }` effective.

## Support for later ML and AI work

The historical collections form a clean feature source for later attrition experiments: attendance trends, review ratings, survey scores, and sentiment results can be joined by employee and time period. AttritionPredictions preserves reproducible prediction history, including model version and later SHAP summaries. Future AI tools can retrieve authorized, scoped records through services; this schema itself does not implement AI access.
