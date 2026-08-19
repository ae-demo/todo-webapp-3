// Request payload shapes are deliberately permissive (plain `string` rather
// than an enum literal union) so a bad enum/date value reaches our own
// validation and gets the shared Error schema — not the framework's default
// bad-request body — while a missing required field is still checked by hand.
public type TaskCreateRequest record {|
    string title?;
    string priority?;
    string? dueDate?;
    string[] tags?;
|};

public type TaskUpdateRequest record {|
    string title?;
    string priority?;
    string? dueDate?;
    string[] tags?;
|};

// Internal row shape mirroring the `task` table; column aliases in the SQL
// queries match these field names exactly so the driver can bind directly.
public type TaskRow record {|
    string id;
    string title;
    string status;
    string priority;
    string? dueDate;
    string createdAt;
    string updatedAt;
|};

function toTask(TaskRow row, string[] tags) returns Task => {
    id: row.id,
    title: row.title,
    status: toTaskStatus(row.status),
    priority: toTaskPriority(row.priority),
    dueDate: row.dueDate,
    tags: tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
};

// Both are only ever written by this service (insertTask/updateTaskRow/
// setTaskStatus all restrict to these literals), so a lookup rather than a
// checked cast keeps this total without risking a runtime panic.
function toTaskStatus(string status) returns "open"|"completed" {
    if status == "completed" {
        return "completed";
    }
    return "open";
}

function toTaskPriority(string priority) returns "low"|"medium"|"high" {
    if priority == "high" {
        return "high";
    }
    if priority == "low" {
        return "low";
    }
    return "medium";
}
