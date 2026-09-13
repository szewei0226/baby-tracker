# Phase 3.5 — Medication Recording and History Management

## 1. Problem

Baby Tracker currently records feeding, sleep and other baby activities but does not provide a structured way to record medication. Medication tracking must make it easy to record what was given, who gave it, when it was given, and to review it with the baby's other activities. The application records caregiver-entered information; it does not make medical decisions.

## 2. Goal

Add a Medication module that supports:

- Medication plans and courses.
- Scheduled/PRN classification where useful as medication metadata.
- Administration recording: Give now, Given earlier, and Skip.
- Administration history.
- Medication photo thumbnails.
- Caregiver recording.
- Activity / Timeline integration.
- Editing and deleting administration records.
- Existing persistence and backup/export workflows.

The feature is a medication tracking system, not a dosing or medical-advice system.

## 3. Users

Primary users:

- Dad
- Mum
- Helper
- Other

For every medication actually given, the caregiver must be recorded. The app remembers the last selected caregiver and uses that as the default for the next administration. The user can change it before saving.

## 4. Core User Workflow

### 4.1 Create medication

User opens:

`Medication -> + Add medication`

Enter:

- Medicine name — required
- Photo thumbnail — optional
- Dose — required
- Unit — required
- Medication type — required where useful (Scheduled or PRN metadata)
- Start date — required
- End date — optional where appropriate
- Notes — optional

Example:

```text
Augmentin
2.5 mL
Scheduled
11 Sep -> 15 Sep
optional photo
optional note
```

### 4.2 Record medication

Available actions:

- **Give now** — records the actual administration time as the current time; caregiver defaults to the last-used caregiver; user confirms/saves.
- **Given earlier** — user enters the actual administration time.
- **Skip** — records that the planned/manual medication action was skipped.

There is no automatic scheduled occurrence generation in this phase.

## 5. Medication Types

### 5.1 Scheduled classification

Scheduled is available as medication metadata when it is useful to the caregiver. It does not create a Schedule Engine, next-dose calculation, due/overdue state, or automatic occurrence.

### 5.2 PRN

PRN — pro re nata / 按需要使用.

PRN medicine has no automatic schedule. The user can manually select Give now, Given earlier, or Skip as appropriate.

## 6. Medication Plan Data

A medication course should conceptually contain:

| Field | Requirement |
| --- | --- |
| Medication ID | Required |
| Medicine name | Required |
| Thumbnail | Optional |
| Dose | Required |
| Unit | Required |
| Type | Scheduled / PRN metadata where useful |
| Start date | Required |
| End date | Optional/required according to course |
| Notes | Optional |
| Status | Active / Completed |
| Created timestamp | Required |
| Updated timestamp | Required |

Initial unit options:

- mL
- mg
- tablet
- drop
- puff
- Other

Other permits a custom unit.

## 7. Medication Administration Record

Every actual administration should create a separate record.

| Field | Requirement |
| --- | --- |
| Administration ID | Required |
| Medication ID | Required |
| Actual time | Required when given |
| Dose at time of administration | Required |
| Unit | Required |
| Given by | Required |
| Status | Given / Skipped |
| Notes | Optional |
| Created timestamp | Required |
| Updated timestamp | Required |

The administration record stores the dose and unit actually recorded at that time. Changing the Medication Plan later must not rewrite old administration records.

## 8. Medication History

Medication History must be a clear record of actual medication activity. Every Medication History entry must clearly display:

- medication name;
- dose and unit for Given records;
- Given or Skipped status;
- caregiver;
- actual administration time.

Preferred mobile presentation:

```text
Paracetamol
1.5 mL · Given by Mum
2:20 PM
```

History must support review of current and previous medication courses. Given and Skipped records must remain distinguishable.

## 9. Accidental Duplicate Prevention

The app does not perform medical duplicate-dose analysis. It should prevent accidental UI duplication: a double tap or repeated request must not create two administration records for the same action. This is data-integrity protection, not medical advice.

## 10. Existing Timeline Integration

Medication events should also appear in the existing Activity / Timeline.

Example:

```text
4:03 PM — Medication
Augmentin · 2.5 mL
Given by Dad
```

Skipped records should also be identifiable. There must be only one underlying medication record. Medication History and Timeline are two views of the same data, not separate copies.

