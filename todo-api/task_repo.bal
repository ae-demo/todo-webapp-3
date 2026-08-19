import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function nowText() returns string {
    return time:utcToString(time:utcNow());
}

function findTaskRow(string taskId, string userId) returns TaskRow|error? {
    TaskRow|sql:Error result = dbClient->queryRow(`
        SELECT id, title, status, priority, due_date AS "dueDate",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM task
        WHERE id = ${taskId} AND user_id = ${userId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function insertTask(string userId, string title, string priority, string? dueDate) returns TaskRow|error {
    string id = uuid:createRandomUuid();
    string timestamp = nowText();
    _ = check dbClient->execute(`
        INSERT INTO task (id, user_id, title, status, priority, due_date, created_at, updated_at)
        VALUES (${id}, ${userId}, ${title}, 'open', ${priority}, ${dueDate}, ${timestamp}, ${timestamp})
    `);
    TaskRow row = {
        id: id,
        title: title,
        status: "open",
        priority: priority,
        dueDate: dueDate,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    return row;
}

function updateTaskRow(string taskId, string userId, string? title, string? priority, string? dueDate,
        boolean dueDateProvided) returns error? {
    string timestamp = nowText();
    sql:ParameterizedQuery setClause = `SET updated_at = ${timestamp}`;
    if title is string {
        setClause = sql:queryConcat(setClause, `, title = ${title}`);
    }
    if priority is string {
        setClause = sql:queryConcat(setClause, `, priority = ${priority}`);
    }
    if dueDateProvided {
        setClause = sql:queryConcat(setClause, `, due_date = ${dueDate}`);
    }
    sql:ParameterizedQuery updateQuery = sql:queryConcat(
        `UPDATE task `, setClause, ` WHERE id = ${taskId} AND user_id = ${userId}`
    );
    _ = check dbClient->execute(updateQuery);
}

function setTaskStatus(string taskId, string userId, string status) returns error? {
    string timestamp = nowText();
    _ = check dbClient->execute(`
        UPDATE task SET status = ${status}, updated_at = ${timestamp}
        WHERE id = ${taskId} AND user_id = ${userId}
    `);
}

function deleteTaskRow(string taskId, string userId) returns int|error {
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM task WHERE id = ${taskId} AND user_id = ${userId}
    `);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}

function buildOrderClause(string? sort) returns sql:ParameterizedQuery {
    if sort == "dueDate" {
        return ` ORDER BY (due_date IS NULL) ASC, due_date ASC`;
    }
    if sort == "priority" {
        return ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC`;
    }
    return ` ORDER BY created_at DESC`;
}

// Lists a page of the caller's tasks with the requested filters and sort,
// returning the page rows alongside the total matching count for pagination.
function listTaskRows(string userId, string? status, string? tag, string? priority, string? sort,
        int pageLimit, int pageOffset) returns [TaskRow[], int]|error {
    sql:ParameterizedQuery whereClause = ` WHERE user_id = ${userId}`;
    if status is string {
        whereClause = sql:queryConcat(whereClause, ` AND status = ${status}`);
    }
    if priority is string {
        whereClause = sql:queryConcat(whereClause, ` AND priority = ${priority}`);
    }
    if tag is string {
        whereClause = sql:queryConcat(whereClause, ` AND EXISTS (
            SELECT 1 FROM task_tag tt JOIN tag tg ON tg.id = tt.tag_id
            WHERE tt.task_id = task.id AND tg.user_id = ${userId} AND tg.name = ${tag}
        )`);
    }

    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS total FROM task`, whereClause);
    record {| int total; |} countRow = check dbClient->queryRow(countQuery);

    sql:ParameterizedQuery orderClause = buildOrderClause(sort);
    sql:ParameterizedQuery selectQuery = sql:queryConcat(
        `SELECT id, title, status, priority, due_date AS "dueDate",
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM task`,
        whereClause,
        orderClause,
        ` LIMIT ${pageLimit} OFFSET ${pageOffset}`
    );
    stream<TaskRow, sql:Error?> rowStream = dbClient->query(selectQuery);
    TaskRow[] rows = [];
    check from TaskRow row in rowStream
        do {
            rows.push(row);
        };
    return [rows, countRow.total];
}
