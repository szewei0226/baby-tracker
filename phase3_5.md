1. Problem
Baby Tracker currently records feeding, sleep and other baby activities but does not provide a structured way to manage medication.
Medication introduces several practical problems:
remembering when the next medicine is due;
knowing whether a scheduled dose has already been given;
recording the actual administration time;
identifying the correct medicine visually;
knowing who administered it;
following a multi-day treatment course;
recording PRN medication that has no fixed schedule;
reviewing medication together with the baby’s other activities.
The application should solve these tracking problems without attempting to make medical decisions.

2.Goal
Add a Medication module that supports:
Medication courses.
Scheduled medication.
PRN medication.
Administration history.
Medication photo thumbnails.
Caregiver recording.
Due / overdue status.
In-app reminders.
Phone push notifications.
Integration with the existing Activity / Timeline.
Existing backup/export workflow.
The feature is a medication tracking system, not a dosing or medical-advice system.

3. Users
Primary users:
Dad
Mum
Helper
Other
For every medication actually given, the caregiver must be recorded.
The app remembers the last selected caregiver and uses that as the default for the next administration. The user can change it before saving.

4. Core User Workflow
4.1 Create medication
User opens:
Medication → + Add medication
Enter:
Medicine name — required
Photo thumbnail — optional
Dose — required
Unit — required
Medication type — required
Schedule — when applicable
Start date — required
End date — optional where appropriate
Notes — optional
Example:
Augmentin
2.5 mL
Scheduled
08:00 / 16:00 / 00:00
11 Sep → 15 Sep
optional photo
optional note

5. Medication Types
5.1 Scheduled
Supported schedule methods:
A. Specific times
Example:
08:00
16:00
00:00
B. Interval
Examples:
Every 6 hours
Every 8 hours
Every 12 hours
An interval schedule requires an anchor/start time.
C. Daily frequency
Examples:
2× daily
3× daily
For daily-frequency medication, the user must still specify the actual administration times.
The app must not guess what “twice daily” means.

5.2 PRN
PRN — pro re nata / 按需要使用
PRN medicine has no automatic next-dose schedule.
Example:
Paracetamol
2.5 mL
PRN
The user can manually select:
Give now
Given earlier
PRN medication does not generate scheduled overdue states unless a future enhancement explicitly adds this.

6. Medication Plan Data
A medication course should conceptually contain:
Field
Requirement
Medication ID
Required
Medicine name
Required
Thumbnail
Optional
Dose
Required
Unit
Required
Type
Scheduled / PRN
Schedule mode
Specific time / interval / daily frequency
Schedule definition
Required for Scheduled
Start date
Required
End date
Optional/required according to course
Notes
Optional
Status
Active / Completed
Created timestamp
Required
Updated timestamp
Required
Initial unit options:
mL
mg
tablet
drop
puff
Other
Other permits a custom unit.

7. Medication Administration Record
Every actual administration should create a separate record.
Conceptual fields:
Field
Requirement
Administration ID
Required
Medication ID
Required
Scheduled occurrence
Optional for PRN/manual records
Scheduled time
If applicable
Actual time
Required when given
Dose at time of administration
Required
Unit
Required
Given by
Required
Status
Given / Skipped
Notes
Optional
Created timestamp
Required
Updated timestamp
Required
The administration record stores the dose and unit actually recorded at that time.
Changing the Medication Plan later must not rewrite old administration records.

8. Giving Medication
For a scheduled dose, present:
Medicine name
Dose
Scheduled time
Available actions:
Give now
actual administration time = current time;
caregiver defaults to last-used caregiver;
user confirms/saves.
Given earlier
User manually enters the actual administration time.
Skip
Marks that scheduled occurrence as skipped.
Snooze
Not included.

9. Accidental Duplicate Prevention
The app does not perform medical duplicate-dose analysis.
However, it should prevent accidental UI duplication:
Once a scheduled occurrence is marked:
Given; or
Skipped
that occurrence no longer shows an active Give now button.
A double tap or repeated request must not create two administration records for the same action.
This is data-integrity protection, not medical advice.

10. Due / Overdue Logic
Before scheduled time:
Upcoming
At scheduled time:
Due
If not recorded after the scheduled time:
Overdue
Once recorded:
Given
or:
Skipped
No pharmacological interpretation is performed.

11. Notification Behaviour
At the scheduled medication time:
Send one notification.
Example:
Augmentin 2.5 mL is due now
The system must not repeatedly notify the user merely because the medication remains overdue.
There is no Snooze function.
Tapping the notification opens the relevant medication/dose screen rather than only opening the generic Medication page.
If a dose was already marked Given or Skipped before the reminder is sent, the reminder should not be sent.
Failure or denial of push-notification permission must not prevent medication tracking. In-app Due / Overdue states remain available.