## 11. Medication Photo

Medication photo is optional. User can:

- take a photo;
- select a photo;
- replace it;
- remove it.

The application stores only a compressed thumbnail. Full-resolution medication photos are outside Phase 3.5. The thumbnail is intended for visual identification of the medicine rather than document/photo storage.

### Storage decision for Phase 3.5

Prefer the existing D1 architecture rather than introducing Cloudflare R2. Store only a deliberately small compressed thumbnail. No new object-storage service should be introduced unless implementation testing demonstrates that the existing approach is unsuitable.

## 12. Edit / Delete Administration Record

Existing administration records can be corrected.

Supported:

- Edit
- Delete

Delete requires explicit confirmation.

Example:

```text
Delete this medication record?
Cancel
Delete
```

Editing an individual administration record changes only that record.

## 13. Editing a Medication Plan

Changes to a Medication Plan affect future use of the plan only. Historical administration records remain unchanged. Plan editing must not retroactively modify:

- historical dose;
- historical unit;
- actual administration time;
- caregiver;
- Given / Skipped history.

Explicit manual editing of an individual historical record remains possible under Section 12.

## 14. Completing a Medication Course

A medication course is not automatically marked completed at End Date. After reaching the End Date, prompt:

```text
This medication course has reached its end date. Mark it as completed?
Complete
Keep active / Edit course
```

Completed courses move from Active to History and remain available for review.

## 15. Medical Safety Boundary

Phase 3.5 must not:

- calculate recommended medication dosage;
- determine dosage from body weight;
- recommend medication;
- identify drug interactions;
- determine minimum safe intervals;
- determine maximum daily dose;
- claim that a dose is medically safe or unsafe;
- provide clinical treatment advice.

The application records what the caregiver entered. Scheduled/PRN is metadata only in this phase; no schedule-derived medication state is provided.

## 16. Backup / Export

Medication information must be included in the existing JSON backup/export. Export should preserve at minimum:

- medication plans;
- medication IDs;
- type classification;
- status;
- start/end dates;
- dose/unit;
- notes;
- administration records;
- caregiver;
- actual timestamps;
- Given/Skipped state;
- thumbnail data or sufficient thumbnail representation.

Existing non-medication backup/export behavior must not regress.

## 17. Time Handling

Medication is time-critical. Use the Baby Tracker's existing time-handling convention consistently:

- correct Singapore/local display time;
- actual administration time preserved;
- page refresh must not alter timestamps;
- changing a Medication Plan must not alter historical timestamps.

## 18. Permissions

Use least-privilege permissions.

### Camera / Photo Library

Ask only when the user chooses to add/change a medication photo.

### Notification

Scheduled push notifications are deferred with the Schedule Engine and are not required for Phase 3.5. Medication recording and history must work without notification permission.

## 19. In Scope — Phase 3.5

- Medication page
- Medication Plan
- Scheduled/PRN classification where useful as metadata
- Dose/unit entry
- Optional thumbnail
- Optional notes
- Caregiver selection
- Remember previous caregiver
- Give now
- Given earlier
- Skip
- Medication History with the required fields and mobile presentation
- Existing Timeline integration
- Edit record
- Delete record with confirmation
- Edit Medication Plan prospectively
- Complete-course confirmation
- JSON backup/export integration
- Data persistence
- Duplicate prevention

## 20. Explicitly Out of Scope

- Schedule Engine
- next-dose calculation
- Upcoming / Due / Overdue states
- specific-time occurrence generation
- every-X-hours scheduling
- daily-frequency scheduling
- midnight/cross-day scheduling
- automatic scheduled occurrence generation
- scheduled push notifications and notification deep-link behavior
- Home Next Medication card
- Snooze
- AI medication advice
- Weight-based dosing
- Dose recommendations
- Interaction checking
- Drug database
- Prescription OCR
- Full-resolution photo storage
- R2 unless technically necessary
- Automatic course completion
- Repeating overdue notifications
- Medication inventory
- Pharmacy ordering
- Doctor/pharmacy integrations
- Sharing medical records externally
- Analytics such as medication effectiveness
- AI health summaries

These can be considered in later phases.

## 21. Acceptance Criteria

### AC-01 — Create Medication Plan

