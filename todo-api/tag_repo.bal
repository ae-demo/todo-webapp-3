import ballerina/sql;
import ballerina/uuid;

// Returns the tag names currently attached to at least one of the caller's
// tasks — "in use", per the /tags contract — not every tag row ever created.
function listTagNames(string userId) returns string[]|error {
    stream<record {| string name; |}, sql:Error?> resultStream = dbClient->query(`
        SELECT DISTINCT tg.name AS name
        FROM tag tg
        JOIN task_tag tt ON tt.tag_id = tg.id
        JOIN task ta ON ta.id = tt.task_id
        WHERE tg.user_id = ${userId}
        ORDER BY tg.name
    `);
    string[] names = [];
    check from record {| string name; |} row in resultStream
        do {
            names.push(row.name);
        };
    return names;
}

function getTaskTagNames(string taskId) returns string[]|error {
    stream<record {| string name; |}, sql:Error?> resultStream = dbClient->query(`
        SELECT tg.name AS name
        FROM tag tg
        JOIN task_tag tt ON tt.tag_id = tg.id
        WHERE tt.task_id = ${taskId}
        ORDER BY tg.name
    `);
    string[] names = [];
    check from record {| string name; |} row in resultStream
        do {
            names.push(row.name);
        };
    return names;
}

// Inserts the tag if it is new for this user, otherwise returns the existing
// row's id — an upsert expressed as an ON CONFLICT ... DO UPDATE so RETURNING
// always yields a row.
function upsertTag(string userId, string name) returns string|error {
    string tagId = uuid:createRandomUuid();
    record {| string id; |} row = check dbClient->queryRow(`
        INSERT INTO tag (id, user_id, name) VALUES (${tagId}, ${userId}, ${name})
        ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    `);
    return row.id;
}

// Replaces every tag link on a task with the given (deduplicated) tag names.
function replaceTaskTags(string taskId, string userId, string[] tagNames) returns error? {
    _ = check dbClient->execute(`DELETE FROM task_tag WHERE task_id = ${taskId}`);

    string[] uniqueNames = [];
    foreach string name in tagNames {
        string trimmed = name.trim();
        if trimmed == "" || uniqueNames.indexOf(trimmed) is int {
            continue;
        }
        uniqueNames.push(trimmed);
    }

    foreach string name in uniqueNames {
        string tagId = check upsertTag(userId, name);
        _ = check dbClient->execute(`
            INSERT INTO task_tag (task_id, tag_id) VALUES (${taskId}, ${tagId})
            ON CONFLICT DO NOTHING
        `);
    }
}
