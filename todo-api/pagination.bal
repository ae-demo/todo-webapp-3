import ballerina/url;

// Builds the relative URI for a page, preserving the caller's active filters.
function buildPageUri(string basePath, int pageOffset, int pageLimit, map<string> filters) returns string|error {
    string query = string `limit=${pageLimit}&offset=${pageOffset}`;
    foreach [string, string] [filterKey, filterValue] in filters.entries() {
        string encoded = check url:encode(filterValue, "UTF-8");
        query = query + "&" + filterKey + "=" + encoded;
    }
    return basePath + "?" + query;
}

function buildNextUri(string basePath, int pageOffset, int pageLimit, int total, map<string> filters)
        returns string? {
    int nextOffset = pageOffset + pageLimit;
    if nextOffset >= total {
        return ();
    }
    string|error uri = buildPageUri(basePath, nextOffset, pageLimit, filters);
    return uri is string ? uri : ();
}

function buildPreviousUri(string basePath, int pageOffset, int pageLimit, map<string> filters) returns string? {
    if pageOffset <= 0 {
        return ();
    }
    int previousOffset = pageOffset - pageLimit;
    if previousOffset < 0 {
        previousOffset = 0;
    }
    string|error uri = buildPageUri(basePath, previousOffset, pageLimit, filters);
    return uri is string ? uri : ();
}