12. Home Screen
Do not redesign the Phase 3 Home screen.
Add a small Medication card.
Example:
Next medication
Augmentin · 2.5 mL
Due 4:00 PM
Give now
Rules:
show the nearest scheduled medication;
an overdue medication takes priority over an upcoming medication;
do not normally display PRN medicines in this card;
if there is no scheduled medication, the card may show No medication due.

13. Medication Page
Primary layout:
Active
Example:
Augmentin
2.5 mL · 3× daily
Next: 4:00 PM
Paracetamol
2.5 mL · PRN
History
Today
Yesterday
Previous courses
Action
+ Add medication
Selecting an active medicine opens:
medication details;
schedule;
next dose;
administration history;
edit course;
complete course.

14. Existing Timeline Integration
Medication events should also appear in the existing Activity / Timeline.
Example:
4:03 PM — Medication
Augmentin · 2.5 mL
Given by Dad
Skipped occurrences should also be identifiable.
There must be only one underlying medication record.
Medication page and Timeline are two views of the same data, not separate copies.

15. Medication Photo
Medication photo is optional.
User can:
take a photo;
select a photo;
replace it;
remove it.
The application stores only a compressed thumbnail.
Full-resolution medication photos are outside Phase 3.5.
The thumbnail is intended for visual identification of the medicine rather than document/photo storage.
The thumbnail should remain associated with the Medication Plan and be visible beside the medication where useful.
Storage decision for Phase 3.5
Prefer the existing D1 architecture rather than introducing Cloudflare R2.
Store only a deliberately small compressed thumbnail.
No new object-storage service should be introduced unless implementation testing demonstrates that the existing approach is unsuitable.

16. Edit / Delete Administration Record
Existing administration records can be corrected.
Supported:
Edit
Delete
Delete requires explicit confirmation.
Example:
Delete this medication record?
Cancel
Delete
Editing an individual administration record changes only that record.

17. Editing a Medication Plan
Example:
Original:
3× daily
Doctor later changes it to:
2× daily
Rule:
Changes affect future scheduled occurrences only.
Historical administration records remain unchanged.
Plan editing must not retroactively modify:
historical dose;
historical unit;
actual administration time;
caregiver;
Given / Skipped history.
Explicit manual editing of an individual historical record remains possible under Section 16.

18. Completing a Medication Course
A medication course is not automatically marked completed at End Date.
After reaching the End Date, prompt:
This medication course has reached its end date. Mark it as completed?
Options:
Complete
Keep active / Edit course
Completed courses move from Active to History.
They remain available for review.
If the end date is extended, future scheduled occurrences are generated according to the revised plan.

19. Medical Safety Boundary
Phase 3.5 must not:
calculate recommended medication dosage;
determine dosage from body weight;
recommend medication;
identify drug interactions;
determine minimum safe intervals;
determine maximum daily dose;
claim that a dose is medically safe or unsafe;
provide clinical treatment advice.
The application records what the caregiver entered.
The app may indicate:
Due
Overdue
Given
Skipped
These are schedule states only.

20. Backup / Export
Medication information must be included in the existing JSON backup/export.
Export should preserve at minimum:
medication plans;
medication IDs;
schedule definitions;
status;
start/end dates;
dose/unit;
notes;
administration records;
caregiver;
actual timestamps;
scheduled timestamps;
Given/Skipped state;
thumbnail data or sufficient thumbnail representation.
Existing non-medication backup/export behavior must not regress.

21. Time Handling
Medication is time-critical.
Use the Baby Tracker’s existing time-handling convention consistently.
Requirements:
correct Singapore/local display time;
actual administration time preserved;
scheduled time preserved separately from actual time;
page refresh must not alter timestamps;
changing a Medication Plan must not alter historical timestamps.

22. Permissions
Use least-privilege permissions.
Camera / Photo Library
Ask only when the user chooses to add/change a medication photo.
Notification
Ask only after the user explicitly enables medication reminders or performs an equivalent user action.
Medication tracking must continue if notification permission is denied.

23. In Scope — Phase 3.5
Medication page
Medication Plan
Scheduled medication
PRN medication
Specific-time schedule
Every-X-hours schedule
Daily-frequency schedule
Dose/unit entry
Optional thumbnail
Optional notes
Caregiver selection
Remember previous caregiver
Give now
Given earlier
Skip
Due/Overdue state
One reminder per scheduled occurrence
Push notification
Notification deep-link to medicine/dose
Home Next Medication card
Medication History
Existing Timeline integration
Edit record
Delete record with confirmation
Edit Medication Plan prospectively
Complete-course confirmation
JSON backup/export integration

