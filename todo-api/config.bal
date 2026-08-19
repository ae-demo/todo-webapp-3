import ballerina/os;

// Every value below has a sensible local/dev default and is overridable by the
// TODO_DB_* env vars the platform injects per workload.yaml — the service
// starts with no required environment variables.
configurable string dbHostEnv = os:getEnv("TODO_DB_HOST");
configurable string dbPortEnv = os:getEnv("TODO_DB_PORT");
configurable string dbUserEnv = os:getEnv("TODO_DB_USER");
configurable string dbPasswordEnv = os:getEnv("TODO_DB_PASSWORD");
configurable string dbNameEnv = os:getEnv("TODO_DB_DBNAME");

final string dbHost = dbHostEnv != "" ? dbHostEnv : "localhost";
final int dbPort = dbPortEnv != "" ? parsePort(dbPortEnv) : 5432;
final string dbUser = dbUserEnv != "" ? dbUserEnv : "postgres";
final string dbPassword = dbPasswordEnv != "" ? dbPasswordEnv : "postgres";
final string dbName = dbNameEnv != "" ? dbNameEnv : "tododb";

function parsePort(string value) returns int {
    int|error parsed = int:fromString(value);
    if parsed is int {
        return parsed;
    }
    return 5432;
}
