// Typed client for todo-api, generated from its committed openapi.yaml
// (src/generated/todo-api.ts, regenerate with `npm run gen:todo-api`).
//
// The gateway that fronts todo-api injects `X-User-Id` from the caller's
// validated token before the request reaches the service — the client never
// sets the real value, and the gateway discards/overwrites whatever a caller
// sends (see specs/design/security.md, api-management skill). The header is
// still `required: true` in the contract, so every generated operation type
// requires *a* value to satisfy the client; GATEWAY_HEADER_PLACEHOLDER exists
// purely to satisfy that type and carries no meaning at runtime.
import createClient from "openapi-fetch";
import type { components, paths } from "./generated/todo-api";
import { env } from "./env";
import { getAccessToken, signIn } from "./auth";

const BASE_URL = env.TODO_API_URL;
if (!BASE_URL) {
  throw new Error("TODO_API_URL not set in window._env_");
}

export type Task = components["schemas"]["Task"];
export type TaskInput = components["schemas"]["TaskInput"];
export type TaskUpdate = components["schemas"]["TaskUpdate"];
export type Tag = components["schemas"]["Tag"];
export type Priority = Task["priority"];
export type TaskStatus = Task["status"];

const GATEWAY_HEADER_PLACEHOLDER = "gateway-injected";

const client = createClient<paths>({ baseUrl: BASE_URL });

client.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      // Access token missing/expired beyond silent renewal — restart sign-in.
      await signIn();
    }
    return response;
  },
});

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function unwrap<T>(data: T | undefined, error: unknown): T {
  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Request to todo-api failed";
    throw new ApiError(message);
  }
  if (data === undefined) {
    throw new ApiError("todo-api returned no data");
  }
  return data;
}

export type ListTasksParams = {
  status?: TaskStatus;
  tag?: string;
  priority?: Priority;
  sort?: "dueDate" | "priority" | "createdAt";
  limit?: number;
  offset?: number;
};

export async function listTasks(params: ListTasksParams = {}) {
  const { data, error } = await client.GET("/tasks", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      query: params,
    },
  });
  return unwrap(data, error);
}

export async function createTask(input: TaskInput) {
  const { data, error } = await client.POST("/tasks", {
    params: { header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER } },
    body: input,
  });
  return unwrap(data, error);
}

export async function getTask(taskId: string) {
  const { data, error } = await client.GET("/tasks/{taskId}", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      path: { taskId },
    },
  });
  return unwrap(data, error);
}

export async function updateTask(taskId: string, update: TaskUpdate) {
  const { data, error } = await client.PATCH("/tasks/{taskId}", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      path: { taskId },
    },
    body: update,
  });
  return unwrap(data, error);
}

export async function deleteTask(taskId: string) {
  const { error } = await client.DELETE("/tasks/{taskId}", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      path: { taskId },
    },
  });
  if (error) {
    throw new ApiError("Failed to delete task");
  }
}

export async function completeTask(taskId: string) {
  const { data, error } = await client.POST("/tasks/{taskId}/complete", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      path: { taskId },
    },
  });
  return unwrap(data, error);
}

export async function reopenTask(taskId: string) {
  const { data, error } = await client.POST("/tasks/{taskId}/reopen", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
      path: { taskId },
    },
  });
  return unwrap(data, error);
}

export async function listTags() {
  const { data, error } = await client.GET("/tags", {
    params: {
      header: { "X-User-Id": GATEWAY_HEADER_PLACEHOLDER },
    },
  });
  return unwrap(data, error);
}
