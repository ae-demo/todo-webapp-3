import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { User } from "oidc-client-ts";
import { currentUser, signIn } from "./auth";
import { Layout } from "./components/Layout";
import { Callback } from "./pages/Callback";
import { TaskList } from "./pages/TaskList";
import { NewTask } from "./pages/NewTask";
import { TaskDetail } from "./pages/TaskDetail";
import { CompletedTasks } from "./pages/CompletedTasks";

// Gates every task screen behind a signed-in session: an unauthenticated
// visitor is sent to Thunder sign-in before any task data is fetched.
function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    currentUser().then((u) => {
      if (cancelled) return;
      if (u) {
        setUser(u);
        setChecked(true);
      } else {
        void signIn();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked || !user) {
    return (
      <div className="centered-message">
        <p>Signing you in…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TaskList />} />
        <Route path="/tasks/new" element={<NewTask />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/completed" element={<CompletedTasks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route path="/*" element={<AuthGate />} />
      </Routes>
    </BrowserRouter>
  );
}
