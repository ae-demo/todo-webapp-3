import ballerina/time;

final string[] validPriorities = ["low", "medium", "high"];
final string[] validStatuses = ["open", "completed"];

// Resolves the caller's identity from the gateway-injected header. Missing or
// blank X-User-Id means the request did not come through the gateway → 401.
function requireUserId(string? headerValue) returns string|ErrorUnauthorized {
    if headerValue is string {
        string trimmed = headerValue.trim();
        if trimmed != "" {
            return trimmed;
        }
    }
    return <ErrorUnauthorized>{
        body: {code: 401, message: "unauthorized", description: "missing or invalid X-User-Id"}
    };
}

function isValidPriority(string inputValue) returns boolean {
    return validPriorities.indexOf(inputValue) is int;
}

function isValidStatus(string inputValue) returns boolean {
    return validStatuses.indexOf(inputValue) is int;
}

// A due date is stored as plain ISO-8601 "YYYY-MM-DD" text; validate it both
// matches that shape and denotes a real calendar date.
function isValidDueDate(string inputValue) returns boolean {
    if !re`^\d{4}-\d{2}-\d{2}$`.isFullMatch(inputValue) {
        return false;
    }
    time:Utc|time:Error parsed = time:utcFromString(inputValue + "T00:00:00.000Z");
    return parsed is time:Utc;
}

function badRequest(string message, string description) returns ErrorBadRequest {
    return <ErrorBadRequest>{body: {code: 400, message: message, description: description}};
}

function notFound(string message) returns ErrorNotFound {
    return <ErrorNotFound>{body: {code: 404, message: message, description: "task not found"}};
}

function internalError(string description) returns ErrorInternalServerError {
    return <ErrorInternalServerError>{
        body: {code: 500, message: "internal error", description: description}
    };
}
