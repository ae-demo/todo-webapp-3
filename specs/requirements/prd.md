# Todo Webapp — PRD

## Problem Statement

People juggling daily tasks across work and life lose track of what needs to get done, when it's due, and what matters most. Sticky notes and memory don't scale, and generic note apps don't give a clear, actionable view of open work — so things slip through the cracks.

## Solution

A personal todo web application where a signed-in user can capture tasks, tag them for context, set an optional due date and priority, and track them to completion. It gives each user a single, fast, always-accessible list of what they need to do.

## Actors

- **User** — a signed-in individual who creates, organizes, and manages their own tasks. Each user only ever sees their own tasks.

## User Stories

1. As a User, I want to sign in securely, so that my tasks are private to me.
2. As a User, I want to create a task with a title, so that I can quickly capture something I need to do.
3. As a User, I want to edit a task's title, tags, due date, or priority, so that I can keep it accurate as things change.
4. As a User, I want to mark a task as complete, so that I can track my progress.
5. As a User, I want to reopen a completed task, so that I can correct a mistake or resume work.
6. As a User, I want to delete a task, so that I can remove things I no longer need to track.
7. As a User, I want to add tags to a task, so that I can group related tasks by context.
8. As a User, I want to filter my tasks by tag, so that I can focus on one context at a time.
9. As a User, I want to set an optional due date on a task, so that I know when it needs to be done.

## Product Decisions

- Sign-in is via SSO through Thunder, the platform IDP *(org default)*.
- Tasks are organized as a single flat list per user with optional free-form tags — no separate named lists/projects.
- Due dates are supported; there are no reminder notifications in this phase.
- Priority is a simple three-level field: Low, Medium, High.
- Tasks are personal only — no sharing or collaboration between users in this phase.
- Tasks are one-off — no recurring/repeating task support in this phase.

## Phasing

- **Phase 1 — A personal, signed-in todo list with tags, due dates, and priority**: Deliver secure sign-in and full task lifecycle management (create, edit, complete, reopen, delete) with tagging, due dates, and priority, plus filtering/sorting by tag, due date, and priority, and a clear open-vs-completed view. Stories: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13.

## Out of Scope

- Sharing or collaborating on tasks/lists with other users.
- Recurring or repeating tasks.
- Reminder notifications (email, push, or in-app) for due dates.
- Named lists/projects as a separate organizational structure from tags.
- Sub-tasks or task dependencies.
- Mobile native apps (this is a web application only).

## Open Questions

None — all decisions needed to proceed to design were resolved during the interview.