Given the user creates a medication with medicine name, dose, unit and start date, when saved, the medication appears under Active with its Scheduled/PRN classification where provided.

### AC-02 — Give Now

When the user taps Give now, the app records medicine, dose, unit, current time, caregiver, and Given status.

### AC-03 — Given Earlier

The user can enter an earlier actual administration time, and that time remains available in Medication History.

### AC-04 — Skip

The user can record a medication action as Skipped, and the record is identifiable as Skipped in Medication History and Timeline.

### AC-05 — Caregiver

A Given medication cannot be saved without a caregiver. The previous caregiver is preselected for the next administration.

### AC-06 — Medication History Display

Every Medication History entry clearly displays medication name, dose and unit for Given records, Given/Skipped status, caregiver, and actual administration time.

### AC-07 — Timeline

A medication administration appears in both Medication History and the existing Timeline without creating duplicated underlying records.

### AC-08 — Thumbnail

The user can attach, replace and remove a medication thumbnail. The application stores only a compressed thumbnail.

### AC-09 — Plan Modification

Changing a Medication Plan does not alter existing administration history.

### AC-10 — Edit Historical Record

The user can correct an existing administration record. Only the selected record changes.

### AC-11 — Delete Historical Record

Deleting an administration record requires confirmation. After confirmation it no longer appears as an active history entry.

### AC-12 — Course Completion

Reaching the End Date prompts the user to confirm completion. The application does not automatically complete the course.

### AC-13 — Backup

Exported Baby Tracker JSON contains medication plan and medication-administration data. Existing export functionality continues to work.

### AC-14 — Data Persistence

Medication plans and administration records remain after reload, browser restart, and later login/opening of the deployed app according to existing Baby Tracker persistence behavior.

### AC-15 — Duplicate UI Protection

Repeated tapping of a single Give action must not accidentally create duplicate records.

### AC-16 — No Schedule Engine

Creating or editing a medication does not calculate a next dose, create automatic scheduled occurrences, or display Upcoming/Due/Overdue states.

### AC-17 — No Medical Recommendation

No workflow displays an automatically calculated recommended dose, safe interval, or medical treatment recommendation.

## 22. Validation Plan

Validation should cover:

### Basic workflow

Create medication plan -> give now or given earlier -> history -> edit -> complete.

### PRN and classification

Verify Scheduled/PRN classification is retained as metadata and no future scheduled events are automatically created.

### History

Verify every Given and Skipped entry displays the medication name, required dose/unit, status, caregiver, and actual administration time. Verify the preferred mobile presentation remains legible.

### Time

Test Give now, Given earlier, local display time, page refresh, and historical timestamp preservation.

### Photos

Test camera, photo library, replace, remove, page reload, and backup/export.

### Data integrity

Test rapid double tap, edit plan after existing doses, delete administration, completed course, existing Timeline, and existing feeding/sleep data unaffected.

### Regression

Existing Baby Tracker Phase 3 functions must continue working.

## 23. Milestones

### Phase 3.5A — Core Medication

Implement Medication Plan, medication page, Scheduled/PRN metadata, Give now, Given earlier, Skip, caregiver, Medication History, Timeline integration, persistence, editing/deletion, duplicate prevention, course completion confirmation, and backup/export.

### Phase 3.5A.1 — Medication History Display Correction

Ensure every Medication History entry displays medication name, dose and unit for Given records, Given/Skipped status, caregiver, and actual administration time. Use the preferred mobile presentation.

### Phase 3.5B — Removed from scope

The Schedule Engine and all next-dose, occurrence-generation, scheduling-state, and cross-day scheduling behavior are removed from the approved Phase 3.5 scope.

### Phase 3.5C — Medication Thumbnail

Implement photo capture/select, client-side resize/compression, thumbnail persistence, and display/edit/remove.

### Phase 3.5D — Scheduled Notification deferred

Scheduled push notifications are deferred because they depend on the removed Schedule Engine.

### Phase 3.5E — Reliability

Implement and verify edit/delete, JSON export, duplicate prevention, persistence, and regression tests.

## Revision History

### Revision 2

Date: 2026-09-13

- Schedule Engine removed.
- Scheduled notifications deferred.
- Next Medication Home card removed.
- Medication History medication-name requirement added.