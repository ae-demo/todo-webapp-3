import ballerina/http;

listener http:Listener ep0 = new (9090);

service / on ep0 {

    # List the caller's tasks, filterable and sortable
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + status - filter by completion state
    # + tag - filter by tag name
    # + priority - filter by priority
    # + sort - sort field
    # + return - matching tasks, or an error
    resource function get tasks(@http:Header string? X\-User\-Id, "open"|"completed"? status, string? tag,
            "low"|"medium"|"high"? priority, "dueDate"|"priority"|"createdAt"? sort, int 'limit = 20,
            int offset = 0) returns TaskListResponse|ErrorUnauthorized|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        int safeLimit = 'limit;
        if safeLimit < 1 {
            safeLimit = 20;
        } else if safeLimit > 100 {
            safeLimit = 100;
        }
        int safeOffset = offset < 0 ? 0 : offset;

        [TaskRow[], int]|error pageResult = listTaskRows(identity, status, tag, priority, sort, safeLimit,
                safeOffset);
        if pageResult is error {
            return internalError("failed to list tasks");
        }
        TaskRow[] rows = pageResult[0];
        int total = pageResult[1];

        Task[] tasks = [];
        foreach TaskRow row in rows {
            string[]|error tagNames = getTaskTagNames(row.id);
            if tagNames is error {
                return internalError("failed to load task tags");
            }
            tasks.push(toTask(row, tagNames));
        }

        map<string> filters = {};
        if status is string {
            filters["status"] = status;
        }
        if tag is string {
            filters["tag"] = tag;
        }
        if priority is string {
            filters["priority"] = priority;
        }
        if sort is string {
            filters["sort"] = sort;
        }

        TaskListResponse response = {
            count: total,
            next: buildNextUri("/tasks", safeOffset, safeLimit, total, filters),
            previous: buildPreviousUri("/tasks", safeOffset, safeLimit, filters),
            data: tasks
        };
        return response;
    }

    # Create a task
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - the created task, or an error
    resource function post tasks(@http:Header string? X\-User\-Id, @http:Payload TaskCreateRequest payload)
            returns TaskCreated|ErrorBadRequest|ErrorUnauthorized|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        string? title = payload?.title;
        if title is () || title.trim() == "" {
            return badRequest("invalid task payload", "title is required");
        }

        string? priority = payload?.priority;
        if priority is () || !isValidPriority(priority) {
            return badRequest("invalid task payload", "priority must be one of low, medium, high");
        }

        string? dueDate = payload?.dueDate;
        if dueDate is string && !isValidDueDate(dueDate) {
            return badRequest("invalid task payload", "dueDate must be a valid ISO-8601 date (YYYY-MM-DD)");
        }

        TaskRow|error created = insertTask(identity, title.trim(), priority, dueDate);
        if created is error {
            return internalError("failed to create task");
        }

        string[] tagNames = payload?.tags ?: [];
        if tagNames.length() > 0 {
            error? tagResult = replaceTaskTags(created.id, identity, tagNames);
            if tagResult is error {
                return internalError("failed to save task tags");
            }
        }

        string[]|error savedTags = getTaskTagNames(created.id);
        string[] finalTags = savedTags is string[] ? savedTags : [];

        return <TaskCreated>{body: toTask(created, finalTags)};
    }

    # Get one task
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - the task, or an error
    resource function get tasks/[string taskId](@http:Header string? X\-User\-Id)
            returns Task|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        TaskRow|error? existing = findTaskRow(taskId, identity);
        if existing is error {
            return internalError("failed to load task");
        }
        if existing is () {
            return notFound("task not found");
        }

        string[]|error tagNames = getTaskTagNames(existing.id);
        if tagNames is error {
            return internalError("failed to load task tags");
        }
        return toTask(existing, tagNames);
    }

    # Edit a task's title, tags, due date, or priority
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - the updated task, or an error
    resource function patch tasks/[string taskId](@http:Header string? X\-User\-Id,
            @http:Payload TaskUpdateRequest payload)
            returns Task|ErrorBadRequest|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        TaskRow|error? existing = findTaskRow(taskId, identity);
        if existing is error {
            return internalError("failed to load task");
        }
        if existing is () {
            return notFound("task not found");
        }

        string? title = payload?.title;
        if title is string && title.trim() == "" {
            return badRequest("invalid update payload", "title cannot be empty");
        }

        string? priority = payload?.priority;
        if priority is string && !isValidPriority(priority) {
            return badRequest("invalid update payload", "priority must be one of low, medium, high");
        }

        boolean dueDateProvided = payload.hasKey("dueDate");
        string? dueDate = payload?.dueDate;
        if dueDateProvided && dueDate is string && !isValidDueDate(dueDate) {
            return badRequest("invalid update payload", "dueDate must be a valid ISO-8601 date (YYYY-MM-DD)");
        }

        string? updateTitle = title is string ? title.trim() : ();
        error? updateResult = updateTaskRow(taskId, identity, updateTitle, priority, dueDate, dueDateProvided);
        if updateResult is error {
            return internalError("failed to update task");
        }

        if payload.hasKey("tags") {
            string[] tagNames = payload?.tags ?: [];
            error? tagResult = replaceTaskTags(taskId, identity, tagNames);
            if tagResult is error {
                return internalError("failed to save task tags");
            }
        }

        TaskRow|error? updatedRow = findTaskRow(taskId, identity);
        if updatedRow is error {
            return internalError("failed to load task");
        }
        if updatedRow is () {
            return notFound("task not found");
        }
        string[]|error tagNames = getTaskTagNames(taskId);
        if tagNames is error {
            return internalError("failed to load task tags");
        }
        return toTask(updatedRow, tagNames);
    }

    # Delete a task
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - no content, or an error
    resource function delete tasks/[string taskId](@http:Header string? X\-User\-Id)
            returns http:NoContent|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        TaskRow|error? existing = findTaskRow(taskId, identity);
        if existing is error {
            return internalError("failed to load task");
        }
        if existing is () {
            return notFound("task not found");
        }

        int|error deleted = deleteTaskRow(taskId, identity);
        if deleted is error {
            return internalError("failed to delete task");
        }
        return http:NO_CONTENT;
    }

    # Mark a task complete
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - the completed task, or an error
    resource function post tasks/[string taskId]/complete(@http:Header string? X\-User\-Id)
            returns TaskOk|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
        return completeOrReopen(X\-User\-Id, taskId, "completed");
    }

    # Reopen a completed task
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - the reopened task, or an error
    resource function post tasks/[string taskId]/reopen(@http:Header string? X\-User\-Id)
            returns TaskOk|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
        return completeOrReopen(X\-User\-Id, taskId, "open");
    }

    # List tags the caller has used, for filter suggestions
    #
    # + X\-User\-Id - caller identity injected by the gateway from the validated token
    # + return - tags in use, or an error
    resource function get tags(@http:Header string? X\-User\-Id)
            returns TagListResponse|ErrorUnauthorized|ErrorInternalServerError {
        string|ErrorUnauthorized identity = requireUserId(X\-User\-Id);
        if identity is ErrorUnauthorized {
            return identity;
        }

        string[]|error names = listTagNames(identity);
        if names is error {
            return internalError("failed to list tags");
        }
        Tag[] tags = [];
        foreach string name in names {
            tags.push({name: name});
        }
        TagListResponse response = {
            count: tags.length(),
            next: (),
            previous: (),
            data: tags
        };
        return response;
    }
}

function completeOrReopen(string? headerValue, string taskId, string status)
        returns TaskOk|ErrorUnauthorized|ErrorNotFound|ErrorInternalServerError {
    string|ErrorUnauthorized identity = requireUserId(headerValue);
    if identity is ErrorUnauthorized {
        return identity;
    }

    TaskRow|error? existing = findTaskRow(taskId, identity);
    if existing is error {
        return internalError("failed to load task");
    }
    if existing is () {
        return notFound("task not found");
    }

    error? statusResult = setTaskStatus(taskId, identity, status);
    if statusResult is error {
        return internalError("failed to update task status");
    }

    TaskRow|error? updatedRow = findTaskRow(taskId, identity);
    if updatedRow is error {
        return internalError("failed to load task");
    }
    if updatedRow is () {
        return notFound("task not found");
    }
    string[]|error tagNames = getTaskTagNames(taskId);
    if tagNames is error {
        return internalError("failed to load task tags");
    }
    return <TaskOk>{body: toTask(updatedRow, tagNames)};
}