24. Explicitly Out of Scope
Snooze
AI medication advice
Weight-based dosing
Dose recommendations
Interaction checking
Drug database
Prescription OCR
Full-resolution photo storage
R2 unless technically necessary
Automatic course completion
Repeating overdue notifications
Medication inventory
Pharmacy ordering
Doctor/pharmacy integrations
Sharing medical records externally
Analytics such as medication effectiveness
AI health summaries
These can be considered in later phases.

25. Acceptance Criteria
AC-01 — Create Scheduled Medication
Given the user creates a medication with medicine name, dose, unit, schedule and start date,
when saved,
the medication appears under Active and the correct next scheduled dose is displayed.
AC-02 — Create PRN Medication
Given the user creates a PRN medication,
it appears under Active,
but the system does not generate automatic Due / Overdue occurrences.
AC-03 — Give Now
When the user taps Give now,
the app records:
medicine;
dose;
unit;
current time;
caregiver.
The scheduled occurrence becomes Given.
AC-04 — Given Earlier
The user can enter an earlier actual administration time.
Both scheduled time and actual time remain available.
AC-05 — Skip
The user can mark a scheduled occurrence Skipped.
The same occurrence no longer appears as active Due/Overdue.
AC-06 — Caregiver
A Given medication cannot be saved without a caregiver.
The previous caregiver is preselected for the next administration.
AC-07 — Overdue
A scheduled occurrence that passes its scheduled time without Given/Skipped status displays Overdue.
AC-08 — Single Notification
A scheduled occurrence generates at most one due notification.
Remaining overdue does not create repeated reminders.
AC-09 — Notification Deep Link
Tapping a medication notification opens the relevant medication/dose context.
AC-10 — Notification Failure
If push notification is unavailable, disabled or denied, the Medication page and Home card continue to show correct Due/Overdue information.
AC-11 — Thumbnail
The user can attach, replace and remove a medication thumbnail.
The application stores only a compressed thumbnail.
AC-12 — Timeline
A medication administration appears in both Medication History and the existing Timeline without creating duplicated underlying records.
AC-13 — Plan Modification
Changing a medication’s future schedule does not alter existing administration history.
AC-14 — Edit Historical Record
The user can correct an existing administration record.
Only the selected record changes.
AC-15 — Delete Historical Record
Deleting an administration record requires confirmation.
After confirmation it no longer appears as an active history entry.
AC-16 — Course Completion
Reaching the End Date prompts the user to confirm completion.
The application does not automatically complete the course.
AC-17 — Backup
Exported Baby Tracker JSON contains medication plan and medication-administration data.
Existing export functionality continues to work.
AC-18 — Data Persistence
Medication plans and administration records remain after:
reload;
browser restart;
later login/opening of the deployed app according to existing Baby Tracker persistence behavior.
AC-19 — Duplicate UI Protection
Repeated tapping of a single Give action must not accidentally create duplicate records.
AC-20 — No Medical Recommendation
No workflow displays an automatically calculated recommended dose, safe interval or medical treatment recommendation.

26. Validation Plan
Validation should cover:
Basic workflow
Create → schedule → give → history → edit → complete.
Scheduled medicine
Test:
specific times;
every X hours;
2× daily;
3× daily.
PRN
Verify no future scheduled events are automatically created.
Time
Test:
before due;
exactly due;
overdue;
Given earlier;
midnight-crossing schedules;
multi-day course.
Notifications
Test:
permission granted;
permission denied;
notification opened;
already Given before reminder;
already Skipped before reminder;
overdue without repeated notifications.
Photos
Test:
camera;
photo library;
replace;
remove;
page reload;
backup/export.
Data integrity
Test:
rapid double tap;
edit plan after existing doses;
delete administration;
completed course;
existing Timeline;
existing feeding/sleep data unaffected.
Regression
Existing Baby Tracker Phase 3 functions must continue working.

27. Implementation Milestones
Phase 3.5A — Medication Data + Core UI
Implement:
schema;
Medication page;
Medication Plan;
Scheduled/PRN;
Give now;
Given earlier;
Skip;
caregiver;
history;
Timeline integration.
Phase 3.5B — Schedule Engine
Implement:
next-dose calculation;
Due;
Overdue;
every-X-hours;
specific times;
daily frequency;
course end handling.
Phase 3.5C — Thumbnail
Implement:
photo capture/select;
client-side resize/compression;
thumbnail persistence;
display/edit/remove.
Phase 3.5D — Notification
Implement:
notification opt-in;
push subscription;
due notification;
one-notification rule;
deep linking.
Phase 3.5E — Reliability
Implement and verify:
edit/delete;
JSON export;
duplicate prevention;
persistence;
regression tests.
