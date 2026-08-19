import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client dbClient = check new (
    host = dbHost,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    port = dbPort
);

function init() returns error? {
    check initSchema();
}

function initSchema() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS task (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            priority TEXT NOT NULL,
            due_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`CREATE INDEX IF NOT EXISTS idx_task_user_id ON task (user_id)`);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS tag (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            CONSTRAINT tag_user_name_unique UNIQUE (user_id, name)
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS task_tag (
            task_id TEXT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
            PRIMARY KEY (task_id, tag_id)
        )
    `);
}
