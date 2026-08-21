# Todo Webapp — Design

## Overview

A single-page React application (`todo-webapp`) lets a signed-in user manage a personal, flat list of tasks — each with optional tags, an optional due date, and a priority — backed by a Ballerina service (`todo-api`) that owns the task data in a project-scoped Postgres database. Sign-in for the SPA and identity for the API both flow through Thunder, the platform IDP; the API gateway fronts `todo-api` and injects the caller's identity on every call.

## Context (C1)

```mermaid
graph TD
    user[User]
    subgraph system[Todo Webapp]
        webapp[todo-webapp]
        api[todo-api]
    end
    thunder[Thunder Auth]

    user -->|signs in, manages tasks| webapp
    webapp -->|REST calls| api
    webapp -->|OIDC/PKCE sign-in| thunder
    api -->|validates token| thunder
```

## Domain model (ER)

```mermaid
erDiagram
    USER {
        string id
        string displayName
    }
    TASK {
        string id
        string userId
        string title
        string status
        string priority
        string dueDate
        string createdAt
        string updatedAt
    }
    TAG {
        string id
        string userId
        string name
    }
    TASK_TAG {
        string taskId
        string tagId
    }

    USER ||--o{ TASK : owns
    USER ||--o{ TAG : defines
    TASK ||--o{ TASK_TAG : has
    TAG ||--o{ TASK_TAG : labels
```

## Key flows

### Sign in and load tasks

```mermaid
sequenceDiagram
    actor User
    participant Webapp as todo-webapp
    participant Thunder as Thunder Auth
    participant API as todo-api

    User->>Webapp: Open app
    Webapp->>Thunder: OIDC/PKCE sign-in redirect
    Thunder-->>Webapp: ID + access token
    Webapp->>API: GET /tasks (bearer token)
    API->>Thunder: Validate token (via gateway)
    API-->>Webapp: 200 tasks (open vs completed)
    Webapp-->>User: Render task list
```

### Create, tag, and prioritize a task

```mermaid
sequenceDiagram
    actor User
    participant Webapp as todo-webapp
    participant API as todo-api

    User->>Webapp: Fill title, tags, due date, priority
    Webapp->>API: POST /tasks
    API-->>Webapp: 201 created task
    Webapp-->>User: Task appears in open list
```

### Complete, reopen, or delete a task

```mermaid
sequenceDiagram
    actor User
    participant Webapp as todo-webapp
    participant API as todo-api

    User->>Webapp: Mark complete / reopen / delete
    Webapp->>API: PATCH or DELETE /tasks/{taskId}
    API-->>Webapp: 200/204 updated state
    Webapp-->>User: List reflects open vs completed split
```

### Filter and sort tasks

```mermaid
sequenceDiagram
    actor User
    participant Webapp as todo-webapp
    participant API as todo-api

    User->>Webapp: Choose tag / due date / priority filter or sort
    Webapp->>API: GET /tasks?tag=&sort=&status=
    API-->>Webapp: 200 filtered, sorted tasks
    Webapp-->>User: Updated list
```

