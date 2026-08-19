// Todo Webapp — wireframes

screen TaskList "Signed-in user's main view: open tasks, filters, and quick actions"
  navbar "TodoHub"
  sidebar "Tasks -> TaskList | Completed -> CompletedTasks | Settings"
  row
    heading "My Tasks"
    right
    search "Search tasks…"
    select "Sort: Due date"
    button "New task" primary -> NewTask
  row
    badge "All (18)"
    badge "High priority (3)" danger
    badge "Due this week (5)" warning
  tabs "Open | Tag: Work | Tag: Home | Tag: Errands"
  table "Title | Tags | Due | Priority | Status" -> TaskDetail
    row "Finish quarterly report | Work | Fri | High | Open"
    row "Book dentist appointment | Home | Mon | Medium | Open"
    row "Buy groceries | Errands | — | Low | Open"
    row "Renew car insurance | Home | Aug 22 | High | Open"

screen NewTask "User captures a new task with optional tags, due date, and priority"
  navbar "TodoHub"
  sidebar "Tasks -> TaskList | Completed -> CompletedTasks | Settings"
  breadcrumb "Tasks / New task"
  heading "New Task"
  input "Title — e.g. Finish quarterly report"
  input "Tags — comma separated, e.g. Work, Urgent"
  row
    select "Due date: None"
    select "Priority: Medium"
  row
    right
    button "Cancel" -> TaskList
    button "Create task" primary -> TaskList

screen TaskDetail "User reviews and edits one task, or marks it complete"
  navbar "TodoHub"
  sidebar "Tasks -> TaskList | Completed -> CompletedTasks | Settings"
  breadcrumb "Tasks / Finish quarterly report"
  row
    heading "Finish quarterly report"
    badge "High" danger
    badge "Open" info
  text "Tags: Work · Due: Fri · Created 3 days ago"
  input "Title — Finish quarterly report"
  input "Tags — Work"
  row
    select "Due date: Fri"
    select "Priority: High"
  row
    right
    button "Delete"
    button "Save changes" primary -> TaskList
  row
    right
    button "Mark complete" primary -> TaskList

screen CompletedTasks "User reviews finished tasks, separate from open work, and can reopen one"
  navbar "TodoHub"
  sidebar "Tasks -> TaskList | Completed -> CompletedTasks | Settings"
  heading "Completed Tasks"
  text "Tasks you've finished — reopen one if it needs more work."
  table "Title | Tags | Completed | Priority"
    row "Pay electricity bill | Home | Yesterday | Medium"
    row "Submit expense report | Work | 3 days ago | Low"
  row
    right
    button "Reopen selected" -> TaskList
